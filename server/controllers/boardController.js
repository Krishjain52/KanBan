const boardService = require('../services/BoardService');

class BoardController {
  async getBoards(req, res) {
    try {
      const boards = await boardService.getBoards(req.user.id);
      res.json(boards);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getBoard(req, res) {
    try {
      const board = await boardService.getBoardById(req.params.id, req.user.id);
      res.json(board);
    } catch (err) {
      if (err.message === 'Board not found') return res.status(404).json({ message: err.message });
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createBoard(req, res) {
    try {
      if (!req.body.title) return res.status(400).json({ message: 'Title required' });
      const board = await boardService.createBoard(req.body.title, req.user.id);
      res.status(201).json(board);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateBoard(req, res) {
    try {
      const board = await boardService.updateBoard(req.params.id, req.user.id, req.body.title);
      res.json(board);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteBoard(req, res) {
    try {
      await boardService.deleteBoard(req.params.id, req.user.id);
      res.json({ message: 'Board deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new BoardController();
