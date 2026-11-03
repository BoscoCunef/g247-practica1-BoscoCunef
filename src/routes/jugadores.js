const express = require('express');
const controller = require('../controllers/jugadoresController');
const router = express.Router();
router.get('/', controller.list);
router.get('/stats', controller.stats); // IMPORTANTE: /stats antes de /:id
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.replace);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
module.exports = router;
