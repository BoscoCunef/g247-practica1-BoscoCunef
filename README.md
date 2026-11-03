# Práctica 1 — Foundations API · Plantilla FC

**Integrantes:** Pendiente de completar con el nombre real del alumno o los dos integrantes antes de la entrega.

**Tema:** Gestión de jugadores de un club de fútbol. **ATENCIÓN:** el tema ha de coincidir con el elegido en los laboratorios del bloque I; si era otro, hay que adaptar este ejemplo antes de entregar.

## 1. Instalación y ejecución

Requisitos: Node.js **18 o superior** y npm.

```bash
npm install
npm start
```

Abrir **http://localhost:3000** en el navegador. La API se encuentra en `http://localhost:3000/jugadores`. Detener con `Ctrl+C`.

**Pruebas unitarias automáticas** (sin dependencias adicionales): `npm test`.

**Prueba de caja negra HTTP:** con el servidor iniciado, en otra terminal:

```bash
npm run test:http
```

El runner de caja negra utiliza únicamente HTTP y requiere que el servidor esté iniciado. Los datos se almacenan **solo en memoria**, por lo que se pierden al reiniciar el servidor.

## 2. Recurso y validación

Cada jugador tiene este formato:

```json
{
  "id": 1,
  "nombre": "Lucía Pérez",
  "dorsal": 9,
  "activo": true,
  "posicion": "delantero"
}
```

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | número entero | Lo genera el servidor, es único y positivo; cualquier `id` enviado por el cliente se ignora. |
| `nombre` | texto | Obligatorio, de 2 a 60 caracteres después de quitar espacios iniciales/finales. |
| `dorsal` | número entero | Obligatorio, entre 1 y 99 incluidos. |
| `activo` | booleano | Obligatorio, solo `true` o `false`. |
| `posicion` | enumerado | Obligatorio: `portero`, `defensa`, `centrocampista` o `delantero`. |

El validador `validateJugador(body, { partial })` comprueba todos los campos; `POST` y `PUT` requieren los cuatro campos editables y `PATCH` admite al menos uno. Nunca se guardan campos desconocidos. El identificador no forma parte de los datos editables.

## 3. Endpoints y respuestas

| Método | Ruta | Parámetros o cuerpo | Éxito | Errores |
| --- | --- | --- | --- | --- |
| GET | `/jugadores` | `search`, `activo`, `posicion`, `sort`, `order`, `limit`, `offset` (opcionales) | `200` y array JSON | `400` consulta inválida |
| GET | `/jugadores/stats` | ninguno | `200` y estadísticas JSON | — |
| POST | `/jugadores` | JSON completo | `201` con jugador JSON y cabecera `Location: /jugadores/:id` | `400` datos incorrectos |
| GET | `/jugadores/:id` | id entero positivo | `200` con jugador JSON | `400` id inválido, `404` inexistente |
| PUT | `/jugadores/:id` | JSON completo | `200` con jugador reemplazado | `400` cuerpo/id inválido, `404` inexistente |
| PATCH | `/jugadores/:id` | JSON parcial no vacío | `200` con jugador actualizado | `400` cuerpo/id inválido, `404` inexistente |
| DELETE | `/jugadores/:id` | id entero positivo | `204` sin cuerpo | `400` id inválido, `404` inexistente |
| Cualquiera | ruta inexistente | — | — | `404` y `{ "error": "Ruta no encontrada." }` |

Un error de validación responde con **todas** las incidencias:

```json
{
  "errors": [
    { "field": "nombre", "message": "Debe ser texto de entre 2 y 60 caracteres." },
    { "field": "dorsal", "message": "Debe ser un número entero entre 1 y 99." }
  ]
}
```

Un fallo interno inesperado responde `500` con `{ "error": "Error interno del servidor." }` sin traza. Un JSON mal formado produce `400` con errores en el campo `body`.

### Consultas combinables

- `search=ana` busca una coincidencia parcial en `nombre`, sin distinguir mayúsculas y minúsculas.
- `activo=true` o `activo=false` filtra por el booleano.
- `posicion=defensa` filtra por enumeración.
- `sort=nombre|dorsal|id` indica campo de ordenación. Por defecto se ordena por `id`.
- `order=asc|desc` indica sentido. Por defecto `asc`.
- `limit=1..100` limita elementos devueltos; sin él no se aplica límite.
- `offset=0..` salta elementos después de filtrar y ordenar; por defecto 0.

**Política única:** si hay parámetros desconocidos, repetidos, no escalares o con valores inválidos, la consulta devuelve **400 JSON** con `errors`. No se detiene el servidor. Los parámetros opcionales conocidos que no se envían toman sus valores por defecto.

Ejemplo:

```http
GET /jugadores?search=luc&activo=true&posicion=delantero&sort=dorsal&order=desc&limit=5&offset=0
```

Respuesta `200` (según los datos existentes):

```json
[{ "id": 1, "nombre": "Lucía Pérez", "dorsal": 9, "activo": true, "posicion": "delantero" }]
```

## 4. Ejemplos de operaciones HTTP

**Crear jugador:**

