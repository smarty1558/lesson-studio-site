# Next Chat Handoff - OSUM Music Academy Site

다음 채팅에서 이 파일부터 읽으면 현재 프로젝트 상태를 바로 이어받을 수 있다.

## 기본 정보

- 작업 폴더: `C:\Users\USER\Documents\New project 6`
- 현재 로컬 확인 URL: `http://127.0.0.1:5173/`
- 프레임워크: Vite 정적 사이트
- 주요 파일:
  - `index.html`
  - `style.css`
  - `main.js`
  - `admin-d1.js`
  - `portfolio-data.js`
  - `portfolio-interest.js`
  - `teacher-profiles.js`

## 서버 상태

- `npm run dev` 대신 Node 기반 정적 서버로 `127.0.0.1:5173`을 열어 사용했다.
- 서버가 죽으면 다시 5173 포트로 정적 서버를 켜야 한다.
- 최근 확인 링크:
  - 메인: `http://127.0.0.1:5173/`
  - J-POP 클래스 확인: `http://127.0.0.1:5173/?jpop-class=20260516#courses`
  - 강사 슬라이드 모달 확인: `http://127.0.0.1:5173/?teacher-slide=20260516c#teachers`

## 최근 주요 변경

### 1. 메인 히어로 영상

- 기존 상단 이미지 페이드 영역을 영상 배경으로 교체했다.
- 사용 영상 원본: `C:\Users\USER\Downloads\오썸학원.mp4`
- 사이트용 파일: `studio-hero-loop.mp4`
- 히어로 영상 위에는 열화가 덜 보이도록 픽셀/모자이크 계열 오버레이와 그라데이션 마스크가 들어가 있다.

### 2. 커스텀 마우스

- 메인 사이트에 커스텀 커서가 들어가 있다.
- 클래스 카드와 강사 카드 위에서는 `VIEW` 커서가 뜬다.
- 기본 브라우저 커서가 겹쳐 보이던 문제를 수정했다.
- `html`과 `body`에 `has-view-cursor` 클래스를 붙이고, 투명 커서 이미지까지 강제로 적용한다.
- 관련 파일:
  - `main.js`
  - `style.css`

### 3. 클래스 카드

- 기존 3개 클래스에서 4개 클래스로 변경했다.
- 현재 클래스:
  - 게임 · 영화 OST
  - 애니메이션 BGM
  - J-POP
  - Sound Design
- 애니메이션 BGM과 J-POP을 분리했다.
- 상담 폼 선택 옵션에도 `J-POP`을 추가했다.
- CMS 타겟 옵션에도 `jpop`을 추가했다.
- 기본 포트폴리오 데이터에도 J-POP 타겟 샘플이 연결되어 있다.

### 4. 강사진 카드 호버

- 강사진 카드에도 클래스 카드처럼 마우스 위치 기반 주변 글로우가 생기게 했다.
- 관련 CSS:
  - `.artist-card::before`
  - `.artist-card:hover::before`

### 5. Student Works 섹션

- WebGL 연기/버블 시도는 제거했다.
- 최종 상태는 은은하게 움직이는 그라데이션 배경이다.
- DOM에 별도 버블이나 캔버스가 생기지 않는다.
- 관련 CSS:
  - `.portfolio-strip::before`
  - `.portfolio-strip::after`
  - `studentWorksFlow`
  - `studentWorksShimmer`

### 6. 포트폴리오 상세 CTA

- 포트폴리오 상세창의 버튼 문구를 `이런 스타일 배우기`로 바꿨다.
- 이 버튼을 누르면:
  - 포트폴리오 모달이 닫힌다.
  - 상담 섹션으로 스크롤된다.
  - 상담 카드가 세로로 살짝 늘어나는 애니메이션 후,
  - `이런 스타일 배우기 : 포폴 이름` 칩이 생긴다.
- 칩의 `삭제` 버튼을 누르면:
  - 상담 카드가 다시 줄어드는 애니메이션을 한다.
  - 칩이 사라진다.
  - 원래 상담 폼 상태로 돌아간다.
- 새 모듈:
  - `portfolio-interest.js`
