# app/routers/admin_statistics_router.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime

from app.database.database import db
from app.schemas.statistics_schema import OverviewStatisticsResponse
from app.utils.auth import Auth 

router = APIRouter()

@router.get("/overview", response_model=OverviewStatisticsResponse, summary="[Admin] Lấy dữ liệu thống kê tổng quan")
async def get_overview_statistics(
    current_user=Depends(Auth("admin")),
    date_from: Optional[str] = Query(None, alias="dateFrom", description="Lọc từ ngày (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, alias="dateTo", description="Lọc đến ngày (YYYY-MM-DD)")
):
    """
    API cung cấp dữ liệu thống kê tổng quan về hồ sơ:
    - Tổng số hồ sơ.
    - Phân loại theo trạng thái.
    - Phân loại theo trường, ngành, và tổ hợp môn.
    Có thể lọc theo một khoảng thời gian.
    """
    try:
        # --- Bước 1: Xây dựng giai đoạn lọc ban đầu ($match) ---
        match_stage = {"school": {"$ne": None}}
        if date_from or date_to:
            match_stage["created_at"] = {}
            if date_from:
                match_stage["created_at"]["$gte"] = datetime.fromisoformat(f"{date_from}T00:00:00")
            if date_to:
                match_stage["updated_at"]["$lte"] = datetime.fromisoformat(f"{date_to}T23:59:59")
        
        # --- Bước 2: Xây dựng pipeline với $facet để chạy các thống kê song song ---
        pipeline = [
            # Áp dụng bộ lọc thời gian ngay từ đầu nếu có
            {"$match": match_stage} if match_stage else {"$match": {}},
            {
                "$facet": {
                    # Thống kê tổng số hồ sơ
                    "totalApplications": [
                        {"$count": "count"}
                    ],
                    # Thống kê theo trạng thái
                    "byStatus": [
                        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}}
                    ],
                    # Thống kê theo trường
                    "bySchool": [
                        {"$group": {"_id": "$school", "count": {"$sum": 1}}},
                        # Join với collection 'schools' để lấy tên đầy đủ
                        {
                            "$lookup": {
                                "from": "schools",
                                "localField": "_id",
                                "foreignField": "code",
                                "as": "schoolDetails"
                            }
                        },
                        # Thêm tên trường vào kết quả
                        {
                            "$addFields": {
                                "name": {"$ifNull": [{"$arrayElemAt": ["$schoolDetails.name", 0]}, "$_id"]}
                            }
                        },
                        {"$project": {"schoolDetails": 0}}, # Bỏ trường thừa
                        {"$sort": {"count": -1}}
                    ],
                    # Thống kê theo ngành
                    "byMajor": [
                        {"$group": {"_id": "$major", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}},
                        {"$limit": 10} # Giới hạn 10 ngành phổ biến nhất
                    ],
                    # Thống kê theo tổ hợp môn
                    "bySubjectGroup": [
                        {"$group": {"_id": "$subjectGroup", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}}
                    ]
                }
            }
        ]

        # Thực thi pipeline
        result = list(db.applications.aggregate(pipeline))

        if not result:
            raise HTTPException(status_code=404, detail="Không có dữ liệu thống kê.")

        # Xử lý kết quả từ $facet
        stats_data = result[0]
        
        # Trích xuất dữ liệu, có xử lý trường hợp mảng rỗng
        total_applications = stats_data["totalApplications"][0]["count"] if stats_data.get("totalApplications") else 0
        
        response_data = {
            "totalApplications": total_applications,
            "byStatus": stats_data.get("byStatus", []),
            "bySchool": stats_data.get("bySchool", []),
            "byMajor": stats_data.get("byMajor", []),
            "bySubjectGroup": stats_data.get("bySubjectGroup", [])
        }
        
        return response_data

    except Exception as e:
        # Ghi lại log lỗi đầy đủ
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi server khi lấy dữ liệu thống kê: {str(e)}")

