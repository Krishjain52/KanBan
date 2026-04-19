const jwt = require('jsonwebtoken');

const initSocket = (io, prisma) => {
  // Authenticate socket connections
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

    // Join a board room
    socket.on('board:join', async ({ boardId }) => {
      try {
        // Verify user has access to this board
        const board = await prisma.board.findFirst({
          where: { id: boardId, userId: socket.user.id },
        });

        if (!board) {
          socket.emit('error', { message: 'Board not found or access denied' });
          return;
        }

        // Leave previous board rooms
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

    // Handle task move via socket (for optimistic updates from other clients)
    socket.on('task:move', async ({ taskId, targetColumnId, newOrder, boardId }) => {
      try {
        const board = await prisma.board.findFirst({
          where: { id: boardId, userId: socket.user.id },
        });
        if (!board) return;

        // Persist the move
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { column: true },
        });
        if (!task) return;

        const sourceColumnId = task.columnId;

        await prisma.$transaction(async (tx) => {
          const sourceTasks = await tx.task.findMany({
            where: { columnId: sourceColumnId, id: { not: taskId } },
            orderBy: { order: 'asc' },
          });
          await Promise.all(
            sourceTasks.map((t, i) => tx.task.update({ where: { id: t.id }, data: { order: i } }))
          );

          const insertAt = newOrder ?? 0;
          const targetTasks = await tx.task.findMany({
            where: { columnId: targetColumnId, id: { not: taskId } },
            orderBy: { order: 'asc' },
          });
          await Promise.all(
            targetTasks.map((t, i) => {
              const actualOrder = i >= insertAt ? i + 1 : i;
              return tx.task.update({ where: { id: t.id }, data: { order: actualOrder } });
            })
          );

          await tx.task.update({
            where: { id: taskId },
            data: { columnId: targetColumnId, order: insertAt },
          });
        });

        const movedTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: { select: { id: true, email: true, name: true } } },
        });

        // Broadcast to all OTHER clients in the room
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
