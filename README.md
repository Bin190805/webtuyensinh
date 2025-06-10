# admission-portal# webtuyensinh
"# codelastweb" 


Dự án gồm hai phần: backend sử dụng FastAPI và frontend sử dụng React. Làm theo các bước sau để chạy được toàn bộ hệ thống trên máy local.

Di chuyển vào thư mục backend:
```bash
cd backend

## Tạo và kích hoạt môi trường ảo 
#### Trên window 
python -m venv venv
venv\Scripts\activate

#### Trên macOS/Linux:
## Cài đặt các thư viện cần thiết:

pip install -r requirements.txt

## Tạo file .env trong thư mục backend và điền nội dung sau:
MONGO_URI="mongodb://localhost:27017/"
DB_NAME="admission_portal"
SECRET_KEY="your_super_secret_key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60

## Cấu hình email
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_gmail_app_password"

## URL của frontend
FRONTEND_URL="http://localhost:3000"

## Chạy server FastAPI:
uvicorn app.main:app --reload
## Tiếp theo, di chuyển vào thư mục frontend:
cd frontend
## Cài đặt các packages:
npm install
## Chạy ứng dụng React:
npm start
## Ứng dụng sẽ chạy tại: http://localhost:3000