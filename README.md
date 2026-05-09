# My Fitness Buddy

Minimal instructions to install and run (frontend + backend).

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL (or set DATABASE_URL)
- API keys as needed (POLAR credentials https://admin.polaraccesslink.com/)

## Backend (API)
1. cd backend
2. npm install
3. Copy and fill environment variables:
   - create `.env` with at least: DATABASE_URL,
4. Run (dev): `npm run dev`
   - Production: `npm run build` then `npm start`
   - Default dev server: http://localhost:3000 (check src/index.ts)

## Frontend (UI)
1. cd frontend
2. npm install
3. Run (dev): `npm run dev`
   - Vite dev server usually at: http://localhost:5173
   - Production: `npm run build` then `npm run preview`

## Notes
- Ensure backend and frontend ports match any configured proxy or API base URL.
- If using PostgreSQL, create the DB and set DATABASE_URL before starting backend.
