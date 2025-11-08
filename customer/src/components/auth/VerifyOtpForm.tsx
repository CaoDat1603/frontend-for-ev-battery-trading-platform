import React, { useState } from "react";
import { TextField, Button, Box, Typography, Alert } from "@mui/material";
import { AuthService } from "../../services/authService";
import { useNavigate } from "react-router-dom";

const VerifyOtpForm: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Lấy identifier từ localStorage
  const emailOrPhone = (localStorage.getItem("identifier") || "").trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await AuthService.verifyOtp({
        emailOrPhone,
        otp: otp.trim(),
      });

      setMessage(response.message || "Xác thực thành công!");
      localStorage.removeItem("identifier");

      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);

    try {
      await AuthService.resendOtp(emailOrPhone);
      setMessage("OTP mới đã được gửi!");
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
        width: 380,
        mx: "auto",
        p: 4,
        borderRadius: 5,
        boxShadow: 10,
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Typography variant="h5" align="center" color="#296e35c6" fontWeight={600}>
        Nhập mã xác thực
      </Typography>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        label="Mã OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
        fullWidth
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ backgroundColor: "#296e35c6" }}
      >
        {loading ? "Đang xác thực..." : "Xác thực"}
      </Button>

      <Button
        type="button"
        onClick={handleResend}
        variant="text"
        fullWidth
        disabled={loading}
        sx={{ color: "#296e35c6" }}
      >
        Gửi lại mã OTP
      </Button>
    </Box>
  );
};

export default VerifyOtpForm;
