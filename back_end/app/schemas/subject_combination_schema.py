from pydantic import BaseModel
from typing import Optional, List

class SubjectCombinationInDB(BaseModel):
    _id: Optional[str]
    code: str
    name: str
    subjects: List[str]
