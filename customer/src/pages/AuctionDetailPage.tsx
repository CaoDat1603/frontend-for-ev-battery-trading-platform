import React, { useState, useEffect, useMemo, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, Alert, List, ListItem, ListItemText, ListItemIcon,
    CircularProgress, TextField, 
} from '@mui/material';
import { useParams, Link } from 'react-router-dom';

// ICONS
import GavelIcon from '@mui/icons-material/Gavel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category'; 
import LocationOnIcon from '@mui/icons-material/LocationOn'; 

// ====================================================================
// IMPORT SERVICE (GIẢ ĐỊNH)
// ====================================================================
// Bạn cần đảm bảo các hàm sau tồn tại trong file service tương ứng:
// - productService.getProductById
// - auctionService.getAuctionDetail
// - auctionService.searchBids
// - auctionService.countBids
// - auctionService.countBidsMe (Dùng để check cọc)
// - auctionService.createBidApi (Dùng để đặt giá)

import * as productService from '../services/productService'; 
import * as auctionService from '../services/auctionService'; 


// ====================================================================
// ENUMS & INTERFACES
// ====================================================================

/** Trạng thái Đấu giá */
export const AuctionStatusValue = {
    Pending: 0,
    Active: 1,
    Ended: 2,
    Completed: 3,
    Cancelled: 4,
} as const;
export type AuctionStatus = typeof AuctionStatusValue[keyof typeof AuctionStatusValue];

/** Trạng thái Đặt cọc */
export const DepositStatusValue = {
    Paid: 0, // Đã thanh toán cọc
    Refunded: 1,
    Forfeited: 2,
} as const;
export type DepositStatus = typeof DepositStatusValue[keyof typeof DepositStatusValue];

/** Interface cho một lượt đặt giá */
interface Bid {
    bidId: number;
    bidderId: number; // ID người đặt giá
    bidAmount: number;
    statusDeposit: DepositStatus;
    isWinning: boolean;
    createdAt: string; 
}

/** Dữ liệu Chi tiết Đấu giá cơ bản từ API */
export interface AuctionDetailData {
    auctionId: number;
    productId: number;
    sellerEmail: string | null;
    sellerPhone: string | null;
    winnerId: number | null;
    startingPrice: number;
    currentPrice: number;
    depositAmount: number;
    status: AuctionStatus;
    startTime: string; 
    endTime: string; 
    createdAt: string; 
    
    productTitle: string; 
    productImageUrl: string | null;
}

/** Dữ liệu Gộp dùng cho Component */
export interface AuctionDetailWithBids extends AuctionDetailData {
    latestBids: Bid[];
    totalBidsCount: number; 
    /** Trạng thái đặt cọc của người dùng hiện tại (lấy từ countBidsMe) */
    hasUserPaidDeposit: boolean; // <-- TRƯỜNG MỚI ĐỂ CHECK ĐẶT CỌC
}

// KÉO TYPES TỪ PRODUCT SERVICE (Giả định)
type ProductType = 0 | 1 | 2; 
type ProductData = {
    productId: number;
    productName: string;
    imageUrl: string | null;
    title: string;
    description: string;
    pickupAddress: string;
    productType: ProductType;
    // ... các trường khác
};
const ProductTypeMap: Record<ProductType, string> = {
    0: 'Pin điện tử',
    1: 'Ắc quy ô tô điện',
    2: 'Ắc quy xe điện/Scooter',
}


// ====================================================================
// HELPER FUNCTIONS & API WRAPPERS
// ====================================================================

