const prisma = require('../config/db');

class TaskRepository {
  async create(data) {
    return prisma.task.create({ data, include: { assignee: { select: { id: true, name: true, email: true } } } });
  }

  async update(id, data) {
    return prisma.task.update({ where: { id }, data, include: { assignee: { select: { id: true, name: true, email: true } } } });
  }

  async delete(id) {
    return prisma.task.delete({ where: { id } });
  }

  async canAccess(taskId, userId) {
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { column: { include: { board: true } } } });
    return task && task.column.board.userId === userId;
  }
}

module.exports = new TaskRepository();
