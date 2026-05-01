# Sistema de Gestion de Pedidos - Riquisimo

Esqueleto inicial minimo viable para un sistema interno de gestion de pedidos presenciales.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- ORM: Prisma
- Contenedores: Docker + Docker Compose

## Estructura

```text
sistema-pedidos-riquisimo/
├── frontend/
├── backend/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Comandos basicos

```bash
docker compose up --build
docker compose down
```

## Accesos esperados

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:3000/api/health`

## Notas

- El frontend muestra una pantalla inicial simple.
- El backend levanta Express en el puerto `3000`.
- Prisma queda configurado para PostgreSQL, sin modelos ni migraciones todavia.
- El entorno de desarrollo del backend usa `tsx`.
- La ruta `GET /api/health` responde:

```json
{
  "status": "ok",
  "message": "Backend running"
}
```
