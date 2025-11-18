// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Divider, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemAvatar, 
    Avatar, 
    useTheme, 
    Stack,
    Alert,
    CircularProgress,
} from '@mui/material';
import { MetricCard } from '../components/Cards/MetricCard';
import SalesChart from '../components/Charts/SalesChart'; 
import MessageIcon from '@mui/icons-material/Message';
import GroupIcon from '@mui/icons-material/Group';

import { OrderService, type Transaction } from '../services/orderService';
import { getProductsForModeration, type ProductData } from '../services/productService';

interface MetricCardData {
    title: string;
    value: string;
    subValue?: string;
    comparisonPercentage: number;
    comparisonPeriod: string;
    chartColor: string;
}

interface TopSellingItem {
    productId: number;
    name: string;
    sales: number;
    image?: string | null;
}

const formatCurrencyVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
    }).format(amount);
};

const isSuccessfulTransaction = (tx: Transaction): boolean => {
    const status = (tx.transactionStatus || '').toLowerCase();
    return (
        status.includes('success') ||
        status.includes('completed') ||
        status.includes('paid')
    );
};

const isPendingTransaction = (tx: Transaction): boolean => {
    const status = (tx.transactionStatus || '').toLowerCase();
    return (
        status.includes('pending') ||
        status.includes('created') ||
        status.includes('processing')
    );
};

