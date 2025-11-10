import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface LayoutMainProps {
    children: React.ReactNode;
    hideHeaderFooter?: boolean;
}

const LayoutMain: React.FC<LayoutMainProps> = ({ children, hideHeaderFooter = false }) => {
    
    const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

    const handleHeaderSearch = (searchTerm: string) => {
        setGlobalSearchTerm(searchTerm);
    };
    
    // 🚨 PHẦN CẦN THAY ĐỔI: Sử dụng type assertion (ép kiểu) cho React.cloneElement
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // Ép kiểu cho child để TypeScript chấp nhận các props bổ sung.
            // Sử dụng "as { props: any }" để làm cho cloneElement linh hoạt hơn
            const element = child as React.ReactElement<any>; 
            
            return React.cloneElement(element, { 
                // 🚨 Thêm key: globalSearchTerm để đảm bảo React thấy sự thay đổi, 
                // mặc dù key này không được truyền thành prop.
                key: 'category-page-search-' + globalSearchTerm, 
                
                // 🚨 Props cần truyền xuống
                globalSearchTerm: globalSearchTerm, 
                onHeaderSearch: handleHeaderSearch
            });
        }
        return child;
    });

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
                    {/* TRUYỀN HÀM XỬ LÝ SEARCH XUỐNG HEADER */}
                    <Header onSearch={handleHeaderSearch} />
                </Box>
            )}

            {/* Nội dung chính */}
            <Box component="main" sx={{ flexGrow: 1 }}>
                {childrenWithProps}
            </Box>

            {/* Footer */}
            {!hideHeaderFooter && <Footer />}
        </Box>
    );
};

export default LayoutMain;