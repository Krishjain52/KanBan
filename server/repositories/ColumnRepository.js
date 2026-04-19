const prisma = require('../config/db');

class ColumnRepository {
  async create(title, boardId, order) {
    return prisma.column.create({ data: { title, boardId, order } });
  }

  async update(id, title) {
    return prisma.column.update({ where: { id }, data: { title } });
  }

  async delete(id) {
    return prisma.column.delete({ where: { id } });
  }

  async canAccess(columnId, userId) {
    const col = await prisma.column.findUnique({ where: { id: columnId }, include: { board: true } });
    return col && col.board.userId === userId;
  }

  async executeTransaction(operations) {
    return prisma.$transaction(operations);
  }

  updateOrderQuery(id, order) {
    return prisma.column.update({ where: { id }, data: { order } });
  }
}

module.exports = new ColumnRepository();
