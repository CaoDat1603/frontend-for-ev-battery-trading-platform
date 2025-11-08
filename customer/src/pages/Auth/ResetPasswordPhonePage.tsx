import React from 'react';
import { Box } from '@mui/material';
import ResetPasswordPhoneForm from '../../components/auth/ResetPasswordPhoneForm';

export const ResetPasswordPhonePage: React.FC = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px - 64px)', // trừ header + footer
            p: 2,
        }}
    >
        <ResetPasswordPhoneForm />
    </Box>
);

export default ResetPasswordPhonePage;
