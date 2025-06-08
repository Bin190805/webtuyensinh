from fastapi import APIRouter, UploadFile, File, HTTPException
import os

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
        raise HTTPException(400, "Invalid file type")
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"file_url": f"/uploads/{file.filename}"}
