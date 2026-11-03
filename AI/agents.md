# Tester agent — contrato y comprobaciones de caja negra

## Objetivo y límites
Un único agente de tipo **tester**, sin acceso a `src/` ni a la implementación. Solo recibe este contrato HTTP y la URL de un servidor ya iniciado. Debe proponer y ejecutar pruebas mediante peticiones HTTP y revisar los códigos, cabeceras y cuerpos. No debe asumir que la implementación funciona.

## Prompt del agente
> Actúa como tester de caja negra de una API REST de jugadores disponible en http://localhost:3000. NO leas código fuente ni archivos internos. Usa únicamente los endpoints y el contrato descrito aquí. Comprueba respuestas válidas, entradas inválidas, filtros combinados, 404, PUT frente a PATCH, cabecera Location y DELETE 204 sin cuerpo. Registra para cada caso: método, URL, cuerpo enviado, resultado esperado, resultado observado y veredicto. Si encuentras fallos, propón su corrección sin modificar el código por tu cuenta.

## Contrato recibido
Recurso: `{id: integer (servidor), nombre: string (2-60), dorsal: integer (1-99), activo: boolean, posicion: portero|defensa|centrocampista|delantero}`.

| Método | Endpoint | Resultado |
| --- | --- | --- |
| GET | /jugadores | 200, array, filtros opcionales search, activo, posicion, sort, order, limit, offset |
| GET | /jugadores/stats | 200, resumen calculado |
| POST | /jugadores | 201, objeto con id, Location: /jugadores/:id; errores 400 |
| GET | /jugadores/:id | 200 objeto; 404 inexistente; 400 id mal formado |
| PUT | /jugadores/:id | 200 objeto sustituido; exige cuatro campos; 400/404 |
| PATCH | /jugadores/:id | 200 objeto parcial; 400/404 |
| DELETE | /jugadores/:id | 204 sin cuerpo; 404 inexistente |
| cualquiera | ruta inexistente | 404 JSON |

Parámetros desconocidos y mal formados: **400** con `{ "errors": [{ "field": "...", "message": "..." }] }`.

## Pruebas HTTP propuestas por el tester
Se incluye un runner reproducible en `AI/blackbox-test.mjs`. Emplea solo `fetch` HTTP, no importa módulos de `src/`.

1. `GET /jugadores` → 200 y array.
2. `POST /jugadores` válido → 201, Location e id generado incluso si se envía id.
3. `POST /jugadores` inválido → 400 con incidencias de nombre, dorsal, activo y posición.
4. `GET /jugadores/:id` recién creado → 200.
5. `PUT` incompleto → 400; `PUT` completo → 200.
6. `PATCH` de un solo campo → 200 y los demás campos permanecen.
7. `GET /jugadores?search=...&activo=true&posicion=...` → 200 y resultados correctos.
8. `GET /jugadores?sort=dorsal&order=desc&limit=1&offset=0` → 200.
9. `GET /jugadores?parametroInventado=1` → 400.
10. `GET /jugadores/stats` → 200, agregado coherente.
11. `DELETE /jugadores/:id` → 204 sin cuerpo; siguiente GET → 404.
12. `GET /ruta-inexistente` → 404 JSON.

**Ejecución:** terminal 1 `npm start`; terminal 2 `node AI/blackbox-test.mjs`.
