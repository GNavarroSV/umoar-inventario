# GUÍA DE AUTENTICACIÓN Y ENDPOINTS PROTEGIDOS

## 📖 Introducción

Esta guía te muestra cómo implementar y usar el sistema de autenticación JWT en el Sistema de Inventario.

## 🔐 Cómo Funciona JWT

JWT (JSON Web Tokens) es un token autogenerado que contiene la información del usuario. 

1. El usuario se registra/inicia sesión
2. El servidor genera un token JWT
3. El cliente guarda el token
4. El cliente envía el token en cada solicitud a endpoints protegidos
5. El servidor valida el token

## 📦 Flujo de Autenticación

```
┌─────────┐                          ┌──────────┐
│ Cliente │                          │ Servidor │
└────┬────┘                          └────┬─────┘
     │                                    │
     │─── POST /auth/register ──────────>│
     │     { name, email, password }     │
     │                                    │
     │<─── JWT Token + User Data ────────│
     │                                    │
     │─── GET /items (+ JWT Token) ────>│
     │     Authorization: Bearer JWT     │
     │                                    │
     │<─── Items Data ────────────────────│
```

## 🧪 Pruebas con Postman/Thunder Client

### 1. REGISTRO DE USUARIO

**Método:** POST  
**URL:** `http://localhost:3000/auth/register`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiPassword123",
  "password_confirm": "MiPassword123"
}
```

**Respuesta Exitosa (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJzdWIiOiIxMzAxODk0ODA5IiwiaWF0IjoxNzE1NDkwMjI0LCJleHAiOjE3MTU1NzY2MjR9.qKFd1RXJ8...",
  "user": {
    "id": "1301894809",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "createdAt": "2024-05-12T10:30:24.000Z"
  }
}
```

**Errores Posibles:**
```json
{
  "statusCode": 400,
  "message": "Las contraseñas no coinciden"
}
```

```json
{
  "statusCode": 400,
  "message": "El email ya está registrado"
}
```

---

### 2. LOGIN DE USUARIO

**Método:** POST  
**URL:** `http://localhost:3000/auth/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "juan@example.com",
  "password": "MiPassword123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJzdWIiOiIxMzAxODk0ODA5IiwiaWF0IjoxNzE1NDkwMjI0LCJleHAiOjE3MTU1NzY2MjR9.qKFd1RXJ8...",
  "user": {
    "id": "1301894809",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "createdAt": "2024-05-12T10:30:24.000Z"
  }
}
```

**Errores Posibles:**
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas"
}
```

---

### 3. OBTENER PERFIL (Endpoint Protegido)

**Método:** GET  
**URL:** `http://localhost:3000/profile`  
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJzdWIiOiIxMzAxODk0ODA5IiwiaWF0IjoxNzE1NDkwMjI0LCJleHAiOjE3MTU1NzY2MjR9.qKFd1RXJ8...
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Perfil del usuario",
  "user": {
    "id": "1301894809",
    "email": "juan@example.com"
  }
}
```

**Error sin Token (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 🛠️ Cómo Guardar el Token en Postman/Thunder Client

### En Postman:

1. Haz una petición a `/auth/login`
2. En la sección "Tests", agrega:
```javascript
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.accessToken);
```
3. Ahora puedes usar `{{token}}` en el header Authorization

### En Thunder Client:

1. En la sección de "Env", crea una variable:
```
token: <tu_token_aqui>
```
2. En el header Authorization, usa: `Bearer {{token}}`

---

## 💡 Ejemplo: Proteger un Nuevo Endpoint

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';

@Controller('items')
export class ItemsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getItems(@Request() req: any) {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    console.log(`Usuario ${userEmail} solicitó items`);
    
    return {
      message: 'Items del usuario',
      userId: userId,
      items: [
        // Aquí van tus items
      ]
    };
  }
}
```

---

## 🔒 Validación Manual del Token

Si necesitas validar el token manualmente:

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
```

---

## 📱 Implementar en Frontend (Next.js)

```typescript
// Guardar token después del login
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
localStorage.setItem('token', data.accessToken);

// Usar token en solicitudes protegidas
const items = await fetch('http://localhost:3000/items', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | Token no enviado o inválido | Incluye el token en Authorization header |
| `400 Las contraseñas no coinciden` | Campos password y password_confirm diferentes | Verifica que las contraseñas sean idénticas |
| `400 El email ya está registrado` | El email ya existe | Usa otro email o haz login |
| `Token expired` | El token ha vencido (24 horas) | Haz login nuevamente para obtener uno nuevo |

---

## 🔑 Formato del Token

Cada JWT contiene 3 partes separadas por puntos (.):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJzdWIiOiIxMzAxODk0ODA5IiwiaWF0IjoxNzE1NDkwMjI0LCJleHAiOjE3MTU1NzY2MjR9.qKFd1RXJ8...
│                                      │                                                              │
Header (algoritmo)                     Payload (datos del usuario)                                  Signature (verificación)
```

### Decodificar manualmente:
1. Ve a [jwt.io](https://jwt.io)
2. Pega tu token en "Encoded"
3. Verás el contenido decodificado

---

## 📝 Checklist de Seguridad

- [ ] ✅ Cambiar `JWT_SECRET` en producción
- [ ] ✅ Usar HTTPS en producción
- [ ] ✅ Validar email y password en frontend
- [ ] ✅ Guardar token de forma segura (no localStorage en apps sensibles)
- [ ] ✅ Implementar logout para limpiar token
- [ ] ✅ Implementar refresh tokens
- [ ] ✅ Agregar rate limiting a login

---

## 🆘 Ayuda Rápida

```bash
# Ver estructura de auth
ls -la src/auth/

# Compilar
npm run build

# Ejecutar en modo desarrollo
npm run watch

# Probar que funciona
curl http://localhost:3000
```

