// src/pages/auth/VerifyEmailSuccess.tsx
import React, { useEffect, useState } from 'react';
import { Typography, Button, Spin, Result } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../services/axiosInstance';
import "../styles/VerifySuccessPage.css";

const VerifyEmailSuccess: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      axios
        .get(`/api/v1/auth/verify-email?token=${token}`)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  if (status === 'loading') return <Spin style={{ marginTop: 100 }} />;

  return (
    <div style={{ marginTop: 60, textAlign: 'center' }}>
      {status === 'success' ? (
        <Result
          status="success"
          title="Xác thực email thành công!"
          subTitle="Bạn có thể đăng nhập vào hệ thống."
          extra={[
            <Button type="primary" onClick={() => navigate('/auth/login')}>
              Đăng nhập
            </Button>,
          ]}
        />
      ) : (
        <Result
          status="error"
          title="Xác thực thất bại"
          subTitle="Link xác thực không hợp lệ hoặc đã được sử dụng."
          extra={[
            <Button onClick={() => navigate('/auth/register')}>Thử lại</Button>,
          ]}
        />
      )}
    </div>
  );
};

export default VerifyEmailSuccess;
