import axiosInstance from "./axiosInstance";

export const loginAPI = async (username: string, password: string) => {
  const res = await axiosInstance.post("api/v1/auth/login", { username, password });
  return res.data;
};

export const registerAPI = async (data: any) => {
  const res = await axiosInstance.post("api/v1/auth/register", data);
  return res.data;
};

