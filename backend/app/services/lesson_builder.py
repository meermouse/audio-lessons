from __future__ import annotations
import io
from app.services.pdf_extract import extract_pages
from app.services.zip_bundle import create_zip_bytes
from app.services.llm import generate_lesson_script

def build_lesson_bundle(pdf_path: str, from_page: int, to_page: int, storage, bundle_key: str) -> str:
    pages = extract_pages(pdf_path, from_page, to_page)

    # Extract and combine text from pages
    combined = "\n\n".join([f"[Page {p.page_number}]\n{p.text}" for p in pages]).strip()
    if not combined:
        combined = "No extractable text found for the selected pages."

    # Call LLM to generate structured lesson script
    lesson_script = generate_lesson_script(combined, from_page, to_page)

    # TODO: call TTS to generate audio (mp3) from lesson_script
    # For now, we just create a bundle with the script text.
    files = {
        "lesson.txt": lesson_script.encode("utf-8"),
        "meta.json": f'{{"from_page":{from_page},"to_page":{to_page}}}'.encode("utf-8"),
    }
    zip_bytes = create_zip_bytes(files)

    # store zip
    import asyncio
    asyncio.get_event_loop().run_until_complete(storage.put_bytes(bundle_key, zip_bytes, content_type="application/zip"))
    return bundle_key
