from fastapi import APIRouter, HTTPException, Request, Body, Depends
from app.schemas.user_schema import UserRegister, UserLogin
from app.crud.user_crud import get_user_by_username, get_user_by_email, create_user, update_user_verified, get_user_by_reset_token, reset_user_password, update_user_reset_token
from app.utils.auth import hash_password, verify_password, create_access_token, Auth
from app.utils.mailer import send_verify_email, send_reset_password_email
import secrets
import time
import os

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@router.post("/register")
def register(user: UserRegister, request: Request):
    # Kiểm tra username
    if get_user_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    # Kiểm tra email
    if get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already exists")

    # Sinh verification token
    verification_token = secrets.token_urlsafe(32)
    # Tạo user
    create_user({
        "username": user.username,
        "password_hash": hash_password(user.password),
        "email": user.email,
        "full_name": user.full_name,
        "role": "candidate",
        "isVerified": False,
        "verification_token": verification_token,
    })
    # Gửi mail xác nhận
    verify_link = f"{FRONTEND_URL}/auth/verify-email?token={verification_token}"
    send_verify_email(user.email, verify_link)

    return {"msg": "Đăng ký thành công, vui lòng kiểm tra email để xác nhận tài khoản"}

@router.get("/verify-email")
def verify_email(token: str):
    result = update_user_verified(token)
    if result.modified_count == 1:
        return {"msg": "Xác nhận email thành công, bạn có thể đăng nhập"}
    else:
        raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc đã xác nhận")

@router.post("/login")
def login(user: UserLogin):
    user_db = get_user_by_username(user.username)
    if not user_db:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")
    if not user_db.get("isVerified", False):
        raise HTTPException(status_code=401, detail="Tài khoản chưa xác thực email")
    if not verify_password(user.password, user_db["password_hash"]):
        raise HTTPException(status_code=401, detail="Sai mật khẩu")
    token = create_access_token({"sub": user_db["username"], "role": user_db["role"]})
    return {
        "access_token": token,
        "user": {
            "username": user_db["username"],
            "email": user_db.get("email"),
            "full_name": user_db.get("full_name"),
            "role": user_db.get("role"),
            "isVerified": user_db.get("isVerified", False),
            "avatar": user_db.get("avatar"),
            # Thêm trường nào nữa bạn muốn ở đây
        }
    }


@router.post("/forgot-password")
def forgot_password(email: str = Body(..., embed=True)):
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="Email không tồn tại")

    reset_token = secrets.token_urlsafe(32)
    expired = int(time.time()) + 3600

    update_user_reset_token(email, reset_token, expired)

    reset_link = f"{FRONTEND_URL}/api/auth/reset-password?token={reset_token}"
    send_reset_password_email(email, reset_link)

    return {"msg": "Đã gửi link đặt lại mật khẩu tới email (nếu email tồn tại)"}

@router.post("/reset-password")
def reset_password(token: str = Body(...), new_password: str = Body(...)):
    user = get_user_by_reset_token(token)
    if not user:
        raise HTTPException(status_code=404, detail="Token không hợp lệ")
    if int(time.time()) > user.get("reset_token_expired", 0):
        raise HTTPException(status_code=400, detail="Token đã hết hạn, vui lòng gửi lại yêu cầu")
    reset_user_password(user["email"], hash_password(new_password))
    return {"msg": "Đổi mật khẩu thành công, bạn có thể đăng nhập"}

@router.get("/me")
def get_user_info(current_user: dict = Depends(Auth())):
    user = current_user.copy()
    user.pop("password_hash", None)
    return user


@router.put("/me")
def update_user_info(
    data: dict = Body(...),
    current_user: dict = Depends(Auth())
):
    update_fields = {k: v for k, v in data.items() if k in ["full_name", "phone", "gender", "birthday", "address"]}
    if not update_fields:
        raise HTTPException(status_code=400, detail="Không có trường nào để cập nhật")
    from app.crud.user_crud import update_user_info_by_username
    update_user_info_by_username(current_user["username"], update_fields)
    return {"msg": "Cập nhật thông tin thành công"}

