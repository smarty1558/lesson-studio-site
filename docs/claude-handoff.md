# OMUS 사이트 점검용 인수인계 문서

작성일: 2026-07-04  
프로젝트 경로: `C:\Users\USER\Documents\New project 6`  
운영 도메인: `https://otakumusicstudio.com/`

## 1. 프로젝트 한 줄 요약

OMUS 오타쿠 뮤직 스튜디오의 정적 랜딩 페이지 + 포트폴리오/CMS + 상담 신청 폼 사이트다.  
프론트는 Vite 정적 빌드이고, 배포는 Cloudflare Pages를 사용한다. CMS 저장/조회는 Cloudflare Pages Functions, D1, R2를 사용한다. 상담 신청 메일은 Resend API로 발송한다.

## 2. 기술 스택

- 프론트엔드: Vite, vanilla HTML/CSS/JS
- 배포: Cloudflare Pages
- 서버 API: Cloudflare Pages Functions
- DB: Cloudflare D1
- 파일 저장소: Cloudflare R2
- 메일 발송: Resend
- 테스트: Node.js 내장 test runner
- 주요 빌드 명령: `npm run build`
- 전체 테스트 명령: `node --test *.test.js`

## 3. 핵심 파일 구조

- `index.html`
  - 메인 사이트 HTML
  - SEO 메타, JSON-LD, 정적 강사 fallback, FAQ, 연락 폼, 위치 섹션 포함
  - 크롤러가 JS 실행 전 읽는 원문이므로 SEO/fallback 텍스트가 중요함

- `main.js`
  - 사이트 인터랙션 대부분 담당
  - 포트폴리오 모달, 강사 모달, 뒤로가기 히스토리 처리, CMS 데이터 preload, 관리자 UI 일부 포함
  - D1 API에서 강사/포트폴리오 데이터를 불러와 정적 fallback 위에 덮어씀

- `style.css`
  - 전체 UI/반응형/모달/관리자/CMS 스타일
  - 최근 노트북/모바일에서 팝업, 클래스 포트폴리오, 강사 포트폴리오 반응형 문제를 많이 고친 상태

- `teacher-profiles.js`
  - 강사 정보의 정적 fallback
  - CMS API가 실패하거나 크롤러가 JS 실행 전 HTML/JS를 읽을 때 기준이 됨
  - 현재 fallback 이름은 `김정환 / YUMU`, `B@kamin`, `Kev1`, `은오 / Eunoh`

- `teacher-profile-utils.js`
  - D1 teacher row를 public profile shape로 변환
  - CMS payload normalize
  - 정적 fallback과 CMS override merge

- `portfolio-data.js`
  - 포트폴리오 fallback/정규화 관련 데이터

- `admin-d1.js`
  - `/admin` CMS UI 로직
  - 포트폴리오 CMS와 강사 CMS 탭 포함
  - 강사 선택 label도 fallback을 가지고 있으므로 실제 강사명과 맞아야 함

- `free-plugin-transition-options.html`
  - 무료 플러그인 인터랙티브 페이지
  - 메인 사이트 안에서 iframe portal로 열림

- `functions/`
  - Cloudflare Pages Functions API

- `migrations/`
  - D1 schema migration

- `public/`
  - favicon, robots, sitemap, location map image 등 정적 public asset

## 4. 배포/실행 방식

로컬 개발:

```powershell
cd "C:\Users\USER\Documents\New project 6"
npm install
npm run dev
```

빌드:

```powershell
cd "C:\Users\USER\Documents\New project 6"
npm run build
```

Cloudflare Pages 권장 설정:

- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: `functions`

Wrangler 관련 설정은 `wrangler.toml`에 있다.

```toml
name = "osum-music-academy"
compatibility_date = "2026-05-14"
pages_build_output_dir = "dist"

[[r2_buckets]]
binding = "PORTFOLIO_BUCKET"
bucket_name = "osum-portfolio"

[[d1_databases]]
binding = "DB"
database_name = "osum-portfolio-db"
database_id = "6e267712-cf31-4455-aba7-d0fc47f5bcff"

[vars]
R2_PUBLIC_URL = "https://pub-da3c2c9b5797479eb03e88e4a6084539.r2.dev"
```

