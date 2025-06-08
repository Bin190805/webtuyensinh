import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/Layout/AdminLayout';

// Import các trang của Admin
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminApplicationsPage from '../pages/admin/AdminApplicationPage';
import AdmissionDataPage from '../pages/admin/AdmissionDataPage';
// import AdminStatisticsPage from '../pages/admin/AdminStatisticsPage';

const AdminRoutes: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        {/* Khi vào /admin, mặc định chuyển đến /admin/dashboard */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="admissions-data" element={<AdmissionDataPage />} />
        {/* <Route path="statistics" element={<AdminStatisticsPage />} /> */}

        {/* Thêm các route admin khác ở đây */}
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
