# Kulan Platform

Monorepo for the Kulan events app.

| Folder | Stack | Purpose |
| --- | --- | --- |
| `frontend/` | React Native + Expo | Mobile app |
| `backend/` | NestJS + TypeORM | REST API + auth |

See [AGENTS.md](./AGENTS.md) for development conventions.

## Quick start

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm run start
```