## 5. Cloudflare 바인딩/환경변수

필수 바인딩:

- `DB`: Cloudflare D1 database binding
- `PORTFOLIO_BUCKET`: Cloudflare R2 bucket binding

필수/관련 환경변수:

- `ADMIN_PASSWORD`
  - `/admin`, `/api/admin/*` 보호용
- `R2_PUBLIC_URL`
  - R2 public asset base URL
- `RESEND_API_KEY`
  - 상담 신청 메일 발송용 Resend API key
- `CONTACT_TO_EMAIL`
  - 일반 신청자의 기본 상담 메일 수신자
  - 현재 운영값: `smarty1558@gmail.com`
- `CONTACT_SPECIAL_TO_EMAIL`
  - 특정 신청자 이메일에만 적용할 별도 수신자
  - 현재 운영값: `omusinform@gmail.com`
- `CONTACT_SPECIAL_FROM_EMAILS`
  - `CONTACT_SPECIAL_TO_EMAIL`로 보낼 신청자 이메일 목록
  - 콤마 또는 세미콜론 구분
  - 현재 목록: `bakamin98@gmail.com`, `haveosumtime@gmail.com`, `qwdmsdh@gmail.com`, `tadaimanoyume@gmail.com`, `qwdmsdh@naver.com`
  - 비교 시 앞뒤 공백을 제거하고 대소문자를 무시함
- 기존 코드의 콤마/세미콜론 수신자 파싱과 `CONTACT_TO_EMAIL=...` value 보정은 유지됨
- `CONTACT_FROM_EMAIL`
  - Resend 발신자
  - 미설정 시 `Lesson Studio <onboarding@resend.dev>` fallback

주의:

- Resend에서 여러 수신자에게 보내려면 API key 문제가 아니라 발신 도메인/발신자 인증이 중요함.
- `CONTACT_TO_EMAIL` value에는 보통 `omusinform@gmail.com, smarty1558@gmail.com`처럼 이메일만 넣는다.

## 6. D1 데이터 구조

마이그레이션 파일:

- `0001_create_portfolio_items.sql`
  - `portfolio_items` 생성
  - title, description, category, date, image_url, audio_url, external_link, visible, sort_order, created_at, updated_at

- `0002_add_portfolio_metadata.sql`
  - `portfolio_items.metadata` 추가
  - metadata에 `teacherKeys`, `courseKeys`, `teacherNames`, `courseNames`, mediaType 등 확장 정보 저장

- `0003_create_teacher_profiles.sql`
  - `teacher_profiles` 생성
  - key, name, role, image_url, summary, direction, specialties, works, note, sort_order, updated_at

- `0004_add_teacher_direction.sql`
  - `teacher_profiles.direction` 추가

중요 점검 포인트:

- 현재 `0003_create_teacher_profiles.sql` 안에 이미 `direction TEXT`가 들어 있다.
- 동시에 `0004_add_teacher_direction.sql`도 `direction`을 추가한다.
- 기존 운영 D1은 과거에 `0003`에 direction이 없던 상태에서 `0004`를 적용한 것으로 보인다.
- 새 D1에 처음부터 전체 migration을 적용하면 `0004`에서 duplicate column 문제가 날 수 있다.
- 클로드는 이 migration 중복 상태를 반드시 점검해야 한다.

운영 D1 migration 적용 예시:

```powershell
cd "C:\Users\USER\Documents\New project 6"
npx --yes wrangler d1 migrations apply osum-portfolio-db --remote
```

운영 DB 확인 예시:

```powershell
cd "C:\Users\USER\Documents\New project 6"
npx --yes wrangler d1 execute osum-portfolio-db --remote --command "SELECT key, name, summary, direction, note FROM teacher_profiles;"
```

## 7. API 구조

### Public APIs

`GET /api/portfolio`

- 파일: `functions/api/portfolio.js`
- D1 `portfolio_items`에서 visible item만 조회
- `toPublicPortfolioItem`으로 public shape 변환
- 클래스 포트폴리오/강사 포트폴리오 모달에서 사용

`GET /api/teachers`

- 파일: `functions/api/teachers.js`
- D1 `teacher_profiles` 조회
- `toPublicTeacherProfile`로 public shape 변환
- 메인 강사 카드와 강사 상세 모달의 CMS override로 사용

