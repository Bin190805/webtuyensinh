import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
// import các page khác nếu có

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    {/* Route khác ở đây, ví dụ: */}
    {/* <Route path="/register" element={<RegisterPage />} /> */}
    {/* <Route path="/" element={<DashboardPage />} /> */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRoutes;
