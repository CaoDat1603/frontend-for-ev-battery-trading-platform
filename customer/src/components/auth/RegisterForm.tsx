import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({
    fullName: "",
    identifier: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullName = form.fullName.trim();
    const identifier = form.identifier.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\d{9,11}$/.test(identifier);

    if (!isEmail && !isPhone) {
      setError("Vui lòng nhập đúng định dạng Email hoặc SĐT!");
      return;
    }

    const payload = {
      fullName,
      email: isEmail ? identifier : undefined,
      phoneNumber: isPhone ? identifier : undefined,
      password,
    };

    try {
      setLoading(true);
      const result = await AuthService.register(payload);
      console.log("Register request sent:", result);
      localStorage.setItem("identifier", identifier);

      alert("OTP đã được gửi!");
      navigate("/verify-otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: 420,
        mx: "auto",
        p: 4,
        borderRadius: 5,
        boxShadow: 8,
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Typography variant="h3" align="center" fontWeight={600} color="#041409c6">
        Đăng Ký
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        label="Họ và tên"
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        required
        fullWidth
      />
      <TextField
        label="Email hoặc Số điện thoại"
        name="identifier"
        value={form.identifier}
        onChange={handleChange}
        required
        fullWidth
      />

      <TextField
        label="Mật khẩu"
        name="password"
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={handleChange}
        required
        fullWidth
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

      <TextField
        label="Xác nhận mật khẩu"
        name="confirmPassword"
        type={showConfirm ? "text" : "password"}
        value={form.confirmPassword}
        onChange={handleChange}
        required
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{
          backgroundColor: "#2f7e2ae4",
          "&:hover": { backgroundColor: "#87cc94c6" },
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Gửi mã xác thực"}
      </Button>

      <Typography variant="body2" align="center">
        Đã có tài khoản?{" "}
        <span style={{ color: "#1e67238d", cursor: "pointer" }} onClick={() => navigate("/login")}>
          Đăng nhập
        </span>
      </Typography>
    </Box>
  );
};

export default RegisterForm;
