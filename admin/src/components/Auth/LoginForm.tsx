// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { TextField, Button, Box, Typography, InputAdornment, IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";

const LoginForm: React.FC = () => {
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { password: form.password };
            if (form.identifier.includes("@")) payload.email = form.identifier;
            else payload.phoneNumber = form.identifier;

            const result = await AuthService.login(payload);
            localStorage.setItem("accessToken", result.token);
            localStorage.setItem("role", result.role);
            if (result.role === "Admin") {
                alert(`Đăng nhập thành công! Chào ${result.fullName}`);
                window.location.href = "http://localhost:3000"; 
            } else {
                alert("Tài khoản của bạn không có quyền truy cập trang quản trị.");
                // Xoá token nếu không phải admin
                localStorage.removeItem("accessToken");
                localStorage.removeItem("role");
            }

        } catch (error: any) {
            alert(`Đăng nhập thất bại: ${error.message}`);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: 420, mx: "auto", p: 4, borderRadius: 5, boxShadow: 10, backgroundColor: "#F3EEDC", display: "flex", flexDirection: "column", gap: 3 }}
        >
            <Typography variant="h3" align="center" color="#589092" fontWeight={700}>Đăng Nhập</Typography>

            <TextField
                label="Email hoặc Số điện thoại"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                fullWidth
                required
            />

            <TextField
                label="Mật khẩu"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            <Button type="submit" variant="contained" fullWidth sx={{ backgroundColor: "#589092", "&:hover": { backgroundColor: "#BCD2C9" } }}>Đăng Nhập</Button>

            <Typography variant="body2" align="center">
                <span style={{ color: "#0709025b", cursor: "pointer" }} onClick={() => navigate("/forgot-password")}>Quên mật khẩu?</span>
            </Typography>
        </Box>
    );
};

export default LoginForm;
