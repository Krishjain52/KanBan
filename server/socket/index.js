const jwt = require('jsonwebtoken');
const boardService = require('../services/BoardService');
const taskService = require('../services/TaskService');
const prisma = require('../config/db'); // for anything unsupported

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user.email})`);

    socket.on('board:join', async ({ boardId }) => {
      try {
        const board = await boardService.getBoardById(boardId, socket.user.id);
        const rooms = Array.from(socket.rooms).filter(r => r.startsWith('board:'));
        rooms.forEach(room => socket.leave(room));

        socket.join(`board:${boardId}`);
        socket.currentBoardId = boardId;
        console.log(`User ${socket.user.email} joined board:${boardId}`);
        socket.emit('board:joined', { boardId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    socket.on('task:move', async ({ taskId, sourceColumnId, targetColumnId, newOrder, boardId }) => {
      try {
        const task = await taskService.moveTask(taskId, sourceColumnId, targetColumnId, newOrder, socket.user.id);

        const movedTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: { select: { id: true, email: true, name: true } } },
        });

        socket.to(`board:${boardId}`).emit('task:moved', {
          task: movedTask,
          sourceColumnId,
          targetColumnId,
          newOrder: movedTask.order,
        });
      } catch (err) {
        console.error('Socket task:move error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocket };
