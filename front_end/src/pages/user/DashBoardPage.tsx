import React, { useState, useEffect } from "react";
import { Card, Descriptions, Tag, Typography, Avatar, Button, App, Spin } from "antd";
import "../../styles/UserDashboardPage.css";
import ProfileUpdateModal from "../../components/Form/ProfileUpdateModal";
import { getUserInfoAPI, updateUserInfoAPI } from "../../services/userService";
import { formatBirthday } from "../../utils/dateUtils";

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { message, notification } = App.useApp();


  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await getUserInfoAPI();
      setUser(res);
    } catch {
      message.error("Không lấy được thông tin người dùng");
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      await updateUserInfoAPI(values);
      message.success("Cập nhật hồ sơ thành công!");
      setModalOpen(false);
      fetchUser(); 
    } catch (err: any) {
      message.error(err?.response?.data?.detail || "Cập nhật thất bại!");
    }
  };

  if (loading || !user) {
    return <Spin size="large" style={{ margin: "40px auto", display: "block" }} />;
  }

  return (
    <div className="dashboard-page">
      <Card className="profile-card" bordered={false}>
        <div className="profile-header">
          <Avatar size={80} src="/profile-default.png" style={{ background: "#285fa8", marginBottom: 16 }} />
          <div>
            <Title level={3} style={{ marginBottom: 2 }}>
              {user.full_name || user.username || "Chưa đặt tên"}
            </Title>
            <Tag color={user.isVerified ? "green" : "red"}>
              {user.isVerified ? "Đã xác thực email" : "Chưa xác thực"}
            </Tag>
          </div>
        </div>
        <Descriptions column={1} size="middle" labelStyle={{ fontWeight: 600, width: 120 }} contentStyle={{ fontWeight: 400 }}>
          <Descriptions.Item label="Tên đăng nhập">{user.username}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Giới tính">{user.gender || "Chưa cập nhật"}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{user.phone || "Chưa cập nhật"}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{user.address || "Chưa cập nhật"}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">{formatBirthday(user.birthday) || "Chưa cập nhật"}</Descriptions.Item>

          <Descriptions.Item label="Vai trò">
            <Tag color="blue">Thí sinh</Tag>
          </Descriptions.Item>
        </Descriptions>
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Button type="primary" onClick={() => setModalOpen(true)}>
            Cập nhật hồ sơ
          </Button>
        </div>
      </Card>
      <ProfileUpdateModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        user={user}
        onSubmit={handleUpdateProfile}
      />
    </div>
  );
};

export default DashboardPage;
