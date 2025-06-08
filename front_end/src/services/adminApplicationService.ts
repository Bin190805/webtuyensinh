import axiosInstance from "./axiosInstance";

// --- INTERFACES CHO API ---

export interface GetAdminApplicationsParams {
  page: number;
  limit: number;
  search?: string;
  schoolCode?: string;
  majorCode?: string;
  subjectGroup?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminApplicationListItem {
  applicationCode: string;
  fullname: string;
  schoolName: string | null;
  majorName: string | null;
  status: string;
  updatedAt: string;
}

export interface PaginatedAdminApplicationResponse {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
  applications: AdminApplicationListItem[];
}

// <<< THÊM: Export các interface này để component có thể sử dụng >>>
export interface StatusDetail {
    code: string;
    displayName: string;
}

export interface ExtraDocument {
    description: string;
    files: string[];
}

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
    createdAt?: string;
}
// <<< KẾT THÚC PHẦN THÊM >>>


// --- CÁC HÀM GỌI API (ADMIN) ---

export const getAdminApplicationsAPI = async (params: GetAdminApplicationsParams): Promise<PaginatedAdminApplicationResponse> => {
  const res = await axiosInstance.get("/api/v2/application", { params });
  return res.data;
};

export const updateApplicationStatusAPI = async (applicationCode: string, newStatus: 'Đã duyệt' | 'Từ chối') => {
  const res = await axiosInstance.patch(`/api/v2/application/${applicationCode}/status`, {
    status: newStatus
  });
  return res.data;
};

export const getApplicationDetailsByAdminAPI = async (applicationCode: string): Promise<ApplicationDetail> => {
    const res = await axiosInstance.get(`/api/v2/application/${applicationCode}`);
    return res.data;
};
