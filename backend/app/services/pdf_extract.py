from __future__ import annotations
from dataclasses import dataclass
from typing import Optional

from pypdf import PdfReader

@dataclass
class ExtractedPage:
    page_number: int
    text: str

def extract_pages_pypdf(pdf_path: str, start_page: int, end_page: int) -> list[ExtractedPage]:
    reader = PdfReader(pdf_path)
    pages = []
    for i in range(start_page - 1, end_page):
        txt = reader.pages[i].extract_text() or ""
        pages.append(ExtractedPage(page_number=i + 1, text=txt))
    return pages

def extract_pages_pymupdf(pdf_path: str, start_page: int, end_page: int) -> list[ExtractedPage]:
    import fitz  # pymupdf
    doc = fitz.open(pdf_path)
    pages = []
    for i in range(start_page - 1, end_page):
        page = doc.load_page(i)
        txt = page.get_text("text") or ""
        pages.append(ExtractedPage(page_number=i + 1, text=txt))
    return pages

def extract_pages(pdf_path: str, start_page: int, end_page: int) -> list[ExtractedPage]:
    # Try pypdf first
    pages = extract_pages_pypdf(pdf_path, start_page, end_page)
    # Heuristic: if “too empty”, fallback to pymupdf
    total = sum(len(p.text.strip()) for p in pages)
    if total < 50:
        pages = extract_pages_pymupdf(pdf_path, start_page, end_page)
    return pages
