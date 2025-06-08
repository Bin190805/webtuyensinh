from pydantic import BaseModel
from typing import Optional

class UserInDB(BaseModel):
    _id: Optional[str]
    username: str
    password_hash: str
    email: str
    full_name: str
    role: str = "candidate"
    phone: Optional[str]
    gender: Optional[str]
    birthday: Optional[str]
    address: Optional[str]     
    isVerified: bool = False
    verification_token: Optional[str] = None
