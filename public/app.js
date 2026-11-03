const playersElement = document.querySelector('#players');
const form = document.querySelector('#player-form');
const filtersForm = document.querySelector('#filters');
const loading = document.querySelector('#loading');
const globalError = document.querySelector('#global-error');
let editingId = null;
let requestsInProgress = 0;

function setLoading(delta) {
  requestsInProgress += delta;
  loading.hidden = requestsInProgress === 0;
}
function showError(message) { globalError.textContent = message; globalError.hidden = !message; }
function clearFieldErrors() { document.querySelectorAll('.field-error').forEach(el => el.textContent = ''); }
async function api(url, options = {}) {
  setLoading(1);
  try {
    const response = await fetch(url, options);
    const payload = response.status === 204 ? null : await response.json();
    // fetch no rechaza por HTTP 400/404/500: hay que verificar response.ok.
    if (!response.ok) {
      const err = new Error(payload?.error || 'No se pudo completar la operación.');
      err.errors = payload?.errors || [];
      throw err;
    }
    return payload;
  } finally { setLoading(-1); }
}
function queryString() {
  const data = new FormData(filtersForm);
  const params = new URLSearchParams();
  for (const [key, value] of data) { if (value.trim()) params.set(key, value.trim()); }
  params.set('sort', 'nombre'); params.set('order', 'asc');
  return params.toString();
}
function playerCard(player) {
  const article = document.createElement('article'); article.className = 'player';
  const info = document.createElement('div');
  const name = document.createElement('h3'); name.textContent = `${player.nombre} · #${player.dorsal}`;
  const details = document.createElement('p'); details.textContent = `${player.posicion} · ${player.activo ? 'Activo' : 'Inactivo'}`;
  info.append(name, details);
  const actions = document.createElement('div'); actions.className = 'actions';
  const edit = document.createElement('button'); edit.textContent = 'Editar'; edit.className = 'secondary';
  edit.addEventListener('click', () => startEdit(player));
  const del = document.createElement('button'); del.textContent = 'Eliminar'; del.className = 'danger';
  del.addEventListener('click', () => deletePlayer(player));
  actions.append(edit, del); article.append(info, actions); return article;
}
async function refresh() {
  showError('');
  try {
    const [players, stats] = await Promise.all([api(`/jugadores?${queryString()}`), api('/jugadores/stats')]);
    playersElement.replaceChildren(...players.map(playerCard));
    document.querySelector('#empty').hidden = players.length > 0;
    document.querySelector('#count').textContent = `(${players.length} visibles)`;
    document.querySelector('#stats').textContent = `Plantilla total: ${stats.total} · Activos: ${stats.activos} · Media de dorsal: ${stats.mediaDorsal ?? '—'}`;
  } catch (err) { showError(err.message); }
}
function resetForm() {
  editingId = null; form.reset(); form.elements.activo.checked = true; clearFieldErrors();
  document.querySelector('#editor-title').textContent = 'Añadir jugador';
  document.querySelector('#save').textContent = 'Guardar jugador';
  document.querySelector('#cancel').hidden = true;
}
function startEdit(player) {
  editingId = player.id;
  form.elements.nombre.value = player.nombre;
  form.elements.dorsal.value = player.dorsal;
  form.elements.posicion.value = player.posicion;
  form.elements.activo.checked = player.activo;
  clearFieldErrors(); showError('');
  document.querySelector('#editor-title').textContent = `Editar jugador #${player.id}`;
  document.querySelector('#save').textContent = 'Guardar cambios';
  document.querySelector('#cancel').hidden = false;
  document.querySelector('#editor').scrollIntoView({ behavior: 'smooth' });
}
function collectFormData() {
  return { nombre: form.elements.nombre.value.trim(), dorsal: Number(form.elements.dorsal.value),
    posicion: form.elements.posicion.value, activo: form.elements.activo.checked };
}
function clientValidate(data) {
  const errors = [];
  if (data.nombre.length < 2 || data.nombre.length > 60) errors.push({ field: 'nombre', message: 'Entre 2 y 60 caracteres.' });
  if (!Number.isInteger(data.dorsal) || data.dorsal < 1 || data.dorsal > 99) errors.push({ field: 'dorsal', message: 'Introduce un dorsal entero entre 1 y 99.' });
  if (!['portero', 'defensa', 'centrocampista', 'delantero'].includes(data.posicion)) errors.push({ field: 'posicion', message: 'Selecciona una posición.' });
  return errors;
}
function showFieldErrors(errors) {
  errors.forEach(({ field, message }) => {
    const element = document.getElementById(`error-${field}`);
    if (element) element.textContent = message;
    else showError(message);
  });
}
form.addEventListener('submit', async event => {
  event.preventDefault(); clearFieldErrors(); showError('');
  const data = collectFormData(); const errors = clientValidate(data);
  if (errors.length) return showFieldErrors(errors);
  try {
    await api(editingId === null ? '/jugadores' : `/jugadores/${editingId}`, {
      method: editingId === null ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    resetForm(); await refresh();
  } catch (err) {
    if (err.errors?.length) showFieldErrors(err.errors);
    else showError(err.message);
  }
});
async function deletePlayer(player) {
  if (!confirm(`¿Eliminar a ${player.nombre}?`)) return;
  showError('');
  try { await api(`/jugadores/${player.id}`, { method: 'DELETE' }); if (editingId === player.id) resetForm(); await refresh(); }
  catch (err) { showError(err.message); }
}
filtersForm.addEventListener('submit', event => { event.preventDefault(); refresh(); });
document.querySelector('#cancel').addEventListener('click', resetForm);
refresh();
