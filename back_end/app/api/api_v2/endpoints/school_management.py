# app/routers/admin_school_router.py
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List

from app.database.database import db
from app.schemas.school_management_schema import (
    SchoolManagementResponse, SchoolDetailSchema, MajorDetailSchema, SubjectCombinationDetailSchema,
    SchoolCreateSchema, SchoolUpdateSchema
)
from app.utils.auth import Auth 

router = APIRouter()

@router.get("/", summary="[Admin] Lấy toàn bộ dữ liệu tuyển sinh (thô)")
async def get_full_admissions_data(
    search: str = Query("", description="Tìm theo mã hoặc tên trường"),
    current_user=Depends(Auth("admin"))
):
    """
    Lấy danh sách trường học từ MongoDB, không xử lý đầu ra (đúng như lưu trong DB).
    Có thể truyền `search` để lọc theo mã hoặc tên trường.
    """
    try:
        query_filter = {}
        if search:
            query_filter = {
                "$or": [
                    {"code": {"$regex": search, "$options": "i"}},
                    {"name": {"$regex": search, "$options": "i"}},
                ]
            }

        schools = list(db.schools.find(query_filter, {"_id": 0}))
        return schools
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")


# --- API THÊM TRƯỜNG MỚI (CREATE) ---
@router.post("/", response_model=SchoolDetailSchema, status_code=status.HTTP_201_CREATED, summary="[Admin] Tạo trường học mới")
async def create_school(school_data: SchoolCreateSchema, current_user=Depends(Auth("admin"))):
    """
    Tạo một trường học mới trong cơ sở dữ liệu.
    - `code`: Mã trường phải là duy nhất.
    """
    # Kiểm tra xem mã trường đã tồn tại chưa
    if db.schools.find_one({"code": school_data.code}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã trường '{school_data.code}' đã tồn tại."
        )
    
    # Chuyển đổi Pydantic model thành dict để lưu vào DB
    new_school_dict = school_data.model_dump(by_alias=True)
    
    try:
        db.schools.insert_one(new_school_dict)
        school_dict = school_data.model_dump()
        school_dict.pop("majors", None)

        created_majors = [
            MajorDetailSchema(subjectCombinations=[], **major.model_dump())
            for major in school_data.majors
        ]

        return SchoolDetailSchema(
            **school_dict,
            majors=created_majors
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo trường mới: {str(e)}")

# --- API CẬP NHẬT TRƯỜNG (UPDATE) ---
@router.put("/{school_code}", response_model=SchoolUpdateSchema, summary="[Admin] Cập nhật thông tin trường học")
async def update_school(school_code: str, school_update: SchoolUpdateSchema, current_user=Depends(Auth("admin"))):
    """
    Cập nhật thông tin của một trường học dựa trên mã trường.
    - Chỉ các trường được cung cấp trong request body mới được cập nhật.
    """
    # Tạo dict chỉ chứa các trường được gửi lên
    update_data = school_update.model_dump(exclude_unset=True, by_alias=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có dữ liệu nào được cung cấp để cập nhật."
        )

    try:
        result = db.schools.update_one(
            {"code": school_code},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy trường có mã '{school_code}'."
            )
            
        return school_update

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật trường: {str(e)}")

# --- API XÓA TRƯỜNG (DELETE) ---
@router.delete("/{school_code}", status_code=status.HTTP_204_NO_CONTENT, summary="[Admin] Xóa trường học")
async def delete_school(school_code: str, current_user=Depends(Auth("admin"))):
    """
    Xóa một trường học khỏi cơ sở dữ liệu dựa trên mã trường.
    """
    try:
        result = db.schools.delete_one({"code": school_code})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy trường có mã '{school_code}' để xóa."
            )
        
        # Trả về response không có nội dung khi xóa thành công
        return

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa trường: {str(e)}")

@router.get("/subject-combinations", response_model=List[SubjectCombinationDetailSchema], summary="[Admin] Lấy danh sách tất cả tổ hợp môn")
async def get_all_subject_combinations(current_user=Depends(Auth("admin"))):
    """
    Lấy danh sách tất cả các tổ hợp môn để sử dụng trong các form, dropdown.
    """
    try:
        combinations_cursor = db.subject_combination.find({}, {"_id": 0})
        return list(combinations_cursor)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server khi lấy danh sách tổ hợp môn: {str(e)}")