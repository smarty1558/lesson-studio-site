# Next Chat Handoff - Lesson Studio Site

이 문서는 다음 채팅에서 바로 작업을 이어가기 위한 확정 사항 정리다.

## 프로젝트 위치

- 로컬 경로: `C:\Users\USER\Documents\New project 6`
- GitHub 저장소: `https://github.com/smarty1558/lesson-studio-site`
- 기본 브랜치: `main`
- Cloudflare Pages 프로젝트: `lesson-studio-site`
- 빌드 명령: `npm run build`
- 빌드 출력 폴더: `dist`

## 현재 Git 상태

확인 기준 최신 커밋:

```text
d4bca9b Improve R2 file manager in portfolio CMS
6c9c13d Add R2 file picker to portfolio CMS
d1bfc30 Improve portfolio CMS editor and filtering
a885c41 Merge CMS fields with R2 upload admin
98102b3 Set R2 public URL
```

작업트리 상태:

```text
clean
```

## 확정된 기능

### 공개 포트폴리오

- 공개 포트폴리오 페이지는 `/api/portfolio`에서 D1 데이터를 받아 렌더링한다.
- `visible = true`인 항목만 공개 페이지에 나온다.
- 정렬은 `sortOrder ASC`, 이후 최신 생성일/날짜 기준이다.
- 특정 강사/클래스에 연결된 포트폴리오만 해당 섹션에 표시된다.
- 매칭되는 항목이 없을 때 전체 포트폴리오를 fallback으로 뿌리던 문제는 제거됐다.

### 관리자 인증

- `/admin`은 처음에 관리자 비밀번호 입력 화면을 보여준다.
- Cloudflare 환경변수 `ADMIN_PASSWORD`로 인증한다.
- 현재 사용 중인 비밀번호 값은 Cloudflare dashboard 쪽 Secret으로 `1324`를 설정해둔 상태다.
- 비밀번호는 클라이언트 번들에 직접 하드코딩하지 않는다.

### 관리자 CMS

- `/admin` 로그인 후 Wix CMS처럼 표 형태로 포트폴리오 항목을 보여준다.
- 표에는 상태, 이미지, 프로젝트명, 등급/정렬, 설명, 카테고리, 크레딧, 태그, 표시 조건, 상세설명, 날짜, 오디오, 링크가 표시된다.
- 표는 가로 스크롤이 가능하다.
- 긴 텍스트는 칸 밖으로 튀어나가지 않고 말줄임 처리된다.
- 표 좌측에 수정/삭제 버튼이 있다.
- `새 항목` 버튼을 누르면 임시 빈 행이 생긴다.
- 임시 행은 DB에 저장되지 않았으므로 새로고침하거나 다시 열면 사라진다.
- 수정 버튼을 누르면 아이템 에디터가 팝업으로 열린다.

### 아이템 에디터

- 팝업 에디터에서 아래 값을 관리한다.
  - title
  - description
  - category
  - date
  - image file
  - audio file
  - image URL
  - audio URL
  - YouTube URL
  - externalLink
  - visible
  - sortOrder
  - teacherKeys
  - targetKeys
  - detail
  - format
  - points
- 이미지/오디오 파일을 선택하면 먼저 R2에 업로드하고, 반환된 public URL을 D1에 저장한다.
- 이미지 URL / Audio URL 옆에 `R2` 버튼이 있다.
- `R2` 버튼을 누르면 R2 파일 탐색기 팝업이 열린다.

### R2 업로드

- 업로드 API: `POST /api/admin/upload`
- 요청 형식: `multipart/form-data`
- 필드:
  - `file`
  - `type`: `image` 또는 `audio`
- R2 binding 이름: `PORTFOLIO_BUCKET`
- public URL 환경변수: `R2_PUBLIC_URL`
- 이미지 저장 경로: `portfolio/images/`
- 오디오 저장 경로: `portfolio/audio/`
- 업로드 파일명은 이제 알아볼 수 있는 형태다.

예:

```text
portfolio/audio/123e4567-e89b-12d3-a456-426614174000-original-file-name.mp3
portfolio/images/123e4567-e89b-12d3-a456-426614174000-cover-image.webp
```

- 원본 파일명만 그대로 쓰지 않는다.
- 앞에 UUID를 붙여 충돌을 막는다.
- 원본 파일명은 안전한 문자만 남겨 관리자가 알아볼 수 있게 한다.

### R2 파일 탐색기

- 파일 목록 API: `GET /api/admin/files?type=image`
- 파일 목록 API: `GET /api/admin/files?type=audio`
- 파일 삭제 API: `DELETE /api/admin/files?key=portfolio/images/...`
- 파일 삭제 API: `DELETE /api/admin/files?key=portfolio/audio/...`
- 관리자 인증이 필요하다.
- 클라이언트에는 R2 secret, access key, bucket credential이 노출되지 않는다.
- 삭제는 `portfolio/images/`, `portfolio/audio/` 안의 파일만 허용한다.
- 파일 탐색기 팝업은 카드/썸네일 그리드 방식이다.
- 이미지 파일은 썸네일로 보인다.
- 오디오 파일은 Audio 카드로 보인다.
- 파일명, 용량, 업로드 날짜가 보인다.
- `선택` 버튼을 누르면 해당 URL이 에디터 입력칸에 들어간다.
- `삭제` 버튼을 누르면 R2에서 파일을 삭제한다.
- 삭제 전 확인창을 띄운다.
- 현재는 D1에서 해당 URL이 사용 중인지 역참조 검사는 하지 않는다.

