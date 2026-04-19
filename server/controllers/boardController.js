const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getBoards = async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { columns: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBoard = async (req, res) => {
  try {
    const board = await prisma.board.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const board = await prisma.board.create({
      data: {
        title,
        userId: req.user.id,
        columns: {
          create: [
            { title: 'To Do', order: 0 },
            { title: 'In Progress', order: 1 },
            { title: 'Done', order: 2 },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: { tasks: true },
        },
      },
    });
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { title } = req.body;
    const board = await prisma.board.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const updated = await prisma.board.update({
      where: { id: req.params.id },
      data: { title },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await prisma.board.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    await prisma.board.delete({ where: { id: req.params.id } });
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getBoards, getBoard, createBoard, updateBoard, deleteBoard };
