const headers = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const REGISTRY = {
  'QM-DEMO-LIBRARY': {questId:'library', label:'새벽벌도서관', emoji:'📚', lat:35.2329, lng:129.0840, radius:600},
  'QM-DEMO-MEAL': {questId:'meal', label:'금정회관', emoji:'🍚', lat:35.2317, lng:129.0834, radius:600},
  'QM-DEMO-NOTICE': {questId:'notice', label:'학생지원 공지 확인', emoji:'📣', lat:35.2335, lng:129.0829, radius:800},
  'QM-DEMO-HIDDEN': {questId:'hidden', label:'히든스팟', emoji:'🗺️', lat:35.2330, lng:129.0820, radius:900},
  'QM-DEMO-TEAM': {questId:'team', label:'팀 챌린지', emoji:'🤝', lat:35.2325, lng:129.0835, radius:900}
};
function normalize(raw='') {
  raw = String(raw).trim();
  try { const u = new URL(raw); return (u.searchParams.get('code') || u.hash.replace('#','') || raw).trim(); } catch(e) { return raw; }
}
function haversine(lat1, lon1, lat2, lon2) {
  const R=6371000, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function evidenceId(code) {
  const s = `${code}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return 'QM-' + Buffer.from(s).toString('base64url').slice(0,18).toUpperCase();
}
exports.handler = async (event) => {
  if(event.httpMethod === 'OPTIONS') return {statusCode:204, headers, body:''};
  if(event.httpMethod !== 'POST') return {statusCode:405, headers, body:JSON.stringify({ok:false,message:'POST only'})};
  let body={};
  try { body=JSON.parse(event.body||'{}'); } catch(e) {}
  const code=normalize(body.code);
  const record=REGISTRY[code];
  if(!record) return {statusCode:200, headers, body:JSON.stringify({ok:false,message:'등록되지 않은 QR 코드입니다.', code})};
  let method='QR + demo location';
  let note='발표용 데모 위치로 인증했습니다. 실제 운영에서는 학교가 QR/위치/시간 로그를 DB에 저장합니다.';
  if(!body.demoMode) {
    if(typeof body.lat !== 'number' || typeof body.lng !== 'number') {
      return {statusCode:200, headers, body:JSON.stringify({ok:false,message:'실제 GPS 인증을 선택했지만 위치 정보를 받을 수 없습니다.', code})};
    }
    const dist=haversine(body.lat, body.lng, record.lat, record.lng);
    if(dist > record.radius) {
      return {statusCode:200, headers, body:JSON.stringify({ok:false,message:`현재 위치가 인증 장소와 약 ${Math.round(dist)}m 떨어져 있습니다.`, code})};
    }
    method='QR + GPS + timestamp';
    note=`위치 오차 허용 범위(${record.radius}m) 안에서 인증됨. 거리 약 ${Math.round(dist)}m.`;
  }
  return {statusCode:200, headers, body:JSON.stringify({
    ok:true, status:'verified', code, questId:record.questId, label:record.label, emoji:record.emoji,
    method, verifiedAt:new Date().toLocaleString('ko-KR', {timeZone:'Asia/Seoul'}), evidenceId:evidenceId(code), note
  })};
};
