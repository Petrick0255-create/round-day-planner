동그란 하루 - 웹앱 초안

1. index.html을 더블클릭하면 바로 실행됩니다.
2. 같은 브라우저에서는 계획이 자동 저장됩니다.
3. 웹에 배포할 때 이 폴더 안의 모든 파일을 함께 올리세요.

홈 화면에 추가하기
- iPhone/iPad: Safari 공유 버튼 > 홈 화면에 추가
- Android: Chrome 메뉴 > 홈 화면에 추가 또는 앱 설치
- 추가하면 원형 시간표 모양의 '동그란 하루' 전용 아이콘이 표시됩니다.

현재 버전은 Google 로그인과 Firebase Firestore 저장을 사용합니다.
같은 Google 계정으로 로그인하면 다른 기기에서도 같은 시간표를 불러옵니다.

주요 사용법
- 원의 맨 위는 항상 00시입니다.
- 전날 23시에 취침하면 꿈나라 조각이 23시 위치에서 시작해 자정을 지나 기상 시각까지 이어집니다.
- 오늘의 계획에서 빈 영역을 누르면 해당 시각부터 1시간이 선택됩니다.
- 빈 영역의 원 가장자리를 시계 방향으로 드래그하면 5분 단위로 시간 범위를 선택할 수 있습니다.
- 새 일정과 기존 일정의 색상을 직접 바꿀 수 있습니다. 기본 색상은 파스텔 톤입니다.

Firestore 구조
users/{uid}/planner/state
  data, updatedAt

Firebase 콘솔에서 반드시 설정할 것
1. Authentication > Sign-in method에서 Google 사용 설정
2. Authentication > Settings > Authorized domains에 배포 도메인 추가
3. Firestore Database 생성
4. firestore.rules 파일 내용을 Firestore 규칙에 붙여넣고 게시

앱스토어 등록 단계에서는 이 웹앱을 Capacitor로 감싼 뒤 알림, 광고, 결제·개인정보 처리방침을 추가하는 방식이 적합합니다.
