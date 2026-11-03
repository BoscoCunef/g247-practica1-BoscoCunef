const store = require('../data/store');
const { validateJugador, POSICIONES } = require('../validators/jugadoresValidator');

function badRequest(res, errors) { return res.status(400).json({ errors }); }
function notFound(res) { return res.status(404).json({ error: 'Jugador no encontrado.' }); }
function parseId(req, res) {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
    badRequest(res, [{ field: 'id', message: 'El identificador debe ser un entero positivo.' }]);
    return null;
  }
  return Number(req.params.id);
}

// El controlador utiliza el módulo store, sin acceder directamente a su estructura interna.
function list(req, res) {
  const allowed = new Set(['search', 'activo', 'posicion', 'sort', 'order', 'limit', 'offset']);
  const errors = [];
  for (const key of Object.keys(req.query)) {
    if (!allowed.has(key)) errors.push({ field: key, message: 'Parámetro de consulta desconocido.' });
  }
  for (const key of Object.keys(req.query)) {
    if (Array.isArray(req.query[key]) || typeof req.query[key] !== 'string') {
      errors.push({ field: key, message: 'Debe aparecer una sola vez con un valor de texto.' });
    }
  }
  if (errors.length) return badRequest(res, errors);
  const { search, activo, posicion, sort, order, limit, offset } = req.query;
  if (activo !== undefined && !['true', 'false'].includes(activo)) errors.push({ field: 'activo', message: 'Utiliza true o false.' });
  if (posicion !== undefined && !POSICIONES.includes(posicion)) errors.push({ field: 'posicion', message: `Utiliza: ${POSICIONES.join(', ')}.` });
  if (sort !== undefined && !['nombre', 'dorsal', 'id'].includes(sort)) errors.push({ field: 'sort', message: 'Utiliza nombre, dorsal o id.' });
  if (order !== undefined && !['asc', 'desc'].includes(order)) errors.push({ field: 'order', message: 'Utiliza asc o desc.' });
  if (limit !== undefined && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100)) errors.push({ field: 'limit', message: 'Debe ser entero entre 1 y 100.' });
  if (offset !== undefined && (!/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset)))) errors.push({ field: 'offset', message: 'Debe ser entero mayor o igual a 0.' });
  if (errors.length) return badRequest(res, errors);
  let result = store.getAll();
  if (search !== undefined) result = result.filter(p => p.nombre.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  if (activo !== undefined) result = result.filter(p => p.activo === (activo === 'true'));
  if (posicion !== undefined) result = result.filter(p => p.posicion === posicion);
  const sortField = sort || 'id';
  const direction = order === 'desc' ? -1 : 1;
  result.sort((a, b) => (typeof a[sortField] === 'string'
    ? a[sortField].localeCompare(b[sortField], 'es')
    : a[sortField] - b[sortField]) * direction);
  // Primero se filtra y ordena, después se aplica paginación.
  result = result.slice(Number(offset || 0), limit === undefined ? undefined : Number(offset || 0) + Number(limit));
  res.json(result);
}
function stats(req, res) {
  const players = store.getAll(); // agregado calculado en cada petición
  const porPosicion = Object.fromEntries(POSICIONES.map(pos => [pos, players.filter(p => p.posicion === pos).length]));
  const total = players.length;
  res.json({ total, activos: players.filter(p => p.activo).length,
    mediaDorsal: total ? Number((players.reduce((s, p) => s + p.dorsal, 0) / total).toFixed(2)) : null,
    porPosicion });
}
function getOne(req, res) {
  const id = parseId(req, res); if (id === null) return;
  const player = store.getById(id);
  if (!player) return notFound(res);
  res.json(player);
}
function create(req, res) {
  const { data, errors } = validateJugador(req.body, { partial: false });
  if (errors.length) return badRequest(res, errors);
  const player = store.create(data);
  res.location(`/jugadores/${player.id}`).status(201).json(player);
}
function replace(req, res) {
  const id = parseId(req, res); if (id === null) return;
  const { data, errors } = validateJugador(req.body, { partial: false });
  if (errors.length) return badRequest(res, errors);
  const player = store.replace(id, data);
  if (!player) return notFound(res);
  res.json(player);
}
function update(req, res) {
  const id = parseId(req, res); if (id === null) return;
  const { data, errors } = validateJugador(req.body, { partial: true });
  if (errors.length) return badRequest(res, errors);
  const player = store.update(id, data);
  if (!player) return notFound(res);
  res.json(player);
}
function remove(req, res) {
  const id = parseId(req, res); if (id === null) return;
  if (!store.remove(id)) return notFound(res);
  res.status(204).end();
}
module.exports = { list, stats, getOne, create, replace, update, remove };
