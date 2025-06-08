import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const userInfoString = localStorage.getItem('user_info');
  const user = userInfoString ? JSON.parse(userInfoString) : null;

  // 1. Kiểm tra đã đăng nhập chưa
  if (!token || !user) {
    // Lưu lại trang muốn truy cập để sau khi đăng nhập có thể quay lại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Kiểm tra có đúng vai trò không
  if (!allowedRoles.includes(user.role)) {
    // Nếu sai vai trò, có thể chuyển về trang 403 (Không có quyền) hoặc trang login
    console.error(`Truy cập bị từ chối: Vai trò '${user.role}' không được phép.`);
    return <Navigate to="/login" replace />; 
  }

  // 3. Nếu mọi thứ đều ổn, cho phép truy cập
  return <>{children}</>;
};

export default ProtectedRoute;
