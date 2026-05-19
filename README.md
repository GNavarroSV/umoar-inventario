# My Fullstack Application

This project is a fullstack application built with NestJS for the backend and Next.js for the frontend. It serves as a template for developing modern web applications with a clear separation of concerns between the client and server.

## Project Structure

```
my-fullstack-app
├── backend          # NestJS backend application
│   ├── src         # Source files for the backend
│   ├── package.json # Backend dependencies and scripts
│   ├── tsconfig.json # TypeScript configuration for the backend
│   └── README.md    # Documentation for the backend
└── frontend         # Next.js frontend application
    ├── app         # Main application files for the frontend
    ├── components   # React components used in the frontend
    ├── lib         # API functions for backend communication
    ├── package.json # Frontend dependencies and scripts
    ├── tsconfig.json # TypeScript configuration for the frontend
    ├── next.config.js # Next.js configuration
    └── README.md    # Documentation for the frontend
```

## Docker Setup

Levantamiento completo del stack:

```bash
docker compose up --build
```

Servicios expuestos:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

### Healthchecks

- Backend: `GET /health`
- Frontend: `GET /`

### Variables clave

- `JWT_SECRET`: secreto del backend
- `DATABASE_URL`: cadena de conexion a PostgreSQL
- `NEXT_PUBLIC_API_URL`: URL publica del backend para el frontend

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- pnpm

### Local Development

1. Instala dependencias:
   ```bash
   cd backend
   pnpm install

   cd ../frontend
   pnpm install
   ```

2. Arranca cada app por separado:
   ```bash
   cd backend
   pnpm run build
   pnpm start

   cd ../frontend
   pnpm run dev
   ```

### Usage

- Access the backend API at `http://localhost:3000`
- Access the frontend application at `http://localhost:3001`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.