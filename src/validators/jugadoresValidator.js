const POSICIONES = ['portero', 'defensa', 'centrocampista', 'delantero'];
const CAMPOS = ['nombre', 'dorsal', 'activo', 'posicion'];

function validateJugador(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { data, errors: [{ field: 'body', message: 'Debe enviarse un objeto JSON.' }] };
  }
  // No se usa 'id' ni se conservan propiedades desconocidas.
  if (partial && !CAMPOS.some(campo => Object.hasOwn(body, campo))) {
    errors.push({ field: 'body', message: 'Indica al menos un campo válido para modificar.' });
  }

  if (!partial || Object.hasOwn(body, 'nombre')) {
    if (typeof body.nombre !== 'string' || body.nombre.trim().length < 2 || body.nombre.trim().length > 60) {
      errors.push({ field: 'nombre', message: 'Debe ser texto de entre 2 y 60 caracteres.' });
    } else data.nombre = body.nombre.trim();
  }
  if (!partial || Object.hasOwn(body, 'dorsal')) {
    if (!Number.isInteger(body.dorsal) || body.dorsal < 1 || body.dorsal > 99) {
      errors.push({ field: 'dorsal', message: 'Debe ser un número entero entre 1 y 99.' });
    } else data.dorsal = body.dorsal;
  }
  if (!partial || Object.hasOwn(body, 'activo')) {
    if (typeof body.activo !== 'boolean') {
      errors.push({ field: 'activo', message: 'Debe ser true o false.' });
    } else data.activo = body.activo;
  }
  if (!partial || Object.hasOwn(body, 'posicion')) {
    if (typeof body.posicion !== 'string' || !POSICIONES.includes(body.posicion)) {
      errors.push({ field: 'posicion', message: `Debe ser una de: ${POSICIONES.join(', ')}.` });
    } else data.posicion = body.posicion;
  }
  return { data, errors };
}
module.exports = { validateJugador, POSICIONES };