### D1

- D1 binding 이름: `DB`
- 테이블명: `portfolio_items`
- 주요 컬럼:
  - `id`
  - `title`
  - `description`
  - `category`
  - `date`
  - `image_url`
  - `audio_url`
  - `external_link`
  - `visible`
  - `sort_order`
  - `metadata`
  - `created_at`
  - `updated_at`
- `metadata` 컬럼에는 태그, 표시 조건, 상세 설명, 유튜브 URL 같은 확장 정보가 JSON으로 들어간다.
- 원격 D1 migration 상태는 마지막 확인 시:

```text
No migrations to apply
```

## Cloudflare 필수 설정

### Bindings

- D1 database binding: `DB`
- R2 bucket binding: `PORTFOLIO_BUCKET`

### Variables and Secrets

- `ADMIN_PASSWORD`
  - Secret으로 설정
  - 현재 테스트용 값: `1324`
- `R2_PUBLIC_URL`
  - Plaintext로 설정 가능
  - 현재 예: `https://pub-da3c2c9b5797479eb03e88e4a6084539.r2.dev`

## 주요 파일

### Frontend

- `main.js`
  - 공개 페이지 렌더링
  - 포트폴리오 필터링
  - `/admin` 라우팅 진입
- `admin-d1.js`
  - 관리자 CMS UI
  - 표 UI
  - 아이템 팝업 에디터
  - R2 파일 탐색기 팝업
  - 생성/수정/삭제/토글 흐름
- `style.css`
  - 사이트 전체 스타일
  - 관리자 CMS 표
  - 에디터 모달
  - R2 파일 탐색기 카드 UI

### Cloudflare Functions

- `functions/api/portfolio.js`
  - 공개 포트폴리오 목록 API
- `functions/api/admin/portfolio.js`
  - 관리자 목록/생성 API
- `functions/api/admin/portfolio/[id].js`
  - 관리자 수정/삭제 API
- `functions/api/admin/upload.js`
  - R2 업로드 API
- `functions/api/admin/files.js`
  - R2 파일 목록/삭제 API
- `functions/_shared/portfolio-utils.js`
  - D1 row mapping, payload normalization
- `functions/_shared/upload-utils.js`
  - 업로드 검증, public URL 생성, 안전한 파일명 생성

### Tests

- `portfolio-api.test.js`
- `portfolio-utils.test.js`
- `portfolio-data.test.js`
- `upload-api.test.js`
- `upload-utils.test.js`
- `files-api.test.js`

## 검증 명령

```powershell
cd "C:\Users\USER\Documents\New project 6"

node --test portfolio-utils.test.js portfolio-api.test.js upload-utils.test.js upload-api.test.js files-api.test.js portfolio-data.test.js
npm run build
```

마지막 확인 결과:

```text
tests: 18 pass
npm run build: success
```

## 배포 흐름

로컬 변경 후:

```powershell
cd "C:\Users\USER\Documents\New project 6"

git status
git add .
git commit -m "작업 내용"
git push origin main
```

GitHub main에 push되면 Cloudflare Pages가 자동 배포한다.

배포 확인:

1. Cloudflare Dashboard
2. Workers & Pages
3. `lesson-studio-site`
4. Deployments
5. 최신 commit hash가 GitHub 최신 커밋과 같은지 확인

## 다음 작업 후보

### 우선순위 높음

- R2 파일 삭제 시 D1에서 사용 중인 URL인지 먼저 검사하기
- 사용 중인 파일이면 삭제 차단 또는 경고 강화
- R2 파일 탐색기에서 검색 기능 추가
- R2 파일 탐색기에서 이미지/오디오 탭 전환 추가
- 업로드 직후 자동으로 파일 탐색기 목록 새로고침

### 우선순위 중간

- CMS 표에서 컬럼별 정렬
- CMS 표에서 검색/필터
- 아이템 에디터 입력값 검증 강화
- 삭제 취소 또는 soft delete
- 포트폴리오 항목이 참조하는 R2 key를 D1에 별도 저장

### 우선순위 낮음

- 대량 업로드
- 드래그 앤 드롭 업로드
- R2 폴더별 용량 요약
- 썸네일 lazy loading 최적화

## 주의사항

- Cloudflare R2 key, secret, API token은 절대 클라이언트 코드에 넣지 않는다.
- `.env`, `.dev.vars`는 커밋하지 않는다.
- R2 업로드는 반드시 서버 API를 통해서만 한다.
- D1 수정은 반드시 관리자 API를 통해서만 한다.
- 사이트 디자인과 공개 포트폴리오 레이아웃은 임의로 갈아엎지 않는다.
- `/admin`은 CMS 기능을 추가하더라도 공개 페이지 구조를 망가뜨리면 안 된다.
