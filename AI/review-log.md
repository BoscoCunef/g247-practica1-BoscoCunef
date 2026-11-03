# Registro de revisión del tester agent

Este registro distingue **propuestas del agente** de **resultados observados**. No implica que el tester haya inspeccionado la implementación.

| Aportación | Solicitud al tester | Prueba o propuesta | Revisión humana / criterio |
| --- | --- | --- | --- |
| 1 | Verificar contrato de creación | POST válido; exigir 201, Location e id del servidor | Aceptada: son tres exigencias independientes. |
| 2 | Detectar validación insuficiente | POST con cuatro campos incorrectos; comprobar `errors` | Aceptada: debe devolver las cuatro incidencias, no solo la primera. |
| 3 | Distinguir actualización completa y parcial | PUT incompleto 400; PATCH de `activo` conserva los demás | Aceptada: prueba la diferencia semántica. |
| 4 | Comprobar consulta | Combinar `search`, `activo`, `posicion` y probar paginación | Aceptada: el filtrado debe ejecutarse en el servidor. |
| 5 | Verificar eliminación | DELETE 204 sin cuerpo y posterior GET 404 | Aceptada: comprueba estado final y ausencia de contenido. |
| 6 | Verificar resiliencia | Parámetro desconocido devuelve 400 JSON, no bloquea servidor | Aceptada: coincide con la política documentada. |
| 7 | Verificar agregado | GET /stats devuelve valores numéricos calculados | Aceptada: el contrato exige resumen dinámico. |

## Ejecución observada y limitaciones

- **03/11/2026:** se ejecutó `npm test`: **6 pruebas correctas, 0 fallidas** (validador y almacén).
- **Prueba HTTP de caja negra:** generada en `AI/blackbox-test.mjs`, pero **no ejecutada en este entorno**, porque la instalación de la dependencia Express no pudo completarse por falta de acceso a npm. No se declara superada.
- **Comprobación visual del navegador:** pendiente de comprobar en una instalación local con `npm install` y `npm start`.

## Criterio de revisión

Se rechazó asumir que un `fetch` con estado `400` provoca por sí solo una excepción; se comprueba explícitamente `response.ok` en el cliente. Se rechazó guardar campos no definidos e identificadores enviados por el cliente; el validador proyecta únicamente campos admitidos. Antes de entregar, ejecutar `npm run test:http` y anotar el número real de pruebas correctas/fallidas; corregir cualquier fallo que aparezca.
