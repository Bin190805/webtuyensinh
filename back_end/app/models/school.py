from pydantic import BaseModel
from typing import Optional, List

class MajorInSchool(BaseModel):
    code: str
    name: str
    subject_group_ids: List[str]

class SchoolInDB(BaseModel):
    _id: Optional[str]
    code: str
    name: str
    majors: List[MajorInSchool]
