import React from 'react';
import { Box } from '@mui/material';
import VerifyOtpForm from '../../components/auth/VerifyOtpForm';

export const VerifyOtpPage: React.FC = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px - 64px)', // trừ header + footer
            p: 2,
        }}
    >
        <VerifyOtpForm />
    </Box>
);

export default VerifyOtpPage;
