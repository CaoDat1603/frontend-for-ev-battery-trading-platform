import axios from "axios";
import type { RateListResponse, RateResponse } from "../pages/Rate/RateResponse"; // Import RateResponse interface
 // Import RateResponse interface

const API_BASE_URL = "http://localhost:8000/api/rating";

export const RateService = {
    // Nhận userId làm tham số để có thể xem rating của người dùng khác
    getRatingByUserId: async (targetUserId: string | number): Promise<RateListResponse> => {
        try {
            // Sửa kiểu generic của axios.get
            const res = await axios.get<RateListResponse>(`${API_BASE_URL}?userId=${targetUserId}`);
            return res.data; // Trả về toàn bộ object RateListResponse
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể lấy thông tin đánh giá.";
            throw new Error(msg); 
        }
    },
    getRatingByProductId: async (targetProductId: string | number): Promise<RateListResponse> => {
        try {
            // Sửa kiểu generic của axios.get
            const res = await axios.get<RateListResponse>(`${API_BASE_URL}?productId=${targetProductId}`);
            return res.data; // Trả về toàn bộ object RateListResponse
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể lấy thông tin đánh giá.";
            throw new Error(msg); 
        }
    },
    postUserRating: async (ratingData: {
        feedbackId: number | null;
        userId: number;
        rateBy: number;
        score: number;
        comment: string;
    }): Promise<RateResponse> => {
        try {
            // API: POST /api/rating/user/{userId}
            const url = `${API_BASE_URL}/user/${ratingData.userId}`;
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");
            const res = await axios.post<RateResponse>(
                url,
                ratingData,
                {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : "",
                        "Content-Type": "application/json",
                    },
                }
            );
            return res.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể gửi đánh giá.";
            throw new Error(msg);
        }
    },
    postRatingImage: async (rateId: number, imageFiles: File[]): Promise<void> => {
        try {
            // API: POST /api/rating/{rateId}/images
            const url = `${API_BASE_URL}/${rateId}/images`;
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");

            const formData = new FormData();
            imageFiles.forEach((imageFile: File) => {
                formData.append("files", imageFile);
            });
            await axios.post(
                url,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể tải ảnh đánh giá lên.";
            throw new Error(msg);
        }
    },
    postProductRating: async (ratingData: {
        feedbackId: number | null;
        productId: number;
        rateBy: number;
        score: number;
        comment: string;
    }): Promise<RateResponse> => {
        try {
            // APi: POST /api/rating/product/{productId}
            const url = `${API_BASE_URL}/product/${ratingData.productId}`;
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("No access token");
            const res = await axios.post<RateResponse>(
                url,
                ratingData,
                {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : "",
                        "Content-Type": "application/json",
                    },
                }
            );
            return res.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể gửi đánh giá.";
            throw new Error(msg);
        }
    },
};