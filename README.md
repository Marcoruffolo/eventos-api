# Eventos API

API REST para una plataforma de gestión de eventos, construida con Node.js y Express siguiendo una arquitectura por capas (routes → controllers → services → repositories → DAO → models). Cubre autenticación con JWT, autorización basada en roles, CRUD de eventos con filtros/paginación, un sistema de inscripciones con control de cupo y notificación por email, y un flujo de solicitudes con revisión de un admin para habilitar organizadores.

Frontend (React + Vite + Tailwind): [eventos-app](https://github.com/Marcoruffolo/eventos-app).

## Qué resuelve

Cualquier usuario puede registrarse y explorar eventos publicados. Los usuarios se inscriben a eventos publicados mientras haya cupo disponible, reciben un email de confirmación con su código de reserva, y pueden cancelar su inscripción cuando quieran (liberando el cupo para otra persona).

Para crear eventos hay que ser `organizer`, y ese rol no se puede elegir al registrarse: el usuario envía una **solicitud** (organización, descripción de su actividad, web o redes) y un `admin` la **aprueba o rechaza** desde la app. Recién al aprobarla el usuario pasa a ser organizador. Los `organizer` crean y administran sus propios eventos (capacidad, precio, estado). Los `admin` tienen visibilidad y permisos totales sobre eventos, tickets y solicitudes.

## Highlights técnicos

- **Autenticación y autorización real**: Passport (`local` + `jwt`), JWT en cookie httpOnly, passwords hasheadas con bcrypt, middleware de roles reforzado a nivel de ruta.
- **Política de contraseñas** validada en el backend: mínimo 8 caracteres, con mayúscula, minúscula y número.
- **Alta de organizadores con revisión humana**: nadie puede asignarse un rol superior; las solicitudes tienen estados (`pending` / `approved` / `rejected`), registro de qué admin las resolvió y cuándo, y un límite de una solicitud pendiente por usuario (identificado por su sesión, no por datos del formulario).
- **Arquitectura por capas** con responsabilidad única en cada una (ver detalle abajo) — no hay lógica de negocio en controllers, ni Mongoose fuera del DAO.
- **DTOs** que garantizan que ningún endpoint exponga datos sensibles (passwords nunca salen de la API, ni en la respuesta ni en el JWT).
- **Manejo de errores centralizado** con códigos HTTP correctos (400/401/403/404/409/500), incluyendo validación de `ObjectId` malformados.
- **Tests automatizados** con Jest + Supertest + `mongodb-memory-server`: unitarios sobre la capa de servicios y de integración sobre los endpoints críticos (auth, autorización).
- **Reglas de negocio con casos borde cubiertos**: cupo, inscripción duplicada, cancelación sin borrado, solicitudes duplicadas o ya resueltas, envío de email "best effort" (no bloquea la respuesta si falla el SMTP).
- **Script de seed** para crear el primer admin de forma idempotente (se puede correr varias veces sin duplicar nada).

## Tecnologías

- Node.js + Express 5
- MongoDB + Mongoose
- Passport (estrategias `local` para register/login, `jwt` para sesión actual)
- JWT en cookie httpOnly
- bcrypt (hashing de contraseñas)
- Nodemailer (email de confirmación de inscripción)
- dotenv, cookie-parser, cors

## Arquitectura

```
src/
├── routes/         # define endpoints y middlewares por ruta
├── controllers/    # coordinan request/response, sin lógica de negocio
├── services/       # lógica de negocio y validaciones
├── repositories/   # intermediario entre services y DAOs
├── dao/            # única capa que importa modelos de Mongoose
├── dto/            # dan forma a las respuestas (nunca exponen password)
├── models/         # esquemas de Mongoose
├── middlewares/    # authenticate, authorize, errorHandler
├── utils/          # AppError, JWT, hashing, mailer, política de contraseñas, generador de códigos
├── scripts/        # comandos de mantenimiento (seed del admin)
└── config/         # conexión a DB, configuración de Passport
```

Regla de capas: los modelos de Mongoose solo se importan en los DAO. Los services consumen repositories, nunca DAOs directamente; si un service necesita algo de otro dominio, usa una función del otro service (por ejemplo, aprobar una solicitud llama a `promoteToOrganizer` de `user.service`). Los controllers no importan Mongoose ni contienen lógica de negocio. Las respuestas de usuario, evento, ticket y solicitud pasan siempre por su DTO correspondiente. Los scripts también pasan por la capa de servicios, nunca tocan los modelos directamente.

## Instalación

```bash
git clone https://github.com/Marcoruffolo/eventos-api.git
cd eventos-api
npm install
cp .env.example .env    # completar con tus propios valores
npm run seed:admin      # crea la cuenta admin definida en el .env
npm run dev             # levanta con nodemon
# o
npm start
```

## Variables de entorno

Ver `.env.example`. Se necesitan:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor |
| `MONGO_URL` | Connection string de MongoDB |
| `FRONTEND_URL` | Origen del frontend permitido por CORS (ej. `http://localhost:5173`) |
| `JWT_SECRET` | Secreto para firmar el JWT |
| `JWT_EXPIRES_IN` | Expiración del JWT (ej. `1d`) |
| `NODE_ENV` | `development` / `production` (afecta la cookie `secure`) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Credenciales SMTP para el email de confirmación (con Gmail, `MAIL_PASS` debe ser una [contraseña de aplicación](https://myaccount.google.com/apppasswords), no la contraseña normal de la cuenta) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Cuenta que crea `npm run seed:admin`. La contraseña tiene que cumplir la política (8+ caracteres, mayúscula, minúscula y número) |

Si el envío de email falla (credenciales inválidas, sin conexión, etc.), la inscripción se crea igual — el mail es "best effort" y no bloquea la respuesta.

## Roles

- **user**: rol por defecto al registrarse. Puede ver eventos publicados, inscribirse, cancelar sus propias inscripciones y **solicitar ser organizador**.
- **organizer**: además de lo anterior, puede crear eventos y administrar (modificar, cambiar estado, ver inscriptos de) los eventos de los que es dueño.
- **admin**: acceso total — puede administrar cualquier evento o ticket, sea o no el dueño, y es quien aprueba o rechaza las solicitudes de organizador.

El registro público (`POST /api/sessions/register`) **no** acepta `role` en el body; todo usuario nuevo nace `user`.

### Cómo obtener cada rol

**Admin — con el script de seed.** Los admins nunca se crean desde la API pública: se crean con un comando que solo puede correr alguien con acceso al servidor.

```bash
npm run seed:admin
```

Lee `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env` y:
- si no existe un usuario con ese email, lo crea con rol `admin`;
- si existe pero no es admin, lo promueve (en ese caso conserva su contraseña actual, la del `.env` se ignora);
- si ya es admin, no hace nada.

**Organizer — con una solicitud aprobada.**

1. Un usuario logueado con rol `user` envía `POST /api/organizer-requests` con `organizationName`, `description` y opcionalmente `website`. La solicitud queda `pending`.
2. Mientras tenga una solicitud pendiente, no puede enviar otra (`409`). Cerrar sesión o cambiar de dispositivo no cambia nada: el límite está asociado a su usuario en la base.
3. Un admin la revisa (`GET /api/organizer-requests`) y la aprueba (`PATCH /:rid/approve`) o la rechaza (`PATCH /:rid/reject`). Queda registrado qué admin la resolvió y cuándo.
4. Si se aprueba, el usuario pasa a `organizer`. Si se rechaza, sigue siendo `user` y puede volver a enviar una solicitud.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor con nodemon (recarga automática) |
| `npm start` | Levanta el servidor con node |
| `npm run seed:admin` | Crea o promueve la cuenta admin definida en el `.env` |
| `npm test` | Corre la suite de tests (Jest) |

## Tests

```bash
npm test
```

- **Unitarios** (`tests/unit`): prueban la capa de servicios de forma aislada — reglas de negocio como que el registro público siempre asigna el rol `user`, que no se puede registrar dos veces el mismo email, o que se rechazan contraseñas que no cumplen la política.
- **Integración** (`tests/integration`): prueban el flujo HTTP completo contra la app (routes → middlewares → controllers → services → DB), incluyendo el manejo de la cookie de sesión (registro → login → `/current`) y el rechazo de credenciales inválidas (`401`).

Corren contra una instancia de MongoDB en memoria (`mongodb-memory-server`), sin depender de una base real ni de datos previos.

## Endpoints

### Sesiones (`/api/sessions`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/register` | — | Registra un usuario nuevo (rol `user`) |
| POST | `/login` | — | Login, setea cookie JWT httpOnly |
| GET | `/current` | JWT | Devuelve el usuario logueado |
| POST | `/logout` | — | Limpia la cookie de sesión |

### Eventos (`/api/events`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/` | organizer/admin | Crea un evento (queda en estado `draft`) |
| GET | `/` | — | Lista eventos, con filtros/paginación/orden |
| GET | `/:id` | — | Detalle de un evento |
| PUT | `/:id` | dueño/admin | Modifica un evento (no si está `cancelled`) |
| PATCH | `/:id/status` | dueño/admin | Cambia el estado (`draft`/`published`/`cancelled`/`finished`) |
| POST | `/:eid/tickets` | JWT | Se inscribe a un evento publicado |
| GET | `/:eid/tickets` | dueño/admin | Lista los inscriptos de un evento |

Filtros de `GET /`: `status` (por defecto solo `published`), `category`, `location`, `dateFrom`, `dateTo`. Paginación: `page`, `limit`. Orden: `sortBy`, `order` (`asc`/`desc`).

### Tickets (`/api/tickets`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/my-tickets` | JWT | Lista las inscripciones propias (con datos básicos del evento) |
| PATCH | `/:tid/cancel` | dueño/admin | Cancela una inscripción (no la elimina), libera cupo |

### Solicitudes de organizador (`/api/organizer-requests`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/` | user | Envía una solicitud para ser organizador (una pendiente como máximo) |
| GET | `/` | admin | Lista solicitudes por estado: `?status=pending` (por defecto), `approved` o `rejected`. Ordenadas de la más antigua a la más nueva, con nombre y email del solicitante |
| PATCH | `/:rid/approve` | admin | Aprueba la solicitud y promueve al usuario a `organizer` |
| PATCH | `/:rid/reject` | admin | Rechaza la solicitud; el usuario puede volver a pedir |

## Ejemplos de uso

**Registro:**
```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Gomez","email":"ana@example.com","password":"Clave1234"}'
```

**Login** (guarda la cookie para las siguientes requests):
```bash
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Clave1234"}'
```

**Solicitar ser organizador** (como `user`):
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/organizer-requests \
  -H "Content-Type: application/json" \
  -d '{"organizationName":"Rock Producciones","description":"Recitales de bandas locales en CABA","website":"https://instagram.com/rockprod"}'
```

**Ver solicitudes pendientes y aprobar una** (con la cookie de un `admin`):
```bash
curl -b admin-cookies.txt http://localhost:8080/api/organizer-requests
curl -b admin-cookies.txt -X PATCH http://localhost:8080/api/organizer-requests/<requestId>/approve
```

**Crear un evento** (requiere rol `organizer` o `admin`):
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Congreso Tech 2026","description":"...","category":"Tech","date":"2026-12-01","location":"CABA","capacity":100,"price":0}'
```

**Listado paginado y filtrado:**
```bash
curl "http://localhost:8080/api/events?status=published&category=Tech&page=1&limit=5&sortBy=date&order=asc"
```

**Inscribirse a un evento publicado:**
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/<eventId>/tickets \
  -H "Content-Type: application/json" -d '{}'
```

**Cancelar una inscripción:**
```bash
curl -b cookies.txt -X PATCH http://localhost:8080/api/tickets/<ticketId>/cancel
```

## Flujo completo

1. `npm run seed:admin` — se crea la cuenta admin.
2. `POST /api/sessions/register` — se crea un usuario (rol `user`).
3. `POST /api/sessions/login` — devuelve el usuario (sin password) y setea la cookie `token` (JWT, httpOnly).
4. `GET /api/sessions/current` — con la cookie, confirma quién está logueado.
5. `POST /api/organizer-requests` — el usuario pide ser organizador; si ya tiene una pendiente, recibe `409`.
6. El admin la aprueba (`PATCH /api/organizer-requests/:rid/approve`) y el usuario pasa a `organizer`.
7. El organizer crea un evento (`POST /api/events`, queda `draft`) y lo publica (`PATCH /api/events/:id/status` con `{"status":"published"}`).
8. Otro usuario se inscribe (`POST /api/events/:eid/tickets`): se valida que el evento esté publicado, que no tenga ya una inscripción activa a ese evento, y que haya cupo disponible. Se genera un `reservationCode`, se guarda el ticket y se intenta enviar un email de confirmación.
9. `GET /api/tickets/my-tickets` — el usuario ve sus inscripciones, con los datos básicos del evento.
10. `PATCH /api/tickets/:tid/cancel` — el usuario cancela; el ticket pasa a `cancelled` (no se borra) y el cupo queda libre para una nueva inscripción.
11. `POST /api/sessions/logout` — limpia la cookie; `GET /api/sessions/current` a partir de ahí devuelve `401`.

## A tener en cuenta

- Ninguna respuesta de la API devuelve `password`, ni en el usuario ni en el payload del JWT.
- Los errores usan códigos HTTP según corresponda: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (no encontrado), `409` (conflicto: inscripción duplicada, sin cupo, solicitud pendiente duplicada o ya resuelta), `500` (error interno).
- Un id con formato inválido en cualquier ruta con `:id` devuelve `400`, no `500`.
- El rol se lee de la base en cada request (`/current` y los middlewares), así que un usuario recién aprobado como organizador no necesita volver a loguearse para que la API lo reconozca.
