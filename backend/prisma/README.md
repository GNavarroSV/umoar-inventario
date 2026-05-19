Uso rápido de Docker y Prisma

1. Levantar la base de datos con Docker Compose:

```bash
cd backend
docker compose up -d
```

2. Actualizar `DATABASE_URL` en `.env` según los valores del `docker-compose.yml`:

```
DATABASE_URL="postgresql://inventory_user:inventory_pass@localhost:5432/sistema_inventario?schema=public"
```

3. Generar cliente Prisma:

```bash
pnpm prisma generate
# si usas npx:
# npx prisma generate
```

4. Crear la migración inicial y aplicar:

```bash
pnpm prisma migrate dev --name init
# o npx prisma migrate dev --name init
```

5. Abrir pgAdmin en http://localhost:8080 (usuario: admin@local, pass: admin)