```bash
curl -i -X POST http://localhost:3000/jugadores -H "Content-Type: application/json" -d '{"nombre":"Carlos Gómez","dorsal":14,"activo":true,"posicion":"defensa"}'
```

Respuesta: `201 Created`, cabecera `Location: /jugadores/4` (si no hubo altas previas) y cuerpo:

```json
{ "id": 4, "nombre": "Carlos Gómez", "dorsal": 14, "activo": true, "posicion": "defensa" }
```

**Leer uno:**

```bash
curl -i http://localhost:3000/jugadores/4
```

Respuesta `200` con el objeto o `404` con `{ "error": "Jugador no encontrado." }`.

**Sustituir completamente (PUT):**

```bash
curl -i -X PUT http://localhost:3000/jugadores/4 -H "Content-Type: application/json" -d '{"nombre":"Carlos Gómez","dorsal":8,"activo":false,"posicion":"centrocampista"}'
```

Respuesta `200` con el objeto completo actualizado. Si falta un campo, `400`.

**Modificar parcialmente (PATCH):**

```bash
curl -i -X PATCH http://localhost:3000/jugadores/4 -H "Content-Type: application/json" -d '{"activo":true}'
```

Respuesta `200` con el objeto completo, pero solo cambia `activo`.

**Eliminar:**

```bash
curl -i -X DELETE http://localhost:3000/jugadores/4
```

Respuesta `204 No Content` sin cuerpo.

**Estadísticas:**

```bash
curl -i http://localhost:3000/jugadores/stats
```

Respuesta `200`, por ejemplo al iniciar el servidor:

```json
{
  "total": 3,
  "activos": 2,
  "mediaDorsal": 5,
  "porPosicion": { "portero": 1, "defensa": 1, "centrocampista": 0, "delantero": 1 }
}
```

Este agregado se calcula de nuevo en cada petición, no se guarda.

## 5. PUT y PATCH

`PUT` **reemplaza por completo** los cuatro datos editables de un jugador, por lo que exige todos ellos. `PATCH` **modifica únicamente** los campos presentes en el JSON, conservando los demás. El formulario de edición del cliente utiliza **PUT** porque envía los cuatro campos. Los dos métodos están disponibles en la API.

## 6. Estructura y arquitectura

```text
practice1-jugadores/
├── package.json
├── README.md
├── src/
│   ├── app.js
│   ├── server.js
│   ├── middleware/logger.js
│   ├── routes/jugadores.js
│   ├── controllers/jugadoresController.js
│   ├── data/store.js
│   └── validators/jugadoresValidator.js
├── tests/
│   ├── validator.test.js
│   └── store.test.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── AI/
    ├── agents.md
    ├── review-log.md
    └── blackbox-test.mjs
```

- **Rutas:** asocian URLs y métodos al controlador; `/stats` se registra antes de `/:id`.
- **Controladores:** hacen validación, filtros, ordenación, paginación y HTTP; operan a través de métodos públicos del `store`.
- **Almacenamiento:** `data/store.js` encapsula una colección en memoria y se puede sustituir por otra implementación con la misma interfaz.
- **Validación:** `validators/jugadoresValidator.js` comprueba tipos y restricciones y excluye propiedades no permitidas.
- **Cliente web:** HTML semántico, CSS con Flexbox/Grid y breakpoint `760px`, JS con `fetch` y comprobación de `response.ok`.

La carpeta **`public/`** se sirve desde `src/app.js` con `app.use(express.static(path.join(__dirname, '..', 'public')))`. Se coloca antes de la declaración de rutas de API y los manejadores de 404/errores. Así el navegador pide archivos HTML/CSS/JS y hace llamadas `/jugadores` al **mismo origen**, sin configurar CORS.

La búsqueda y los filtros se realizan **en el servidor** para que exista una única lógica de consulta, no sea necesario descargar toda la colección para filtrar y se cumpla el contrato de la API. El navegador construye los parámetros con `URLSearchParams` y muestra la respuesta recibida. La página permite listar, crear, editar, borrar, ver carga, errores por campo y estado vacío sin recargar.

## 7. Componente IA agéntica

El contrato entregado al tester, prompt y comprobaciones propuestas están en `AI/agents.md`. La revisión crítica, decisiones y campo para incorporar resultados reales están en `AI/review-log.md`. El programa `AI/blackbox-test.mjs` realiza comprobaciones **solo por HTTP** sin importar ni leer la implementación.

## 8. Verificación

`npm test` ejecuta pruebas unitarias sobre el validador y el almacén con el módulo nativo `node:test`. `npm run test:http` realiza pruebas de caja negra de los endpoints mediante `fetch` HTTP. Las pruebas HTTP requieren Express instalado y la aplicación iniciada con `npm start`. Se debe realizar una comprobación final del formulario en el navegador.

## 9. GitHub y entrega

Crear repositorio GitHub, subir estos archivos **sin** `node_modules/`, registrar commits propios y, si hay pareja, añadirla como colaboradora y asegurar contribuciones de ambas personas. Entregar en Canvas el **enlace del repositorio** y el **SHA exacto** del commit final (`git rev-parse HEAD`).
