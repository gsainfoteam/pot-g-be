# PotG Backend

## API 문서 (Swagger)

서버 실행 후 다음 경로에서 현재 HTTP API 명세를 확인할 수 있습니다.

- Swagger UI: <http://localhost:3000/api/docs>
- OpenAPI JSON: <http://localhost:3000/api/docs-json>
- OpenAPI YAML: <http://localhost:3000/api/docs-yaml>

사용자·관리자 API 및 `/health`를 포함합니다. WebSocket 메시지는 별도 프로토콜이므로 이 HTTP 명세에 포함하지 않습니다.

Swagger UI의 **Authorize**에 `Bearer` 접두사 없이 액세스 토큰을 입력합니다.
`user-access-token`은 `/api/v1/user/login`으로 발급한 사용자 토큰,
`manager-access-token`은 `/api/manager/v1/auth/login`으로 발급한 관리자 토큰입니다.
관리자 계정 생성·권한 변경·삭제에는 `superadmin` 권한이 필요합니다.

POST의 기본 성공 상태는 **201**입니다. `result` 필드가 있는 API는 HTTP 성공 상태에서도
`OK` 이외의 업무 오류 코드를 반환할 수 있으므로 응답 본문을 함께 확인해야 합니다.
날짜 요청은 `2026-11-15T10:00:00+09:00`처럼 시간대가 포함된 ISO 8601 문자열을 권장합니다.
팟 이벤트의 `timestamp`와 조회 조건 `starts_from`은 Unix timestamp **초** 단위입니다.

DTO 필드를 변경할 때는 `@ApiProperty`/`@ApiPropertyOptional`을 함께 갱신하고,
새 HTTP API에는 요약, 응답 타입, 필요한 인증 정보를 추가합니다.
제네릭 페이지네이션과 이벤트 payload는 명시적인 스키마를 사용합니다.

```bash
# 외부 서비스 연결 없이 전체 HTTP 명세 및 문서 경로 검증
bun run test --runInBand swagger.spec.ts
bun run build
```

구현 방식은 [NestJS OpenAPI 문서](https://docs.nestjs.com/openapi/types-and-parameters)를 참고했습니다.

택시 합승 서비스 PotG의 백엔드 서버입니다.

## 기술 스택

- [Bun](https://bun.sh/) - JavaScript 런타임
- [NestJS](https://nestjs.com/) - Node.js 프레임워크
- [PostgreSQL](https://www.postgresql.org/) - 데이터베이스
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM

## 시작하기

### 필수 조건

- bun >= 1.0.0
- npm >=10.0.0
- node >=24.22.1
- PostgreSQL >= 17.0

### 설치

```bash
# 의존성 설치
# 1. github CLI가 설치되어 있는 경우
export NPM_TOKEN=$(gh auth token)
bun install

# 2. github CLI가 설치되어 있지 않은 경우 - 환경 설정 NPM_TOKEN 부분을 참고하여 NPM_TOKEN 발급
export NPM_TOKEN=(발급받은 토큰)
bun install
```

### 환경 설정

`.env-template` 파일을 복사하여 `.env` 파일을 생성하고, 다음 환경 변수를 설정합니다:

```env
# Database Configuration
POSTGRES_PASSWORD=password
POSTGRES_USER=potg
POSTGRES_DB=potg
DATABASE_URL=postgresql://potg:password@localhost:5432/potg
# (Postgres 관련 환경 변수는 모두 수정 불필요)

# IDP Server
IDP_URL=https://api.account.gistory.me # (수정 불필요)
IDP_CLIENT_ID=CHANGE_TO_YOUR_IDP_CLIENT_ID
IDP_CLIENT_SECRET=CHANGE_TO_YOUR_IDP_CLIENT_SECRET
IDP_AUTHORIZE_URL=https://account.gistory.me/authorize # (수정 불필요)

# Firebase와 Slack 관련 환경변수는 로컬 실행 시 불필요하므로 주석 처리된 상태를 유지

# NPM Token
NPM_TOKEN=CHANGE_TO_YOUR_NPM_TOKEN
```

IDP 관련 환경 변수 중 IDP_CLIENT_ID와 IDP_CLIENT_SECRET은 따로 발급받아야 합니다. 두 환경 변수는 다음의 과정을 통해 발급받을 수 있습니다.

1. account.gistory.me 접속
2. 개발자 센터에서 새로운 서비스 추가
3. 서비스 이름 입력 후 생성 (임의로 설정해도 상관 없음)
4. 서비스 상세-연결에서 Redirect URIs에 http://localhost:3000/callback을 입력
5. 서비스 상세-일반에서 client id와 client secret 발급
6. 발급받은 값을 각각 IDP_CLIENT_ID와 IDP_CLIENT_SECRET에 입력

#### NPM Token 발급 방법

NPM Token은 다음의 과정을 통해 발급받을 수 있습니다.

(github CLI가 설치되어 있는 경우)

1. terminal에 gh auth token 명령어 실행
2. 출력된 결과를 NPM_TOKEN에 입력

(github CLI가 설치되어 있지 않은 경우)

1. github.com 접속
2. 로그인 후 프로필에서 Settings로 이동
3. 좌측 Open Menu 클릭 후, 목록 아래의 Developer settings로 이동
4. Personal access tokens 선택 후 Tokens (classic) 선택
5. read:packages 체크 후 Generate Token
6. 발급된 Token을 NPM_TOKEN에 입력

### Docker 실행

로컬에서 별도로 PostgreSQL을 설치해 데이터베이스를 구동할 수는 있지만, 기본적으로는 Docker 사용을 **강력히** 권장합니다.

`.env` 파일에 설정된 POSTGRES 환경 변수 값을 바탕으로 로컬 DB 컨테이너가 자동으로 생성됩니다.

```bash
# 백그라운드에서 PostgreSQL 컨테이너 실행
docker compose up -d potg-db
```

### 데이터베이스 마이그레이션 및 개발을 위한 세팅

```bash
bun run db:migrate
```

어드민 페이지의 경우 db 에 로그인이 가능한 idp 계정 리스트가 저장되어 있어야 합니다. (화이트리스트 개념)
따라서 아래 명령어를 실행시켜야 본인의 idp 계정을 통해 어드민 페이지로 접속이 가능합니다.

```bash
bun run db:seed-admin -- <email>@gm.gist.ac.kr superadmin
```

### Admin 프론트엔드 설정 및 빌드

potG 백엔드 서버는 `admin/dist` directory의 파일을 통해 관리자 화면을 제공합니다.
`admin` 폴더 안에 `.env-template`을 복사하여 `.env` 파일을 생성합니다.
VITE_IDP_CLIENT_ID 환경 변수에 이전에 발급받은 IDP_CLIENT_ID 값을 넣습니다.

```env
# VITE_IDP_AUTHORIZE_URL은 수정 불필요
VITE_IDP_AUTHORIZE_URL=[https://account.gistory.me/authorize](https://account.gistory.me/authorize)
VITE_IDP_CLIENT_ID=CHANGE_TO_YOUR_IDP_CLIENT_ID
```

```bash
# admin 폴더로 이동
cd admin

# admin 의존성 패키지 설치
bun install

# admin/dist 생성
bun run build

# 프로젝트 루트 폴더로 복귀
cd ..
```

### 개발 서버 실행

```bash
bun run start:dev
```
