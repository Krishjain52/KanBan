const prisma = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }
  
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true }
    });
  }
  
  async create(data) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true, createdAt: true }
    });
  }
}

module.exports = new UserRepository();