`POST /api/contact`

- 파일: `functions/api/contact.js`
- 상담 신청 폼 payload를 받아 Resend로 메일 발송
- 필수: name, email, course, lessonMode, message
- phone은 optional
- teacher preference는 최근 제거됨
- courseLabel/lessonModeLabel을 사용해서 사용자가 사이트에서 본 문구 그대로 메일에 보냄

### Admin APIs

`GET /api/admin/portfolio`

- 관리자용 전체 포트폴리오 목록
- hidden 포함
- `ADMIN_PASSWORD` 필요

`POST /api/admin/portfolio`

- 포트폴리오 item 생성
- teacher/course metadata 저장

`PATCH /api/admin/portfolio/:id`

- 포트폴리오 item 수정

`DELETE /api/admin/portfolio/:id`

- 포트폴리오 item 삭제

`POST /api/admin/upload`

- 이미지/오디오 R2 업로드
- image: `portfolio/images/`
- audio: `portfolio/audio/`

`GET /api/admin/files`

- R2 파일 목록 조회/관리용

`GET /api/admin/teachers`

- 강사 CMS 프로필 조회

`POST /api/admin/teachers`

- 강사 CMS 프로필 upsert
- key와 name 필수
- direction은 대표 방향
- note는 Class Direction으로 UI에서 표시됨

## 8. 프론트엔드 데이터 흐름

### 초기 HTML/fallback

`index.html`에는 정적 강사 카드와 텍스트가 박혀 있다.

이 텍스트는 다음 사용자에게 중요하다:

- JS 실행 전 사용자가 보는 초기 HTML
- 검색엔진/AI/크롤러가 읽는 HTML 원문
- OpenGraph/SEO 인덱싱
- CMS API 실패 시 fallback

최근 이슈:

- 화면/CMS에는 `김정환 / YUMU`, `B@kamin`, `Kev1`, `은오 / Eunoh`가 보였지만, HTML 원문에는 `이서윤`, `한유나`, `조은오` 등 예전 더미 이름이 남아 있었다.
- 원인: CMS는 브라우저에서 JS가 실행된 뒤 D1 API 결과로 화면을 덮어쓰는 구조라, CMS 수정이 `index.html` 소스 자체를 변경하지는 않는다.
- 조치: `index.html`, `teacher-profiles.js`, `main.js`, `admin-d1.js`의 fallback 이름을 현재 공개 이름으로 맞췄고 테스트도 추가했다.

현재 정적 강사 fallback:

- `kim`: 김정환 / YUMU
- `lee`: B@kamin
- `han`: Kev1
- `cho`: 은오 / Eunoh

### CMS hydrate

`main.js`의 `initSite()`에서:

- `/api/teachers` 호출
- `/api/portfolio` 호출
- `teacher_profiles` CMS 값이 있으면 `teacher-profiles.js` fallback과 merge
- 메인 강사 카드, 강사 상세 모달, 강사 대표작 모달에 반영

CMS가 실패하면:

- 정적 fallback으로 동작한다.

### 포트폴리오 표시

포트폴리오 item은 D1 `portfolio_items`에 저장된다.

metadata에서 주로 쓰는 값:

- `teacherKeys`
- `courseKeys`
- `teacherNames`
- `courseNames`
- `mediaType`
- 기타 CMS 필드

표시 로직:

- 클래스 포트폴리오는 course key 기준으로 필터
- 강사 포트폴리오는 teacher key 기준으로 필터
- 예전에는 클래스 포트폴리오 간 scrollTop이 공유되는 문제가 있었고, 현재는 열 때 scroll reset 처리된 상태

## 9. 상담 신청 폼

위치:

- `index.html` contact section
- submit handler는 `main.js`와 하단 inline script 쪽을 반드시 함께 확인해야 한다.

현재 필드:

- 이름 또는 활동명: required
- 연락처: optional
- 이메일: required
- 희망 수업: required
- 수업 방식: required
- 문의 내용: required

희망 선생님 필드는 제거됨.

현재 희망 수업 옵션:

