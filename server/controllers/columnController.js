const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createColumn = async (req, res) => {
  try {
    const { title, boardId } = req.body;
    if (!title || !boardId) return res.status(400).json({ message: 'Title and boardId required' });

    // Verify board ownership
    const board = await prisma.board.findFirst({ where: { id: boardId, userId: req.user.id } });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const count = await prisma.column.count({ where: { boardId } });
    const column = await prisma.column.create({
      data: { title, boardId, order: count },
      include: { tasks: true },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('column:created', column);

    res.status(201).json(column);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateColumn = async (req, res) => {
  try {
    const { title } = req.body;
    const column = await prisma.column.findFirst({
      where: { id: req.params.id },
      include: { board: true },
    });
    if (!column || column.board.userId !== req.user.id)
      return res.status(404).json({ message: 'Column not found' });

    const updated = await prisma.column.update({
      where: { id: req.params.id },
      data: { title },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteColumn = async (req, res) => {
  try {
    const column = await prisma.column.findFirst({
      where: { id: req.params.id },
      include: { board: true },
    });
    if (!column || column.board.userId !== req.user.id)
      return res.status(404).json({ message: 'Column not found' });

    await prisma.column.delete({ where: { id: req.params.id } });

    const io = req.app.get('io');
    io.to(`board:${column.boardId}`).emit('column:deleted', { columnId: req.params.id });

    res.json({ message: 'Column deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reorderColumns = async (req, res) => {
  try {
    const { boardId, columnIds } = req.body;
    const board = await prisma.board.findFirst({ where: { id: boardId, userId: req.user.id } });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const updates = columnIds.map((id, index) =>
      prisma.column.update({ where: { id }, data: { order: index } })
    );
    await prisma.$transaction(updates);

    res.json({ message: 'Columns reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createColumn, updateColumn, deleteColumn, reorderColumns };
