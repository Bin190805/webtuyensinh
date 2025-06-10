import os
from dotenv import load_dotenv

load_dotenv()
## Set up từ file môi trường đây là những thữ nhạy cảm ở file .env mà sẽ kh up lên git 
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET")
