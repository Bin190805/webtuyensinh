# app/schemas/enums.py
from enum import Enum

class ApplicationStatus(str, Enum):
    PENDING = "Chờ duyệt"
    APPROVED = "Đã duyệt"
    CANCEL = "Từ chối"