# app/schemas/statistics_schema.py
from pydantic import BaseModel, Field
from typing import List, Optional, Union

# Model cho một mục thống kê (ví dụ: một trạng thái và số lượng)
class StatisticItem(BaseModel):
    id: Union[str, int, None] = Field(..., alias="_id")
    count: int

# Model cho thống kê theo trường (có thêm tên trường đầy đủ)
class SchoolStatisticItem(BaseModel):
    id: str = Field(..., alias="_id") # Mã trường
    name: str # Tên trường
    count: int

# Model cho toàn bộ dữ liệu thống kê tổng quan
class OverviewStatisticsResponse(BaseModel):
    total_applications: int = Field(..., alias="totalApplications")
    by_status: List[StatisticItem] = Field(..., alias="byStatus")
    by_school: List[SchoolStatisticItem] = Field(..., alias="bySchool")
    by_major: List[StatisticItem] = Field(..., alias="byMajor")
    by_subject_group: List[StatisticItem] = Field(..., alias="bySubjectGroup")

    class Config:
        populate_by_name = True
