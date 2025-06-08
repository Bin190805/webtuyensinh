# app/utils/mailer.py
import smtplib
from email.mime.text import MIMEText
# --- THÊM DÒNG IMPORT NÀY ---
from email.mime.multipart import MIMEMultipart
# -----------------------------
import os

# Lấy thông tin cấu hình từ biến môi trường
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

# --- CÁC HÀM GỬI EMAIL CŨ (Giữ nguyên nếu có) ---

def send_verify_email(to_email: str, verify_link: str):
    subject = "Xác nhận đăng ký tài khoản"
    body = f"Vui lòng xác nhận tài khoản bằng cách click vào link: {verify_link}"
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
      server.starttls()
      server.login(SMTP_USER, SMTP_PASS)
      server.sendmail(SMTP_USER, to_email, msg.as_string())

def send_reset_password_email(to_email: str, reset_link: str):
    subject = "Đặt lại mật khẩu"
    body = f"Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link sau để đổi mật khẩu (có hiệu lực trong 1h): {reset_link}"
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:

      server.starttls()

      server.login(SMTP_USER, SMTP_PASS)

      server.sendmail(SMTP_USER, to_email, msg.as_string())

# --- HÀM GỬI EMAIL THÔNG BÁO TRẠNG THÁI HỒ SƠ ---

def send_application_status_email(
    to_email: str, 
    full_name: str, 
    application_code: str, 
    new_status_display: str, # Ví dụ: "Đã duyệt" hoặc "Từ chối"
    detail_link: str
):
    """
    Gửi email thông báo cho thí sinh khi trạng thái hồ sơ thay đổi.
    """
    subject = f"Thông báo kết quả hồ sơ tuyển sinh mã số {application_code}"
    
    # Mẫu email HTML
    html_body = f"""
    <html>
      <head></head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Xin chào {full_name},</h2>
        <p>Hệ thống tuyển sinh xin thông báo về hồ sơ của bạn:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <td style="padding: 12px; border: 1px solid #ddd;">Mã số hồ sơ</td>
            <td style="padding: 12px; border: 1px solid #ddd;"><b>{application_code}</b></td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Trạng thái mới</td>
            <td style="padding: 12px; border: 1px solid #ddd;"><b>{new_status_display}</b></td>
          </tr>
        </table>
        <p>
          Bạn có thể xem chi tiết hồ sơ của mình bằng cách nhấn vào nút bên dưới:
        </p>
        <p style="text-align: center;">
          <a href="{detail_link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Xem chi tiết hồ sơ
          </a>
        </p>
        <p>Trân trọng,<br>Hội đồng Tuyển sinh</p>
      </body>
    </html>
    """

    # Tạo đối tượng email
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"Hệ thống tuyển sinh <{SMTP_USER}>"
    msg['To'] = to_email
    
    # Đính kèm phần HTML vào email
    msg.attach(MIMEText(html_body, 'html'))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        print(f"Đã gửi email thông báo trạng thái đến {to_email} thành công.")
    except Exception as e:
        print(f"Lỗi khi gửi email đến {to_email}: {e}")

