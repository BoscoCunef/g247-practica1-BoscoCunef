const express = require('express');
const path = require('path');
const jugadoresRoutes = require('./routes/jugadores');
const logger = require('./middleware/logger');
const app = express();
app.use(logger);
app.use(express.json());
// Cliente y API en el mismo origen: no se necesita configurar CORS.
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/jugadores', jugadoresRoutes);
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
// Último middleware: centraliza errores y no revela detalles internos.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ errors: [{ field: 'body', message: 'JSON no válido.' }] });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});
module.exports = app;
