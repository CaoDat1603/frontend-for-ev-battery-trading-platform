import React from 'react';
import { Box } from '@mui/material';
import LoginForm from '../../components/auth/LoginForm';

export const LoginPage: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 64px - 64px)', // Trừ header + footer (nếu header 64px, footer 64px)
      p: 3,
    }}
  >
    <LoginForm />
  </Box>
);

export default LoginPage;
