import axiosInstance from "./axiosInstance";

// --- INTERFACES CHO API DANH SÁCH ---
interface GetApplicationsParams {
  page: number;
  limit: number;
  schoolCode?: string;
  majorCode?: string;
  search?: string; // Tìm kiếm theo applicationCode
  status?: string; // Lọc theo trạng thái
  dateFrom?: string; // Lọc từ ngày (YYYY-MM-DD)
  dateTo?: string;   // Lọc đến ngày (YYYY-MM-DD)
}

interface ApplicationListItem {
  _id: string;
  applicationCode: string;
  schoolName: string | null;
  majorName: string | null;
  status: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export interface PaginatedApplicationResponse {
  pagination: PaginationData;
  applications: ApplicationListItem[];
}

// --- INTERFACES CHO API CHI TIẾT ---

interface StatusDetail {
    code: string;
    displayName: string;
}

interface ExtraDocument {
    description: string;
    files: string[]; // Mảng các chuỗi base64
}

// Định nghĩa cấu trúc chi tiết của một hồ sơ
export interface ApplicationDetail {
    applicationCode: string;
    status: StatusDetail;
    fullname: string;
    gender: string;
    dob: string;
    idNumber: string;
    province: string;
    district: string;
    ward: string;
    addressDetail: string;
    mathScore: number;
    literatureScore: number;
    englishScore: number;
    physicsScore: number | null;
    chemistryScore: number | null;
    biologyScore: number | null;
    historyScore: number | null;
    geographyScore: number | null;
    civicEducationScore: number | null;
    school: string;
    major: string;
    subjectGroup: string;
    totalScore: number;
    cccdFront: string;
    cccdBack: string;
    transcript: string[];
    priority: string | null;
    priorityProof: string | null;
    extraDocuments: ExtraDocument[];
    schoolName: string | null;
    majorName: string | null;
}


// --- CÁC HÀM GỌI API ---

/**
 * Lấy danh sách hồ sơ của người dùng (có phân trang)
 */
export const getUserApplicationsAPI = async (params: GetApplicationsParams): Promise<PaginatedApplicationResponse> => {
  // Sửa lại đường dẫn API cho đúng
  const res = await axiosInstance.get("/api/v1/application/applications", { params });
  return res.data;
};

/**
 * Lấy thông tin chi tiết của một hồ sơ theo mã hồ sơ
 * @param applicationCode - Mã của hồ sơ cần lấy chi tiết
 */
export const getApplicationDetailsAPI = async (applicationCode: string): Promise<ApplicationDetail> => {
    const res = await axiosInstance.get(`/api/v1/application/${applicationCode}`);
    return res.data;
};
