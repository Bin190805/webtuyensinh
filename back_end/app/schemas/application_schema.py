# app/schemas/application_schema.py
from pydantic import BaseModel, Field, field_serializer
from typing import List, Optional
from datetime import datetime # <<< THÊM: Import datetime
# Import Enum trạng thái
from .enums import ApplicationStatus

# --- SCHEMAS FOR SUB-DOCUMENTS ---
class ExtraDocumentSchema(BaseModel):
    description: str
    files: List[str]

# --- BASE SCHEMA FOR CREATING APPLICATION ---
class ApplicationSchema(BaseModel):
    # Biến application_code và status thành trường tùy chọn, sẽ được gán ở router
    application_code: Optional[str] = Field(None, alias="applicationCode")
    status: Optional[str] = Field(None) # Trường status giờ đây là tùy chọn

    # Các trường dữ liệu đầy đủ của hồ sơ
    fullname: str
    gender: str
    dob: str
    idNumber: str = Field(..., alias="idNumber")
    province: str
    district: str
    ward: str
    addressDetail: str = Field(..., alias="addressDetail")
    mathScore: float = Field(..., alias="mathScore")
    literatureScore: float = Field(..., alias="literatureScore")
    englishScore: float = Field(..., alias="englishScore")
    physicsScore: Optional[float] = Field(None, alias="physicsScore")
    chemistryScore: Optional[float] = Field(None, alias="chemistryScore")
    biologyScore: Optional[float] = Field(None, alias="biologyScore")
    historyScore: Optional[float] = Field(None, alias="historyScore")
    geographyScore: Optional[float] = Field(None, alias="geographyScore")
    civicEducationScore: Optional[float] = Field(None, alias="civicEducationScore")
    school: str
    major: str
    subjectGroup: str = Field(..., alias="subjectGroup")
    totalScore: float = Field(..., alias="totalScore")
    cccdFront: str = Field(..., alias="cccdFront")
    cccdBack: str = Field(..., alias="cccdBack")
    transcript: List[str]
    priority: Optional[str] = None
    priorityProof: Optional[str] = None
    extraDocuments: Optional[List[ExtraDocumentSchema]] = Field(None, alias="extraDocuments")
    created_at: Optional[datetime] = Field(None, alias="createdAt")

    class Config:
        populate_by_name = True

# --- SCHEMAS FOR API RESPONSES ---
# (Các schema khác như ApplicationListItemSchema, PaginationData,... giữ nguyên)

class ApplicationListItemSchema(BaseModel):
    application_code: str = Field(..., alias="applicationCode")
    school_name: Optional[str] = Field(None, alias="schoolName")
    major_name: Optional[str] = Field(None, alias="majorName")
    status: str
    class Config:
        populate_by_name = True
        
class PaginationData(BaseModel):
    current_page: int = Field(..., alias="currentPage")
    total_pages: int = Field(..., alias="totalPages")
    total_records: int = Field(..., alias="totalRecords")
    limit: int

class PaginatedApplicationResponse(BaseModel):
    pagination: PaginationData
    applications: List[ApplicationListItemSchema]

class StatusDetailSchema(BaseModel):
    code: str
    display_name: str = Field(..., alias="displayName")

class ApplicationDetailSchema(ApplicationSchema):
    school_name: Optional[str] = Field(None, alias="schoolName")
    major_name: Optional[str] = Field(None, alias="majorName")
    status: StatusDetailSchema

class StatusUpdateRequest(BaseModel):
    status: ApplicationStatus