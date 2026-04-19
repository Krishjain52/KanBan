const taskService = require('../services/TaskService');

class TaskController {
  async createTask(req, res) {
    try {
      const task = await taskService.createTask(req.body, req.user.id);
      
      const io = req.app.get('io');
      if (io && req.body.boardId) {
         io.to(\`board:\${req.body.boardId}\`).emit('task:created', { task, columnId: req.body.columnId });
      }
      res.status(201).json(task);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async updateTask(req, res) {
    try {
      // Body may not contain boardId, client usually sends it for socket emission
      const { boardId, ...data } = req.body;
      const task = await taskService.updateTask(req.params.id, data, req.user.id);
      
      const io = req.app.get('io');
      if (io && boardId) {
          io.to(\`board:\${boardId}\`).emit('task:updated', task);
      }
      res.json(task);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async deleteTask(req, res) {
    try {
      const { boardId, columnId } = req.body; // Sent via query or body usually
      // Just extract it from query since DELETE usually has no body
      const bId = boardId || req.query.boardId;
      const cId = columnId || req.query.columnId;

      await taskService.deleteTask(req.params.id, req.user.id);
      
      const io = req.app.get('io');
      if (io && bId) {
          io.to(\`board:\${bId}\`).emit('task:deleted', { taskId: req.params.id, columnId: cId });
      }
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async moveTask(req, res) {
    try {
      const { sourceColumnId, targetColumnId, newOrder, boardId } = req.body;
      const task = await taskService.moveTask(req.params.id, sourceColumnId, targetColumnId, newOrder, req.user.id);
      
      const io = req.app.get('io');
      if (io && boardId) {
          io.to(\`board:\${boardId}\`).emit('task:moved', { task, sourceColumnId, targetColumnId, newOrder });
      }
      res.json(task);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }
}

module.exports = new TaskController();
