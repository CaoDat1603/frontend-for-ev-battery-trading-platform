import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography } from "@mui/material";
import { AuthService } from "../../services/authService";

export const ResetPasswordEmailForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("Token không hợp lệ hoặc đã hết hạn.");
      return;
    }

    try {
      await AuthService.resetPassword({
        tokenOrOtp: token,
        newPassword: password
      });

      alert("✅ Mật khẩu đã được cập nhật thành công!");
      navigate("/login");
    } catch (error: any) {
      alert(error.message);
    }
  };


  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: 400,
        mx: "auto",
        mt: 8,
        p: 4,
        borderRadius: 5,
        boxShadow: 10,
        backgroundColor: "#F3EEDC",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Typography variant="h5" align="center" color="#589092" fontWeight={600}>
        Đặt Lại Mật Khẩu
      </Typography>

      <TextField
        label="Mật khẩu mới"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" variant="contained" sx={{ backgroundColor: "#589092" }}>
        Xác Nhận
      </Button>
    </Box>
  );
};

export default ResetPasswordEmailForm;
