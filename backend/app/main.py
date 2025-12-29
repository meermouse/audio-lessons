from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api.routes import router
from app.core.config import settings

app = FastAPI(title="Audio Lessons Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

# Mount storage directory for serving PDFs
storage_path = os.path.join(settings.LOCAL_STORAGE_DIR, "pdfs")
if os.path.exists(storage_path):
    app.mount("/storage/pdfs", StaticFiles(directory=storage_path), name="storage")