const DashboardPage: React.FC = () => {
    const theme = useTheme();
    const userName = 'Admin';

    const [metrics, setMetrics] = useState<MetricCardData[]>([]);
    const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [transactions, products] = await Promise.all([
                    OrderService.getAllTransactions(),
                    getProductsForModeration(
                        'All',   // status
                        '',      // searchTerm
                        null,    // filterDate
                        null,    // minPrice
                        null,    // maxPrice
                        null,    // sellerId
                        undefined,    // pickupAddress
                        undefined, // sortOrder
                        null,    // saleMethod
                        null,    // isSpam
                        null,    // isVerified
                        null,    // productType
                        null     // createAt
                    ),
                ]);

                // --- Metrics từ transaction ---
                const totalPlatformRevenue = transactions.reduce(
                    (sum, tx) => sum + (tx.platformAmount || 0),
                    0
                );

                const uniqueBuyerIds = new Set<number>();
                transactions.forEach((tx) => {
                    if (tx.buyerId) uniqueBuyerIds.add(tx.buyerId);
                });

                const successfulTransactions = transactions.filter(isSuccessfulTransaction);
                const pendingTransactions = transactions.filter(isPendingTransaction);

                const metricsData: MetricCardData[] = [
                    {
                        title: 'Doanh thu nền tảng',
                        value: formatCurrencyVND(totalPlatformRevenue),
                        subValue: 'Tổng commission + service fee',
                        comparisonPercentage: 0,
                        comparisonPeriod: 'so với kỳ trước',
                        chartColor: '#ff0000',
                    },
                    {
                        title: 'Lượt khách hàng (buyer)',
                        value: uniqueBuyerIds.size.toString(),
                        subValue: 'Số buyer khác nhau có giao dịch',
                        comparisonPercentage: 0,
                        comparisonPeriod: 'toàn thời gian',
                        chartColor: '#05aa10ff',
                    },
                    {
                        title: 'Sản phẩm đã bán',
                        value: successfulTransactions.length.toString(),
                        subValue: 'Dựa trên giao dịch thành công',
                        comparisonPercentage: 0,
                        comparisonPeriod: 'toàn thời gian',
                        chartColor: '#05aa10ff',
                    },
                    {
                        title: 'Giao dịch đang chờ',
                        value: pendingTransactions.length.toString(),
                        subValue: 'Đang ở trạng thái Pending/Created',
                        comparisonPercentage: 0,
                        comparisonPeriod: 'hiện tại',
                        chartColor: '#ffc107',
                    },
                ];

                // --- Top selling items: dựa trên số giao dịch thành công theo product ---
                const salesCountMap = new Map<number, number>();
                successfulTransactions.forEach((tx) => {
                    const current = salesCountMap.get(tx.productId) || 0;
                    salesCountMap.set(tx.productId, current + 1);
                });

                const topEntries = Array.from(salesCountMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                const topItems: TopSellingItem[] = topEntries.map(([productId, sales]) => {
                    const product = products.find((p: ProductData) => p.productId === productId);
                    return {
                        productId,
                        name: product?.title || `Product #${productId}`,
                        sales,
                        image: product?.imageUrl,
                    };
                });

                setMetrics(metricsData);
                setTopSellingItems(topItems);
            } catch (err: any) {
                console.error('Failed to load dashboard data', err);
                setError(err?.message || 'Không thể tải dữ liệu tổng quan từ máy chủ.');
            } finally {
                setLoading(false);
            }
        };

        void loadDashboardData();
    }, []);

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
                Welcome, {userName}!
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* --- 1. METRIC CARDS ROW --- */}
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={3} 
                sx={{ mb: 4 }}
            >
                {loading && metrics.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    metrics.map((metric, index) => (
                        <Box key={index} sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
                            <MetricCard {...metric} />
                        </Box>
                    ))
                )}
            </Stack>

            {/* --- 2. SALES CHART & TOP SELLING ROW --- */}
            <Stack 
                direction={{ xs: 'column', md: 'row' }} 
                spacing={3}
            >
                
                {/* 2.1. Sales Chart (tạm thời vẫn dùng dữ liệu mock nội bộ của SalesChart) */}
                <Box sx={{ width: { xs: '100%', md: '66.67%' } }}>
                    <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: theme.shadows[1] }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Month wise sales
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <SalesChart /> 
                    </Paper>
                </Box>

                {/* 2.2. Top Selling Items (dựa trên transaction + products) */}
                <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
                    <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: theme.shadows[1], height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Top Selling Item
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        
                        {loading && topSellingItems.length === 0 ? (
                            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : topSellingItems.length === 0 ? (
                            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                                Chưa có giao dịch thành công nào.
                            </Box>
                        ) : (
                            <List disablePadding>
                                {topSellingItems.map((item, index) => (
                                    <ListItem
                                        key={item.productId}
                                        disablePadding
                                        sx={{
                                            py: 1,
                                            borderBottom:
                                                index < topSellingItems.length - 1
                                                    ? `1px solid ${theme.palette.divider}`
                                                    : 'none',
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={item.image || undefined}
                                                alt={item.name}
                                                variant="rounded"
                                                sx={{ width: 40, height: 40 }}
                                            >
                                                {item.name.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={item.name} 
                                            secondary={`Sold: ${item.sales} units`}
                                            primaryTypographyProps={{ fontWeight: 'bold' }}
                                        />
                                        <Typography variant="body2" color="primary" fontWeight="bold">
                                            #{index + 1}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>
            </Stack>
            
            {/* --- 3. KHU VỰC DƯỚI (giữ placeholder, sẽ nối User/Chat service sau) --- */}
            <Stack 
                direction={{ xs: 'column', md: 'row' }} 
                spacing={3} 
                sx={{ mt: 3 }}
            >
                 {/* Item 1: Recent Customers */}
                 <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: theme.shadows[1], height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Recent Customers
                        </Typography>
                        <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                            <GroupIcon sx={{ mr: 1 }}/>
                            [Bảng khách hàng gần đây - sẽ kết nối API User sau]
                        </Box>
                    </Paper>
                </Box>
                
                {/* Item 2: Pending Messages */}
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: theme.shadows[1], height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Pending Messages
                        </Typography>
                        <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                            <MessageIcon sx={{ mr: 1 }}/>
                            [Danh sách tin nhắn cần phản hồi - sẽ kết nối API Chat/Support sau]
                        </Box>
                    </Paper>
                </Box>
            </Stack>

        </Box>
    );
};

export default DashboardPage;
