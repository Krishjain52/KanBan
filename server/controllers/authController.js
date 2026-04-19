const authService = require('../services/AuthService');

class AuthController {
  async register(req, res) {
    try {
      const data = await authService.register(req.body);
      res.status(201).json(data);
    } catch (err) {
      if (err.message === 'Email and password are required') return res.status(400).json({ message: err.message });
      if (err.message === 'Email already in use') return res.status(409).json({ message: err.message });
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async login(req, res) {
    try {
      const data = await authService.login(req.body);
      res.json(data);
    } catch (err) {
      if (err.message === 'Email and password are required') return res.status(400).json({ message: err.message });
      if (err.message === 'Invalid credentials') return res.status(401).json({ message: err.message });
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getMe(req, res) {
    try {
      const user = await authService.getMe(req.user.id);
      res.json(user);
    } catch (err) {
      if (err.message === 'User not found') return res.status(404).json({ message: err.message });
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new AuthController();