- 새 테스트:
  - `portfolio-interest.test.js`

### 7. 강사 상세/대표작품 모달

- 강사 카드 또는 강사 카드 위 `VIEW`를 누르면 바로 포폴 목록이 아니라 강사 상세 모달이 먼저 열린다.
- 강사 상세 모달 구조:
  - 첫 화면: 강사 상세정보
  - 우측 책갈피: `강사 대표작품 보기`
  - 누르면 상세 패널이 옆으로 밀리고 대표작품 패널이 나온다.
  - 대표작품 화면 좌측 책갈피: `강사 상세정보 보기`
  - 누르면 다시 상세정보 패널로 돌아간다.
- 대표작품 패널 안에는 기존 포트폴리오 카드 목록이 들어간다.
- 로컬 정적 서버에는 `/api/portfolio`가 없으므로 `portfolio-data.js` fallback을 사용하게 고쳤다.
- 새 모듈:
  - `teacher-profiles.js`
- 새 테스트:
  - `teacher-profiles.test.js`

## CMS / 관리자 관련

- `/admin`은 `admin-d1.js`가 렌더링한다.
- J-POP 타겟 옵션을 CMS에도 추가했다.
- `admin-d1.js`의 `targetOptions`에 현재 포함된 값:
  - `game`
  - `anime`
  - `jpop`
  - `sound`
- 인앱 브라우저에서 `/admin` 이동이 `ERR_BLOCKED_BY_CLIENT`로 막힌 적이 있다. 코드상 옵션 추가는 확인했지만, 인앱 브라우저로 관리자 화면 직접 검증은 제한될 수 있다.

## 데이터 구조

### `portfolio-data.js`

- 기본 포트폴리오 fallback 데이터가 있다.
- `getPortfolioItemsForTarget(type, key)`로 클래스/강사별 포트폴리오를 필터한다.
- J-POP 샘플은 `category: 'jpop'`, `courseKeys: ['jpop']`로 분리했다.

### `teacher-profiles.js`

- 강사 상세 모달용 프로필 데이터가 있다.
- 현재 키:
  - `kim`
  - `lee`
  - `han`
  - `cho`
- 제공 함수:
  - `getTeacherProfile(key)`
  - `getTeacherProfileViewState(mode)`

### `portfolio-interest.js`

- 상담 섹션의 `이런 스타일 배우기 : 포폴 이름` 상태를 만든다.
- 제공 함수:
  - `createPortfolioInterest(item)`
  - `clearPortfolioInterest()`

## 테스트

현재 전체 테스트 명령:

```powershell
node --test portfolio-utils.test.js portfolio-api.test.js upload-utils.test.js upload-api.test.js files-api.test.js portfolio-data.test.js portfolio-interest.test.js teacher-profiles.test.js
```

최근 결과:

```text
tests: 24 pass
```

빌드 명령:

```powershell
npm.cmd run build
```

최근 결과:

```text
vite build: success
```

## 주의할 점

- `index.html` 일부 텍스트가 터미널 출력에서는 깨져 보일 수 있다. 브라우저에서는 정상 한국어로 보이는 부분이 많다.
- 파일 편집 시 전체 인코딩을 건드리지 않는 게 좋다.
- 기존에 `docs/next-chat-handoff.md`가 깨진 텍스트로 되어 있었고, 지금 이 문서로 새로 정리했다.
- 커스텀 커서 관련 변경은 민감하다. 기본 커서가 겹쳐 보이는지 항상 브라우저에서 직접 확인해야 한다.
- 모달 관련 변경 후에는 반드시 실제 브라우저에서 다음 흐름을 확인해야 한다:
  - 클래스 카드 클릭
  - 포트폴리오 상세 열기
  - `이런 스타일 배우기` 클릭
  - 상담 섹션 칩 생성/삭제
  - 강사 카드 클릭
  - 강사 상세 ↔ 대표작품 책갈피 전환

## 마지막 확인된 작업 링크

```text
http://127.0.0.1:5173/?teacher-slide=20260516c#teachers
```

이 링크에서 강사 모달의 상세정보/대표작품 슬라이드 전환까지 확인했다.
