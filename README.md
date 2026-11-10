# PotG Backend

택시 합승 서비스 PotG의 백엔드 서버입니다.

## 기술 스택

- [Bun](https://bun.sh/) - JavaScript 런타임
- [NestJS](https://nestjs.com/) - Node.js 프레임워크
- [PostgreSQL](https://www.postgresql.org/) - 데이터베이스
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM

## 시작하기

### 필수 조건

- Bun >= 1.0.0
- PostgreSQL >= 14.0

### 설치

```bash
# 의존성 설치
bun install
```

### 환경 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/potg_db

# IDP Server
IDP_CLIENT_ID=CHANGE_TO_YOUR_IDP_CLIENT_ID
IDP_CLIENT_SECRET=CHANGE_TO_YOUR_IDP_CLIENT_SECRET

# NPM Token
NPM_TOKEN=CHANGE_TO_YOUR_NPM_TOKEN
```

IDP 관련 환경 변수는 다음의 과정을 통해 발급받을 수 있습니다.

1.  idp.gistory.me 접속
2.  개발자 센터에서 새로운 서비스 추가
3.  서비스 이름 입력 후 생성
4.  서비스 상세에서 client id와 client secret 발급
5.  발급받은 값을 각각 IDP_CLIENT_ID와 IDP_CLIENT_SECRET에 입력

NPM Token은 다음의 과정을 통해 발급받을 수 있습니다.

1.  github.com 접속
2.  로그인 후 프로필에서 Settings로 이동
3.  좌측 Open Menu 클릭 후, 목록 아래의 Developer settings로 이동
4.  Personal access tokens 선택 후 Tokens (classic) 선택
5.  repo 체크 후 Generate Token
6.  발급된 Token을 NPM_TOKEN에 입력

### 개발 서버 실행

```bash
# 개발 모드
bun run start:dev

# 프로덕션 모드
bun run start:prod
```

### 데이터베이스 마이그레이션

```bash
# 마이그레이션 생성
bunx drizzle-kit generate

# 마이그레이션 적용
bunx drizzle-kit push
```

## 라이선스

MIT