- `jpop`: jpop 작곡 / 미디 레슨
- `subculture`: 서브컬처 작곡 / 미디 레슨
- `game`: 게임 BGM
- `anime`: 애니메이션 · 영화 OST
- `sound`: Sound Design
- `singer-songwriter`: 싱어송라이터(보컬작곡)
- `mixing`: 믹싱 / 마스터링

메일 발송:

- `/api/contact`
- Resend API 사용
- 수신자: 신청자 이메일이 `CONTACT_SPECIAL_FROM_EMAILS`에 정확히 포함되면 `CONTACT_SPECIAL_TO_EMAIL`, 그 외에는 `CONTACT_TO_EMAIL`
- 발신자: `CONTACT_FROM_EMAIL`
- reply_to: 신청자 이메일

메일 본문에는 사이트의 select visible label이 그대로 들어가야 한다.

## 10. SEO/검색엔진 관련

파일:

- `index.html`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/_headers`
- `seo-metadata.test.js`

현재 적용:

- title/meta description/meta keywords
- canonical
- OpenGraph
- Twitter card
- favicon/apple-touch-icon
- JSON-LD
  - `WebSite`
  - `EducationalOrganization`
  - `FAQPage`
- FAQ 섹션
- 위치 섹션
- HTML content 안에 주요 검색어 포함

FAQ 현재 포함 항목:

- JPOP 레슨
- 서브컬처 작곡 레슨
- 게임음악 작곡 레슨
- 미디 레슨
- 성인 1:1 수업
- 믹싱/마스터링
- 싱어송라이터 보컬작곡

주의:

- Google Search Console에서 URL 검사 후 색인 생성 요청 필요.
- `site:otakumusicstudio.com`에 뜬다고 해서 모든 검색어에서 상위 노출되는 것은 아니다.
- CMS에서 바꾼 데이터가 정적 HTML SEO 원문에 자동 반영되지 않는다. SEO에 중요한 문구는 `index.html` 또는 빌드 시점 fallback에도 있어야 한다.

## 11. 위치 섹션

위치 섹션은 FAQ 아래에 있다.

현재 구조:

- 제목: 찾아오시는 길
- 문구: 수원역 7, 8번 출구에서 도보 약 10분
- 이미지: `public/location-suwon-station-route.png`
- 버튼: `https://naver.me/GuCakPWt`

처음에는 Naver iframe을 넣었지만, `naver.me`는 지도 embed 전용 URL이 아니라 네이버 지도 페이지 전체가 iframe 안에 떠서 검색창/사이드바까지 보이는 문제가 있었다.

현재는 정적 길찾기 이미지 + 네이버 지도 길찾기 버튼 방식이다.  
API 키가 필요 없고, 로딩/디자인/모바일 안정성이 더 좋다.

## 12. 모바일/모달/뒤로가기 관련

최근 많이 고친 부분:

- 노트북/작은 화면 강사 상세 모달에서 이미지가 공간을 차지해 내용이 잘리는 문제
- 작은 화면에서 프로필 이미지를 숨기고 내부 요소가 화면 안에 들어오도록 조정
- 클래스 포트폴리오와 강사 포트폴리오의 모바일 구조 통일
- 좁은 화면에서 팝업이 상하로 꽉 차지 않는 문제
- 강사 포트폴리오 좁은 화면에서 스크롤이 안 되는 문제
- 모바일 브라우저 뒤로가기 버튼 처리

뒤로가기 동작:

- 모달이 열려 있을 때 Android/모바일 뒤로가기 버튼이 뒤 페이지를 움직이는 게 아니라 모달 내부 history를 먼저 처리해야 한다.
- 포트폴리오 detail -> list -> modal close 순서로 동작하도록 `main.js`에서 history stack 관리.
- 관련 테스트: `teacher-modal-layout.test.js`

## 13. 무료 플러그인 페이지

파일:

- `free-plugin-transition-options.html`
- 관련 테스트:
  - `free-plugin-map-interaction.test.js`
  - `free-plugin-site-integration.test.js`

동작:

- 메인 사이트에서 무료 플러그인 버튼 클릭 시 별도 페이지로 바로 이동하지 않고, in-page portal iframe으로 preview를 띄움
- 커서/배경 인터랙션, 플러그인 맵, 확대/드래그/hover 등 자체 인터랙션이 있음

주의:

