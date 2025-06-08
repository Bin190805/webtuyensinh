from pydantic import BaseModel

class Subject(BaseModel):
    code: str  # Ví dụ: "CHE105"
    name: str  # Ví dụ: "Chemistry"
    display_name: str  # Ví dụ: "Hóa học"

    class Config:
        orm_mode = True
