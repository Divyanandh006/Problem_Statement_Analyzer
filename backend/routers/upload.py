"""
Upload Router — parse PS files (PDF, DOCX, image) and return extracted text
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from services.file_parser import parse_file
from services.supabase_service import get_user_from_token
from config import MAX_FILE_SIZE_BYTES

router = APIRouter(prefix="/api/upload", tags=["upload"])


def _require_auth(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.removeprefix("Bearer ").strip()
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


@router.post("")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Accept a PS file (PDF / DOCX / image), extract text, return structured response.
    Does NOT store in Supabase Storage — that happens on conversation save.
    """
    user = _require_auth(request)

    # Size check
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed is {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.",
        )

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        result = await parse_file(
            file_bytes=file_bytes,
            filename=file.filename or "upload",
            content_type=file.content_type or "",
        )
    except ValueError as e:
        raise HTTPException(status_code=415, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

    if not result.get("extracted_text", "").strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this file. Try a different format or paste the text directly.",
        )

    return result
