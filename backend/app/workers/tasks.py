from __future__ import annotations
import os

from app.workers.celery_app import celery
from app.services.storage import get_storage
from app.services.lesson_builder import build_lesson_bundle

@celery.task(bind=True)
def generate_lesson_job(self, pdf_key: str, from_page: int, to_page: int, job_id: str):
    storage = get_storage()

    # In local mode, we can access by path. In S3 mode, you can either:
    # (a) presign+download to temp, or (b) stream via boto3 to a temp file.
    # For now we implement: presign+download for S3.
    pdf_ref = self._get_pdf_local_path(storage, pdf_key)

    bundle_key = f"jobs/{job_id}/bundle.zip"
    build_lesson_bundle(pdf_ref, from_page, to_page, storage, bundle_key)

    return {"job_id": job_id, "bundle_key": bundle_key}

def _download_to_temp(url: str, dest_path: str):
    import requests
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

def _ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def _temp_path(job_id: str) -> str:
    return os.path.abspath(f"./tmp/{job_id}.pdf")

def _get_pdf_local_path(storage, pdf_key: str) -> str:
    ref = storage  # duck typing
    path_or_url = __import__("asyncio").get_event_loop().run_until_complete(storage.get_path_or_presigned(pdf_key))
    if path_or_url.startswith("http"):
        dest = _temp_path("download")
        _ensure_dir(dest)
        _download_to_temp(path_or_url, dest)
        return dest
    return path_or_url

# attach helper as attribute to avoid clutter above
generate_lesson_job._get_pdf_local_path = staticmethod(_get_pdf_local_path)
