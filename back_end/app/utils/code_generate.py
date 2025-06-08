# app/utils/code_generate.py
import uuid

def generate_application_code():
    """
    Tạo một mã hồ sơ duy nhất có định dạng HS-XXXXXXXX.
    Bạn có thể tùy chỉnh logic tạo mã ở đây nếu muốn.
    """
    return f"HS-{uuid.uuid4().hex[:8].upper()}"

