# Sistema de Inventario - Backend

Backend del Sistema de Inventario construido con NestJS.

## 🔐 Autenticación y Seguridad

El backend implementa un sistema completo de autenticación con **JWT (JSON Web Tokens)**.

### Características de Seguridad:

- ✅ Autenticación por JWT
- ✅ Hashing de contraseñas con bcrypt
- ✅ Guards para proteger endpoints
- ✅ Validación de tokens automática
- ✅ Expiración de tokens (24 horas)

## 📋 Requisitos Previos

- Node.js >= 14.0.0
- npm o yarn

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
```

## 🔧 Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
JWT_SECRET=tu_secret_key_muy_seguro_aqui_cambiar_en_produccion
NODE_ENV=development
```

⚠️ **IMPORTANTE**: En producción, debes cambiar `JWT_SECRET` a una clave segura y aleatoria.

## 🏃 Ejecutar la Aplicación

```bash
# Modo desarrollo (con watch)
npm run watch

# Compilar a producción
npm run build

# Iniciar servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 🔑 Endpoints de Autenticación

### 1. Registro de Usuario

**POST** `/auth/register`

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiPassword123",
  "password_confirm": "MiPassword123"
}
```

**Respuesta exitosa (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "createdAt": "2024-05-12T10:30:00Z"
  }
}
```

### 2. Login de Usuario

**POST** `/auth/login`

```json
{
  "email": "juan@example.com",
  "password": "MiPassword123"
}
```

**Respuesta exitosa (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "createdAt": "2024-05-12T10:30:00Z"
  }
}
```

## 🛡️ Endpoints Protegidos

Todos los endpoints protegidos requieren enviar el token en el header `Authorization`:

```
Authorization: Bearer <tu_access_token>
```

### Ejemplo: Obtener Perfil del Usuario

**GET** `/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "message": "Perfil del usuario",
  "user": {
    "id": "1234567890",
    "email": "juan@example.com"
  }
}
```

## 📚 Cómo Proteger Nuevos Endpoints

Para proteger un nuevo endpoint con JWT, usa el decorador `@UseGuards(JwtAuthGuard)`:

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards';

@Controller('items')
export class ItemsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getItems(@Request() req: any) {
    // req.user contiene la información del usuario autenticado
    return {
      userId: req.user.id,
      email: req.user.email
    };
  }
}
```

## 🧪 Pruebas

Usa Postman, Thunder Client, o curl para probar los endpoints:

```bash
# Registrar un nuevo usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123",
    "password_confirm": "Test123"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123"
  }'

# Acceder a endpoint protegido
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📁 Estructura del Proyecto

```
src/
├── auth/                 # Módulo de autenticación
│   ├── dto/             # Data Transfer Objects
│   ├── strategies/      # Estrategias de Passport
│   ├── guards/          # Guards para protección
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # Módulo de usuarios
│   ├── dto/
│   ├── users.service.ts
│   └── users.module.ts
├── controllers/         # Controladores generales
├── services/            # Servicios generales
├── types/               # Tipos TypeScript
├── app.module.ts        # Módulo principal
└── main.ts              # Punto de entrada
```

## 🔒 Buenas Prácticas de Seguridad

1. **Cambiar JWT_SECRET en producción**: Usa una clave larga y aleatoria
2. **HTTPS obligatorio**: En producción, todos los endpoints deben usar HTTPS
3. **CORS configurado**: Configura CORS solo para dominios permitidos
4. **Rate limiting**: Considera agregar rate limiting a `/auth/login`
5. **Validación de entrada**: Valida y sanitiza todas las entradas
6. **Variabilidad de tokens**: Los tokens tienen expiración de 24 horas

## 📝 Próximos Pasos

- [ ] Agregar base de datos (PostgreSQL/MongoDB)
- [ ] Implementar refresh tokens
- [ ] Agregar roles y permisos (RBAC)
- [ ] Implementar endpoints de inventario
- [ ] Agregar validaciones más estrictas
- [ ] Configurar CORS
- [ ] Agregar logging
- [ ] Implementar rate limiting

## 📞 Soporte

Para reportar problemas o sugerencias, por favor crea un issue en el repositorio.