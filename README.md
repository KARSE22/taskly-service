# Taskly Service

A task management API built with Bun, Hono, and Prisma.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Running](#running)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
  - [Boards](#boards)
  - [Board Statuses](#board-statuses)
  - [Tasks](#tasks)
  - [Subtasks](#subtasks)
  - [Health Check](#health-check)
- [Project Structure](#project-structure)
- [Path Aliases](#path-aliases)

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono with OpenAPI
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **API Docs**: Scalar

## Setup

```bash
# Install dependencies
bun install

# Create database
createdb taskly

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
bun --bun run prisma generate

# Run migrations
bun --bun run prisma migrate dev

# Seed database (optional)
bun --bun run prisma db seed
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |

## Running

```bash
# Development
bun run index.ts

# With hot reload
bun --hot run index.ts
```

Server runs at `http://localhost:${PORT}` (default: 8080)

## Testing

Tests run against a separate test database. Bun automatically loads `.env.test` when running tests.

```bash
# Create test database
createdb taskly_test

# Create .env.test with test database URL
echo 'DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/taskly_test?schema=public"' > .env.test

# Run migrations on test database (replace YOUR_USERNAME)
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/taskly_test?schema=public" bun --bun run prisma migrate deploy

# Run all tests
bun test

# Run a single test file
bun test tests/boards.test.ts
```

## API Documentation

Interactive API docs available at `/docs`

OpenAPI spec at `/openapi.json`

## API Endpoints

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List all boards |
| GET | `/api/boards/:id` | Get board with statuses, tasks, and subtasks |
| POST | `/api/boards` | Create board |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |

#### Create Board
```json
POST /api/boards
{
  "name": "My Board",
  "description": "Optional description"
}
```

#### Update Board
```json
PUT /api/boards/:id
{
  "name": "Updated name",
  "description": "Updated description"
}
```

### Board Statuses

Board statuses (columns) are managed as nested resources under boards.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/:boardId/statuses` | List all statuses for a board |
| GET | `/api/boards/:boardId/statuses/:statusId` | Get status by ID |
| POST | `/api/boards/:boardId/statuses` | Create status |
| PUT | `/api/boards/:boardId/statuses/:statusId` | Update status |
| DELETE | `/api/boards/:boardId/statuses/:statusId` | Delete status (cascades to tasks) |

#### Create Status
```json
POST /api/boards/:boardId/statuses
{
  "name": "In Progress",
  "description": "Tasks being worked on",
  "position": 1
}
```

#### Update Status
```json
PUT /api/boards/:boardId/statuses/:statusId
{
  "name": "Updated name",
  "position": 2
}
```

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks (filter by `?boardStatusId=`) |
| GET | `/api/tasks/:id` | Get task with subtasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

#### Create Task
```json
POST /api/tasks
{
  "boardStatusId": "uuid",
  "title": "Task title",
  "description": "Optional description",
  "position": 0
}
```

#### Update Task
```json
PUT /api/tasks/:id
{
  "title": "Updated title",
  "boardStatusId": "uuid",
  "position": 1
}
```

### Subtasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subtasks` | List all subtasks (filter by `?taskId=`) |
| GET | `/api/subtasks/:id` | Get subtask by ID |
| POST | `/api/subtasks` | Create subtask |
| PUT | `/api/subtasks/:id` | Update subtask |
| DELETE | `/api/subtasks/:id` | Delete subtask |

#### Create Subtask
```json
POST /api/subtasks
{
  "taskId": "uuid",
  "description": "Subtask description",
  "isCompleted": false
}
```

#### Update Subtask
```json
PUT /api/subtasks/:id
{
  "description": "Updated description",
  "isCompleted": true
}
```

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check for infrastructure |

## Project Structure

```
├── index.ts              # Entry point
├── src/
│   ├── db.ts             # Prisma client
│   ├── config/
│   │   └── index.ts      # Environment validation
│   ├── middleware/
│   │   └── error-handler.ts
│   ├── routes/
│   │   ├── boards.ts
│   │   ├── statuses.ts
│   │   ├── tasks.ts
│   │   └── subtasks.ts
│   └── schemas/
│       ├── index.ts      # Schema exports
│       ├── common.ts     # Shared schemas (Error, IdParam)
│       ├── board.ts      # Board schemas
│       └── task.ts       # Task schemas
├── tests/
│   ├── setup.ts          # Test database utilities
│   ├── app.ts            # Test app instance
│   ├── boards.test.ts
│   ├── statuses.test.ts
│   ├── tasks.test.ts
│   └── subtasks.test.ts
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed data
│   └── migrations/
└── generated/
    └── prisma/           # Generated Prisma client
```

## Path Aliases

The project uses TypeScript path aliases:
- `@/*` - Maps to `./src/*`
- `@prisma/*` - Maps to `./generated/prisma/*`
