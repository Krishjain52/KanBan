const boardRepository = require('../repositories/BoardRepository');

class BoardService {
  async getBoards(userId) {
    return boardRepository.findAllByUser(userId);
  }

  async getBoardById(id, userId) {
    const board = await boardRepository.findById(id, userId);
    if (!board) throw new Error('Board not found');
    return board;
  }

  async createBoard(title, userId) {
    return boardRepository.create(title, userId);
  }

  async updateBoard(id, userId, title) {
    return boardRepository.update(id, userId, title);
  }

  async deleteBoard(id, userId) {
    return boardRepository.delete(id, userId);
  }
}

module.exports = new BoardService();
