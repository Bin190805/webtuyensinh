from pydantic import BaseModel
from typing import Optional, List

class MajorInSchool(BaseModel):
    code: str
    name: str
    subject_group_ids: List[str]   # Liên kết tới code của subject_combination

class SchoolInDB(BaseModel):
    _id: Optional[str]
    code: str
    name: str
    majors: List[MajorInSchool]
