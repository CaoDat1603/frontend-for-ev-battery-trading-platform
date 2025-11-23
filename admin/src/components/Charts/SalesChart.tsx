// src/components/Charts/SalesChart.tsx
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

// Giả định dữ liệu biểu đồ
const mockSalesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 2000 },
    { month: 'Apr', sales: 2780 },
    { month: 'May', sales: 1890 },
    { month: 'Jun', sales: 2390 },
    { month: 'Jul', sales: 3490 },
];

const SalesChart: React.FC = () => {
    const theme = useTheme();

    return (
        <Box sx={{ height: 350, p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Doanh số hàng tháng (USD)
            </Typography>
            
            {/* Đây là vùng placeholder. Thay thế bằng component biểu đồ thực tế */}
            <Box 
                sx={{ 
                    height: 'calc(100% - 30px)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: '4px',
                    bgcolor: theme.palette.action.hover,
                }}
            >
                <Typography variant="body2" color="text.secondary">

                </Typography>
            </Box>
            
            {/* Lưới trục X giả định */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                {mockSalesData.map((d, i) => (
                    <Typography key={i} variant="caption" color="text.secondary">{d.month}</Typography>
                ))}
            </Box>
        </Box>
    );
};

export default SalesChart;