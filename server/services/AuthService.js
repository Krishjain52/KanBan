const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const boardRepository = require('../repositories/BoardRepository');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  async register({ email, password, name }) {
    if (!email || !password) throw new Error("Email and password are required");
    
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new Error("Email already in use");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({ email, passwordHash, name });

    const token = this.generateToken(user);
    await boardRepository.createWithDefaultColumns('My First Board', user.id);

    return { token, user };
  }

  async login({ email, password }) {
    if (!email || !password) throw new Error("Email and password are required");

    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    const token = this.generateToken(user);
    const { passwordHash, ...safeUser } = user;

    return { token, user: safeUser };
  }

  async getMe(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }
}

module.exports = new AuthService();
