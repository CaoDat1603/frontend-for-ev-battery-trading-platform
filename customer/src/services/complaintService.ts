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
                `${API_BASE_URL}//${complaintId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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
            if (!token) throw new Error("No access token");

            const res = await axios.get<ComplaintCountResponse>(
                `${API_BASE_URL}/user/${userId}/count`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || "Không thể lấy số lượng khiếu nại.");
        }
    },
    // FILE: ComplaintService
    // ...
    // SỬA: Thay đổi Promise<ComplaintListResponse> thành Promise<ComplaintResponse[]>
    getByComplaintant: async (userId: number): Promise<ComplaintResponse[]> => { 
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            // SỬA: Thay đổi kiểu dữ liệu cho axios.get
            const res = await axios.get<ComplaintResponse[]>( 
                `${API_BASE_URL}/by-complaintant/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            return res.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể lấy danh sách khiếu nại.";
            throw new Error(msg);
        }
    },
};
