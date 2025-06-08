import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

// Import các layout chính
import UserRoutes from './routes/UserRoutes';
import AdminRoutes from './routes/AdminRoutes';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckEmailPage from './pages/CheckEmailPage';
import VerifyEmailSuccess from './pages/VerifyEmailSuccess';

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <AntdApp>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/check-email" element={<CheckEmailPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailSuccess />} />

            {/* Protected Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <UserRoutes />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
