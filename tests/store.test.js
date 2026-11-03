const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/data/store');

test('Almacén en memoria: crear, leer, sustituir, actualizar y borrar', () => {
  const creado = store.create({ nombre: 'Test Unitario', dorsal: 88, activo: true, posicion: 'portero' });
  assert.ok(Number.isInteger(creado.id));
  assert.equal(store.getById(creado.id).nombre, 'Test Unitario');
  const sustituido = store.replace(creado.id, { nombre: 'Otro Jugador', dorsal: 21, activo: false, posicion: 'defensa' });
  assert.deepEqual(sustituido, { id: creado.id, nombre: 'Otro Jugador', dorsal: 21, activo: false, posicion: 'defensa' });
  const actualizado = store.update(creado.id, { activo: true });
  assert.equal(actualizado.dorsal, 21);
  assert.equal(actualizado.activo, true);
  assert.equal(store.remove(creado.id), true);
  assert.equal(store.getById(creado.id), null);
});
