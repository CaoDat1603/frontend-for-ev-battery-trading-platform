import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/users";

export const UserService = {
    getProfile: async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            const res = await axios.get(`${API_BASE_URL}/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            return res.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể lấy thông tin người dùng";
            throw new Error(msg);
        }
    },


    updateProfile: async (formData: FormData) => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            const res = await axios.put(`${API_BASE_URL}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            return res.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Cập nhật người dùng thất bại";
            throw new Error(msg);
        }
    },
};
