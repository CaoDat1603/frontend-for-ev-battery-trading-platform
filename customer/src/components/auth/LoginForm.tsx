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
      localStorage.setItem("userId", result.userId.toString());
      alert(`Đăng nhập thành công! Chào ${result.fullName}`);
      if (result.role === "Admin") {
      window.location.href = "http://localhost:3000/users";  
    } else {
      window.location.href = "http://localhost:5173/";
    }
      
    } catch (error: any) {
      alert(`Đăng nhập thất bại: ${error.message}`);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: 420, mx: "auto", p: 4, borderRadius: 5, boxShadow: 10, backgroundColor: "white", display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Typography variant="h3" align="center" fontWeight={700}>Đăng Nhập</Typography>

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

      <Button type="submit" variant="contained" fullWidth sx={{ backgroundColor: "#296e35c6", "&:hover": { backgroundColor: "#60e68ac6" } }}>Đăng Nhập</Button>

      <Typography variant="body2" align="center">
        <span style={{ color: "#0c472a8d", cursor: "pointer" }} onClick={() => navigate("/forgot-password")}>Quên mật khẩu?</span>
      </Typography>

      <Typography variant="body2" align="center">
        Chưa có tài khoản?{" "}
        <span style={{ color: "#1d9d5f8d", cursor: "pointer" }} onClick={() => navigate("/register")}>Đăng ký ngay</span>
      </Typography>
    </Box>
  );
};

export default LoginForm;
