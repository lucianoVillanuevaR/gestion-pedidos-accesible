# Sistema de Gestion de Pedidos - Riquisimo

## Docker

Clonar el repositorio:

```bash
git clone https://github.com/lucianoVillanuevaR/gestion-pedidos-accesible.git
cd gestion-pedidos-accesible
```

Crear el archivo de variables de entorno:

```bash
cp .env.example .env
```

Levantar el proyecto:

```bash
docker compose up --build
```

URLs:

```text
Frontend: http://localhost
Backend health: http://localhost:3000/api/health
PostgreSQL: localhost:5433
```

## Sin Docker

Requisitos:

```text
Node.js
npm
PostgreSQL
```

Crear usuario y base de datos en PostgreSQL:

```sql
CREATE USER admin WITH PASSWORD 'admin123';
CREATE DATABASE sistema_pedidos OWNER admin;
```

Crear o editar `backend/.env`:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/sistema_pedidos
PORT=3001
```

Levantar el backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

En otra terminal, levantar el frontend:

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```
