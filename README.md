# Taskly Service

A task management API built with Bun, Hono, and Prisma.

## Table of Contents

- [Getting Started](#getting-started)
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

## Getting Started

Get up and running:

```bash
# Clone and install
git clone <repo-url>
cd taskly-service
bun install

# Set up database
createdb taskly
cp .env.example .env
# Edit .env with: DATABASE_URL="postgresql://YOUR_USER@localhost:5432/taskly"

# Run migrations and start
bun --bun run prisma generate
bun --bun run prisma migrate dev
bun run index.ts
```

The API is now running at `http://localhost:8080`. View the interactive docs at `http://localhost:8080/docs`.

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

| Variable       | Description                                       | Default       |
| -------------- | ------------------------------------------------- | ------------- |
| `DATABASE_URL` | PostgreSQL connection string                      | Required      |
| `PORT`         | Server port                                       | `8080`        |
| `NODE_ENV`     | Environment (`development`, `production`, `test`) | `development` |

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

| Method | Endpoint             | Description                                  |
| ------ | -------------------- | -------------------------------------------- |
| GET    | `/api/v1/boards`     | List all boards                              |
| GET    | `/api/v1/boards/:id` | Get board with statuses, tasks, and subtasks |
| POST   | `/api/v1/boards`     | Create board                                 |
| PUT    | `/api/v1/boards/:id` | Update board                                 |
| DELETE | `/api/v1/boards/:id` | Delete board                                 |

#### Create Board

```json
POST /api/v1/boards
{
  "name": "My Board",
  "description": "Optional description"
}
```

#### Update Board

```json
PUT /api/v1/boards/:id
{
  "name": "Updated name",
  "description": "Updated description"
}
```

### Board Statuses

Board statuses (columns) are managed as nested resources under boards.

| Method | Endpoint                                     | Description                       |
| ------ | -------------------------------------------- | --------------------------------- |
| GET    | `/api/v1/boards/:boardId/statuses`           | List all statuses for a board     |
| GET    | `/api/v1/boards/:boardId/statuses/:statusId` | Get status by ID                  |
| POST   | `/api/v1/boards/:boardId/statuses`           | Create status                     |
| PUT    | `/api/v1/boards/:boardId/statuses/:statusId` | Update status                     |
| DELETE | `/api/v1/boards/:boardId/statuses/:statusId` | Delete status (cascades to tasks) |
| PUT    | `/api/v1/boards/:boardId/statuses/reorder`   | Reorder statuses                  |

#### Create Status

Position is optional - if not provided, the status will be added at the end.

```json
POST /api/v1/boards/:boardId/statuses
{
  "name": "In Progress",
  "description": "Tasks being worked on",
  "position": 1
}
```

#### Update Status

```json
PUT /api/v1/boards/:boardId/statuses/:statusId
{
  "name": "Updated name",
  "position": 2
}
```

#### Reorder Statuses

```json
PUT /api/v1/boards/:boardId/statuses/reorder
{
  "statusIds": ["uuid-3", "uuid-1", "uuid-2"]
}
```

### Tasks

| Method | Endpoint                | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| GET    | `/api/v1/tasks`         | List all tasks (filter by `?boardStatusId=`) |
| GET    | `/api/v1/tasks/:id`     | Get task with subtasks                       |
| POST   | `/api/v1/tasks`         | Create task                                  |
| PUT    | `/api/v1/tasks/:id`     | Update task                                  |
| DELETE | `/api/v1/tasks/:id`     | Delete task                                  |
| PUT    | `/api/v1/tasks/reorder` | Reorder tasks (can move between columns)     |

#### Create Task

Position is optional - if not provided, the task will be added at the end of the column.

```json
POST /api/v1/tasks
{
  "boardStatusId": "uuid",
  "title": "Task title",
  "description": "Optional description"
}
```

#### Update Task

```json
PUT /api/v1/tasks/:id
{
  "title": "Updated title",
  "boardStatusId": "uuid",
  "position": 1
}
```

#### Reorder Tasks

Reorder tasks within a column or move them to a different column.

```json
PUT /api/v1/tasks/reorder
{
  "boardStatusId": "target-column-uuid",
  "taskIds": ["task-3", "task-1", "task-2"]
}
```

### Subtasks

| Method | Endpoint               | Description                              |
| ------ | ---------------------- | ---------------------------------------- |
| GET    | `/api/v1/subtasks`     | List all subtasks (filter by `?taskId=`) |
| GET    | `/api/v1/subtasks/:id` | Get subtask by ID                        |
| POST   | `/api/v1/subtasks`     | Create subtask                           |
| PUT    | `/api/v1/subtasks/:id` | Update subtask                           |
| DELETE | `/api/v1/subtasks/:id` | Delete subtask                           |

#### Create Subtask

```json
POST /api/v1/subtasks
{
  "taskId": "uuid",
  "description": "Subtask description",
  "isCompleted": false
}
```

#### Update Subtask

```json
PUT /api/v1/subtasks/:id
{
  "description": "Updated description",
  "isCompleted": true
}
```

### Health Check

| Method | Endpoint  | Description                     |
| ------ | --------- | ------------------------------- |
| GET    | `/health` | Health check for infrastructure |

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
