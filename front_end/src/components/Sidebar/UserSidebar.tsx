import { Menu, Button } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import "../../styles/UserSidebar.css";

const menuItems = [
  {
    key: "/dashboard",
    icon: <UserOutlined />,
    label: "Trang chủ",
    path: "/dashboard",
  },
  {
    key: "/applications",
    icon: <FileTextOutlined />,
    label: "Nộp hồ sơ",
    path: "/applications",
  },
  {
    key: "/results",
    icon: <CheckCircleOutlined />,
    label: "Kết quả",
    path: "/results",
  },
];

const UserSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xóa localStorage/cache user/token
    localStorage.clear();
    // Nếu dùng sessionStorage thì sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="sidebar-modern">
      <div className="sidebar-logo-block">
        <img src="../logo.png" alt="Logo" className="sidebar-logo" />
        <div className="sidebar-title">Tuyển Sinh Đại Học</div>
      </div>
      <Menu
        mode="vertical"
        selectedKeys={[location.pathname]}
        items={menuItems.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: <Link to={item.path}>{item.label}</Link>,
        }))}
        style={{ border: "none", background: "transparent" }}
      />
      {/* Nút logout */}
      <Button
        icon={<LogoutOutlined />}
        danger
        className="sidebar-logout-btn"
        onClick={handleLogout}
        style={{
          margin: "32px 12px 0 12px",
          width: "90%",
          fontWeight: 600,
        }}
        block
      >
        Đăng xuất
      </Button>
    </div>
  );
};

export default UserSidebar;
