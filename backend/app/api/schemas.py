from pydantic import BaseModel, Field

class UploadPdfResponse(BaseModel):
    pdf_id: str
    pdf_key: str

class PdfInfoResponse(BaseModel):
    pdf_id: str
    num_pages: int

class PdfListItem(BaseModel):
    pdf_id: str
    pdf_key: str

class ListPdfsResponse(BaseModel):
    pdfs: list[PdfListItem]

class CreateJobRequest(BaseModel):
    pdf_id: str
    from_page: int = Field(ge=1)
    to_page: int = Field(ge=1)

class CreateJobResponse(BaseModel):
    job_id: str
    status_url: str
    download_url: str

class JobStatusResponse(BaseModel):
    job_id: str
    state: str
    result: dict | None = None
    error: str | None = None
