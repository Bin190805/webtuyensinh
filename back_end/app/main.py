from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.endpoints import user, file, school, application
from app.api.api_v2.endpoints import admin, admin_application, admin_statistic, school_management

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc ["http://localhost:3000"] nếu muốn hạn chế FE
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả method, hoặc ["GET", "POST", "OPTIONS"] nếu muốn
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(application.router, prefix="/api/v1/application", tags=["application"])
app.include_router(file.router, prefix="/api/v1/file", tags=["file"])
app.include_router(school.router, prefix="/api/v1", tags=["school"])
app.include_router(admin_application.router, prefix="/api/v2/application", tags=["admin_application"])
app.include_router(admin_statistic.router, prefix="/api/v2/statistic", tags=["admin_statistic"])
app.include_router(school_management.router, prefix="/api/v2/schools", tags=["school_management"])

# Serve file static
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
