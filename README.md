# Personal Diary App

A private, self-hosted diary application with Facebook-like post UX.

## Tech Stack

- **Backend:** NestJS 11 + TypeORM + SQLite
- **Frontend:** Next.js 16 + Mantine 8
- **Container:** Docker + Docker Compose

## Getting Started

### Development

```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

### Docker

```bash
docker compose up -d
```

## Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs
