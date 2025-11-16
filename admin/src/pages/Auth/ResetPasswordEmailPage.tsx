import React from 'react';
import { Box } from '@mui/material';
import ResetPasswordEmailForm from '../../components/auth/ResetPasswordEmailForm';

export const ResetPasswordEmailPage: React.FC = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px - 64px)', // trừ header + footer
            p: 2,
        }}
    >
        <ResetPasswordEmailForm />
    </Box>
);

export default ResetPasswordEmailPage;
