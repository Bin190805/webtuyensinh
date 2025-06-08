from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

class SubjectInDB(BaseModel):
    _id: ObjectId
    code: str  # Ví dụ: "CHE105"
    name: str  # Ví dụ: "Chemistry"
    display_name: str  # Ví dụ: "Hóa học"

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True
