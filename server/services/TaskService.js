const taskRepository = require('../repositories/TaskRepository');
const columnRepository = require('../repositories/ColumnRepository');

class TaskService {
  async createTask(data, userId) {
    const valid = await columnRepository.canAccess(data.columnId, userId);
    if (!valid) throw new Error('Unauthorized');
    return taskRepository.create(data);
  }

  async updateTask(id, data, userId) {
    const valid = await taskRepository.canAccess(id, userId);
    if (!valid) throw new Error('Unauthorized');
    return taskRepository.update(id, data);
  }

  async deleteTask(id, userId) {
    const valid = await taskRepository.canAccess(id, userId);
    if (!valid) throw new Error('Unauthorized');
    return taskRepository.delete(id);
  }

  async moveTask(id, sourceColumnId, targetColumnId, newOrder, userId) {
    const valid = await taskRepository.canAccess(id, userId);
    if (!valid) throw new Error('Unauthorized');
    
    const validSource = await columnRepository.canAccess(sourceColumnId, userId);
    const validTarget = await columnRepository.canAccess(targetColumnId, userId);
    
    if (!validSource || !validTarget) throw new Error('Unauthorized');
    
    return taskRepository.update(id, { columnId: targetColumnId, order: newOrder });
  }
}

module.exports = new TaskService();
