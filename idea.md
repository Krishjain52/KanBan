# Kanban Monorepo – Full-Stack Task Management System

## Project Overview

The Kanban project is a full-stack task management application that allows users to organize their work visually through boards, columns, and tasks. It uses drag-and-drop mechanics to make managing workflows simple and intuitive.

The system helps individuals and teams keep track of their progress seamlessly with real-time updates and a clean, responsive interface.

---

## Problem Statement

Managing complex projects and individual tasks can become overwhelming without a proper visual representation. Traditional to-do lists lack the spatial organization that helps teams understand task statuses quickly.

This Kanban application solves this by providing a highly structured, visual board where tasks can flow from "Backlog" to "Done", mapping perfectly to Agile workflows.

---

## Core Features

- Organize work into customizable Boards
- Manage the workflow using categorizable Columns (e.g., Todo, In Progress, Done)
- Create, edit, and reorganize Tasks with descriptions and priorities
- Drag-and-drop interface for smoothly transitioning tasks between columns
- Persistent data storage for user workspaces
- Real-time communication via WebSockets for dynamic updates

---

## Backend Architecture

The backend follows a clear and robust Node.js/Express architecture:
- RESTful API endpoints routing
- Controllers dedicated to domain entities (Users, Boards, Tasks)
- Real-time Socket.io layer
- Prisma ORM for database abstraction

Design principles applied:
- Separation of concerns
- High cohesion and loose coupling
- Relational data integrity

---

## Tech Stack

### Frontend
- React
- Vite
- Zustand (State Management)
- @dnd-kit (Drag and Drop functionality)
- Framer Motion

### Backend (Core API)
- Node.js
- Express
- Socket.io
- Prisma ORM

### Database
- SQLite / PostgreSQL
