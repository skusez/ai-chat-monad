# AI Chatbot Application

This repository contains a Next.js application with PostgreSQL and Redis services configured using Docker Compose.

## Services

- **Next.js**: The main application running on port 3000 (configurable)
- **PostgreSQL 15**: Database service running on port 5432 (configurable)
- **Redis**: In-memory data store running on port 6379 (configurable)

## Environment Variables

The Next.js application uses the following environment variables:

- `DATABASE_URL`: Connection string for PostgreSQL
- `REDIS_URL`: Connection string for Redis

### Port Configuration

You can customize the ports for each service by setting these environment variables:

- `POSTGRES_PORT`: Port for PostgreSQL (default: 5432)
- `REDIS_PORT`: Port for Redis (default: 6379)
- `NEXTJS_PORT`: Port for Next.js application (default: 3000)

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine

### Running the Application

1. Clone this repository
2. Create a `.env` file based on `.env.example` and customize as needed
3. Start the services:

```bash
docker-compose up -d
```

4. Access the application at http://localhost:3000 (or your configured NEXTJS_PORT)

### Stopping the Application

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
```

## Development

For local development without Docker:

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

## Database

The PostgreSQL database is configured with:

- Username: postgres
- Password: postgres
- Database name: chatbot

You can connect to it using:

```bash
psql -h localhost -U postgres -d chatbot
```
