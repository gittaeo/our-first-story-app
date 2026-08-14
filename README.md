# 우리의 첫 이야기

임신부터 육아까지 엄마와 배우자가 함께 기록하는 모바일 중심 감성 성장 앨범입니다. 현재는 Firebase 설정이 없어도 전체 화면 흐름을 확인할 수 있는 데모 어댑터로 동작하며, `.env`의 `VITE_USE_MOCK=false`와 Firebase 값을 설정하면 실서비스 연결을 시작할 수 있습니다.

## 로컬 실행

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

`http://localhost:5173/welcome`에서 온보딩을, `/`에서 시드 타임라인을 확인합니다. 기록은 브라우저 `localStorage`에 저장됩니다.

## 테스트와 빌드

```powershell
pnpm test
pnpm build
```

## Firebase 연결

1. Firebase 프로젝트에서 익명 인증, Firestore, Storage, Functions를 활성화합니다.
2. `.env`에 `VITE_FIREBASE_*` 값을 입력하고 `VITE_USE_MOCK=false`로 바꿉니다.
   Firebase Authentication의 로그인 제공업체에서 `이메일/비밀번호`를 활성화합니다.
3. Functions 비밀값으로 `GEMINI_API_KEY`, 환경변수로 `GEMINI_MODEL`을 설정합니다.
4. `firebase deploy --only firestore,storage,functions,hosting`으로 배포합니다.

배포 후 소유자는 설정의 `배우자 초대`에서 로그인하고 초대 링크와 6자리 개인번호를 발급합니다. 시스템 공유창으로 배우자에게 전송하면 배우자는 `/join/{token}`에서 로그인한 뒤 개인번호와 표시 이름을 입력해 동일 workspace의 collaborator 멤버가 됩니다.

클라이언트에는 Gemini 키나 Admin SDK가 포함되지 않습니다. 초대 token은 SHA-256으로, PIN은 임의 salt와 scrypt로 해시되고 5회 실패 시 5분 잠금됩니다. 일기 본문과 PIN을 분석 로그로 출력하지 않습니다.

## Emulator

```powershell
pnpm --dir functions install
pnpm --dir functions build
pnpm emulators
```

Emulator UI는 `http://localhost:4000`입니다. 두 브라우저에서 익명 사용자로 접속한 뒤, 첫 브라우저가 만든 링크와 별도로 표시된 PIN을 두 번째 브라우저에 입력하여 공동 작업자 멤버십을 검증합니다.

## 실시간 공동편집 구현 기준

기록 본문은 `Y.Text`, 메타데이터는 `Y.Map`, 사진·스티커는 `Y.Array`로 구성합니다. 클라이언트 업데이트는 250ms 단위로 압축해 Firestore `collab/updates`에 기록하고, 서버 함수가 누적 업데이트를 snapshot으로 합칩니다. 데모 모드는 혼자 쓰는 흐름에 한정되며 UI에 명확히 표시됩니다.
