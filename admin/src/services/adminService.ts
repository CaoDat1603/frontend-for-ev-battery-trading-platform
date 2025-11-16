import axios from "../utils/axios-interceptor";
import type { ProfileStatus} from "../types/enum";
import type { CreateUserDto } from "../types/dto";

const BASE_URL = "http://localhost:8000/api/admin";

export const AdminService = {
    
    // Lấy user theo Id
    async getUserById(userId: number) {
        const res = await axios.get(`${BASE_URL}`, {
            params: { userId },
        });
        return res.data;
    },

    // Lọc danh sách user theo trạng thái xác minh
    async getUsersByStatus(status: ProfileStatus) {
        const res = await axios.get(`${BASE_URL}/users`, {
            params: { status },
        });
        return res.data;
    },

// Trong AdminService
// ...

// Tìm kiếm user theo tên / email / sđt
async searchUsers(
    q: string,
    userStatus: string,
    profileStatus: string,
    role: string,
    createdAt: string, 
    take: number = 50,
    page: number = 1
) {
    const res = await axios.get(`${BASE_URL}/users/search`, {
        params: { q, userStatus, profileStatus, role, createdAt, take, page },
    });
    
    // In kết quả tìm kiếm ra console
    console.log("--- searchUsers Result ---");
    console.log(`Query: q='${q}', status='${userStatus}', page=${page}, take=${take}`);
    console.log("Fetched Users Array:", res.data); // In mảng dữ liệu
    console.log("--------------------------");
    
    return res.data;
},

// Đếm user theo tên / email / sđt
async countUsers(
    q: string,
    userStatus: string,
    profileStatus: string,
    role: string,
    createdAt: string
) {
    const res = await axios.get(`${BASE_URL}/users/count`, {
        params: { q, userStatus, profileStatus, role, createdAt },
    });

    // In kết quả đếm ra console
    console.log("--- countUsers Result ---");
    console.log(`Query: q='${q}', status='${userStatus}'`);
    console.log("Total Count:", res.data); // In số lượng
    console.log("-------------------------");
    
    return res.data;
},

    // Tạo user mới (multipart/form-data)
    async createUser(data: CreateUserDto) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) formData.append(key, value as any);
        });
        const res = await axios.post(`${BASE_URL}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    // Xác minh user
    async verifyUser(id: number) {
        const res = await axios.post(`${BASE_URL}/${id}/verify`);
        return res.data;
    },

    // Từ chối user (kèm lý do)
    async rejectUser(id: number, reason?: string) {
        const res = await axios.post(`${BASE_URL}/${id}/reject`, null, {
            params: { reason },
        });
        return res.data;
    },

    // Vô hiệu hóa user
    async disableUser(id: number) {
        const res = await axios.post(`${BASE_URL}/${id}/disable`);
        return res.data;
    },

    // Kích hoạt lại user
    async enableUser(id: number) {
        const res = await axios.post(`${BASE_URL}/${id}/enable`);
        return res.data;
    },

    // Xóa mềm user
    async deleteUser(id: number) {
        const res = await axios.delete(`${BASE_URL}/${id}`);
        return res.data;
    },
};
