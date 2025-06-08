import React from 'react';
import { Form, Input, Button, Typography, Card, notification, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axiosInstance';
import '../styles/RegisterPage.css';

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message, notification } = App.useApp();

  const onFinish = async (values: any) => {
    try {
      const res = await axios.post('/api/v1/auth/register', values);
      notification.success({
        message: 'Đăng ký thành công',
        description: res?.data?.msg || 'Vui lòng kiểm tra email để xác thực tài khoản.',
      });
      navigate('/auth/check-email');
    } catch (error: any) {
      notification.error({
        message: 'Lỗi',
        description: error?.response?.data?.detail || error?.message || 'Đăng ký thất bại.',
      });
    }
  };

  return (
    <div className="register-bg">
      <Card className="register-card" bordered={false}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/logo.png"
            alt="logo"
            className="register-logo"
          />
          <Title level={3}>Đăng ký tài khoản</Title>
          <Text type="secondary">Tham gia để bắt đầu đăng ký xét tuyển đại học</Text>
        </div>

        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item name="full_name" label="Họ tên" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}>
            <Input placeholder="nguyenvana123" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: "Email không hợp lệ" }]}>
            <Input placeholder="abc@gmail.com" />
          </Form.Item>

          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
            <Input.Password placeholder="********" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text>Đã có tài khoản? <a href="/login">Đăng nhập</a></Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
