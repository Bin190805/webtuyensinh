import type { RcFile } from 'antd/es/upload';

/**
 * Chuyển đổi một đối tượng File hoặc RcFile thành chuỗi Base64.
 * @param file Đối tượng file cần chuyển đổi.
 * @returns Promise chứa chuỗi Base64.
 */
export const fileToBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });