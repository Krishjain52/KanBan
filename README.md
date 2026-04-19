# Kanban — Fullstack Real-Time Task Manager
Complete Production-Grade Repository Intelligence System

## Overview

Kanban is a full-stack real-time task manager application that analyzes productivity and organizes them efficiently. It automatically keeps your tasks synchronized through websockets and provides drag-and-drop workflow functionality.

## Documentation Highlights

See our detailed visual documentation:
- [System Idea & Overview](idea.md)
- [System Architecture Class Diagram](classDiagram.md)
- [Database ER Diagram](erDigram.md)
- [Usage Sequence Diagram](sequenceDiagram.md)
- [Application Use Case Diagram](useCaseDiagram.md)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6 |
| State | Zustand + Immer |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Animations | Framer Motion |
| HTTP | Axios |
| Real-time | Socket.io client |
| Backend | Node.js + Express |
| Auth | JWT + bcrypt |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io server |

## Project Structure

```
kanban/
├── package.json          # Root — concurrently scripts
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   └── Auth.module.css
│   │   │   ├── Board/
│   │   │   │   ├── BoardsPage.jsx      # Board list
│   │   │   │   ├── BoardPage.jsx       # Kanban board with DnD
│   │   │   │   ├── Column.jsx          # Droppable column
│   │   │   │   ├── TaskCard.jsx        # Sortable task card
│   │   │   │   └── TaskModal.jsx       # Edit task modal
│   │   │   └── UI/
│   │   │       └── PageTransition.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js            # Socket.io hook
│   │   │   └── useBoard.js             # Board data hook
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # JWT auth context
│   │   ├── store/
│   │   │   └── boardStore.js           # Zustand store
│   │   └── services/
│   │       └── api.js                  # Axios instance
└── server/               # Express backend
    ├── index.js           # Entry point
    ├── prisma/
    │   ├── schema.prisma  # DB schema
    │   └── seed.js        # Demo data seed
    ├── routes/            # Express routers
    ├── controllers/       # Business logic
    ├── middleware/
    │   └── auth.js        # JWT verifyToken
    └── socket/
        └── index.js       # Socket.io handlers
```

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted DB)

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL and JWT_SECRET

# Client (optional — uses Vite proxy by default)
cp client/.env.example client/.env
```

**server/.env**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/kanban_db"
JWT_SECRET="change-this-to-a-long-random-string"
PORT=3001
CLIENT_URL="http://localhost:5173"
```

### 4. Set up the database

```bash
# Create tables
npm run db:setup

# Or run migrations (for dev with migration history)
npm run db:migrate
```

### 5. Run in development

```bash
npm run dev
```

This starts both the Express server (port 3001) and the Vite dev server (port 5173) concurrently.

Open **http://localhost:5173**

### Demo account
- Email: `demo@kanban.dev`
- Password: `password123`

---

## Features

### Auth
- Register / Login with JWT (7-day expiry)
- Protected routes — unauthenticated users redirected to `/login`
- Token stored in `localStorage`, attached to every API request via Axios interceptor

### Boards
- Create multiple boards per user
- Each board auto-creates 3 default columns: To Do, In Progress, Done
- Delete boards (cascade deletes all columns + tasks)

### Columns
- Add / rename / delete columns
- Column count badge
- Drop zone highlighting when dragging over

### Tasks
- Create tasks inline (quick add) or via modal (full edit)
- Four priority levels: Low / Medium / High / Urgent — color-coded stripe + badge
- Description field
- Assignee (references user by ID)
- Drag between columns and reorder within columns

### Real-Time (Socket.io)
- Every user on the same board sees changes instantly
- Events: `task:created`, `task:deleted`, `task:moved`, `task:updated`, `column:created`, `column:deleted`
- JWT validated on socket handshake
- Board room isolation: `board:${boardId}`

### Animations (Framer Motion)
| Trigger | Animation |
|---------|-----------|
| Card created | Slide in from top + fade |
| Card deleted | Fade out + height collapse to 0 |
| Card dragged | Scale 1.04× + 1.5° rotation, spring physics |
| Card moved remotely | Smooth `layout` + `layoutId` transition |
| Column added | Slide in from right |
| Page navigation | Fade + subtle Y shift via `AnimatePresence` |

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Boards
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/boards` | List all boards |
| GET | `/api/boards/:id` | Get board with columns + tasks |
| POST | `/api/boards` | Create board |
| PUT | `/api/boards/:id` | Update board title |
| DELETE | `/api/boards/:id` | Delete board |

### Columns
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/columns` | Create column |
| PUT | `/api/columns/:id` | Update column title |
| DELETE | `/api/columns/:id` | Delete column |
| POST | `/api/columns/reorder` | Reorder columns |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/move` | Move task to column |

### Socket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `board:join` | client→server | `{ boardId }` |
| `board:joined` | server→client | `{ boardId }` |
| `task:created` | server→clients | `{ task, columnId }` |
| `task:deleted` | server→clients | `{ taskId, columnId }` |
| `task:moved` | server→clients | `{ task, sourceColumnId, targetColumnId, newOrder }` |
| `task:updated` | server→clients | `task` |
| `column:created` | server→clients | `column` |
| `column:deleted` | server→clients | `{ columnId }` |

---

## Production Deployment

1. Build the client: `cd client && npm run build`
2. Serve `client/dist` as static files from Express (or a CDN)
3. Set `NODE_ENV=production` and all required env vars
4. Run `prisma migrate deploy` (not `db push`) for production migrations
5. Use a process manager like PM2: `pm2 start server/index.js`
