# app/schemas/school_management_schema.py
from pydantic import BaseModel, Field
from typing import List, Optional

# --- SCHEMAS CHO CÁC API CRUD ---

# Model cho thông tin của một ngành khi tạo/sửa
class MajorSchema(BaseModel):
    code: str
    name: str
    subject_group_ids: List[str] = Field(..., alias="subjectGroupIds")

# Model để tạo một trường mới
class SchoolCreateSchema(BaseModel):
    code: str = Field(..., description="Mã trường, ví dụ: BKHN")
    name: str = Field(..., description="Tên đầy đủ của trường")
    majors: List[MajorSchema] = []

# Model để cập nhật thông tin của trường (tất cả các trường đều là tùy chọn)
class SchoolUpdateSchema(BaseModel):
    name: Optional[str] = None
    majors: Optional[List[MajorSchema]] = None

# --- SCHEMAS CHO API RESPONSE (GET) ---

# Model cho thông tin chi tiết của một tổ hợp môn
class SubjectCombinationDetailSchema(BaseModel):
    code: str
    name: str

# Model cho thông tin chi tiết của một ngành khi trả về
class MajorDetailSchema(BaseModel):
    code: str
    name: str
    subject_combinations: List[SubjectCombinationDetailSchema] = Field(..., alias="subjectCombinations")

# Model cho thông tin chi tiết của một trường khi trả về
class SchoolDetailSchema(BaseModel):
    code: str
    name: str
    majors: List[MajorDetailSchema]

# Response cuối cùng của API lấy danh sách
SchoolManagementResponse = List[SchoolDetailSchema]
