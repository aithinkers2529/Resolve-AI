import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

router = APIRouter()

# Directory for persisted evidence uploads
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".pdf", ".svg"}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml", "application/pdf"
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.post("/upload")
@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Real image and document upload endpoint.
    Validates file extension, MIME type, and size, saves to disk, and returns the accessible URL.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided or filename is empty."
        )

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed types: JPG, PNG, WEBP, GIF, BMP, PDF."
        )

    # Validate MIME type if available
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES and not any(img_t in content_type for img_t in ["image/", "pdf"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format: {content_type}. Please upload an actual image or document."
        )

    # Generate safe unique filename
    unique_name = f"{uuid.uuid4().hex[:12]}_{os.path.basename(file.filename).replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # Read and save file with size limit check
    try:
        total_size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 64):
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds maximum allowed limit of 15MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )
    finally:
        await file.close()

    file_url = f"/uploads/{unique_name}"
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "filename": unique_name,
            "original_name": file.filename,
            "file_url": file_url,
            "content_type": content_type,
            "size": total_size
        }
    )
