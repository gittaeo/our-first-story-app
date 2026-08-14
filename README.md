# 우리의 첫 이야기

임신부터 육아까지 부모가 함께 기록하고, 사진과 기록을 성장 이야기 앨범으로 만드는 모바일 중심 서비스입니다.

- 웹/PWA: React 19, TypeScript, Vite
- 앱 패키징: Capacitor(Android/iOS)
- 백엔드: Firebase Authentication, Firestore, Storage, Functions, Hosting
- 협업 편집 기반: Yjs

## 현재 상태

화면과 데모 데이터는 로컬에서 동작합니다. 실제 계정 로그인, 배우자 초대, 기기간 기록 공유를 사용하려면 Firebase 프로젝트를 연결하고 배포해야 합니다. 현재 기록 본문·사진의 완전한 서버 동기화는 출시 전 추가 구현 및 검증이 필요합니다.

GitHub Pages는 미리보기 용도입니다. 실제 서비스는 Firebase Hosting을 권장합니다.

## 로컬 실행

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

테스트와 프로덕션 빌드:

```powershell
pnpm test
pnpm build
```

## Firebase 연결 순서

1. Firebase Console에서 프로젝트를 만들고 Authentication의 이메일/비밀번호 로그인을 활성화합니다.
2. Firestore Database와 Storage를 생성합니다.
3. 프로젝트 설정에서 웹 앱을 추가한 뒤 SDK 설정값을 `.env`에 입력합니다.
4. `VITE_USE_MOCK=false`로 변경합니다.
5. Functions에서 사용할 Gemini 키를 Secret 또는 환경값으로 등록합니다.
6. 규칙, Functions, Hosting을 배포합니다.

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
VITE_USE_MOCK=false
```

```powershell
pnpm exec firebase login
pnpm exec firebase use --add
pnpm exec firebase deploy --only firestore,storage,functions,hosting
```

## 휴대폰에 웹앱 설치

배포된 사이트를 Chrome 또는 Safari로 열고 홈 화면에 추가하면 PWA로 설치할 수 있습니다. 서비스 워커, 앱 manifest, 설치 아이콘은 프로젝트에 포함되어 있습니다.

## Android 앱

Windows에서 Android Studio와 Android SDK를 설치한 뒤:

```powershell
pnpm cap:sync
pnpm cap:android
```

Android Studio에서 서명된 Android App Bundle(`.aab`)을 만들고 Google Play Console에 올립니다. 신규 개인 개발자 계정은 프로덕션 출시 전 12명 이상의 테스터가 14일 연속 참여하는 비공개 테스트가 필요할 수 있습니다.

## iOS 앱

iOS 앱 프로젝트는 `ios/`에 생성되어 있지만 최종 빌드와 서명은 macOS와 Xcode가 필요합니다.

```bash
pnpm cap:sync
pnpm cap:ios
```

Apple Developer Program 가입, App Store Connect 앱 생성, 개인정보 항목 작성, TestFlight 테스트 후 심사를 제출합니다.

## 출시 전 필수 확인

- 배우자 계정 사이의 Firestore 기록·사진 동기화 완성
- 개인정보처리방침, 이용약관, 계정 삭제 기능
- 사진 업로드 용량/형식 제한과 Storage 보안 규칙 검증
- 실제 기기 테스트, 접근성, 오류 보고, 백업/복구
- 앱 아이콘 및 스토어 스크린샷 제작
- Google Play 데이터 보안 및 Apple 앱 개인정보 설문 작성

## 프로젝트 자료

- `google_ai_studio_final_prompt.md`: 최초 제작 프롬프트
- `our_first_story_detailed_prd.docx`: 상세 기획서
- `our_first_story_full_storyboard.pptx`: 전체 스토리보드
