const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} = require('../controllers/taskController');

router.use(verifyToken);

router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/move', moveTask);

module.exports = router;
