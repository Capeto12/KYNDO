# README_MIGRATIONS

Checklist mínimo para migraciones seguras:
1. Hacer backup de la DB antes de migrar (scripts/backup_db.sh).
2. Crear migración que añada columnas de forma no destructiva (nullable).
3. Desplegar migración en staging y ejecutar backfill en batches.
4. Probar la app en staging y revisar logs.
5. Cuando seguro, marcar NOT NULL y eliminar columnas antiguas en migración posterior.
6. Mantener scripts idempotentes en `scripts/` (backfill, export, bulk_promote).

Comandos útiles:
- Generar client Prisma:
  npx prisma generate
- Aplicar migraciones en producción/staging:
  npx prisma migrate deploy
- Ejecutar migraciones de desarrollo local:
  npx prisma migrate dev --name <nombre>
