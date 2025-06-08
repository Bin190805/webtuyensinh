# app/routers/application_router.py
from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo.errors import PyMongoError # Import để bắt lỗi MongoDB cụ thể hơn
import math # Để tính total_pages
from typing import Optional, List

from app.database.database import db
# Import ApplicationSchema để dùng cho việc tạo hồ sơ (đã có)
# Import các schema mới cho API lấy danh sách
from app.schemas.enums import ApplicationStatus
from app.schemas.application_schema import (
    ApplicationSchema, 
    PaginatedApplicationResponse, 
    ApplicationListItemSchema, 
    PaginationData,
    ApplicationDetailSchema, # <<< Schema mới
    StatusDetailSchema     # <<< Schema mới
)
from datetime import datetime
from app.utils.auth import Auth 
from bson import ObjectId # Để làm việc với _id của MongoDB
from app.utils.code_generate import generate_application_code

router = APIRouter()

# API NỘP HỒ SƠ (Đã cập nhật)
@router.post("/applications", status_code=201, summary="Nộp hồ sơ ứng tuyển")
async def submit_application(application_payload: ApplicationSchema, current_user=Depends(Auth())):
    """
    API để nhận và lưu hồ sơ ứng tuyển từ client.
    - Mã hồ sơ (`applicationCode`) và trạng thái (`status`) được gán ở đây.
    """
    try:
        user_id = current_user["_id"] 
        application_data = application_payload.model_dump(by_alias=True, exclude_unset=True)
        application_data["userId"] = ObjectId(user_id)

        # <<< ĐÂY LÀ PHẦN THÊM THỜI GIAN >>>
        # Lấy thời gian hiện tại theo múi giờ UTC
        now = datetime.utcnow()
        # Gán vào 2 trường created_at và updated_at
        application_data["created_at"] = now
        application_data["updated_at"] = now
        # <<< KẾT THÚC PHẦN THÊM THỜI GIAN >>>
        
        # --- TẠO CODE VÀ GÁN TRẠNG THÁI THỦ CÔNG ---
        application_data["applicationCode"] = generate_application_code()
        application_data["status"] = ApplicationStatus.PENDING.name # Gán mã code "PENDING"
        # ---------------------------------------------
        
        result = db.applications.insert_one(application_data)
        
        return {
            "message": "Hồ sơ của bạn đã được nộp thành công và đang chờ duyệt.",
            "applicationId": str(result.inserted_id),
            "applicationCode": application_data.get("applicationCode"),
            "status": application_data.get("status") 
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phía server khi xử lý hồ sơ: {str(e)}")


# --- API MỚI: LẤY DANH SÁCH HỒ SƠ THEO USERID ---
@router.get("/applications", response_model=PaginatedApplicationResponse, summary="Lấy danh sách hồ sơ của người dùng")
async def get_user_applications(
    current_user=Depends(Auth()),
    page: int = Query(1, ge=1, description="Số trang hiện tại"),
    limit: int = Query(10, ge=1, le=100, description="Số lượng bản ghi trên mỗi trang"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo mã hồ sơ (không phân biệt chữ hoa/thường)"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái (PENDING, APPROVED, CANCEL)"),
    date_from: Optional[str] = Query(None, alias="dateFrom", description="Lọc từ ngày (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, alias="dateTo", description="Lọc đến ngày (YYYY-MM-DD)")
):
    try:
        user_id = current_user["_id"]
        skip = (page - 1) * limit

        # --- Xây dựng pipeline cho Aggregation ---
        match_stage = {"userId": ObjectId(user_id)}
        
        # 1. Thêm tìm kiếm theo applicationCode
        if search:
            match_stage["applicationCode"] = {"$regex": search, "$options": "i"}

        # 2. Thêm lọc theo status
        if status:
            match_stage["status"] = status
            
        # 3. Thêm lọc theo khoảng thời gian (dựa trên trường updated_at)
        # Lưu ý: Cần đảm bảo các document có trường 'updated_at' kiểu datetime
        if date_from or date_to:
            match_stage["updated_at"] = {}
            if date_from:
                try:
                    match_stage["updated_at"]["$gte"] = datetime.fromisoformat(date_from + "T00:00:00")
                except ValueError:
                    raise HTTPException(status_code=400, detail="Định dạng dateFrom không hợp lệ. Vui lòng dùng YYYY-MM-DD.")
            if date_to:
                try:
                    match_stage["updated_at"]["$lte"] = datetime.fromisoformat(date_to + "T23:59:59")
                except ValueError:
                    raise HTTPException(status_code=400, detail="Định dạng dateTo không hợp lệ. Vui lòng dùng YYYY-MM-DD.")

        pipeline = [
            {"$match": match_stage},
            # 4. Sắp xếp theo ngày cập nhật mới nhất
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

# --- API MỚI: LẤY CHI TIẾT HỒ SƠ ---
@router.get("/{application_code}", response_model=ApplicationDetailSchema, summary="Lấy chi tiết hồ sơ theo mã")
async def get_application_details(application_code: str, current_user=Depends(Auth())):
    """
    Lấy toàn bộ thông tin chi tiết của một hồ sơ dựa trên mã hồ sơ (`applicationCode`).
    - Chỉ người dùng tạo hồ sơ mới có quyền xem.
    - Trả về thông tin đầy đủ, bao gồm cả tên trường, tên ngành, và trạng thái chi tiết.
    """
    try:
        user_id = current_user["_id"]

        # Sử dụng aggregation để join dữ liệu hiệu quả
        pipeline = [
            # Bước 1: Tìm đúng hồ sơ theo mã và userId
            {
                "$match": {
                    "applicationCode": application_code,
                    "userId": ObjectId(user_id)
                }
            },
            # Bước 2: Join với collection 'schools'
            {
                "$lookup": {
                    "from": "schools",
                    "localField": "school",
                    "foreignField": "code",
                    "as": "schoolInfo"
                }
            },
            # Bước 3: Mở mảng schoolInfo
            {"$unwind": {"path": "$schoolInfo", "preserveNullAndEmptyArrays": True}},
            # Bước 4: Định hình lại dữ liệu và tìm tên ngành
            {
                "$addFields": {
                    "schoolName": "$schoolInfo.name",
                    # Tìm object major khớp với mã ngành trong hồ sơ
                    "majorDetails": {
                        "$first": {
                            "$filter": {
                                "input": "$schoolInfo.majors",
                                "as": "major",
                                "cond": {"$eq": ["$$major.code", "$major"]}
                            }
                        }
                    }
                }
            },
            # Bước 5: Lấy tên ngành từ object majorDetails
            {
                "$addFields": {
                    "majorName": "$majorDetails.name"
                }
            },
        ]
        
        result = list(db.applications.aggregate(pipeline))
        
        # Nếu không tìm thấy kết quả, trả về lỗi 404
        if not result:
            raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại hoặc bạn không có quyền truy cập.")
            
        application_doc = result[0]
        
        # Xử lý trạng thái để trả về object chi tiết
        from app.schemas.enums import ApplicationStatus
        status_code = application_doc.get("status", "PENDING")
        status_enum = ApplicationStatus[status_code] # Lấy Enum member từ mã code
        
        application_doc["status"] = StatusDetailSchema(
            code=status_enum.name, # PENDING, APPROVED, REJECTED
            displayName=status_enum.value # Chờ duyệt, Đã duyệt, Từ chối
        )

        # Trả về dữ liệu đã được Pydantic model validate
        return ApplicationDetailSchema(**application_doc)

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cơ sở dữ liệu khi lấy chi tiết hồ sơ: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server không xác định: {str(e)}")