import React from 'react';
import { Box } from '@mui/material';
import RegisterForm from '../../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px - 64px)', // trừ header + footer
            p: 2,
        }}
    >
        <RegisterForm />
    </Box>
);

export default RegisterPage;
