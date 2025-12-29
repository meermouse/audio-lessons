from __future__ import annotations
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from pypdf import PdfReader
from celery.result import AsyncResult

from app.api.schemas import (
    UploadPdfResponse, PdfInfoResponse, ListPdfsResponse, PdfListItem,
    CreateJobRequest, CreateJobResponse, JobStatusResponse
)
from app.services.storage import get_storage, new_id
from app.workers.tasks import generate_lesson_job
from app.core.config import settings

router = APIRouter()
storage = get_storage()

def pdf_key(pdf_id: str) -> str:
    return f"pdfs/{pdf_id}.pdf"

def bundle_key(job_id: str) -> str:
    return f"jobs/{job_id}/bundle.zip"

@router.post("/pdfs", response_model=UploadPdfResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Upload must be a PDF.")

    pid = new_id()
    key = pdf_key(pid)
    await storage.put_stream(key, file.file, content_type="application/pdf")
    return UploadPdfResponse(pdf_id=pid, pdf_key=key)

@router.get("/pdfs/{pdf_id}", response_model=PdfInfoResponse)
async def get_pdf_info(pdf_id: str):
    key = pdf_key(pdf_id)
    if not await storage.exists(key):
        raise HTTPException(status_code=404, detail="PDF not found.")

    path_or_url = await storage.get_path_or_presigned(key)
    # For local storage, read file directly to get num pages.
    if path_or_url.startswith("http"):
        raise HTTPException(status_code=400, detail="PDF info requires local access. Implement S3 temp download if needed.")
    try:
        reader = PdfReader(path_or_url)
        num_pages = len(reader.pages)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read PDF.")
    return PdfInfoResponse(pdf_id=pdf_id, num_pages=num_pages)

@router.get("/pdfs", response_model=ListPdfsResponse)
async def list_pdfs():
    """List all stored PDFs"""
    keys = await storage.list_keys("pdfs/")
    pdfs = []
    for key in keys:
        # Extract pdf_id from key (format: "pdfs/{pdf_id}.pdf")
        if key.startswith("pdfs/") and key.endswith(".pdf"):
            pdf_id = key[5:-4]  # Remove "pdfs/" prefix and ".pdf" suffix
            pdfs.append(PdfListItem(pdf_id=pdf_id, pdf_key=key))
    return ListPdfsResponse(pdfs=pdfs)

@router.post("/jobs", response_model=CreateJobResponse)
async def create_job(req: CreateJobRequest):
    key = pdf_key(req.pdf_id)
    if not await storage.exists(key):
        raise HTTPException(status_code=404, detail="PDF not found.")

    if req.from_page > req.to_page:
        raise HTTPException(status_code=400, detail="from_page must be <= to_page.")

    jid = new_id()

    # enqueue background job
    task = generate_lesson_job.delay(key, req.from_page, req.to_page, jid)

    return CreateJobResponse(
        job_id=task.id,
        status_url=f"{settings.BASE_URL}/api/jobs/{task.id}",
        download_url=f"{settings.BASE_URL}/api/jobs/{task.id}/download",
    )

@router.get("/jobs/{task_id}", response_model=JobStatusResponse)
async def job_status(task_id: str):
    res = AsyncResult(task_id)
    payload = JobStatusResponse(job_id=task_id, state=res.state, result=None, error=None)

    if res.failed():
        payload.error = str(res.result)
    elif res.successful():
        payload.result = res.result
    return payload

@router.get("/jobs/{task_id}/download")
async def download_bundle(task_id: str):
    res = AsyncResult(task_id)
    if not res.successful():
        raise HTTPException(status_code=409, detail="Job not complete yet.")

    result = res.result or {}
    bkey = result.get("bundle_key")
    if not bkey:
        raise HTTPException(status_code=500, detail="No bundle key found for completed job.")

    path_or_url = await storage.get_path_or_presigned(bkey)
    if path_or_url.startswith("http"):
        # For S3 you might want to redirect to presigned URL instead of proxy streaming.
        raise HTTPException(status_code=400, detail="S3 download not implemented in proxy mode. Use redirect/presign.")
    if not os.path.exists(path_or_url):
        raise HTTPException(status_code=404, detail="Bundle not found.")

    def iterfile():
        with open(path_or_url, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk

    return StreamingResponse(
        iterfile(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="lesson-{task_id}.zip"'}
    )
