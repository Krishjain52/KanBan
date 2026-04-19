const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} = require('../controllers/columnController');

router.use(verifyToken);

router.post('/', createColumn);
router.put('/:id', updateColumn);
router.delete('/:id', deleteColumn);
router.post('/reorder', reorderColumns);

module.exports = router;
