from passlib.context import CryptContext
from jose import jwt,JWTError
from datetime import datetime, timedelta
from app.core.config import JWT_SECRET
from app.crud.user_crud import get_user_by_username
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def decode_access_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Vui lòng đăng nhập",  # ✅ Đã sửa
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = get_user_by_username(username)
        if not user:
            raise credentials_exception
        user.pop("password_hash", None)
        user.pop("verification_token", None)
        if "_id" in user:
            user["_id"] = str(user["_id"])
        return user
    except JWTError:
        raise credentials_exception

def Auth(required_role=None):
    def auth_dep(current_user=Depends(get_current_user)):
        if required_role and current_user["role"] != required_role:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return auth_dep