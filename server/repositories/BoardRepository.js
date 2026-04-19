const prisma = require('../config/db');

class BoardRepository {
  async createWithDefaultColumns(title, userId) {
    return prisma.board.create({
      data: {
        title,
        userId,
        columns: {
          create: [
            { title: 'To Do', order: 0 },
            { title: 'In Progress', order: 1 },
            { title: 'Done', order: 2 },
          ]
        }
      }
    });
  }

  async findAllByUser(userId) {
    return prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: { orderBy: { order: 'asc' } }
          }
        }
      }
    });
  }

  async findById(id, userId) {
    return prisma.board.findFirst({
      where: { id, userId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: { orderBy: { order: 'asc' }, include: { assignee: { select: { id: true, name: true, email: true } } } }
          }
        }
      }
    });
  }

  async create(title, userId) {
    return prisma.board.create({ data: { title, userId } });
  }

  async update(id, userId, title) {
    return prisma.board.updateMany({ where: { id, userId }, data: { title } });
  }

  async delete(id, userId) {
    return prisma.board.deleteMany({ where: { id, userId } });
  }
}

module.exports = new BoardRepository();
