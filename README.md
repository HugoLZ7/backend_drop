# Backend Boxful - API de órdenes

API REST desarrollada como parte de la prueba técnica de Boxful. Permite registrar usuarios, autenticarlos mediante JWT, crear órdenes de envío y consultar el historial de órdenes con filtros.

Incluye el punto extra de la prueba: órdenes con cobro contra entrega (COD), actualización de entregas mediante un webhook, costos de envío por día de la semana y cálculo de la liquidación al comercio.

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

5. Cargar las tarifas de envío por día de la semana:

   ```bash
   npm run seed
   ```

   Sin este paso no se pueden crear órdenes, porque el costo de envío se toma de estas tarifas.

6. Iniciar el servidor en modo desarrollo:

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
| `WEBHOOK_SECRET` | Clave compartida que debe enviar el sistema externo al llamar el webhook | Ver el comando siguiente |
| `PORT` | Puerto del servidor (opcional) | `3000` |

Para generar un valor seguro para `JWT_SECRET` o `WEBHOOK_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Inicia el servidor y lo reinicia al detectar cambios |
| `npm run seed` | Carga las tarifas de envío por día de la semana |
| `npm test` | Ejecuta las pruebas unitarias |
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
| GET | `/orders/balance` | Sí | Devuelve el monto a liquidar del comercio |
| POST | `/webhooks/orders/:orderNumber` | Clave compartida | Marca una orden como entregada |

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
  "isCod": true,
  "expectedAmount": 30,
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
- `isCod` es opcional (por defecto `false`). Si es `true`, `expectedAmount` es obligatorio y debe ser mayor que cero.
- `scheduledDate` no puede ser anterior a la fecha actual. El costo de envío se toma de la tarifa del día de la semana de esta fecha.
- `packages` debe contener entre 1 y 50 paquetes. Las medidas están en centímetros y el peso en libras.
- Respuesta: `201` con la orden creada, incluyendo su número de orden de 7 dígitos, el costo de envío, el estado (`PENDING`) y la liquidación (`settlement`).

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

Las órdenes se devuelven de la más reciente a la más antigua, y cada usuario solo puede ver sus propias órdenes. Cada orden incluye su liquidación en el campo `settlement`.

### GET /orders/balance

Respuesta: `200` con `{ "balance": 17.7 }`, la suma de las liquidaciones de todas las órdenes del usuario. Puede ser negativa.

### POST /webhooks/orders/:orderNumber

Endpoint para que un sistema externo informe que una orden fue entregada. No usa JWT: requiere el encabezado `x-webhook-secret` con el valor de `WEBHOOK_SECRET`.

```bash
curl -X POST http://localhost:3000/webhooks/orders/1234567 \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <WEBHOOK_SECRET>" \
  -d '{ "status": "DELIVERED", "collectedAmount": 35 }'
```

- `status` solo acepta `DELIVERED`.
- `collectedAmount` es opcional. En una orden COD, si no se envía, se usa el monto esperado. Puede ser distinto del monto esperado; la liquidación se calcula con el monto recolectado.
- Respuestas: `200` con la orden actualizada, `401` si la clave no es válida, `404` si la orden no existe y `409` si ya estaba entregada.

## Cobro contra entrega y liquidación

**Costo de envío.** Cada día de la semana tiene un costo configurado en la colección `ShippingRate` (cargado con `npm run seed`): de lunes a jueves 5 USD, viernes 6 USD, sábado y domingo 7 USD. El costo se copia en la orden al crearla, así que un cambio de tarifa no altera las órdenes existentes.

**Liquidación de cada orden:**

| Caso | Liquidación |
|---|---|
| Orden sin COD | − costo de envío |
| Orden COD pendiente de entrega | − costo de envío |
| Orden COD entregada | monto recolectado − costo de envío − comisión |

La comisión COD es el 1% del monto recolectado, con un máximo de 25 USD por orden.

Ejemplo: una orden COD de 30 USD programada para un lunes genera −5.00 al crearse. Al confirmarse la entrega con 30 USD recolectados, su liquidación pasa a 30 − 5 − 0.30 = 24.70.

El cálculo está en `src/orders/settlement.ts` y tiene pruebas unitarias en `src/orders/settlement.spec.ts`.

## Decisiones de diseño

- **Paquetes embebidos en la orden.** Los paquetes se guardan dentro del documento de la orden, porque siempre se crean y se consultan junto con ella. Así la orden y sus paquetes se guardan en una sola operación.
- **Índice compuesto `[userId, createdAt]`.** Optimiza la consulta del historial, que siempre filtra por usuario y ordena por fecha de creación.
- **Número de orden aleatorio de 7 dígitos.** A diferencia de un número secuencial, no permite deducir el volumen de órdenes. La unicidad se garantiza con un índice único en la base de datos.
- **El usuario se obtiene del token.** El `userId` de una orden nunca se recibe en el cuerpo de la petición, para que un usuario no pueda crear órdenes a nombre de otro.
- **Zona horaria.** Las fechas de los filtros se interpretan en la hora de El Salvador (UTC-6).
- **Validación global.** Todas las peticiones se validan con DTOs, y se rechazan los campos que no están definidos en ellos.
- **Liquidación calculada, no guardada.** La liquidación se calcula a partir de los datos de la orden cada vez que se consulta, por lo que siempre es coherente con su estado.
- **Webhook idempotente.** Una orden entregada no se puede volver a procesar, para no contar dos veces el mismo cobro si el sistema externo repite la notificación.

## Mejoras pendientes

- Guardar los montos en centavos como enteros para evitar errores de redondeo. Actualmente se usan números decimales redondeados a dos cifras, ya que el conector de MongoDB de Prisma no admite el tipo `Decimal`.
- Calcular el balance con una agregación en la base de datos cuando el volumen de órdenes sea alto.
- Validar en el backend que el departamento, el municipio y el código de área existan en los catálogos. Actualmente estos datos se consultan desde el frontend en APIs externas y el backend solo valida su formato.
- Reintentar automáticamente la creación de la orden si el número de orden generado ya existe. Actualmente la API responde `409` para que el usuario vuelva a intentarlo.
- Agregar pruebas unitarias para la autenticación.
