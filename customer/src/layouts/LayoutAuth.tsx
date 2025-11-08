import React from 'react';
import { Box, Typography } from '@mui/material';
import { Footer } from '../components/Footer';

const LayoutAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4cea81ff 0%, #86bf84ff 100%)',
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
          color: 'white',
          fontSize: '3rem',
          fontWeight: 800,
          letterSpacing: '2px',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          backgroundImage: 'url(/assets/recycle-bg.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '60%',
          backgroundPosition: 'center bottom',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            letterSpacing: '2px',
          }}
        >
          ECYCLE
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Tái tạo năng lượng – Xanh hoá tương lai 🌱
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
    <Footer />
  </>
);
export default LayoutAuth;