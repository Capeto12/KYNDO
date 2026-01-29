# README_BACKEND

Resumen rápido:
- Backend: Node.js + TypeScript + Prisma (SQLite por defecto en dev)
- Endpoints:
  - `GET /api/cards/:id/presentation`
  - `PATCH /api/admin/cards/:id` (requiere header `x-admin-key`)
- Worker: `src/worker/thumbnailWorker.ts` (procesa jobs usando queue)

Ejecutar local (rápido):
1. Instalar dependencias:
   npm install
2. Generar Prisma client:
   npx prisma generate
3. Ejecutar migraciones dev (crea SQLite `dev.db`):
   npx prisma migrate dev --name init
4. Cargar seed (opcional):
   npx ts-node seeds/seed_dev.ts
5. Levantar API:
   npm run dev
6. Levantar worker (en otra terminal):
   npm run worker

Deploy a Railway (resumen):
1. Conecta tu repositorio a Railway.
2. En Railway, crea un Project y el servicio Web apuntando a la rama `main` (o a tu rama de trabajo).
3. Configura variables de entorno desde `.env.example`.
4. En Railway, en la consola del proyecto ejecuta:
   npx prisma generate
   npx prisma migrate deploy
   npx ts-node seeds/seed_dev.ts
5. Crea un service adicional para worker (comando: `npm run worker`).

Notas:
- No usar `ADMIN_KEY` en producción: reemplazar por autenticación real.
- Para producción usar Postgres gestionado y storage S3 para assets.
