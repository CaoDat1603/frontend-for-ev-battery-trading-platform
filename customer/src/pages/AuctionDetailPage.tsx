import React, { useState, useEffect, useMemo, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, Alert, List, ListItem, ListItemText, ListItemIcon,
    CircularProgress, TextField, 
    Step, Stepper, StepLabel, StepContent
} from '@mui/material';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';

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
import ReceiptIcon from '@mui/icons-material/Receipt'; // Icon mới cho Hóa đơn

// ====================================================================
// IMPORT SERVICE (GIẢ ĐỊNH)
// ====================================================================

import * as productService from '../services/productService'; 
import * as auctionService from '../services/auctionService'; 


// ====================================================================
// ENUMS & INTERFACES (Cập nhật)
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
    /** THÊM TRANSACTION ID */
    transactionId: number | null; 
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
    hasUserPaidDeposit: boolean; 
    /** THÊM: Kiểm tra người dùng hiện tại có phải người thắng không */
    isCurrentUserWinner: boolean; 
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
    price: number;
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

// LOGIC GỘP API (Cập nhật check Winner)
const fetchAuctionDetailWithBids = async (idNumber: number): Promise<AuctionDetailWithBids> => {
    if (idNumber <= 0) {
        throw new Error("ID Đấu giá không hợp lệ.");
    }

    const auctionDetailPromise = auctionService.getAuctionDetail(idNumber) as Promise<AuctionDetailData>;
    const bidsSearchPromise = auctionService.searchBids(
        idNumber, null, null, null, null, null, null, null, null, null, null,'newest', 1, 10
    );
    const bidsCountPromise = auctionService.countBids(
        idNumber, null, null, null, null, null, null, null, null, null
    );
    // 1. Check cọc
    const userDepositCountPromise = auctionService.countBidsMe(
        idNumber, null, null, null, null, null, null, null, null,
        DepositStatusValue.Paid 
    ); 
    // 2. Check Người thắng (Lấy 1 lượt đặt giá của người dùng hiện tại)
    const myBidsPromise = auctionService.searchBidsMe(
        idNumber, null, null, null, null, null, null, null, null, null, 'newest', 1, 1
    );

    const [auctionDetail, latestBids, totalBidsCount, userDepositCount, myBids] = await Promise.all([
        auctionDetailPromise, 
        bidsSearchPromise, 
        bidsCountPromise,
        userDepositCountPromise,
        myBidsPromise
    ]);
    
    // Logic kiểm tra Winner: Nếu có bid của mình và bid đó là isWinning = true
    const isCurrentUserWinner = myBids.length > 0 && myBids[0].isWinning === true;

    const result: AuctionDetailWithBids = {
        ...auctionDetail,
        latestBids: latestBids, 
        totalBidsCount: totalBidsCount, 
        hasUserPaidDeposit: userDepositCount > 0, 
        isCurrentUserWinner: isCurrentUserWinner, // THAY ĐỔI: Thêm check Winner
    };

    return result;
};


