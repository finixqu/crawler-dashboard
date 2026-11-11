# Crawler Dashboard Backend

Backend service for managing and executing social media crawler jobs.

## Tech Stack

- Node.js
- Express.js
- MySQL
- MySQL2
- Docker
- tmux
- GNU Parallel
- dotenv

## Features

- Create project crawler jobs.
- Create group crawler jobs.
- Schedule crawler execution.
- Monitor job status.
- Stop running jobs.
- Retrieve crawler logs.
- Recover active jobs after backend restart.

## Requirements

Make sure the following tools are installed:

- Node.js
- npm
- MySQL
- Docker
- tmux
- GNU Parallel

The server must also have access to the required crawler Docker images and crawler configuration files.

## Installation

Go to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Edit the environment configuration:

```bash
nano .env
```

Configure the database, crawler Docker images, crawler configuration paths, and log directory.

## Running the Backend

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The default port is 3000.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Check backend status |
| GET | /api/platforms | Get available platforms |
| GET | /api/groups | Get crawler groups |
| GET | /api/groups/:id/projects | Get projects in a group |
| GET | /api/jobs | Get crawler jobs |
| GET | /api/jobs/stats | Get job statistics |
| POST | /api/jobs/project | Create project job |
| POST | /api/jobs/group | Create group job |
| POST | /api/jobs/:id/stop | Stop a job |
| GET | /api/jobs/:id/log | Get job log |
| GET | /api/jobs/:id/project-logs | Get project logs |
| GET | /api/jobs/:id/project-logs/:projectId | Get specific project log |
| POST | /api/crawlers/start | Start crawler execution |

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── app.js
│   └── server.js
├── .env
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

## Architecture

- **Controllers** handle incoming HTTP requests and responses.
- **Routes** define API endpoints.
- **Services** contain application logic and crawler execution workflows.
- **Repositories** handle database operations.
- **Config** contains application configuration.
- **server.js** initializes the backend and scheduled job recovery.

## Job Execution Flow

1. The frontend sends a job creation request.
2. The backend validates the request.
3. Job information is stored in MySQL.
4. The crawler service builds the Docker command.
5. The tmux service starts the crawler process.
6. The backend monitors the execution status.
7. Logs and job status are updated during execution.

## Environment Variables

All server-specific settings must be configured in `.env`.

Do not commit the actual `.env` file to the repository.

Use `.env.example` as a reference when configuring a new environment.
