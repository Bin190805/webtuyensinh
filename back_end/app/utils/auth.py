# Import thư viện cần thiết để mã hóa mật khẩu và tạo JWT
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

# Import cấu hình hệ thống
from app.core.config import JWT_SECRET
# Import hàm truy vấn người dùng từ cơ sở dữ liệu
from app.crud.user_crud import get_user_by_username
# Import các module hỗ trợ HTTP và bảo mật từ FastAPI
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Thiết lập thuật toán mã hóa mật khẩu (dùng bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Thuật toán dùng để ký JWT
ALGORITHM = "HS256"
# Thời hạn của access token: 1 ngày
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Cấu hình OAuth2 để lấy token từ endpoint /api/auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Hàm hash mật khẩu trước khi lưu vào DB
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Hàm kiểm tra mật khẩu nhập vào có khớp với hash không
def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

# Hàm tạo access token với dữ liệu được encode và thời gian hết hạn
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    # Nếu không truyền thời gian hết hạn, mặc định là 1 ngày
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})  # thêm trường "exp" cho JWT
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

# Hàm giải mã access token, trả về payload
def decode_access_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])

# Dependency lấy người dùng hiện tại từ token
def get_current_user(token: str = Depends(oauth2_scheme)):
    # Tạo lỗi nếu xác thực thất bại
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Vui lòng đăng nhập",  # Thông báo lỗi
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Giải mã token và lấy username
        payload = decode_access_token(token)
        username: str = payload.get("sub")  # Lấy subject (username) từ token
        if username is None:
            raise credentials_exception
        # Truy vấn người dùng từ DB
        user = get_user_by_username(username)
        if not user:
            raise credentials_exception
        # Xóa thông tin nhạy cảm khỏi user để tránh trả về client
        user.pop("password_hash", None)
        user.pop("verification_token", None)
        if "_id" in user:
            user["_id"] = str(user["_id"])  # Chuyển ObjectId thành string
        return user
    except JWTError:
        # Bắt lỗi JWT (token không hợp lệ, hết hạn, sai chữ ký...)
        raise credentials_exception

# Tạo dependency kiểm tra quyền truy cập
def Auth(required_role=None):
    def auth_dep(current_user=Depends(get_current_user)):
        # Nếu có role yêu cầu, kiểm tra người dùng có role tương ứng không
        if required_role and current_user["role"] != required_role:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return auth_dep