- 성능 이슈가 있었으므로 mousemove/scroll/wheel 관련 이벤트는 과도하게 늘리지 말 것
- 기존 구조를 갈아엎지 않는 게 중요

## 14. 테스트 파일 개요

전체 테스트:

```powershell
cd "C:\Users\USER\Documents\New project 6"
node --test *.test.js
```

주요 테스트:

- `seo-metadata.test.js`
  - SEO meta, FAQPage, location section, favicon, sitemap/robots

- `teacher-modal-layout.test.js`
  - 강사 모달 구조
  - 모바일/좁은 화면 모달
  - 뒤로가기 history
  - static teacher fallback copy

- `contact-form.test.js`
  - 상담 폼 필드, required 여부, 옵션, payload

- `contact-api.test.js`
  - `/api/contact`
  - Resend payload
  - multiple recipient handling
  - optional phone

- `portfolio-api.test.js`
  - public/admin portfolio API

- `teacher-profile-utils.test.js`
  - teacher payload normalize/merge

- `teacher-profiles.test.js`
  - teacher fallback profile

- `upload-api.test.js`, `upload-utils.test.js`
  - R2 upload validation

- `files-api.test.js`
  - R2 file listing/deletion safety

현재 마지막 확인 기준:

- `node --test *.test.js`: 110개 통과
- `npm run build`: 통과

## 15. 현재 작업트리 상태

마지막 확인 시:

- 코드 변경 없음
- `.superpowers/`만 untracked로 보일 수 있음

`.superpowers/`는 이번 사이트 작업과 무관하므로 커밋하지 않는 것을 권장한다.

확인 명령:

```powershell
cd "C:\Users\USER\Documents\New project 6"
git status --short
```

## 16. 클로드가 우선 점검할 항목

1. 정적 HTML과 CMS 화면 데이터가 다시 어긋나지 않는지
   - `index.html`
   - `teacher-profiles.js`
   - `main.js` label maps
   - `admin-d1.js`

2. D1 migration 중복 문제
   - `0003_create_teacher_profiles.sql`에 direction 있음
   - `0004_add_teacher_direction.sql`도 direction 추가
   - 새 DB 초기 구축 시 duplicate column 가능

3. `index.html` 하단 inline contact submit handler와 `main.js` submit handler 중복 가능성
   - 현재 동작은 테스트 통과 상태지만, 유지보수 시 둘 중 하나만 수정하면 불일치 가능

4. SEO fallback과 CMS runtime 데이터 차이
   - 크롤러가 보는 HTML 원문은 CMS 데이터와 다를 수 있음
   - 중요한 SEO 문구는 반드시 정적 HTML에도 반영

5. Resend 설정
   - `CONTACT_TO_EMAIL`
   - `CONTACT_FROM_EMAIL`
   - 도메인 인증/DNS
   - 여러 수신자 발송 여부

6. Cloudflare Pages Production/Preview 브랜치 혼동
   - 커밋/push 후 Production deploy가 실제로 뜨는지 확인
   - Search Console 재색인 요청 필요

7. 모바일 모달
   - 강사 상세
   - 강사 대표작
   - 클래스 포트폴리오
   - 브라우저 뒤로가기 버튼

8. 성능
   - hero mp4가 큼
   - 강사 이미지도 큰 편
   - 모달/포트폴리오 prewarm, 이미지 lazy loading, mousemove/scroll 이벤트 확인

## 17. 절대 조심할 것

- 대규모 구조 변경 금지
- 라우팅/폴더 구조 변경 금지
- UI/UX 흐름 갈아엎기 금지
- CMS/D1 구조를 바꿀 때는 migration과 운영 DB 상태를 반드시 확인
- 사용자가 보는 디자인 방향성 유지
- 정적 HTML fallback을 CMS와 다르게 방치하지 말 것
- `.superpowers/`는 커밋하지 말 것

## 18. 커밋/배포 기본 루틴

```powershell
cd "C:\Users\USER\Documents\New project 6"
node --test *.test.js
npm run build
git status --short
git add <변경 파일들>
git commit -m "<commit message>"
git push origin main
```

Cloudflare Pages에서 Production deploy가 성공했는지 확인한다.  
SEO 관련 변경이면 Google Search Console에서 URL 검사 후 색인 생성 요청을 한다.
