import axiosInstance from "./axiosInstance";

// Lấy thông tin user hiện tại
export const getUserInfoAPI = async () => {
  const res = await axiosInstance.get("/api/v1/auth/me");
  return res.data;
};

// Cập nhật thông tin user
export const updateUserInfoAPI = async (data: any) => {
  const res = await axiosInstance.put("/api/v1/auth/me", data);
  return res.data;
};
