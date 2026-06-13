# PNU QuestMate V3 — QR 인증형 AI 캠퍼스 퀘스트

V3는 기존 실시간 데이터형 프로토타입에 **QR 체크인 + 위치/시간 인증 + 스탬프북 + 인증 로그 다운로드**를 추가한 버전입니다.

## 핵심 차별점

- 기존 부산대 앱: 식단, 좌석, 공지 등 정보를 각각 조회
- QuestMate V3: 공개 데이터를 불러온 뒤 AI가 오늘의 캠퍼스 퀘스트를 생성
- QR 인증: 실제 장소 방문 여부를 QR 코드, GPS, 시간 로그로 확인
- 스탬프북: 인증된 활동만 기록
- 발표용 증거: Netlify 배포 주소, GitHub 코드, 인증 로그 JSON, QR 인증 시연

## 발표 설명 문장

> 실제 운영에서는 학교가 장소별 QR을 발급하고 관리합니다. 학생은 해당 장소에 도착해 QR을 스캔하고, 앱은 QR 코드·현재 위치·시간을 확인해 스탬프를 지급합니다. 본 프로토타입은 샘플 QR과 Netlify Functions를 이용해 그 구조를 시연합니다.

## 배포

1. 이 폴더 안의 파일을 GitHub 저장소에 덮어쓰기
2. `netlify/functions/pnu-data.js`와 `netlify/functions/checkin.js`가 존재하는지 확인
3. Netlify가 자동 재배포할 때까지 대기
4. 기존 Netlify 주소 접속 후 새로고침

## QR 테스트 코드

- `QM-DEMO-LIBRARY`
- `QM-DEMO-MEAL`
- `QM-DEMO-NOTICE`
- `QM-DEMO-HIDDEN`
- `QM-DEMO-TEAM`

앱의 QR 체크인 탭에서 예시 QR을 누르거나 직접 입력하면 인증됩니다.
