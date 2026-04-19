const taskService = require('../services/TaskService');
const columnRepository = require('../repositories/ColumnRepository'); // just to get boardId if needed

class TaskController {
  async createTask(req, res) {
    try {
      const { boardId, ...data } = req.body;
      const task = await taskService.createTask(data, req.user.id);
      
      let bId = boardId;
      if (!bId) {
        const col = await columnRepository.canAccess(data.columnId, req.user.id); // Wait canAccess returns bool. If true, we need boardId.
        // It's cleaner to let client provide boardId or let service return it. Let's assume boardId might be fetched from getTask
      }
      
      const io = req.app.get('io');
      if (io && bId) {
         io.to(\`board:\${bId}\`).emit('task:created', { task, columnId: data.columnId });
      } else if (io && !bId) {
         // Fallback by fetching the boardid
         const existing = await taskService.getTask(task.id, req.user.id);
         io.to(\`board:\${existing.column.boardId}\`).emit('task:created', { task, columnId: data.columnId });
      }
      res.status(201).json(task);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async updateTask(req, res) {
    try {
      const { boardId, ...data } = req.body;
      const task = await taskService.updateTask(req.params.id, data, req.user.id);
      
      const io = req.app.get('io');
      if (io) {
          const existing = await taskService.getTask(task.id, req.user.id);
          io.to(\`board:\${existing.column.boardId}\`).emit('task:updated', task);
      }
      res.json(task);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async deleteTask(req, res) {
    try {
      // deleteTask now returns the existing task from the service
      const existing = await taskService.deleteTask(req.params.id, req.user.id);
      
      const io = req.app.get('io');
      if (io) {
          io.to(\`board:\${existing.column.boardId}\`).emit('task:deleted', { taskId: req.params.id, columnId: existing.columnId });
      }
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }

  async moveTask(req, res) {
    try {
      const { targetColumnId, newOrder } = req.body; // Frontend only sends targetColumnId, newOrder
      const result = await taskService.moveTask(req.params.id, targetColumnId, newOrder, req.user.id);
      // result is { movedTask, sourceColumnId, boardId }
      
      const io = req.app.get('io');
      if (io && result.boardId) {
          io.to(\`board:\${result.boardId}\`).emit('task:moved', { 
            task: result.movedTask, 
            sourceColumnId: result.sourceColumnId, 
            targetColumnId, 
            newOrder: result.movedTask.order 
          });
      }
      res.json(result.movedTask);
    } catch (err) {
      res.status(403).json({ message: err.message });
    }
  }
}

module.exports = new TaskController();
