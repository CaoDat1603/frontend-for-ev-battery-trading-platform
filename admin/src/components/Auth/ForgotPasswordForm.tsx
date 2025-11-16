import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";

const ForgotPasswordForm: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      alert("Vui lòng nhập email hoặc số điện thoại");
      return;
    }

    try {
      const ok = await AuthService.forgotPassword(identifier);

      if (!ok) {
        alert("Không tìm thấy tài khoản!");
        return;
      }

      if (identifier.includes("@")) {
        // Email → nhận link
        alert("Hãy kiểm tra email của bạn để đặt lại mật khẩu.");
      } else {
        // Phone → chuyển sang OTP reset
        alert("Đã gửi OTP qua SMS.");
        localStorage.setItem("resetIdentifier", identifier);
        navigate("/reset-password-phone");
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: 380, mx: "auto", p: 4, borderRadius: 5, boxShadow: 10, backgroundColor: "#F3EEDC", gap: 3, display: "flex", flexDirection: "column" }}>
      <Typography variant="h5" align="center" color="#589092" fontWeight={600}>
        Quên mật khẩu
      </Typography>

      <TextField label="Email hoặc Số điện thoại" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />

      <Button type="submit" variant="contained" fullWidth sx={{ backgroundColor: "#589092" }}>
        Gửi yêu cầu
      </Button>
      <Button
        variant="text"
        onClick={() => navigate(-1)}
        sx={{
          color: "#1516165e",
          textTransform: "none",  //không in hoa
          alignSelf: "flex-start", //sát bên trái
          paddingLeft: 2,          //sát mép hơn
        }}
      >
        ← Quay lại
      </Button>

    </Box>
  );
};

export default ForgotPasswordForm;
