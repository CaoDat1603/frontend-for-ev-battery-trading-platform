import React from 'react';
import { Box } from '@mui/material';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

export const ForgotPasswordPage: React.FC = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px - 64px)', // trừ header + footer
            p: 2,
    }}
    >
    <ForgotPasswordForm />
    </Box>
);

export default ForgotPasswordPage;
