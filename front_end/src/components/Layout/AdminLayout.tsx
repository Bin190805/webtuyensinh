import React from 'react';
import AdminSidebar from '../Sidebar/AdminSidebar';
import '../../styles/AdminLayout.css'; // Dùng file CSS riêng cho Admin Layout

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="admin-layout-root">
    <AdminSidebar />
    <main className="admin-layout-content">{children}</main>
  </div>
);

export default AdminLayout;

