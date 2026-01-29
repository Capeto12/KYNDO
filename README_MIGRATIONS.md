# README_MIGRATIONS

Checklist mínimo para migraciones seguras:
1. Hacer backup de la DB antes de migrar (scripts/backup_db.sh).
2. Crear migración que añada columnas de forma no destructiva (nullable).
3. Desplegar esa migración en staging y ejecutar backfill en batches.
4. Probar la app en staging y revisar logs.
5. Cuando sea seguro, crear una migración posterior que marque las nuevas columnas como NOT NULL y elimine las columnas antiguas, y desplegar primero esa migración (npx prisma migrate deploy) antes de desplegar código que dependa de esas restricciones.
6. Mantener scripts idempotentes en `scripts/` (backfill, export, bulk_promote).

Comandos útiles:
- Generar client Prisma:
  npx prisma generate
- Aplicar migraciones en producción/staging (siempre ANTES de desplegar la nueva versión de la app que depende de ellas):
  npx prisma migrate deploy
- Ejecutar migraciones de desarrollo local:
  npx prisma migrate dev --name <nombre>
