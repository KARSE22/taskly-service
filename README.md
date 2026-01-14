# Taskly Service

A task management API built with Bun, Hono, and Prisma.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod

## Setup

```bash
# Install dependencies
bun install

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

## Running

```bash
# Development
bun run index.ts

# With hot reload
bun --hot run index.ts
```

Server runs at `http://localhost:8080`

## API Documentation

Interactive API docs available at `http://localhost:8080/docs`

OpenAPI spec at `http://localhost:8080/openapi.json`

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

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check for infrastructure |

## Project Structure

```
├── index.ts              # Entry point
├── src/
│   ├── db.ts             # Prisma client
│   ├── middleware/
│   │   └── error-handler.ts
│   └── routes/
│       └── boards.ts
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed data
│   └── migrations/
└── generated/
    └── prisma/           # Generated Prisma client
```
