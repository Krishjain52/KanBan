const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
} = require('../controllers/boardController');

router.use(verifyToken);

router.get('/', getBoards);
router.get('/:id', getBoard);
router.post('/', createBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);

module.exports = router;
