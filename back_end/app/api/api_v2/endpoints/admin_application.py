# app/routers/admin_application_router.py
from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo.errors import PyMongoError
import math
from typing import Optional, List
from datetime import datetime
import os

from app.database.database import db
from app.schemas.enums import ApplicationStatus
from app.schemas.application_schema import (
    PaginatedApplicationResponse, 
    ApplicationListItemSchema, 
    PaginationData,
    ApplicationDetailSchema,
    StatusDetailSchema,
    StatusUpdateRequest
)
from app.utils.auth import Auth 
from bson import ObjectId

# Import hàm gửi email từ mailer
from app.utils.mailer import send_application_status_email

router = APIRouter()

# Lấy URL của frontend từ biến môi trường, có giá trị mặc định
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# --- API LẤY DANH SÁCH TOÀN BỘ HỒ SƠ (CHO ADMIN) ---
@router.get("/", response_model=PaginatedApplicationResponse, summary="[Admin] Lấy danh sách tất cả hồ sơ")
async def get_all_applications(
    current_user=Depends(Auth("admin")), 
    page: int = Query(1, ge=1, description="Số trang hiện tại"),
    limit: int = Query(10, ge=1, le=100, description="Số lượng bản ghi trên mỗi trang"),
    search: Optional[str] = Query(None, description="Tìm theo mã hồ sơ hoặc tên thí sinh"),
    schoolCode: Optional[str] = Query(None, description="Lọc theo mã trường"),
    majorCode: Optional[str] = Query(None, description="Lọc theo mã ngành"),
    subjectGroup: Optional[str] = Query(None, description="Lọc theo tổ hợp môn"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    dateFrom: Optional[str] = Query(None, description="Lọc từ ngày (YYYY-MM-DD)"),
    dateTo: Optional[str] = Query(None, description="Lọc đến ngày (YYYY-MM-DD)")
):
    try:
        skip = (page - 1) * limit
        match_stage = {} 

        if search:
            match_stage["$or"] = [
                {"applicationCode": {"$regex": search, "$options": "i"}},
                {"fullname": {"$regex": search, "$options": "i"}}
            ]
        
        if schoolCode: match_stage["school"] = schoolCode
        if majorCode: match_stage["major"] = majorCode
        if subjectGroup: match_stage["subjectGroup"] = subjectGroup
        if status: match_stage["status"] = status
            
        if dateFrom or dateTo:
            match_stage["updated_at"] = {}
            if dateFrom: match_stage["updated_at"]["$gte"] = datetime.fromisoformat(f"{dateFrom}T00:00:00")
            if dateTo: match_stage["updated_at"]["$lte"] = datetime.fromisoformat(f"{dateTo}T23:59:59")

        pipeline = [
            {"$match": match_stage},
            {"$sort": {"updated_at": -1}},
            {"$lookup": {"from": "schools", "localField": "school", "foreignField": "code", "as": "schoolInfo"}},
            {"$unwind": {"path": "$schoolInfo", "preserveNullAndEmptyArrays": True}},
            {"$addFields": {
                "schoolName": "$schoolInfo.name",
                "majorDetails": {"$first": {"$filter": {"input": "$schoolInfo.majors", "as": "m", "cond": {"$eq": ["$$m.code", "$major"]}}}}
            }},
            {"$addFields": {"majorName": "$majorDetails.name"}},
            {"$project": {"schoolInfo": 0, "majorDetails": 0}},
            {"$facet": {
                "metadata": [{"$count": "totalRecords"}],
                "data": [{"$skip": skip}, {"$limit": limit}]
            }}
        ]
        
        result = list(db.applications.aggregate(pipeline))

        if not result or not result[0]["metadata"]:
            return PaginatedApplicationResponse(
                pagination=PaginationData(currentPage=page, totalPages=0, totalRecords=0, limit=limit),
                applications=[]
            )

        total_records = result[0]["metadata"][0]["totalRecords"]
        applications_data = result[0]["data"]
        total_pages = math.ceil(total_records / limit)
        processed_applications = [ApplicationListItemSchema.model_validate(app) for app in applications_data]
        
        return PaginatedApplicationResponse(
            pagination=PaginationData(currentPage=page, totalPages=total_pages, totalRecords=total_records, limit=limit),
            applications=processed_applications
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server không xác định: {str(e)}")

# --- API LẤY CHI TIẾT HỒ SƠ (CHO ADMIN) ---
@router.get("/{application_code}", response_model=ApplicationDetailSchema, summary="[Admin] Lấy chi tiết hồ sơ theo mã")
async def get_application_details_by_admin(application_code: str, current_user=Depends(Auth("admin"))):
    try:
        pipeline = [
            {"$match": {"applicationCode": application_code}},
            {"$limit": 1},
            {"$lookup": {"from": "schools", "localField": "school", "foreignField": "code", "as": "schoolInfo"}},
            {"$unwind": {"path": "$schoolInfo", "preserveNullAndEmptyArrays": True}},
            {"$addFields": {
                "schoolName": "$schoolInfo.name",
                "majorDetails": {"$first": {"$filter": {"input": "$schoolInfo.majors", "as": "m", "cond": {"$eq": ["$$m.code", "$major"]}}}}
            }},
            {"$addFields": {"majorName": "$majorDetails.name"}},
        ]
        
        result = list(db.applications.aggregate(pipeline))
        
        if not result:
            raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại.")
            
        application_doc = result[0]
        
        status_from_db = application_doc.get("status")
        status_enum_member = ApplicationStatus.PENDING
        if status_from_db:
            try:
                status_enum_member = ApplicationStatus[status_from_db]
            except KeyError:
                for member in ApplicationStatus:
                    if member.value == status_from_db:
                        status_enum_member = member
                        break
        
        application_doc["status"] = StatusDetailSchema(
            code=status_enum_member.name,
            displayName=status_enum_member.value
        )
        return ApplicationDetailSchema.model_validate(application_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server không xác định: {str(e)}")

# --- API CẬP NHẬT TRẠNG THÁI HỒ SƠ ---
@router.patch("/{application_code}/status", summary="[Admin] Cập nhật trạng thái hồ sơ")
async def change_application_status(
    application_code: str,
    status_update: StatusUpdateRequest,
    current_user=Depends(Auth("admin"))
):
    try:
        application = db.applications.find_one({"applicationCode": application_code})
        if not application:
            raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại.")

        new_status_enum = status_update.status
        update_data = {
            "$set": {
                "status": new_status_enum.name,
                "updated_at": datetime.utcnow()
            }
        }
        
        result = db.applications.update_one(
            {"applicationCode": application_code},
            update_data
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Trạng thái hồ sơ không thay đổi hoặc đã được cập nhật.")

        # Gửi email thông báo cho người dùng
        try:
            user = db.users.find_one({"_id": application.get("userId")})
            if user and user.get("email"):
                detail_link = f"{FRONTEND_URL}/results"
                send_application_status_email(
                    to_email=user["email"],
                    full_name=user.get("full_name", "Thí sinh"),
                    application_code=application_code,
                    new_status_display=new_status_enum.value,
                    detail_link=detail_link
                )
        except Exception as e:
            print(f"Lỗi khi gửi email thông báo cho hồ sơ {application_code}: {e}")

        return {"message": f"Cập nhật trạng thái hồ sơ {application_code} thành công. {detail_link}"}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server không xác định: {str(e)}")
