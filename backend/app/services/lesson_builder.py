from __future__ import annotations
import io
from app.services.pdf_extract import extract_pages
from app.services.zip_bundle import create_zip_bytes

def build_lesson_bundle(pdf_path: str, from_page: int, to_page: int, storage, bundle_key: str) -> str:
    pages = extract_pages(pdf_path, from_page, to_page)

    # Placeholder "lesson"
    combined = "\n\n".join([f"[Page {p.page_number}]\n{p.text}" for p in pages]).strip()
    if not combined:
        combined = "No extractable text found for the selected pages."

    # TODO: call your LLM to turn this into a structured lesson script
    lesson_script = f"Lesson for pages {from_page}-{to_page}\n\n{combined[:6000]}"

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
