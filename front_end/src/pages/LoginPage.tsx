import React, { useState } from "react";
// Thêm App vào import từ antd
import { Form, Input, Button, Typography, Card, App } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../services/authService";
import "../styles/LoginPage.css";

const { Title, Text } = Typography;

// Component con chứa logic chính để có thể sử dụng hook useApp
const LoginPageContent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Sử dụng hook useApp để lấy message instance có context
  const { message } = App.useApp();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await loginAPI(values.username, values.password);
  
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_info", JSON.stringify(res.user));
  
      // Sử dụng message instance từ hook
      message.success("Đăng nhập thành công!");
  
      setTimeout(() => {
        if (res.user?.role === "admin") {
          navigate("/admin/dashboard"); 
        } else {
          navigate("/dashboard");
        }
      }, 800);
    } catch (err: any) {
      // Sử dụng message instance từ hook
      message.error(err?.response?.data?.detail || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-bg">
      <Card className="login-card" bordered={false}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/logo.png" 
            alt="logo"
            style={{ width: 54, marginBottom: 8 }}
          />
          <Title level={3}>Đăng nhập cổng tuyển sinh</Title>
          <Text type="secondary">Hệ thống đăng ký xét tuyển Đại học trực tuyến</Text>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Tài khoản"
            rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập tên đăng nhập"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center" }}>
          <Text>Bạn chưa có tài khoản? <a href="/auth/register">Đăng ký ngay</a></Text>
        </div>
      </Card>
    </div>
  );
};

// Component cha để bọc LoginPageContent.
// Điều này là cần thiết vì hook useApp phải được gọi bên trong <App> provider
// mà bạn đã cấu hình ở file App.tsx.
const LoginPage: React.FC = () => (
    <LoginPageContent />
);

export default LoginPage;