// ====================================================================
// COMPONENT CHÍNH
// ====================================================================
const AuctionDetailPage: React.FC = () => {
    const { auctionId, sellerId } = useParams<{ auctionId: string; sellerId: string }>(); 
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const idNumber = useMemo(() => parseInt(auctionId || '0'), [auctionId]);
    const sellerIdFromUrl = useMemo(() => parseInt(sellerId || '0'), [sellerId]); 

    const [auction, setAuction] = useState<AuctionDetailWithBids | null>(null); 
    const [product, setProduct] = useState<ProductData | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [currentBidAmount, setCurrentBidAmount] = useState<number>(0);
    const [isRegistered, setIsRegistered] = useState(false); 
    const [timeLeft, setTimeLeft] = useState('');
    
    const [isCurrentUserWinner, setIsCurrentUserWinner] = useState<boolean | null>(null);
    // --- [NEW] STATE QUẢN LÝ THANH TOÁN CỌC ---
    const [paymentTransactionId, setPaymentTransactionId] = useState<number | null>(null)

    console.log(`[RENDER] isRegistered hiện tại: ${isRegistered}`); 
    console.log(`[RENDER] paymentTransactionId hiện tại: ${paymentTransactionId}`);
    // --- [NEW] EFFECT KIỂM TRA THANH TOÁN TỪ URL ---
useEffect(() => {
    // 1. Lấy tham số từ URL
    const txIdParam = searchParams.get("transactionId");
    const txIdNumber = Number(txIdParam);
    
    console.log("--- BẮT ĐẦU EFFECT searchParams ---");
    console.log(`URL searchParams: ${searchParams.toString()}`);
    console.log(`txIdParam (từ URL): ${txIdParam}`);
    console.log(`txIdNumber (parsed): ${txIdNumber}`);
    
    // 2. Kiểm tra và cập nhật state
    if (txIdNumber && txIdNumber > 0) {
        console.log("-> Cập nhật state: transactionId HỢP LỆ.");

        setPaymentTransactionId(txIdNumber);
        
        // Cập nhật isRegistered: Dùng giá trị local txIdNumber
        // Nếu đã có transactionId trên URL (sau khi thanh toán), ta coi như đã đăng ký thành công
        setIsRegistered(true); 
        console.log("-> Đặt setIsRegistered(true)");
        
        // Tùy chọn: Xóa tham số khỏi URL để tránh cập nhật lại
        // navigate(location.pathname, { replace: true }); 
        
    } else {
        console.log("-> KHÔNG tìm thấy transactionId hợp lệ. Giữ nguyên trạng thái.");
        setPaymentTransactionId(null);
    }
    
    console.log("--- KẾT THÚC EFFECT searchParams ---");


// Chỉ phụ thuộc vào searchParams, không phụ thuộc vào paymentTransactionId
}, [searchParams, navigate, location.pathname]);

    // 1. Hook để tải dữ liệu
    const fetchData = async () => {
        if (idNumber <= 0) {
            setFetchError(`ID Đấu giá không hợp lệ: ${auctionId}.`);
            setLoading(false);
            return;
        }

        setLoading(true);
        setFetchError(null);

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
            
            if (paymentTransactionId != null && paymentTransactionId > 0) {
                setIsRegistered(true);
            } else {
                setIsRegistered(auctionData.hasUserPaidDeposit); 
            }
            console.log(`txIdNumber (parsed): ${paymentTransactionId}`);

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu đấu giá/sản phẩm:", error);
            setFetchError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [idNumber, auctionId, paymentTransactionId]);

    


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
                // Lấy URL hiện tại để trang Invoice biết đường quay lại
        const currentPath = window.location.pathname + window.location.search;

        navigate(`/invoice-detail/${idNumber}`, {
            state: {
                productId: auction.productId,
                title: `Đặt cọc phiên đấu giá: ${product?.productName}`,
                productName: product?.productName,
                price: auction.depositAmount, // Số tiền cần thanh toán là tiền cọc
                sellerId: sellerIdFromUrl, // Hoặc ID hệ thống nhận cọc
                productType: 3, // [QUAN TRỌNG] Type 4: Phí/Cọc đấu giá
                
                returnUrl: currentPath // Truyền link để quay về
            }
        });
    };