const getStatusChip = (status: AuctionStatus): JSX.Element => {
    switch (status) {
        case AuctionStatusValue.Active:
            return <Chip label="Đang diễn ra" color="success" icon={<AccessTimeIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Ended:
            return <Chip label="Đã kết thúc" color="warning" icon={<BlockIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Completed:
            return <Chip label="Hoàn tất" color="primary" icon={<CheckCircleIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Cancelled:
            return <Chip label="Đã hủy" color="error" icon={<BlockIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Pending:
        default:
            return <Chip label="Chờ duyệt/Bắt đầu" color="default" icon={<HistoryIcon style={{ fontSize: 16 }} />} />;
    }
};

const getTimerDisplay = (endTimeString: string): string => {
    const now = new Date();
    const end = new Date(endTimeString);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Đã hết hạn';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`;
};

const formatCurrency = (amount: number): string => 
    `${amount.toLocaleString('vi-VN')} VND`;

/** Giả định hàm này lấy ID người dùng hiện tại */
const getCurrentUserId = () => 9999; 

// LOGIC GỘP API (Dùng để tải dữ liệu ban đầu)
const fetchAuctionDetailWithBids = async (idNumber: number): Promise<AuctionDetailWithBids> => {
    if (idNumber <= 0) {
        throw new Error("ID Đấu giá không hợp lệ.");
    }

    const auctionDetailPromise = auctionService.getAuctionDetail(idNumber);
    const bidsSearchPromise = auctionService.searchBids(
        idNumber, null, null, null, null, null, null, null, null, null, null,'newest', 1, 10
    );
    const bidsCountPromise = auctionService.countBids(
        idNumber, null, null, null, null, null, null, null, null, null
    );
    // ✅ Dùng countBidsMe để check cọc
    const userDepositCountPromise = auctionService.countBidsMe(
        idNumber, null, null, null, null, null, null, null, null,
        DepositStatusValue.Paid 
    ); 

    const [auctionDetail, latestBids, totalBidsCount, userDepositCount] = await Promise.all([
        auctionDetailPromise, 
        bidsSearchPromise, 
        bidsCountPromise,
        userDepositCountPromise
    ]);
    
    const result: AuctionDetailWithBids = {
        ...auctionDetail,
        latestBids: latestBids, 
        totalBidsCount: totalBidsCount, 
        // ✅ Cập nhật trạng thái cọc
        hasUserPaidDeposit: userDepositCount > 0, 
    };

    return result;
};


// ====================================================================
// COMPONENT CHÍNH
// ====================================================================
const AuctionDetailPage: React.FC = () => {
    const { auctionId } = useParams<{ auctionId: string }>(); 
    const theme = useTheme();

    const idNumber = useMemo(() => parseInt(auctionId || '0'), [auctionId]);

    const [auction, setAuction] = useState<AuctionDetailWithBids | null>(null); 
    const [product, setProduct] = useState<ProductData | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [currentBidAmount, setCurrentBidAmount] = useState<number>(0);
    // Trạng thái đã nộp cọc
    const [isRegistered, setIsRegistered] = useState(false); 
    const [timeLeft, setTimeLeft] = useState('');
    
    // 1. Hook để tải dữ liệu
    useEffect(() => {
        if (idNumber <= 0) {
            setFetchError(`ID Đấu giá không hợp lệ: ${auctionId}.`);
            setLoading(false);
            return;
        }

        setLoading(true);
        setFetchError(null);

        const fetchData = async () => {
            try {
                const auctionData = await fetchAuctionDetailWithBids(idNumber); 

                if (!auctionData) {
                    setFetchError(`Không tìm thấy đấu giá với ID: ${auctionId}.`);
                    return;
                }
                
                setAuction(auctionData);
                const productData = await productService.getProductById(auctionData.productId);
                setProduct(productData);

                setCurrentBidAmount(auctionData.currentPrice + 500000); 
                
                // ✅ Set trạng thái cọc từ API
                setIsRegistered(auctionData.hasUserPaidDeposit); 

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu đấu giá/sản phẩm:", error);
                setFetchError("Không thể tải dữ liệu. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [idNumber, auctionId]);


    // 2. Hook để cập nhật thời gian đếm ngược
    useEffect(() => {
        if (!auction || auction.status !== AuctionStatusValue.Active) return;

        const updateTimer = () => {
            setTimeLeft(getTimerDisplay(auction.endTime));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [auction]);


    // Xử lý Đặt cọc (Mock API call)
    const handleDeposit = () => {
        if (!auction) return;
        // Thực hiện logic gọi API nộp cọc...
        
        // Sau khi API thành công:
        setIsRegistered(true); 
        alert(`Bạn đã đăng ký nộp cọc ${formatCurrency(auction.depositAmount)} thành công! Vui lòng hoàn thành thanh toán.`);
    };

    // ✅ Xử lý Đặt giá (ĐÃ CẬP NHẬT GỌI API createBidApi)
    const handlePlaceBid = async () => {
        if (!auction) return;
        
        if (currentBidAmount <= auction.currentPrice) {
            alert('Giá đặt phải lớn hơn Giá hiện tại!');
            return;
        }
        
        const bidData = {
            auctionId: auction.auctionId,
            bidderId: getCurrentUserId(), 
            amount: String(currentBidAmount), 
            sellerEmail: auction.sellerEmail || '', 
            sellerPhone: auction.sellerPhone || '',
        };

        setLoading(true); // Có thể dùng state loading riêng cho bid để không chặn toàn bộ UI
        
        try {
            // GỌI API TẠO BID
            const apiResult = await auctionService.createBidApi(
                bidData.auctionId,
                bidData.bidderId,
                bidData.amount,
                bidData.sellerEmail,
                bidData.sellerPhone,
            );

            console.log(`[API Success] Bid ID mới: ${apiResult.bidId}`);
            
            // CẬP NHẬT UI SAU KHI GỌI API THÀNH CÔNG
            const newBid: Bid = {
                bidId: apiResult.bidId, 
                bidderId: bidData.bidderId,
                bidAmount: currentBidAmount,
                statusDeposit: DepositStatusValue.Paid, 
                isWinning: true, // Tạm thời
                createdAt: new Date().toISOString(),
            };

            const updatedBids: Bid[] = auction.latestBids ? auction.latestBids.map(b => ({ ...b, isWinning: false })) : []; 
            updatedBids.unshift(newBid); 

            // Cập nhật state chính
            setAuction(prevAuction => prevAuction ? {
                ...prevAuction,
                currentPrice: currentBidAmount,
                latestBids: updatedBids.slice(0, 10), 
                totalBidsCount: prevAuction.totalBidsCount + 1,
            } : null);

            setCurrentBidAmount(currentBidAmount + 500000);

            alert(`Bạn đã đặt giá ${formatCurrency(currentBidAmount)} thành công!`);

        } catch (error) {
            console.error("Lỗi khi gọi API tạo Bid:", error);
            const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định khi đặt giá.";
            alert(`Lỗi đặt giá: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };


    // --- RENDER TRẠNG THÁI TẢI ---
    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Stack direction="column" spacing={2} alignItems="center">
                    <CircularProgress />
                    <Typography variant="h6">Đang tải chi tiết đấu giá...</Typography>
                </Stack>
            </Box>
        );
    }

    // --- RENDER ERROR ---
    if (fetchError || !auction) {
        return (
            <Alert severity="error" sx={{ m: 3 }}>
                <Typography fontWeight="bold">Lỗi:</Typography>
                <Typography>{fetchError || `Không tìm thấy thông tin đấu giá với ID: ${auctionId}`}</Typography>
                <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }} startIcon={<HomeIcon />}>
                    Về Trang chủ
                </Button>
            </Alert>
        );
    }
    
    // LOGIC HIỂN THỊ CHÍNH
    const isAuctionActive = auction.status === AuctionStatusValue.Active;
    const isAuctionEnded = auction.status === AuctionStatusValue.Ended || auction.status === AuctionStatusValue.Completed;

    // --- RENDER CHÍNH ---
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            
            {/* Breadcrumbs */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Trang chủ
                </Link>
                {' / '}
                <Link to={`/products/${auction.productId}`} style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    Sản phẩm: {auction.productTitle}
                </Link>
                {' / '}
                <Typography component="span" color="text.primary" fontWeight="bold">
                    Chi tiết Đấu giá #{auction.auctionId}
                </Typography>
            </Typography>

            {/* Tiêu đề chính */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <GavelIcon color="warning" sx={{ fontSize: '2.5rem' }} /> 
                <Typography variant="h4" fontWeight="bold">
                    Đấu giá: {product?.title || auction.productTitle}
                </Typography>
                {getStatusChip(auction.status)}
            </Stack>

            {/* BỐ CỤC CHÍNH */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                
                {/* --- A. THÔNG TIN ĐẤU GIÁ & LỊCH SỬ (LEFT) --- */}
                <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
                    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mt: 1, mb: 2 }}>
                            Thông tin Phiên Đấu giá
                        </Typography>
                        
                        {/* CÁC CẶP THÔNG TIN ĐẤU GIÁ */}
                        <Stack direction="row" flexWrap="wrap" spacing={2} sx={{ mb: 2 }}>
                            
                            {/* Giá khởi điểm */}
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Giá khởi điểm:</Typography>
                                <Typography variant="h6" fontWeight="bold">{formatCurrency(auction.startingPrice)}</Typography>
                            </Box>

                            {/* Giá hiện tại */}
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Giá hiện tại:</Typography>
                                <Typography variant="h5" fontWeight="bold" color="error">{formatCurrency(auction.currentPrice)}</Typography>
                            </Box>
                            
                            {/* Thời gian bắt đầu */}
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Thời gian bắt đầu:</Typography>
                                <Typography>{new Date(auction.startTime).toLocaleString('vi-VN')}</Typography>
                            </Box>
                            
                            {/* Thời gian kết thúc */}
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Thời gian kết thúc:</Typography>
                                <Typography>{new Date(auction.endTime).toLocaleString('vi-VN')}</Typography>
                            </Box>
                            
                            {/* Tiền đặt cọc (Full width) */}
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="body2" color="text.secondary">Tiền đặt cọc:</Typography>
                                <Typography fontWeight="bold" color="warning.main">{formatCurrency(auction.depositAmount)}</Typography>
                            </Box>
                            
                            {/* Người thắng cuộc (Full width Alert) */}
                            {isAuctionEnded && auction.winnerId && (
                                <Box sx={{ width: '100%' }}>
                                    <Alert severity="success" icon={<CheckCircleIcon />}>
                                        <Typography fontWeight="bold">Người thắng cuộc:</Typography>
                                        <Typography>User ID: **{auction.winnerId}** (Giá thắng: {formatCurrency(auction.currentPrice)})</Typography>
                                    </Alert>
                                </Box>
                            )}
                        </Stack>
                    </Paper>

                    {/* THÔNG TIN CHI TIẾT SẢN PHẨM */}
<Paper elevation={3} sx={{ p: 3, mt: 4 }}>
    <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mt: 1, mb: 2 }}>
        Chi tiết Sản phẩm
    </Typography>

    {product ? (
        <Stack 
            direction={{ xs: 'column', md: 'row' }} // Trên màn hình nhỏ (xs) xếp chồng, màn hình lớn (md) xếp hàng ngang
            spacing={4} 
        >
            {/* Cột 1: Hình ảnh Sản phẩm */}
            <Box 
                sx={{ 
                    // Định nghĩa chiều rộng: 100% trên màn hình nhỏ, 33% trên màn hình lớn
                    width: { xs: '100%', md: '33.33%' }, 
                    flexShrink: 0 // Đảm bảo box này không bị co lại
                }}
            >
                <Box 
                    sx={{ 
                        width: '100%', 
                        paddingTop: '100%', 
                        position: 'relative', 
                        overflow: 'hidden',
                        borderRadius: 1,
                        boxShadow: 2 
                    }}
                >
                    {/* Giả sử `product.imageUrl` là URL của hình ảnh chính */}
                    {product.imageUrl ? (
                        <img 
                            src={product.imageUrl} 
                            alt={product.productName || "Hình ảnh sản phẩm"} 
                            style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '100%',
                                backgroundColor: 'grey.200',
                                color: 'text.secondary'
                            }}
                        >
                            <Typography variant="caption">Không có hình ảnh</Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Cột 2: Thông tin chi tiết */}
            <Box 
                sx={{ 
                    // Cột này sẽ chiếm phần còn lại của không gian (66.67% trừ spacing)
                    width: { xs: '100%', md: '66.67%' }
                }}
            >
                <Stack spacing={2}>
                    {/* Địa chỉ lấy hàng */}
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <LocationOnIcon color="info" sx={{ mt: 0.5, fontSize: 20 }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Địa chỉ lấy hàng:</Typography>
                            <Typography fontWeight="medium">{product.pickupAddress}</Typography>
                        </Box>
                    </Stack>
                    
                    {/* Loại sản phẩm */}
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <CategoryIcon color="info" sx={{ mt: 0.5, fontSize: 20 }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Loại sản phẩm:</Typography>
                            <Typography fontWeight="medium">{ProductTypeMap[product.productType]}</Typography>
                        </Box>
                    </Stack>
                    
                    <Divider />

                    {/* Mô tả */}
                    <Box>
                        <Typography variant="body2" color="text.secondary">Mô tả chi tiết:</Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ whiteSpace: 'pre-line', mt: 1 }}
                        >
                            {product.description}
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        </Stack>
    ) : (
        <Alert severity="warning">Không tìm thấy chi tiết sản phẩm liên quan.</Alert>
    )}
</Paper>


                    {/* LỊCH SỬ ĐẶT GIÁ */}
                    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <HistoryIcon color="info" />
                            <Typography variant="h6" fontWeight="bold">Lịch sử Đặt giá (Tổng: **{auction.totalBidsCount || 0}** lượt)</Typography>
                        </Stack>
                        <List dense disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {auction.latestBids && auction.latestBids.length > 0 ? auction.latestBids.map((bid, index) => (
                                <ListItem 
                                    key={bid.bidId} 
                                    disableGutters 
                                    sx={{ 
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        bgcolor: bid.isWinning ? theme.palette.success.light + '10' : 'transparent',
                                        '&:last-child': { borderBottom: 'none' }
                                    }}
                                >
                                    <ListItemIcon>
                                        <AccountCircleIcon color={bid.isWinning ? 'success' : 'action'} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography fontWeight="bold" color={bid.isWinning ? 'success.dark' : 'text.primary'}>
                                                {formatCurrency(bid.bidAmount)} 
                                                {bid.isWinning && <Chip label="Giá thắng" color="success" size="small" sx={{ ml: 1 }} />}
                                            </Typography>
                                        }
                                        secondary={`Thời gian: ${new Date(bid.createdAt).toLocaleTimeString('vi-VN')}`}
                                    />
                                    <Chip 
                                        label={bid.statusDeposit === DepositStatusValue.Paid ? 'Đã cọc' : 'Chưa cọc'} 
                                        color={bid.statusDeposit === DepositStatusValue.Paid ? 'info' : 'default'}
                                        size="small"
                                    />
                                </ListItem>
                            )) : (
                                <Alert severity="info">Chưa có lượt đặt giá nào.</Alert>
                            )}
                        </List>
                        {/* Thêm nút xem thêm */}
                        {auction.totalBidsCount > (auction.latestBids?.length || 0) && (
                            <Button size="small" sx={{ mt: 2 }} fullWidth>
                                Xem tất cả {auction.totalBidsCount} lượt đặt giá
                            </Button>
                        )}
                    </Paper>
                </Box>

                {/* --- B. ACTION ĐẤU GIÁ (RIGHT - STICKY) --- */}
                <Stack 
                    spacing={3} 
                    sx={{ 
                        width: { xs: '100%', md: '41.67%' }, 
                        position: 'sticky', 
                        top: theme.spacing(10), 
                        alignSelf: 'flex-start' 
                    }}
                >
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[5] }}>
                        <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                            {isAuctionActive ? 'Thời gian còn lại' : 'Trạng thái Phiên'}
                        </Typography>

                        {isAuctionActive ? (
                            <Alert severity="warning" variant="filled" sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h4" fontWeight="bold">{timeLeft}</Typography>
                            </Alert>
                        ) : (
                            <Alert 
                                severity={
                                    isAuctionEnded ? 'info' : 
                                    (auction.status === AuctionStatusValue.Pending ? 'info' : 'error')
                                }
                            >
                                {isAuctionEnded ? 'Phiên đấu giá đã kết thúc.' : (auction.status === AuctionStatusValue.Pending ? 'Phiên chưa bắt đầu, chờ đến thời gian: ' + new Date(auction.startTime).toLocaleString('vi-VN') : 'Phiên đã bị hủy.')}
                            </Alert>
                        )}
                        
                        <Divider sx={{ my: 2 }} />

                        {/* Logic kiểm tra Đã đặt cọc (isRegistered) */}
                        {isAuctionActive ? (
                            !isRegistered ? (
                                // 1. CHƯA CỌC
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                                        Vui lòng nộp cọc **{formatCurrency(auction.depositAmount)}** để tham gia
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        color="warning" 
                                        fullWidth 
                                        size="large"
                                        startIcon={<PaidIcon />}
                                        onClick={handleDeposit}
                                    >
                                        Đăng ký nộp cọc
                                    </Button>
                                </Box>
                            ) : (
                                // 2. ĐÃ CỌC & CÓ THỂ ĐẶT GIÁ
                                <Box>
                                    <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                                        Bạn đã thanh toán cọc thành công và đủ điều kiện đặt giá.
                                    </Alert>
                                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                                        Giá hiện tại: <Box component="span" color="error.main">{formatCurrency(auction.currentPrice)}</Box>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Giá đặt phải lớn hơn giá hiện tại.
                                    </Typography>
                                    
                                    <TextField
                                        label="Số tiền muốn đặt (VND)"
                                        fullWidth
                                        type="number"
                                        value={currentBidAmount}
                                        onChange={(e) => setCurrentBidAmount(Math.max(auction.currentPrice + 1, parseInt(e.target.value) || 0))}
                                        inputProps={{ step: 100000 }}
                                        sx={{ mb: 2 }}
                                        // Vô hiệu hóa nút nhập nếu đang gửi API
                                        disabled={loading} 
                                    />

                                    <Button 
                                        variant="contained" 
                                        color="success" 
                                        fullWidth 
                                        size="large"
                                        startIcon={<PriceCheckIcon />}
                                        onClick={handlePlaceBid}
                                        disabled={currentBidAmount <= auction.currentPrice || loading} // Vô hiệu hóa nếu giá quá thấp hoặc đang loading
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : `Đặt giá ngay (${formatCurrency(currentBidAmount)})`}
                                    </Button>
                                </Box>
                            )
                        ) : (
                            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                                Không thể đặt giá khi phiên không Active.
                            </Typography>
                        )}
                    </Paper>

                </Stack>
            </Stack>
        </Box>
    );
};

export default AuctionDetailPage;