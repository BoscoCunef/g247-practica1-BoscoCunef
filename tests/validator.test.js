const test = require('node:test');
const assert = require('node:assert/strict');
const { validateJugador } = require('../src/validators/jugadoresValidator');

const jugador = { nombre: ' Ana Ruiz ', dorsal: 7, activo: true, posicion: 'defensa' };
test('POST y PUT: acepta datos válidos, limpia nombre y descarta id/extra', () => {
  const result = validateJugador({ ...jugador, id: 55, extra: 'descartar' }, { partial: false });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.data, { nombre: 'Ana Ruiz', dorsal: 7, activo: true, posicion: 'defensa' });
});
test('POST y PUT: devuelve todas las incidencias', () => {
  const result = validateJugador({ nombre: '', dorsal: -1, activo: 'true', posicion: 'lateral' });
  assert.deepEqual(result.errors.map(e => e.field), ['nombre', 'dorsal', 'activo', 'posicion']);
});
test('PATCH: admite solo los campos recibidos', () => {
  const result = validateJugador({ activo: false, id: 999 }, { partial: true });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.data, { activo: false });
});
test('PATCH: rechaza cuerpos sin campos editables', () => {
  const result = validateJugador({ id: 12, extra: 5 }, { partial: true });
  assert.equal(result.errors[0].field, 'body');
});
test('Rechaza un cuerpo que no es objeto JSON', () => {
  assert.equal(validateJugador(null).errors[0].field, 'body');
  assert.equal(validateJugador([]).errors[0].field, 'body');
});
