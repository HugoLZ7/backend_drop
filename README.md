# Backend Boxful - API de órdenes

API REST desarrollada como parte de la prueba técnica de Boxful. Permite registrar usuarios, autenticarlos mediante JWT, crear órdenes de envío y consultar el historial de órdenes con filtros.

La aplicación web que consume esta API se encuentra en el repositorio [frontend_drop](https://github.com/HugoLZ7/frontend_drop).

## Tecnologías

- NestJS 12
- TypeScript
- MongoDB Atlas
- Prisma ORM 6
- JWT (`@nestjs/jwt`, `passport-jwt`) y bcrypt
- class-validator y class-transformer

## Requisitos

- Node.js 20 o superior
- npm
- Una base de datos MongoDB (por ejemplo, un cluster gratuito de MongoDB Atlas)

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/HugoLZ7/backend_drop.git
   cd backend_drop
   ```

2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Crear el archivo `.env` a partir del ejemplo y completar los valores:

   ```bash
   cp .env.example .env
   ```

4. Sincronizar el esquema con la base de datos y generar el cliente de Prisma:

   ```bash
   npx prisma db push
   ```

   Este comando crea los índices definidos en el esquema y genera el cliente de Prisma.

5. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run start:dev
   ```

   La API queda disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a MongoDB, incluyendo el nombre de la base de datos | `mongodb+srv://<usuario>:<contraseña>@<cluster>/<base_de_datos>` |
| `JWT_SECRET` | Clave secreta para firmar los tokens. Debe ser larga y aleatoria | Ver el comando siguiente |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token, en segundos | `86400` (1 día) |
| `PORT` | Puerto del servidor (opcional) | `3000` |

Para generar un valor seguro para `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Inicia el servidor y lo reinicia al detectar cambios |
| `npm run build` | Compila el proyecto en la carpeta `dist` |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run format` | Aplica el formato de Prettier al código |
| `npm run lint` | Revisa el código con oxlint |

## Endpoints

Las rutas de órdenes requieren el encabezado `Authorization: Bearer <token>`, donde el token se obtiene en el inicio de sesión.

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| POST | `/auth/register` | No | Registra un usuario |
| POST | `/auth/login` | No | Inicia sesión y devuelve un token |
| GET | `/auth/me` | Sí | Devuelve los datos del usuario autenticado |
| POST | `/orders` | Sí | Crea una orden |
| GET | `/orders` | Sí | Lista las órdenes del usuario autenticado |

### POST /auth/register

```json
{
  "name": "Ana",
  "lastName": "López",
  "gender": "FEMALE",
  "dateBirth": "1998-05-20",
  "email": "ana@mail.com",
  "areaCode": "+503",
  "phone": "77777777",
  "password": "MiClave123"
}
```

- `gender` acepta `MALE`, `FEMALE` u `OTHER`.
- `areaCode` es el código de país del teléfono, por ejemplo `+503`.
- La contraseña debe tener entre 8 y 72 caracteres.
- Respuesta: `201` con los datos del usuario, sin la contraseña. Si el correo ya existe, responde `409`.

### POST /auth/login

```json
{
  "email": "ana@mail.com",
  "password": "MiClave123"
}
```

Respuesta: `200` con `{ "access_token": "..." }`. Si las credenciales no son válidas, responde `401`.

### POST /orders

```json
{
  "pickupAddress": "Colonia Las Magnolias, calle militar 1, San Salvador",
  "scheduledDate": "2026-12-03",
  "clientName": "Gabriela Reneé",
  "clientLastName": "Díaz López",
  "clientEmail": "gabbydiaz@gmail.com",
  "areaCode": "+503",
  "clientPhone": "77777777",
  "deliveryAddress": "Final 49 Av. Sur y Bulevar Los Próceres, San Salvador",
  "department": "San Salvador",
  "city": "San Salvador Centro",
  "reference": "Cerca de redondel Árbol de la Paz",
  "indications": "Llamar antes de entregar",
  "packages": [
    {
      "length": 15,
      "height": 15,
      "width": 15,
      "weight": 3,
      "content": "iPhone 14 Pro Max"
    }
  ]
}
```

- `reference` e `indications` son opcionales.
- `scheduledDate` no puede ser anterior a la fecha actual.
- `packages` debe contener entre 1 y 50 paquetes. Las medidas están en centímetros y el peso en libras.
- Respuesta: `201` con la orden creada, incluyendo su número de orden de 7 dígitos.

### GET /orders

Parámetros opcionales de consulta:

| Parámetro | Descripción | Valor por defecto |
|---|---|---|
| `startDate` | Fecha inicial de creación (`AAAA-MM-DD`) | Sin límite |
| `endDate` | Fecha final de creación (`AAAA-MM-DD`), incluye todo ese día | Sin límite |
| `page` | Número de página | `1` |
| `limit` | Órdenes por página (máximo 100) | `10` |

Ejemplo: `GET /orders?startDate=2026-01-01&endDate=2026-07-31&page=1&limit=10`

Respuesta:

```json
{
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

Las órdenes se devuelven de la más reciente a la más antigua, y cada usuario solo puede ver sus propias órdenes.

## Decisiones de diseño

- **Paquetes embebidos en la orden.** Los paquetes se guardan dentro del documento de la orden, porque siempre se crean y se consultan junto con ella. Así la orden y sus paquetes se guardan en una sola operación.
- **Índice compuesto `[userId, createdAt]`.** Optimiza la consulta del historial, que siempre filtra por usuario y ordena por fecha de creación.
- **Número de orden aleatorio de 7 dígitos.** A diferencia de un número secuencial, no permite deducir el volumen de órdenes. La unicidad se garantiza con un índice único en la base de datos.
- **El usuario se obtiene del token.** El `userId` de una orden nunca se recibe en el cuerpo de la petición, para que un usuario no pueda crear órdenes a nombre de otro.
- **Zona horaria.** Las fechas de los filtros se interpretan en la hora de El Salvador (UTC-6).
- **Validación global.** Todas las peticiones se validan con DTOs, y se rechazan los campos que no están definidos en ellos.

## Mejoras pendientes

- Validar en el backend que el departamento, el municipio y el código de área existan en los catálogos. Actualmente estos datos se consultan desde el frontend en APIs externas y el backend solo valida su formato.
- Reintentar automáticamente la creación de la orden si el número de orden generado ya existe. Actualmente la API responde `409` para que el usuario vuelva a intentarlo.
- Agregar pruebas unitarias para la lógica de autenticación y de órdenes.
