# README_MIGRATIONS

Checklist mínimo para migraciones seguras:
1. Hacer backup de la DB antes de migrar (por ejemplo, usando tu script o herramienta de backup).
2. Crear migración que añada columnas de forma no destructiva (nullable).
3. Desplegar migración en staging y ejecutar backfill en batches.
4. Probar la app en staging y revisar logs.
5. Cuando seguro, marcar NOT NULL y eliminar columnas antiguas en migración posterior.
6. Mantener scripts o tareas idempotentes para backfill, export y promociones masivas.

Comandos útiles:
- Generar client Prisma:
  npx prisma generate
- Aplicar migraciones en producción/staging:
  npx prisma migrate deploy
- Ejecutar migraciones de desarrollo local:
  npx prisma migrate dev --name <nombre>
