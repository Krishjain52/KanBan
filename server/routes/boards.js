const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', (req, res) => boardController.getBoards(req, res));
router.get('/:id', (req, res) => boardController.getBoard(req, res));
router.post('/', (req, res) => boardController.createBoard(req, res));
router.put('/:id', (req, res) => boardController.updateBoard(req, res));
router.delete('/:id', (req, res) => boardController.deleteBoard(req, res));

module.exports = router;
