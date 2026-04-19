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

  async getTaskWithBoard(taskId) {
    return prisma.task.findFirst({
      where: { id: taskId },
      include: {
        column: { include: { board: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async executeMoveTransaction(taskId, sourceColumnId, targetColumnId, newOrder) {
    return prisma.$transaction(async (tx) => {
      // Remove from source column and close gap
      const sourceTasks = await tx.task.findMany({
        where: { columnId: sourceColumnId, id: { not: taskId } },
        orderBy: { order: 'asc' },
      });
      await Promise.all(
        sourceTasks.map((t, i) => tx.task.update({ where: { id: t.id }, data: { order: i } }))
      );

      // Insert into target column at newOrder
      const targetTasks = await tx.task.findMany({
        where: { columnId: targetColumnId, id: { not: taskId } },
        orderBy: { order: 'asc' },
      });

      // Shift tasks at or after newOrder
      const insertAt = newOrder ?? targetTasks.length;
      await Promise.all(
        targetTasks.map((t, i) => {
          const actualOrder = i >= insertAt ? i + 1 : i;
          return tx.task.update({ where: { id: t.id }, data: { order: actualOrder } });
        })
      );

      // Move the task itself
      await tx.task.update({
        where: { id: taskId },
        data: { columnId: targetColumnId, order: insertAt },
      });
    });
  }
}

module.exports = new TaskRepository();
