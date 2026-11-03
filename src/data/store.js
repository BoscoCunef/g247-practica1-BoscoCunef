// Los datos viven únicamente en memoria: al reiniciar el servidor se restauran.
const initialPlayers = [
  { id: 1, nombre: 'Lucía Pérez', dorsal: 9, activo: true, posicion: 'delantero' },
  { id: 2, nombre: 'Mario López', dorsal: 1, activo: true, posicion: 'portero' },
  { id: 3, nombre: 'Ana Ruiz', dorsal: 5, activo: false, posicion: 'defensa' }
];
let players = initialPlayers.map(player => ({ ...player }));
let nextId = 4;

function getAll() { return players.map(player => ({ ...player })); }
function getById(id) { const player = players.find(player => player.id === id); return player ? { ...player } : null; }
function create(data) {
  const player = { id: nextId++, ...data };
  players.push(player);
  return { ...player };
}
function replace(id, data) {
  const index = players.findIndex(player => player.id === id);
  if (index === -1) return null;
  players[index] = { id, ...data };
  return { ...players[index] };
}
function update(id, changes) {
  const index = players.findIndex(player => player.id === id);
  if (index === -1) return null;
  players[index] = { ...players[index], ...changes };
  return { ...players[index] };
}
function remove(id) {
  const index = players.findIndex(player => player.id === id);
  if (index === -1) return false;
  players.splice(index, 1);
  return true;
}
module.exports = { getAll, getById, create, replace, update, remove };
