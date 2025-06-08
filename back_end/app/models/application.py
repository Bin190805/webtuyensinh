# app/models/application.py
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId

# ----------------- SCHEMAS FOR SUB-DOCUMENTS (as stored in DB) -----------------

# Cấu trúc của một tài liệu bổ sung khi được lưu trong DB
# Pydantic sẽ dump ExtraDocumentSchema thành một dict
class ExtraDocumentDB(BaseModel):
    description: str
    files: List[str]

# ----------------- MAIN DATABASE MODEL -----------------

# Model này mô tả cấu trúc của một document trong collection 'applications'
class ApplicationDBModel(BaseModel):
    id: ObjectId = Field(..., alias="_id")
    userId: ObjectId # Trường này được thêm vào bởi API trước khi lưu

    # Các trường được tự động tạo bởi ApplicationSchema
    applicationCode: str
    status: str # Sẽ là mã code "PENDING", "APPROVED", "CANCEL"

    # Các trường thông tin cá nhân và điểm số
    fullname: str
    gender: str
    dob: str
    idNumber: str
    province: str
    district: str
    ward: str
    addressDetail: str
    mathScore: float
    literatureScore: float
    englishScore: float
    physicsScore: Optional[float] = None
    chemistryScore: Optional[float] = None
    biologyScore: Optional[float] = None
    historyScore: Optional[float] = None
    geographyScore: Optional[float] = None
    civicEducationScore: Optional[float] = None
    
    # Các trường nguyện vọng
    school: str
    major: str
    subjectGroup: str
    totalScore: float
    
    # Các trường tài liệu (đã được chuyển thành chuỗi base64)
    cccdFront: str
    cccdBack: str
    transcript: List[str]
    
    # Các trường ưu tiên và tài liệu bổ sung
    priority: Optional[str] = None
    priorityProof: Optional[str] = None
    extraDocuments: Optional[List[ExtraDocumentDB]] = None

    class Config:
        populate_by_name = True # Cho phép dùng alias (_id)
        arbitrary_types_allowed = True # Cho phép sử dụng kiểu ObjectId
