import axiosInstance from "./axiosInstance";

// --- INTERFACES CHO API ---

// Model cho một mục thống kê cơ bản
export interface StatisticItem {
  _id: string; // Tên của mục (ví dụ: "PENDING", "QTKD")
  count: number;
}

// Model cho thống kê theo trường (có thêm tên trường đầy đủ)
export interface SchoolStatisticItem {
  _id: string; // Mã trường
  name: string; // Tên trường
  count: number;
}

// Model cho toàn bộ dữ liệu thống kê trả về từ API
export interface OverviewStatisticsResponse {
  totalApplications: number;
  byStatus: StatisticItem[];
  bySchool: SchoolStatisticItem[];
  byMajor: StatisticItem[];
  bySubjectGroup: StatisticItem[];
}

// --- CÁC HÀM GỌI API (ADMIN) ---

/**
 * [Admin] Lấy dữ liệu thống kê tổng quan cho dashboard.
 * @param dateFrom - Lọc từ ngày (tùy chọn, định dạng yyyy-MM-DD)
 * @param dateTo - Lọc đến ngày (tùy chọn, định dạng yyyy-MM-DD)
 */
export const getOverviewStatisticsAPI = async (
  dateFrom?: string, 
  dateTo?: string
): Promise<OverviewStatisticsResponse> => {
  const params: any = {};
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const res = await axiosInstance.get("/api/v2/statistic/overview", { params });
  return res.data;
};
