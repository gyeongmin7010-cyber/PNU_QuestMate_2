const SOURCES = {
  meals: 'https://m.pusan.ac.kr/ko/meals',
  seats: 'https://m.pusan.ac.kr/ko/seat',
  notice: 'https://m.pusan.ac.kr/ko/notice/cover/list/1?current=notice',
  academic: 'https://m.pusan.ac.kr/ko/notice/cover/list/1?current=haksa'
};

const headers = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function decodeEntities(str='') {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}
function clean(html='') {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
async function fetchText(url) {
  const res = await fetch(url, {headers: {'user-agent':'Mozilla/5.0 QuestMate/3.0'}, cache:'no-store'});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}
function parseMeals(text) {
  const lines = text.split('\n').map(s=>s.trim()).filter(Boolean);
  const meals=[];
  let place=''; let type='';
  for(const line of lines) {
    if(/회관|식당|학생회관|편의동|금정/.test(line) && !/식단안내|부산캠퍼스|양산/.test(line) && line.length < 40) {
      place=line.replace(/^#+\s*/,'').trim();
      continue;
    }
    if(/^(조식|중식|석식)$/.test(line)) { type=line; continue; }
    if(type && place && !/^(로그인|학교공지|공지사항|학사일정|캠퍼스맵|식단안내|좌석현황|전화번호)/.test(line)) {
      if(/\d{4}\.\d{2}\.\d{2}|토요일|일요일|월요일|화요일|수요일|목요일|금요일/.test(line)) continue;
      meals.push({place,type,menu:line});
      type='';
    }
  }
  return meals.slice(0,30);
}
function parseSeats(text) {
  const lines = text.split('\n').map(s=>s.trim()).filter(Boolean);
  const seats=[];
  const rx = /(.+?)\s*잔여석\s*:?\s*(\d+)\s+(\d+)\/(\d+)\(([^)]+)\)\s*(\d+)?/;
  for(const line of lines) {
    const m=line.match(rx);
    if(m) seats.push({room:m[1].replace(/^\*\s*/,''), available:Number(m[2]), used:Number(m[3]), total:Number(m[4]), rate:m[5]});
  }
  return seats.sort((a,b)=>b.available-a.available).slice(0,40);
}
function parseNotice(text) {
  const lines=text.split('\n').map(s=>s.replace(/^\*\s*/,'').trim()).filter(Boolean);
  const notices=[];
  const rx=/^(공지|\d+)\s+(.+?)\s+([^\s]+)\s+(\d{4}-\d{2}-\d{2})\s+(\d+)$/;
  for(const line of lines) {
    const m=line.match(rx);
    if(m) notices.push({no:m[1], title:m[2], author:m[3], date:m[4], views:m[5]});
  }
  return notices.slice(0,20);
}
function parseAcademic(text) {
  const lines=text.split('\n').map(s=>s.trim()).filter(Boolean);
  const out=[];
  const rx=/^(.+?)\s+(\d{4}\.\d{2}\.\d{2}\s*-\s*\d{4}\.\d{2}\.\d{2})$/;
  for(const line of lines) {
    const m=line.match(rx);
    if(m && !/공지|번호|제목|조회/.test(m[1])) out.push({title:m[1], period:m[2]});
  }
  return out.slice(0,30);
}
async function safeLoad(name, url, parser) {
  try {
    const html=await fetchText(url);
    const text=clean(html);
    const items=parser(text);
    return {name, ok:true, items, message:`${items.length}개 항목 수집`};
  } catch(e) {
    return {name, ok:false, items:[], message:e.message};
  }
}
exports.handler = async (event) => {
  if(event.httpMethod === 'OPTIONS') return {statusCode:204, headers, body:''};
  const [meals, seats, notice, academic] = await Promise.all([
    safeLoad('식단', SOURCES.meals, parseMeals),
    safeLoad('좌석현황', SOURCES.seats, parseSeats),
    safeLoad('공지사항', SOURCES.notice, parseNotice),
    safeLoad('학사일정', SOURCES.academic, parseAcademic)
  ]);
  const diagnostics=[meals,seats,notice,academic].map(x=>({name:x.name,ok:x.ok,message:x.message}));
  return {statusCode:200, headers, body:JSON.stringify({
    fetchedAt:new Date().toISOString(),
    meals:meals.items, seats:seats.items, notices:notice.items, academic:academic.items, diagnostics
  })};
};
