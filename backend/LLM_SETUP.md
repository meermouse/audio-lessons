# LLM Integration Guide

## Overview
The audio-lessons backend now integrates with OpenAI's GPT models to transform extracted PDF text into structured lesson scripts suitable for audio narration.

## Configuration

### 1. Install Dependencies
The OpenAI package has been added to `requirements.txt`. Install it with:
```bash
pip install -r requirements.txt
```

### 2. Set Up OpenAI API Key
Add your OpenAI API key to the `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. (Optional) Customize the System Prompt
The default system prompt in `app/core/config.py` structures lessons with:
- An engaging introduction
- Main learning points
- Key definitions and explanations
- Practical examples
- Summary and conclusion

To customize it, edit the `LLM_SYSTEM_PROMPT` in `app/core/config.py` or set `LLM_SYSTEM_PROMPT` in your `.env` file.

### 4. (Optional) Change the Model
The default model is `gpt-4o-mini`. You can change it in `.env`:
```env
OPENAI_MODEL=gpt-4-turbo
```

## How It Works

When `build_lesson_bundle()` is called:
1. PDF text is extracted from the specified pages
2. The text is sent to OpenAI's API along with the system prompt
3. The LLM generates a structured lesson script
4. The script is packaged into a ZIP bundle with metadata

## Files Modified

- **backend/requirements.txt**: Added `openai==1.40.0`
- **backend/app/core/config.py**: Added LLM configuration settings
- **backend/app/services/lesson_builder.py**: Implemented LLM call
- **backend/app/services/llm.py**: New service module for LLM operations
- **backend/.env**: Updated with example LLM configuration

## Error Handling

If `OPENAI_API_KEY` is not configured, the service will raise a `ValueError` with a helpful message.

## Next Steps

- Implement TTS (Text-to-Speech) to generate audio from the lesson script (marked as TODO)
- Consider adding caching to avoid redundant API calls
- Add error handling and retries for API failures
