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

```

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