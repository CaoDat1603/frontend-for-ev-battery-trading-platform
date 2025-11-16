import React, { type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface AuthLayoutProps {
  children: ReactNode; // BẮT BUỘC phải có
}
const LayoutAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <>
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(224, 231, 226, 0) 0%, #589092 100%)',
                p: 0,
            }}
        >
            {/* Cột trái - thương hiệu */}
            <Box
                sx={{
                    flex: 1,
                    display: { xs: 'none', md: 'flex' },
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#0f5e3dff',
                    fontSize: '3rem',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    backgroundImage: 'url(/assets/recycle-bg.svg)',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '50%',
                    backgroundPosition: 'center bottom',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Typography
                    variant="h2"
                    sx={{
                        fontWeight: 800,
                        letterSpacing: '20px',
                    }}
                >
                    ECYCLE
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 2 }}>
                    Welcome to back Admin
                </Typography>
            </Box>

            {/* Cột bên phải form */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    px: { xs: 2, md: 4 },
                    py: { xs: 4, md: 6 },
                }}
            >
                {children}
            </Box>
        </Box>
    </>
);
export default LayoutAuth;