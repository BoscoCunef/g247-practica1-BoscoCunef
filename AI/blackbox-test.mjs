// Tester HTTP de caja negra: no importa archivos internos de la aplicación.
const BASE = process.env.BASE_URL || 'http://localhost:3000';
let passed = 0;
let failed = 0;
async function check(label, method, path, body, assert) {
  try {
    const res = await fetch(BASE + path, {
      method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text(); const data = text ? JSON.parse(text) : null;
    const ok = assert(res, data, text);
    if (!ok) throw new Error(`HTTP ${res.status}, body=${text}`);
    passed++; console.log(`OK  ${label}`); return { res, data };
  } catch (err) { failed++; console.error(`FAIL ${label}: ${err.message}`); return {}; }
}
await check('GET listado', 'GET', '/jugadores', undefined, (r, d) => r.status === 200 && Array.isArray(d));
const created = await check('POST + Location + id ignorado', 'POST', '/jugadores',
  { id: 9999, nombre: 'Prueba HTTP', dorsal: 42, activo: true, posicion: 'defensa', extra: 'no persistir' },
  (r, d) => r.status === 201 && Number.isInteger(d.id) && d.id !== 9999 && r.headers.get('location') === `/jugadores/${d.id}` && !('extra' in d));
await check('POST inválido: 4 errores', 'POST', '/jugadores',
  { nombre: '', dorsal: -1, activo: 'sí', posicion: 'lateral' },
  (r, d) => r.status === 400 && d.errors?.length === 4);
if (created.data) {
  const id = created.data.id;
  await check('GET por id', 'GET', `/jugadores/${id}`, undefined, (r, d) => r.status === 200 && d.id === id);
  await check('PUT exige objeto completo', 'PUT', `/jugadores/${id}`, { nombre: 'Solo nombre' }, (r, d) => r.status === 400 && d.errors?.length >= 3);
  await check('PUT reemplaza', 'PUT', `/jugadores/${id}`,
    { nombre: 'Nuevo Nombre', dorsal: 17, activo: false, posicion: 'portero' },
    (r, d) => r.status === 200 && d.nombre === 'Nuevo Nombre' && d.dorsal === 17);
  await check('PATCH conserva otros campos', 'PATCH', `/jugadores/${id}`, { activo: true },
    (r, d) => r.status === 200 && d.activo === true && d.dorsal === 17 && d.nombre === 'Nuevo Nombre');
  await check('Filtros combinados', 'GET', '/jugadores?search=NUEVO&activo=true&posicion=portero', undefined,
    (r, d) => r.status === 200 && d.some(p => p.id === id));
  await check('DELETE sin cuerpo', 'DELETE', `/jugadores/${id}`, undefined, (r, d, text) => r.status === 204 && text === '');
  await check('GET eliminado es 404', 'GET', `/jugadores/${id}`, undefined, (r, d) => r.status === 404 && typeof d.error === 'string');
}
await check('Orden y ventana', 'GET', '/jugadores?sort=dorsal&order=desc&limit=1&offset=0', undefined,
  (r, d) => r.status === 200 && d.length <= 1);
await check('Consulta desconocida 400', 'GET', '/jugadores?parametroInventado=1', undefined,
  (r, d) => r.status === 400 && d.errors?.[0]?.field === 'parametroInventado');
await check('GET stats', 'GET', '/jugadores/stats', undefined,
  (r, d) => r.status === 200 && typeof d.total === 'number' && typeof d.activos === 'number');
await check('Ruta inexistente 404 JSON', 'GET', '/ruta-inexistente', undefined,
  (r, d) => r.status === 404 && typeof d.error === 'string');
console.log(`\nResultado: ${passed} correctas; ${failed} fallidas`);
if (failed) process.exitCode = 1;
