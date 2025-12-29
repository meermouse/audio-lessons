# Audio Lessons Backend

A FastAPI-based backend service for generating interactive audio lessons from PDF documents. This service handles PDF uploads, content extraction, lesson generation using Celery workers, and file storage management.

## Features

- **PDF Upload & Management**: Upload and store PDF documents with metadata tracking
- **Async Processing**: Celery-based job queue for long-running lesson generation tasks
- **PDF Extraction**: Extract text and metadata from PDF files
- **Flexible Storage**: Support for local file storage and AWS S3 storage backends
- **RESTful API**: FastAPI-based REST API with automatic OpenAPI documentation
- **CORS Support**: Pre-configured for frontend applications running on localhost

## Tech Stack

- **Framework**: FastAPI 0.115.0
- **Server**: Uvicorn with standard extensions
- **Task Queue**: Celery 5.4.0
- **Cache/Message Broker**: Redis 7
- **PDF Processing**: PyPDF 5.0.1, PyMuPDF 1.24.10
- **Storage**: Local filesystem or AWS S3 (via boto3)
- **Validation**: Pydantic 2.8.2
- **Python**: 3.11

## Prerequisites

- Docker and Docker Compose
- Or: Python 3.11+, Redis 7, and pip

## Getting Started with Docker

### Quick Start

1. **Clone/navigate to the project**:
   ```bash
   cd backend
   ```

2. **Create a `.env` file** (optional, for custom configuration):
   ```env
   # Environment variables for the application
   APP_ENV=dev
   BASE_URL=http://localhost:8000
   STORAGE_BACKEND=local
   REDIS_URL=redis://redis:6379/0
   ```

3. **Start the services**:
   ```bash
   docker-compose up --build
   ```

   This will start:
   - **Redis** on `localhost:6379` - Message broker and cache
   - **API Server** on `localhost:8000` - FastAPI application with auto-reload
   - **Celery Worker** - Background job processor

4. **Access the API**:
   - Interactive API docs: http://localhost:8000/docs
   - Alternative API docs: http://localhost:8000/redoc
   - API base URL: http://localhost:8000/api

### View Logs

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f redis
```

### Stop Services

```bash
docker-compose down
```

To also remove volumes (Redis data, uploaded files):
```bash
docker-compose down -v
```

## Local Development (Without Docker)

### Installation

1. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install and run Redis**:
   ```bash
   # Using Docker just for Redis
   docker run -d -p 6379:6379 redis:7
   ```

### Running Services

1. **Start the API server** (in one terminal):
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start the Celery worker** (in another terminal):
   ```bash
   celery -A app.workers.celery_app.celery worker --loglevel=INFO
   ```

3. **Access the API**:
   - http://localhost:8000/docs

## API Endpoints

### PDF Management

- **POST `/api/pdfs`** - Upload a PDF file
  - Request: Multipart form data with file
  - Returns: `{pdf_id, pdf_key}`

- **GET `/api/pdfs/{pdf_id}`** - Get PDF information
  - Returns: PDF metadata including page count

### Lesson Generation

- **POST `/api/jobs`** - Create a lesson generation job
  - Request body: `{pdf_id, parameters}`
  - Returns: `{job_id, status}`

- **GET `/api/jobs/{job_id}`** - Check job status
  - Returns: Job status and result when complete

- **GET `/api/jobs/{job_id}/bundle`** - Download generated lesson bundle
  - Returns: ZIP file with lesson materials

## Configuration

Configuration is managed via environment variables defined in `.env` file. Default values are provided in `app/core/config.py`.

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `dev` | Application environment |
| `BASE_URL` | `http://localhost:8000` | API base URL |
| `STORAGE_BACKEND` | `local` | Storage backend: `local` or `s3` |
| `LOCAL_STORAGE_DIR` | `./data` | Directory for local file storage |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection URL |
| `S3_BUCKET` | `null` | AWS S3 bucket name (required if using S3) |
| `S3_REGION` | `null` | AWS region for S3 |
| `AWS_ACCESS_KEY_ID` | `null` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | `null` | AWS credentials |

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application setup
│   ├── core/
│   │   └── config.py           # Configuration management
│   ├── api/
│   │   ├── routes.py           # API endpoints
│   │   └── schemas.py          # Pydantic request/response models
│   ├── services/
│   │   ├── storage.py          # Storage abstraction (local/S3)
│   │   ├── pdf_extract.py      # PDF text extraction
│   │   ├── lesson_builder.py   # Lesson content generation
│   │   └── zip_bundle.py       # Bundling lesson files
│   └── workers/
│       ├── celery_app.py       # Celery configuration
│       └── tasks.py            # Async job tasks
├── data/                       # PDF uploads and data storage
├── tmp/                        # Temporary files
├── Dockerfile                  # Container image definition
├── docker-compose.yml          # Multi-container orchestration
└── requirements.txt            # Python dependencies
```

## Troubleshooting

### Redis Connection Refused
- Ensure Redis is running: `docker ps | grep redis`
- Check Redis URL in `.env` matches your setup
- For Docker: use `redis://redis:6379/0` (service name)
- For local: use `redis://localhost:6379/0`

### API Server Not Responding
```bash
# Check if container is running
docker-compose ps

# Check logs
docker-compose logs api

# Restart the service
docker-compose restart api
```

### Worker Not Processing Jobs
```bash
# Check worker logs
docker-compose logs worker

# Ensure Redis is accessible
docker-compose logs redis
```

### File Storage Issues
- For local storage: ensure `./data` directory has write permissions
- For S3: verify AWS credentials and bucket permissions in `.env`

## Development Tips

- **Hot Reload**: API server automatically reloads on file changes (Docker)
- **Interactive Docs**: Visit http://localhost:8000/docs to test endpoints
- **Database**: Redis data persists in Docker volumes; use `docker-compose down -v` to reset
- **Logs**: Use `docker-compose logs -f <service>` for real-time logs

## Next Steps

- Set up environment variables in `.env` for your specific configuration
- Run `docker-compose up --build` to start all services
- Visit http://localhost:8000/docs to explore the API
- Check the frontend README for integration instructions
