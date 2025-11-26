import axios from "axios";
import type { NotificationResponse } from "../pages/Notification/NotificationResponse";

const API_BASE_URL = "http://localhost:8000/api/notification";

export const NotificationService = {

    /**
     * 🟢 Lấy danh sách thông báo theo User
     */
    getByUser: async (userId: number): Promise<NotificationResponse[]> => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            const res = await axios.get<NotificationResponse[]>(
                `${API_BASE_URL}/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return res.data;
        } catch (err: any) {
            console.log(err.response?.data?.message);
            throw new Error("Không thể tải danh sách thông báo.");
        }
    },

    /**
     * 🟢 Đánh dấu thông báo đã đọc
     */
    markAsRead: async (id: string): Promise<void> => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            await axios.patch(
                `${API_BASE_URL}/${id}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (err: any) {
            console.log(err.response?.data?.message)
            throw new Error("Không thể đánh dấu đã đọc.");
        }
    },

};
