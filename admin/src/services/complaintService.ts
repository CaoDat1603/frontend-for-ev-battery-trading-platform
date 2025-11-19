import axios from "axios";
import type {
    ComplaintResponse,
    ComplaintCountResponse,
    ComplaintListResponse
} from "../pages/Complaint/ComplaintResponse";

const API_BASE_URL = "http://localhost:8000/api/complaint";

export const ComplaintService = {

    /**
     * 🟢 Tạo complaint (multipart/form-data)
     */
    createComplaint: async (formData: FormData): Promise<{ complaintId: number }> => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            const res = await axios.post<{ complaintId: number }>(
                API_BASE_URL,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể tạo khiếu nại.");
        }
    },

    /**
     * 🟢 Lấy complaint theo ID
     */
    getComplaintById: async (complaintId: number): Promise<ComplaintResponse> => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            const res = await axios.get<ComplaintResponse>(
                `${API_BASE_URL}/${complaintId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể lấy thông tin khiếu nại.");
        }
    },

    /**
     * 🟢 Lấy số lượng complaint liên quan đến user
     */
    getComplaintCountByUser: async (userId: number): Promise<ComplaintCountResponse> => {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await axios.get<ComplaintCountResponse>(
                `${API_BASE_URL}/user/${userId}/count`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể lấy số lượng khiếu nại.");
        }
    },

    /**
     * 🟢 Lấy danh sách complaint theo complaintant
     */
    getByComplaintant: async (userId: number): Promise<ComplaintResponse[]> => {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await axios.get<ComplaintResponse[]>(
                `${API_BASE_URL}/by-complaintant/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể lấy danh sách khiếu nại.");
        }
    },

    // ============================================================
    // 🔥 ADMIN ENDPOINTS
    // ============================================================

    /**
     * 🔵 Admin cập nhật complaint
     */
    updateComplaint: async (complaintId: number, body: any): Promise<void> => {
        try {
            const token = localStorage.getItem("accessToken");

            await axios.put(
                `${API_BASE_URL}/${complaintId}`,
                body,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể cập nhật khiếu nại.");
        }
    },

    /**
     * 🔵 Admin xóa complaint (soft delete)
     */
    deleteComplaint: async (complaintId: number): Promise<void> => {
        try {
            const token = localStorage.getItem("accessToken");

            await axios.delete(
                `${API_BASE_URL}/${complaintId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể xóa khiếu nại.");
        }
    },

    /**
     * 🔵 Admin filter complaint
     */
    filterComplaints: async (params: {
        transactionId?: number;
        complaintantId?: number;
        againstUserId?: number;
        resolvedBy?: number;
        status?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<ComplaintResponse[]> => {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await axios.get<ComplaintResponse[]>(
                `${API_BASE_URL}/filter`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể lọc khiếu nại.");
        }
    },

    /**
     * 🔵 Admin lấy complaint có phân trang
     */
    getComplaintsPaged: async (
        pageNumber: number,
        pageSize: number,
        status?: string,
        userId?: number
    ): Promise<ComplaintListResponse> => {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await axios.get<ComplaintListResponse>(
                `${API_BASE_URL}/paged`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { pageNumber, pageSize, status, userId }
                }
            );
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể lấy danh sách có phân trang.");
        }
    },

    /**
     * 🔵 Admin lấy thống kê complaint
     */
    getComplaintStatistics: async (): Promise<any> => {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await axios.get<any>(
                `${API_BASE_URL}/statistics`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể lấy thống kê khiếu nại.");
        }
    }
};
