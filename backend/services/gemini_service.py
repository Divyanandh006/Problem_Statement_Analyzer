"""
Gemini Service — PSAdvisor AI Engine
Uses google-genai 2.x SDK (google.genai).
"""
import json
import asyncio
from typing import AsyncGenerator

from google import genai
from google.genai import types
from google.genai.errors import APIError

from config import GEMINI_API_KEY, AVAILABLE_MODELS, DEFAULT_MODEL
from prompts import build_system_prompt

# ── Initialise Gemini client ──────────────────────────────────────────────────
client = genai.Client(api_key=GEMINI_API_KEY)


def _get_model_name(model: str) -> str:
    """Validate and return model name, mapping unsupported models and falling back to default."""
    if model == "gemini-1.5-flash":
        return "gemini-flash-lite-latest"
    if model == "gemini-2.0-flash":
        return "gemini-2.5-flash-lite"
    return model if model in AVAILABLE_MODELS else DEFAULT_MODEL


def _is_deep_analysis_request(message: str) -> bool:
    """Heuristic: detect if the user is asking for a deep dive."""
    keywords = [
        "deep dive", "deep analysis", "analyse ps", "analyze ps",
        "full analysis", "deep-dive", "tell me more about ps",
    ]
    return any(kw in message.lower() for kw in keywords)


async def stream_chat_response(
    message: str,
    model: str = DEFAULT_MODEL,
    ps_context: str | None = None,
    filters: dict | None = None,
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream a Gemini response as SSE-compatible chunks.
    Yields strings formatted as 'data: ...\n\n' lines.
    Final yield is 'data: [DONE]\n\n'.
    """
    model_name = _get_model_name(model)
    system_prompt = build_system_prompt(ps_context=ps_context, filters=filters)
    use_grounding = _is_deep_analysis_request(message)

    # Build contents list from history + current message
    contents: list[types.Content] = []
    for msg in (history or []):
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part(text=msg["content"])])
        )
    contents.append(
        types.Content(role="user", parts=[types.Part(text=message)])
    )

    # Build generation config
    config_kwargs: dict = {
        "system_instruction": system_prompt,
        "temperature": 0.7,
        "max_output_tokens": 8192,
    }

    # Add Google Search grounding only for deep analysis (keeps ranking fast)
    if use_grounding:
        config_kwargs["tools"] = [types.Tool(google_search=types.GoogleSearch())]

    gen_config = types.GenerateContentConfig(**config_kwargs)

    try:
        loop = asyncio.get_event_loop()

        def _do_stream(target_model: str, with_tools: bool = True):
            """Collect all chunks synchronously in a thread."""
            results = []
            
            current_config_kwargs = config_kwargs.copy()
            if not with_tools and "tools" in current_config_kwargs:
                del current_config_kwargs["tools"]
                
            active_config = types.GenerateContentConfig(**current_config_kwargs)
            
            for chunk in client.models.generate_content_stream(
                model=target_model,
                contents=contents,
                config=active_config,
            ):
                if chunk.text:
                    results.append(chunk.text)
            return results

        try:
            chunks = await loop.run_in_executor(None, _do_stream, model_name, True)
        except APIError as e:
            # Handle rate limits, service unavailability (503) or missing endpoints gracefully
            if e.code in (503, 429, 404):
                print(f"Model {model_name} failed with {e.code}. Falling back to gemini-2.5-flash-lite.")
                try:
                    chunks = await loop.run_in_executor(None, _do_stream, "gemini-2.5-flash-lite", True)
                except APIError as e2:
                    if e2.code in (503, 429, 404) and use_grounding:
                        # If search grounding fails or causes a 503, try without tools to guarantee success
                        print(f"Fallback model failed with {e2.code}. Retrying without search grounding.")
                        chunks = await loop.run_in_executor(None, _do_stream, "gemini-2.5-flash-lite", False)
                    else:
                        raise e2
            else:
                raise e

        for text in chunks:
            payload = json.dumps({"text": text})
            yield f"data: {payload}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as exc:
        error_payload = json.dumps({"error": str(exc)})
        yield f"data: {error_payload}\n\n"
        yield "data: [DONE]\n\n"


async def extract_text_from_image_with_gemini(image_bytes: bytes, mime_type: str) -> str:
    """
    Use Gemini Vision to extract problem statements from an uploaded image.
    """
    prompt = (
        "Extract all problem statements from this image. "
        "Return them as a clean numbered list (1. ..., 2. ..., etc.). "
        "If the image contains a table or PDF screenshot, extract each row. "
        "Only return the problem statements, no other commentary."
    )

    loop = asyncio.get_event_loop()

    def _do_vision(target_model: str):
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        text_part = types.Part(text=prompt)
        response = client.models.generate_content(
            model=target_model,
            contents=[types.Content(role="user", parts=[image_part, text_part])],
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=4096,
            ),
        )
        return response.text or ""

    try:
        return await loop.run_in_executor(None, _do_vision, "gemini-2.5-flash-lite")
    except APIError as e:
        if e.code in (503, 429, 404):
            print(f"Vision model gemini-2.5-flash-lite failed with {e.code}. Falling back to gemini-flash-lite-latest.")
            try:
                return await loop.run_in_executor(None, _do_vision, "gemini-flash-lite-latest")
            except APIError as e2:
                # If vision fails completely, raise or try without vision fallback
                raise e2
        raise e
