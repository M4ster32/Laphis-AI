from fastapi import APIRouter, UploadFile, File
from pathlib import Path
import uuid
import fitz  # PyMuPDF

router = APIRouter()

UPLOAD_DIR = Path("src/uploads")  # como estás a usar agora
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    doc_id = str(uuid.uuid4())

    saved_path = UPLOAD_DIR / f"{doc_id}{ext}"
    text_path = UPLOAD_DIR / f"{doc_id}.txt"

    content = await file.read()
    saved_path.write_bytes(content)

    extracted_text = ""
    if ext == ".pdf":
        pdf = fitz.open(saved_path)
        extracted_text = "\n".join(page.get_text() for page in pdf)
        pdf.close()
        text_path.write_text(extracted_text, encoding="utf-8")

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "saved_as": str(saved_path),
        "text_saved_as": str(text_path) if extracted_text else None,
        "chars_extracted": len(extracted_text)
    }