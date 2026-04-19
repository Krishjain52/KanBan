const express = require('express');
const router = express.Router();
const columnController = require('../controllers/columnController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.post('/', (req, res) => columnController.createColumn(req, res));
router.put('/:id', (req, res) => columnController.updateColumn(req, res));
router.delete('/:id', (req, res) => columnController.deleteColumn(req, res));
router.post('/reorder', (req, res) => columnController.reorderColumns(req, res));

module.exports = router;
