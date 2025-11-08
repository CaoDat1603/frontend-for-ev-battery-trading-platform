import React from 'react';
import { Box } from '@mui/material';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface LayoutMainProps {
    children: React.ReactNode;
    hideHeaderFooter?: boolean; // Tùy chọn để ẩn header/footer (ví dụ login page)
}

const LayoutMain: React.FC<LayoutMainProps> = ({ children, hideHeaderFooter = false }) => {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            {!hideHeaderFooter && (
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        backgroundColor: 'white',
                        boxShadow: 2,
                    }}
                >
                    <Header />
                </Box>
            )}

            {/* Nội dung chính */}
            <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
            </Box>

            {/* Footer */}
            {!hideHeaderFooter && <Footer />}
        </Box>
    );
};

export default LayoutMain;
