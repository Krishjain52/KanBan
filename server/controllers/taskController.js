const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTaskWithBoard = async (taskId) => {
  return prisma.task.findFirst({
    where: { id: taskId },
    include: {
      column: { include: { board: true } },
      assignee: { select: { id: true, email: true, name: true } },
    },
  });
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, columnId, assigneeId } = req.body;
    if (!title || !columnId) return res.status(400).json({ message: 'Title and columnId required' });

    const column = await prisma.column.findFirst({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column || column.board.userId !== req.user.id)
      return res.status(404).json({ message: 'Column not found' });

    const count = await prisma.task.count({ where: { columnId } });
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        columnId,
        assigneeId,
        order: count,
      },
      include: { assignee: { select: { id: true, email: true, name: true } } },
    });

    const io = req.app.get('io');
    io.to(`board:${column.boardId}`).emit('task:created', { task, columnId });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, priority, assigneeId } = req.body;
    const existing = await getTaskWithBoard(req.params.id);
    if (!existing || existing.column.board.userId !== req.user.id)
      return res.status(404).json({ message: 'Task not found' });

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { title, description, priority, assigneeId },
      include: { assignee: { select: { id: true, email: true, name: true } } },
    });

    const io = req.app.get('io');
    io.to(`board:${existing.column.boardId}`).emit('task:updated', task);

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const existing = await getTaskWithBoard(req.params.id);
    if (!existing || existing.column.board.userId !== req.user.id)
      return res.status(404).json({ message: 'Task not found' });

    await prisma.task.delete({ where: { id: req.params.id } });

    const io = req.app.get('io');
    io.to(`board:${existing.column.boardId}`).emit('task:deleted', {
      taskId: req.params.id,
      columnId: existing.columnId,
    });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const moveTask = async (req, res) => {
  try {
    const { targetColumnId, newOrder } = req.body;
    const existing = await getTaskWithBoard(req.params.id);
    if (!existing || existing.column.board.userId !== req.user.id)
      return res.status(404).json({ message: 'Task not found' });

    const boardId = existing.column.boardId;
    const sourceColumnId = existing.columnId;

    // Reorder tasks in both columns
    await prisma.$transaction(async (tx) => {
      // Remove from source column and close gap
      const sourceTasks = await tx.task.findMany({
        where: { columnId: sourceColumnId, id: { not: req.params.id } },
        orderBy: { order: 'asc' },
      });
      await Promise.all(
        sourceTasks.map((t, i) => tx.task.update({ where: { id: t.id }, data: { order: i } }))
      );

      // Insert into target column at newOrder
      const targetTasks = await tx.task.findMany({
        where: { columnId: targetColumnId, id: { not: req.params.id } },
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
        where: { id: req.params.id },
        data: { columnId: targetColumnId, order: insertAt },
      });
    });

    const movedTask = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { assignee: { select: { id: true, email: true, name: true } } },
    });

    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('task:moved', {
      task: movedTask,
      sourceColumnId,
      targetColumnId,
      newOrder: movedTask.order,
    });

    res.json(movedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTask, updateTask, deleteTask, moveTask };
