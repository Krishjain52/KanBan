const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.post('/', (req, res) => taskController.createTask(req, res));
router.put('/:id', (req, res) => taskController.updateTask(req, res));
router.delete('/:id', (req, res) => taskController.deleteTask(req, res));
router.post('/:id/move', (req, res) => taskController.moveTask(req, res));

module.exports = router;
