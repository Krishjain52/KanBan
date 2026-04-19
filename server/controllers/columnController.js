const columnService = require('../services/ColumnService');

class ColumnController {
  async createColumn(req, res) {
    try {
      const { title, boardId } = req.body;
      const column = await columnService.createColumn(title, boardId, req.user.id);
      
      const io = req.app.get('io');
      if (io && boardId) {
        io.to(`board:${boardId}`).emit('column:created', column);
      }
      res.status(201).json(column);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async updateColumn(req, res) {
    try {
      const column = await columnService.updateColumn(req.params.id, req.body.title, req.user.id);
      res.json(column);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async deleteColumn(req, res) {
    try {
      await columnService.deleteColumn(req.params.id, req.user.id);
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async reorderColumns(req, res) {
    try {
      await columnService.reorderColumns(req.body.columns, req.body.boardId, req.user.id);
      res.json({ message: 'Reordered successfully' });
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }
}

module.exports = new ColumnController();
