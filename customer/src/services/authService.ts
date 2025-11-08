import axiosInstance from "../utils/axios-interceptor";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/auth";

export const AuthService = {

  login: async (data: { email?: string; phoneNumber?: string; password: string }) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);
      localStorage.setItem("accessToken", res.data.token);
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Đăng nhập thất bại");
    }
  },

  refreshToken: async () => {
    try {
      const res = await axiosInstance.post("/auth/refresh-token");
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Refresh token thất bại");
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    window.location.href = "/login";
  },

  register: async (data: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        FullName: data.fullName,
        Email: data.email,
        PhoneNumber: data.phoneNumber,
        Password: data.password,
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Đăng ký thất bại");
    }
  },

  verifyOtp: async (data: { emailOrPhone: string; otp: string }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/verify-register-otp`, {
        EmailOrPhone: data.emailOrPhone,
        OtpCode: data.otp,
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn");
    }
  },

  resendOtp: async (emailOrPhone: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/resend-otp`, {
        EmailOrPhone: emailOrPhone,
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Không thể gửi lại OTP");
    }
  },

  forgotPassword: async (identifier: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/request-reset-password`,
        identifier,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data || "Không thể gửi yêu cầu reset mật khẩu");
    }
  },

  resetPassword: async (data: { tokenOrOtp: string; newPassword: string }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        TokenOrOtp: data.tokenOrOtp,
        NewPassword: data.newPassword,
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data || "Reset password thất bại");
    }
  },
};
