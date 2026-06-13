"""
File Parser Service
Extracts text from PDF, DOCX, and image files.
Uses pypdf (pure-Python, no C compilation) for PDFs.
"""
import io

from pypdf import PdfReader
import docx  # python-docx

from services.gemini_service import extract_text_from_image_with_gemini


async def parse_pdf(file_bytes: bytes) -> tuple[str, int]:
    """
    Extract all text from a PDF using pypdf (pure Python).
    Returns (extracted_text, page_count).
    """
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = len(reader.pages)
    texts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            texts.append(text)
    full_text = "\n".join(texts).strip()
    return full_text, pages


async def parse_docx(file_bytes: bytes) -> tuple[str, int]:
    """
    Extract text from a DOCX file using python-docx.
    Returns (extracted_text, paragraph_count).
    """
    doc = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full_text = "\n".join(paragraphs)
    return full_text, len(paragraphs)


async def parse_image(file_bytes: bytes, mime_type: str) -> tuple[str, int]:
    """
    Extract problem statements from an image using Gemini Vision.
    Returns (extracted_text, 1).
    """
    extracted = await extract_text_from_image_with_gemini(file_bytes, mime_type)
    return extracted, 1


async def parse_file(
    file_bytes: bytes,
    filename: str,
    content_type: str,
) -> dict:
    """
    Route file to the correct parser based on content type.
    Returns structured dict matching the upload API response schema.
    """
    fname_lower = filename.lower()

    if content_type == "application/pdf" or fname_lower.endswith(".pdf"):
        text, pages = await parse_pdf(file_bytes)
        file_type = "pdf"
    elif (
        content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or fname_lower.endswith(".docx")
    ):
        text, pages = await parse_docx(file_bytes)
        file_type = "docx"
    elif content_type.startswith("image/") or fname_lower.endswith(
        (".png", ".jpg", ".jpeg", ".webp")
    ):
        text, pages = await parse_image(file_bytes, content_type or "image/jpeg")
        file_type = "image"
    else:
        raise ValueError(f"Unsupported file type: {content_type}")

    return {
        "extracted_text": text,
        "file_name": filename,
        "file_type": file_type,
        "page_count": pages,
    }
