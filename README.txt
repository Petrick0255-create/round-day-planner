동그란 하루 - 웹앱 초안

1. index.html을 더블클릭하면 바로 실행됩니다.
2. 같은 브라우저에서는 계획이 자동 저장됩니다.
3. 웹에 배포할 때 index.html, style.css, app.js를 같은 폴더에 올리세요.

현재 버전은 화면과 사용 흐름을 확인하기 위한 초안이며 브라우저 저장소를 사용합니다.
여러 기기 동기화, 회원가입, 공유 기능을 넣을 때 app.js의 save()와 초기 state 불러오기 부분을 Firebase Auth/Firestore로 교체하면 됩니다.

권장 Firestore 구조
users/{uid}/plans/{planId}
  title, createdAt, isActive
users/{uid}/plans/{planId}/days/{dayId}
  items: [{start, end, title, detail, color}]

앱스토어 등록 단계에서는 이 웹앱을 Capacitor로 감싼 뒤 알림, 광고, 결제·개인정보 처리방침을 추가하는 방식이 적합합니다.