// Thêm useEffect để kiểm tra người thắng khi đấu giá kết thúc
useEffect(() => {
    if (auctionId && auction?.status === AuctionStatusValue.Ended) {
        const checkWinner = async () => {
            try {
                // Gọi API mới được cung cấp
                const isWinner = await auctionService.getIsMeWinnerById(parseInt(auctionId));
                setIsCurrentUserWinner(isWinner);
            } catch (error) {
                console.error("Lỗi kiểm tra người thắng:", error);
                setIsCurrentUserWinner(false); // Đặt mặc định là false nếu có lỗi
            }
        };
        checkWinner();
    }

}, [auctionId, auction?.status]);



    // Xử lý Đặt giá (ĐÃ CẬP NHẬT GỌI API createBidApi)
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

        setLoading(true); 
        
        try {
            const apiResult = await auctionService.createBidApi(
                bidData.auctionId,
                bidData.bidderId,
                bidData.amount,
                bidData.sellerEmail,
                bidData.sellerPhone,
                paymentTransactionId ? paymentTransactionId : undefined
            );

            console.log(`[API Success] Bid ID mới: ${apiResult.bidId}`);
            
            // CẬP NHẬT UI SAU KHI GỌI API THÀNH CÔNG
            const newBid: Bid = {
                bidId: apiResult.bidId, 
                bidderId: bidData.bidderId,
                bidAmount: currentBidAmount,
                statusDeposit: DepositStatusValue.Paid, 
                isWinning: true, 
                createdAt: new Date().toISOString(),
            };

            const updatedBids: Bid[] = auction.latestBids ? auction.latestBids.map(b => ({ ...b, isWinning: false })) : []; 
            updatedBids.unshift(newBid); 

            // Tải lại dữ liệu đầy đủ (thực tế nên dùng WebSocket hoặc tải lại 1 phần)
            await fetchData();

            alert(`Bạn đã đặt giá ${formatCurrency(currentBidAmount)} thành công!`);

        } catch (error) {
            console.error("Lỗi khi gọi API tạo Bid:", error);
            const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định khi đặt giá.";
            alert(`Lỗi đặt giá: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // LOGIC HIỂN THỊ CHÍNH
    const isAuctionActive = auction?.status === AuctionStatusValue.Active;
    const isAuctionEnded = auction?.status === AuctionStatusValue.Ended || auction?.status === AuctionStatusValue.Completed;

    const isWinner = isCurrentUserWinner === true;
    const isCurrentUserWinnerAndCompleted = isWinner && auction?.transactionId !== null;
    // const isCurrentUserWinner = (auction.winnerId === getCurrentUserId()) && auction.status === AuctionStatusValue.Completed;
    // ✅ Dùng cờ đã check từ API để đảm bảo chính xác
    const isWinnerButNotCompleted = isWinner && auction?.transactionId === null;


useEffect(() => {
    console.log(`[API Success]: ${isAuctionEnded}`);
    console.log(`[API Success]: ${isWinnerButNotCompleted}`);
    console.log(`[API Success]: ${paymentTransactionId}`);
    // 1. Chỉ chạy khi đấu giá đã kết thúc, user là người thắng, và đã có ID giao dịch cuối
    if (
        isAuctionEnded && 
        isWinnerButNotCompleted && 
        paymentTransactionId != null
    ) {
        const completeAuction = async () => {
            console.log(`[AUTO-COMPLETE] Bắt đầu gọi API hoàn tất cho Auction #${auction.auctionId}`);
            setLoading(true);
            try {
                console.log(`[AUTO-COMPLETE] Bắt đầu gọi API hoàn tất cho Auction #${auction.auctionId}, ${paymentTransactionId}`);
                // [KHẮC PHỤC] Truyền finalTransactionId vào API
                await auctionService.updateAuctionCompleteStatusApi(
                    auction.auctionId, 
                    paymentTransactionId // ⚠️ ĐÃ ĐỔI TỪ paymentTransactionId
                ); 
                
                // Tải lại dữ liệu để cập nhật UI
                await fetchData(); 

                // Xóa tham số khỏi URL sau khi hoàn tất thành công
                navigate(location.pathname, { replace: true });
                
                alert("Đấu giá đã được hoàn tất và giao dịch đã được ghi nhận!");

            } catch (error) {
                console.error("Lỗi khi hoàn tất đấu giá:", error);
                alert("Lỗi: Không thể hoàn tất đấu giá. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
            } finally {
                setLoading(false);
            }
        };

        completeAuction();
    }
// [KHẮC PHỤC] Thêm các dependencies còn thiếu
}, [
    isAuctionEnded, 
    isWinnerButNotCompleted,
    paymentTransactionId
]);

    // --- RENDER TRẠNG THÁI TẢI VÀ ERROR (Giữ nguyên) ---
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
                        <Stack direction="row" flexWrap="wrap" spacing={2} rowGap={2} sx={{ mb: 2 }}>
                            
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
                            
                            <Divider flexItem sx={{ width: '100%', my: 1 }} />
                            
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
                            
                            {/* 🏆 THÔNG BÁO KẾT QUẢ ĐẤU GIÁ VÀ XEM HÓA ĐƠN */}
                            {isAuctionEnded && (
                                <Box sx={{ width: '100%', mt: 2 }}>
                                    {isCurrentUserWinnerAndCompleted ? (
                                        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                                            <Typography fontWeight="bold">CHÚC MỪNG! Bạn đã thắng đấu giá này!</Typography>
                                            <Typography sx={{ mb: 1 }}>Giá thắng: **{formatCurrency(auction.currentPrice)}**</Typography>
                                            
                                            {/* NÚT XEM HÓA ĐƠN */}
                                            {auction.transactionId ? (
                                                <Button
                                                    component={Link}
                                                    to={`/transactions/${auction.transactionId}`} // CUSTOMER VIEW
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    startIcon={<ReceiptIcon />}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Xem Hóa đơn/Giao dịch #{auction.transactionId}
                                                </Button>
                                            ) : (
                                                <Typography variant="body2" color="error" fontWeight="medium">
                                                    Đang chờ tạo hóa đơn/Giao dịch.
                                                </Typography>
                                            )}
                                        </Alert>
                                        ) : isWinnerButNotCompleted ? (
                                            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                                                <Typography fontWeight="bold">CHÚC MỪNG! Bạn là người thắng đấu giá.</Typography>
                                                <Typography sx={{ mb: 1 }}>Giá thắng: **{formatCurrency(auction.currentPrice)}**</Typography>
                                                <Typography color="text.secondary">Vui lòng hoàn tất giao dịch để nhận sản phẩm.</Typography>
                                        
                                                <Button
                                                    onClick={() =>                         
                                                        navigate(`/invoice-detail/${product?.productId}`, {
                                                        state: {
                                                                productId: product?.productId,
                                                                title: product?.title,
                                                                productName: product?.productName,
                                                                price: product?.price,
                                                                sellerId: sellerIdFromUrl,
                                                                productType: product?.productType,
                                                                returnUrl: window.location.pathname + window.location.search,
                                                                isCompleted: true
                                                            },
                                                        })
                                                    } // DẪN ĐẾN TRANG HOÀN TẤT MỚI
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    // ... startIcon ...
                                                    sx={{ mt: 1 }}
                                                >
                                                    Hoàn tất Đấu giá & Thanh toán
                                                </Button>
                                            </Alert>
                                    ) : auction.winnerId ? (
                                        <Alert severity="info">
                                            <Typography fontWeight="bold">Phiên đã kết thúc và có người thắng:</Typography>
                                            <Typography>Giá thắng: **{formatCurrency(auction.currentPrice)}**</Typography>
                                        </Alert>
                                    ) : (
                                        <Alert severity="warning">
                                            <Typography fontWeight="bold">Phiên kết thúc không có người thắng:</Typography>
                                            <Typography>Chưa có lượt đặt giá hợp lệ.</Typography>
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </Stack>
                    </Paper>

                    {/* THÔNG TIN CHI TIẾT SẢN PHẨM (Giữ nguyên) */}
                    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mt: 1, mb: 2 }}>
                            Chi tiết Sản phẩm
                        </Typography>

                        {product ? (
                            <Stack 
                                direction={{ xs: 'column', md: 'row' }} 
                                spacing={4} 
                            >
                                {/* Cột 1: Hình ảnh Sản phẩm */}
                                <Box 
                                    sx={{ 
                                        width: { xs: '100%', md: '33.33%' }, 
                                        flexShrink: 0 
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
                                                    backgroundColor: theme.palette.grey[200],
                                                    color: theme.palette.text.secondary
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

                    {/* LỊCH SỬ ĐẶT GIÁ (Giữ nguyên) */}
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
                                        // Chỉ đánh dấu bid của người dùng hiện tại là Winning nếu cờ isWinning = true
                                        bgcolor: bid.isWinning ? theme.palette.success.light + '10' : 'transparent',
                                        '&:last-child': { borderBottom: 'none' }
                                    }}
                                >
                                    <ListItemIcon>
                                        <AccountCircleIcon color={bid.bidderId === getCurrentUserId() ? 'primary' : 'action'} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography fontWeight="bold" color={bid.isWinning ? 'success.dark' : 'text.primary'}>
                                                {formatCurrency(bid.bidAmount)} 
                                                {bid.isWinning && <Chip label="Giá thắng" color="success" size="small" sx={{ ml: 1 }} />}
                                            </Typography>
                                        }
                                        secondary={`Bidder: ${bid.bidderId === getCurrentUserId() ? 'Bạn' : `ID: ${bid.bidderId}`} | Thời gian: ${new Date(bid.createdAt).toLocaleTimeString('vi-VN')}`}
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
                                        disabled={loading} 
                                    />

                                    <Button 
                                        variant="contained" 
                                        color="success" 
                                        fullWidth 
                                        size="large"
                                        startIcon={<PriceCheckIcon />}
                                        onClick={handlePlaceBid}
                                        disabled={currentBidAmount <= auction.currentPrice || loading} 
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