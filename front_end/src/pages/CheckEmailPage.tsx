// src/pages/auth/CheckEmailPage.tsx
import React from 'react';
import { Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import "../styles/CheckEmailPage.css";

const { Title, Paragraph } = Typography;

const CheckEmailPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 500, margin: 'auto', paddingTop: 60, textAlign: 'center' }}>
      <Title level={3}>Xác thực email</Title>
      <Paragraph>Chúng tôi đã gửi một email xác nhận tới địa chỉ bạn cung cấp. Vui lòng kiểm tra hộp thư và nhấn vào link xác thực để hoàn tất đăng ký.</Paragraph>
      <Button type="primary" onClick={() => navigate('/auth/login')}>
        Quay lại trang đăng nhập
      </Button>
    </div>
  );
};

export default CheckEmailPage;
