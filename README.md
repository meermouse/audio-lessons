# Audio Lessons

A full-stack application for building and serving audio lessons with PDF content.

## Prerequisites

- **Node.js** (v18+) and npm (v10+) - for frontend
- **Python** (v3.9+) - for backend
- **Docker** and Docker Compose - for running backend services

## Project Structure

```
├── frontend/       - Angular web application
└── backend/        - FastAPI services with Celery workers
```

## Frontend Setup

The frontend is an Angular application that serves the GUI for the audio lessons platform.

### Installation

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

### Running the Frontend

Start the development server:

```bash
cd frontend
npm start
```

The application will be available at `http://localhost:4200`

### Frontend Commands

- `npm start` - Start development server with live reload
- `npm build` - Build for production
- `npm watch` - Build in watch mode for development
- `npm test` - Run unit tests

## Backend Setup

The backend consists of a FastAPI application, Celery workers, and Redis for task queuing.

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured in `.env` file in the backend directory

### Running the Backend Services

From the backend directory, use Docker Compose to start all services:

```bash
cd backend
docker compose up --build
```

This command will:
- Build the Docker image for the API and worker services
- Start Redis (for task queuing)
- Start the FastAPI API server on port `8000`
- Start the Celery worker for background tasks

### Accessing Backend Services

- **API Server**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Redis**: `localhost:6379`

### Backend Services

- **API** - FastAPI application serving HTTP endpoints
- **Worker** - Celery worker processing background tasks
- **Redis** - Message broker for task queue

### Backend Commands

- `docker compose up --build` - Start all services with fresh build
- `docker compose up` - Start all services
- `docker compose down` - Stop all services
- `docker compose logs -f api` - View API logs
- `docker compose logs -f worker` - View worker logs

## Development Workflow

To run the full application in development:

### Terminal 1: Start Backend Services
```bash
cd backend
docker compose up --build
```

### Terminal 2: Start Frontend Development Server
```bash
cd frontend
npm install
npm start
```

Then navigate to `http://localhost:4200` in your browser.

## Environment Configuration

Create a `.env` file in the backend directory with necessary configuration:

```
# Example .env file
DATABASE_URL=postgresql://user:password@localhost/dbname
REDIS_URL=redis://redis:6379/0
```

## Project Technologies

### Frontend
- Angular 21
- TypeScript
- pdf.js (PDF viewer)
- RxJS

### Backend
- FastAPI
- Uvicorn (ASGI server)
- Celery (task queue)
- Redis (message broker)
- PyPDF / PyMuPDF (PDF processing)
- boto3 (AWS S3)

## License

[Add your license here]
