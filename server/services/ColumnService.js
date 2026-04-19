const columnRepository = require('../repositories/ColumnRepository');
const boardRepository = require('../repositories/BoardRepository');

class ColumnService {
  async createColumn(title, boardId, userId) {
    const board = await boardRepository.findById(boardId, userId);
    if (!board) throw new Error('Unauthorized or board not found');
    
    const order = board.columns.length;
    return columnRepository.create(title, boardId, order);
  }

  async updateColumn(id, title, userId) {
    const valid = await columnRepository.canAccess(id, userId);
    if (!valid) throw new Error('Unauthorized');
    return columnRepository.update(id, title);
  }

  async deleteColumn(id, userId) {
    const valid = await columnRepository.canAccess(id, userId);
    if (!valid) throw new Error('Unauthorized');
    return columnRepository.delete(id);
  }

  async reorderColumns(columns, boardId, userId) {
    const board = await boardRepository.findById(boardId, userId);
    if (!board) throw new Error('Unauthorized');
    
    const ops = columns.map((col, index) => columnRepository.updateOrderQuery(col.id, index));
    return columnRepository.executeTransaction(ops);
  }
}

module.exports = new ColumnService();
