// src/routes/UserRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import UserLayout from "../components/Layout/UserLayout";
import DashboardPage from "../pages/user/DashBoardPage";
import ApplicationsPage from "../pages/user/ApplicationPage";
import ResultsPage from "../pages/user/ResultPage";

export default function UserRoutes() {
  return (
    <UserLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </UserLayout>
  );
}
