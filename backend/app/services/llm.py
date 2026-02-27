"""LLM service for generating lesson scripts from extracted text."""
from openai import OpenAI
from app.core.config import settings


def generate_lesson_script(text: str, from_page: int, to_page: int) -> str:
    """
    Generate a structured lesson script from extracted PDF text using an LLM.
    
    Args:
        text: The extracted text from the PDF pages
        from_page: Starting page number
        to_page: Ending page number
    
    Returns:
        A structured lesson script suitable for audio narration
    """
    if not settings.OPENAI_API_KEY:
        raise ValueError(
            "OPENAI_API_KEY not configured. Please set it in your .env file."
        )
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    user_message = f"""Please transform the following text from pages {from_page}-{to_page} into a structured lesson script suitable for audio narration:

{text}"""
    
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": settings.LLM_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        temperature=0.7,
    )
    
    return response.choices[0].message.content
