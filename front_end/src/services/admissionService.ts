import axiosInstance from "./axiosInstance";

// --- INTERFACES CHO DỮ LIỆU HIỂN THỊ UI (snake_case) ---

export interface Major {
    code: string;
    name: string;
    subject_group_ids: string[]; // dùng cho UI form
}

export interface School {
    code: string;
    name: string;
    majors: Major[];
}

// --- INTERFACES CHO DỮ LIỆU GỬI LÊN BACKEND (camelCase) ---

export interface MajorPayload {
    code: string;
    name: string;
    subjectGroupIds: string[];
}

export interface SchoolPayload {
    code: string;
    name: string;
    majors: MajorPayload[];
}

export interface MajorPayload {
    code: string;
    name: string;
    subjectGroupIds: string[];
}

export interface SchoolPayload {
    code: string;
    name: string;
    majors: MajorPayload[];
}

// --- API CALLS ---

export const getAdmissionDataAPI = async (params?: { search?: string }): Promise<School[]> => {
    const res = await axiosInstance.get("/api/v2/schools", { params });
    return res.data;
};

export const createSchoolAPI = async (schoolData: SchoolPayload) => {
    const res = await axiosInstance.post("/api/v2/schools/", schoolData);
    return res.data;
};

export const updateSchoolAPI = async (schoolCode: string, schoolData: Partial<SchoolPayload>) => {
    const res = await axiosInstance.put(`/api/v2/schools/${schoolCode}`, schoolData);
    return res.data;
};

export const deleteSchoolAPI = async (schoolCode: string) => {
    const res = await axiosInstance.delete(`/api/v2/schools/${schoolCode}`);
    return res.data;
};

export const getAllSubjectCombinationsAPI = async (): Promise<{ code: string; name: string }[]> => {
    const res = await axiosInstance.get("/api/v2/schools/subject-combinations");
    return res.data;
};
