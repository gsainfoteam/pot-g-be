# PotG Backend

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
DATABASE_URL=postgresql://potg:password@localhost:55432/potg
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

### fofo 이름 변경 (PGB-116)

`0024_rename_fofo_tables.sql`은 기존 `popo_chat_msg`, `popo_chat_reservation`,
`popo_chat_delivery`를 각각 `fofo_chat_*`로, 예약 테이블의 컬럼
`popo_chat_msg_type`을 `fofo_chat_msg_type`으로 이름만 변경합니다.
관련 인덱스와 PK/FK 제약조건도 이름만 변경하며, 테이블 재생성이나 데이터 복사는
없습니다. 기존 마이그레이션(0000~0023)은 수정하지 않습니다.

배포할 때는 이전 서버와 예약 발송 워커를 먼저 중지하고, `npm run db:migrate`를
실행한 뒤 새 서버를 시작하세요. 이전 서버는 변경 전 테이블·컬럼명을 참조하므로 두 버전을
동시에 실행하면 안 됩니다. `npm run start:prod`는 시작 시 마이그레이션을 실행합니다.

코드의 `fofoChatMsgType`은 변경된 DB 컬럼 `fofo_chat_msg_type`에 매핑합니다.
다음 저장 형식과 API 값은 유지합니다.

- PostgreSQL enum 이름 `popo_chat_type`, `popo_action_btn_type`과 값 `popo-…`는 유지합니다.
- `pot_event.data.popoChatType`, API 필드 `popo_chat_type`, 이벤트 종류
  `popo_chat_v1`은 기존 이벤트 기록·API 소비 측·대기 중인 발송 작업과의 호환성을
  위해 유지합니다.
- 관리자 API 경로 `/api/manager/v1/popo-messages`,
  `/api/manager/v1/popo-message-status`도 기존 관리자 화면과의 호환성을 위해 유지합니다.

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
