// src/constants/applicationStatus.ts

export enum ApplicationStatus {
    PENDING = "pending",    // Chờ duyệt
    APPROVED = "approved",  // Đã duyệt
    REJECTED = "rejected",  // Từ chối
  }
  
  // Map để hiển thị tiếng Việt + màu sắc
  export const applicationStatusMap: Record<ApplicationStatus, { label: string; color: string }> = {
    [ApplicationStatus.PENDING]: { label: "Chờ duyệt", color: "orange" },
    [ApplicationStatus.APPROVED]: { label: "Đã duyệt", color: "green" },
    [ApplicationStatus.REJECTED]: { label: "Từ chối", color: "red" },
  };
  