/* 입혀 보기(AI) 서버 설정. anon 키는 앱에 넣도록 만들어진 공개용 키이며 비밀 키가 아니다.
   enabled 가 false 이면 앱에 'AI로 입혀 보기' 버튼이 나타나지 않는다(Kling API 키가 준비되면 true 로 바꾼다). */
window.TRYON_CFG = { enabled: true, multi: true, acc: false, sizeRead: true, unlimited: true /* 테스트 중: 앱의 월 입어보기 횟수 제한 없음(출시 전 false 로) */, url: 'https://excwhulmswcoscupvdrp.supabase.co', anon: 'sb_publishable_PvmGRS6TO2Vt8y7cyK4_7g_x_m4Xgpl' };
