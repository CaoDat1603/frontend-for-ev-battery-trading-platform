import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";

export const ResetPasswordPhoneForm: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await AuthService.resetPassword({
        tokenOrOtp: otp,
        newPassword: password,
      });

      alert("Đặt lại mật khẩu thành công!");
      navigate("/login");
    } catch (err: any) {
      alert(err.message);
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
        Xác Nhận OTP
      </Typography>

      <TextField
        label="Mã OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
      />

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

export default ResetPasswordPhoneForm;
