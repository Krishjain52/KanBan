const taskRepository = require('../repositories/TaskRepository');
const columnRepository = require('../repositories/ColumnRepository');

class TaskService {
  async getTask(taskId, userId) {
    const task = await taskRepository.getTaskWithBoard(taskId);
    if (!task || task.column.board.userId !== userId) throw new Error('Task not found');
    return task;
  }

  async createTask(data, userId) {
    const valid = await columnRepository.canAccess(data.columnId, userId);
    if (!valid) throw new Error('Unauthorized');
    
    // Auto increment order if not provided
    if (data.order === undefined) {
       const column = await columnRepository.canAccess(data.columnId, userId); // returns true ideally
       // Actually let's trust the frontend order for now, or default to 0 in prisma.
    }
    return taskRepository.create(data);
  }

  async updateTask(id, data, userId) {
    const existing = await this.getTask(id, userId); // validates access
    return taskRepository.update(id, data);
  }

  async deleteTask(id, userId) {
    const existing = await this.getTask(id, userId);
    await taskRepository.delete(id);
    return existing; // return existing so we know the boardId and columnId
  }

  async moveTask(id, targetColumnId, newOrder, userId) {
    const existing = await this.getTask(id, userId);
    
    const validTarget = await columnRepository.canAccess(targetColumnId, userId);
    if (!validTarget) throw new Error('Unauthorized');
    
    const sourceColumnId = existing.columnId;
    
    await taskRepository.executeMoveTransaction(id, sourceColumnId, targetColumnId, newOrder);
    
    const movedTask = await taskRepository.getTaskWithBoard(id); // get updated task
    return { movedTask, sourceColumnId, boardId: existing.column.boardId };
  }
}

module.exports = new TaskService();
