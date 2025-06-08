import React from 'react';
import { Menu, Button } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  SolutionOutlined,
  DatabaseOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import '../../styles/AdminSidebar.css'; // Dùng file CSS riêng cho Admin Sidebar

// Xây dựng menu dựa trên yêu cầu của Admin
const menuItems = [
  {
    key: '/admin/dashboard',
    icon: <DashboardOutlined />,
    label: 'Tổng quan & Thống kê',
    path: '/admin/dashboard',
  },
  {
    key: '/admin/applications',
    icon: <SolutionOutlined />,
    label: 'Quản lý Hồ sơ',
    path: '/admin/applications',
  },
  {
    key: '/admin/admissions-data',
    icon: <DatabaseOutlined />,
    label: 'Dữ liệu Tuyển sinh',
    path: '/admin/admissions-data', // Trang này sẽ chứa tab quản lý Trường, Ngành, Tổ hợp
  },
  // {
  //   key: '/admin/users',
  //   icon: <TeamOutlined />,
  //   label: 'Quản lý Người dùng',
  //   path: '/admin/users',
  // },
  // {
  //   key: '/admin/settings',
  //   icon: <SettingOutlined />,
  //   label: 'Cài đặt hệ thống',
  //   path: '/admin/settings',
  // },
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tìm key của menu cha nếu đang ở route con
  const getSelectedKey = () => {
    const currentPath = location.pathname;
    // Ví dụ: nếu đang ở /admin/applications/detail/123, menu 'Quản lý Hồ sơ' vẫn sẽ sáng
    const parentItem = menuItems.find(item => currentPath.startsWith(item.key));
    return parentItem ? parentItem.key : '';
  };

  const handleLogout = () => {
    // Logic đăng xuất tương tự User
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="sidebar-modern admin-sidebar">
      <div className="sidebar-logo-block">
        <img src="/logo.png" alt="Logo" className="sidebar-logo" />
        <div className="sidebar-title">Admin Dashboard</div>
      </div>
      <Menu
        mode="vertical"
        selectedKeys={[getSelectedKey()]}
        items={menuItems.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: <Link to={item.path}>{item.label}</Link>,
        }))}
        style={{ border: 'none', background: 'transparent' }}
      />
      <Button
        icon={<LogoutOutlined />}
        danger
        className="sidebar-logout-btn"
        onClick={handleLogout}
        style={{
          margin: '32px 12px 0 12px',
          width: 'calc(100% - 24px)',
          fontWeight: 600,
        }}
        block
      >
        Đăng xuất
      </Button>
    </div>
  );
};

export default AdminSidebar;

