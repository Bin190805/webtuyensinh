import axiosInstance from "./axiosInstance";

// 1. Lấy danh sách tất cả các trường
export const getAllSchoolsAPI = async () => {
  const res = await axiosInstance.get("/api/v1/schools");
  return res.data; // Array of { _id, name, code }
};

// 2. Lấy danh sách chuyên ngành theo mã trường
export const getMajorsBySchoolAPI = async (schoolCode: string) => {
  const res = await axiosInstance.get(`/api/v1/schools/${schoolCode}/majors`);
  return res.data; // Array of { code, name, subject_group_ids }
};

// 3. Lấy thông tin tổ hợp xét tuyển theo mã tổ hợp
export const getSubjectCombinationAPI = async (subjectGroupCode: string) => {
  const res = await axiosInstance.get(`/api/v1/subject-combinations/${subjectGroupCode}`);
  return res.data; // { code, name, subjects: [...] }
};

interface ExtraDocumentPayload {
    description: string;
    files: string[]; // Mảng các chuỗi base64 của file
  }
  
  // Định nghĩa kiểu dữ liệu cho toàn bộ hồ sơ gửi đi
  interface ApplicationPayload {
    fullname: string;
    gender: string;
    dob: string; // Định dạng "DD/MM/YYYY"
    idNumber: string;
    province: string;
    district: string;
    ward: string;
    addressDetail: string;
    mathScore: number;
    literatureScore: number;
    englishScore: number;
    physicsScore?: number;
    chemistryScore?: number;
    biologyScore?: number;
    historyScore?: number;
    geographyScore?: number;
    civicEducationScore?: number;
    school: string;
    major: string;
    subjectGroup: string;
    totalScore: number;
    cccdFront: string;      // Chuỗi base64
    cccdBack: string;       // Chuỗi base64
    transcript: string[];   // Mảng các chuỗi base64
    priority?: string;
    priorityProof?: string;  // Chuỗi base64
    extraDocuments?: ExtraDocumentPayload[];
  }
  
  /**
   * 4. Gửi thông tin hồ sơ ứng tuyển lên server.
   * @param applicationData Dữ liệu hồ sơ đã được xử lý (file đã chuyển thành base64).
   * @returns Dữ liệu trả về từ server sau khi xử lý.
   */
  export const submitApplicationAPI = async (applicationData: ApplicationPayload) => {
    // Endpoint này phải khớp với endpoint bạn định nghĩa trong router của FastAPI
    const res = await axiosInstance.post("/api/v1/application/applications", applicationData);
    return res.data;
  };