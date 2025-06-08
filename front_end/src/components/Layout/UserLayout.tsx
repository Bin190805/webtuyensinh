import React from "react";
import UserSidebar from "../Sidebar/UserSidebar";
import "../../styles/UserLayout.css"; // Đặt css ở styles cho đồng bộ

const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="user-layout-root">
    <UserSidebar />
    <main className="user-layout-content">{children}</main>
  </div>
);

export default UserLayout;