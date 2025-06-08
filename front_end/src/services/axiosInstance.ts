// src/services/axiosInstance.ts
import axios from "axios";
import { API_USER_BASE_URL } from "../config";

const axiosInstance = axios.create({
  baseURL: API_USER_BASE_URL,
  timeout: 10000, // ms
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor (tuỳ chọn): tự động gắn token cho mọi request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
