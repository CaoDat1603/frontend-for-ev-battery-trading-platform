import React, { useState, useEffect, useMemo, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, Alert, List, ListItem, ListItemText, ListItemIcon,
    CircularProgress, Snackbar,
} from '@mui/material';
import { useParams, Link, useNavigate } from 'react-router-dom';

// ICONS
import GavelIcon from '@mui/icons-material/Gavel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Giữ lại cho kết quả thắng
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import CategoryIcon from '@mui/icons-material/Category'; 
import InfoIcon from '@mui/icons-material/Info'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'; 
import AutorenewIcon from '@mui/icons-material/Autorenew'; 
// import DoneAllIcon from '@mui/icons-material/DoneAll'; // Bỏ
// import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Bỏ


// ====================================================================
// IMPORT SERVICE VÀ ENUMS (Giả định)
// ====================================================================

// Giả định các hàm và Enums được import từ file services/auctionService.ts
// LƯU Ý: Đã loại bỏ updateAuctionCompleteStatusApi
import { 
    AuctionStatusValue, type AuctionStatus, 
    DepositStatusValue, 
    // Các hàm API và interfaces khác...
    updateAuctionStatusApi, 
    deletedAuctionApi, 
    getAuctionDetail, 
    searchBids, 
    countBids, 
    type Bid,
} from '../services/auctionService'; 


// ====================================================================
// CẬP NHẬT INTERFACE AUCTION DETAIL DATA
// ====================================================================
// Đã loại bỏ Transaction ID
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
    /** Đã loại bỏ transactionId: number | null; */
}

/** Dữ liệu Gộp dùng cho Component */
export interface AuctionDetailWithBids extends AuctionDetailData {
    latestBids: Bid[];
    totalBidsCount: number; 
}

// ====================================================================
// HELPER FUNCTIONS (Cập nhật - Loại bỏ Completed)
// ====================================================================

const getStatusChip = (status: AuctionStatus): JSX.Element => {
    switch (status) {
        case AuctionStatusValue.Active:
            return <Chip label="Đang diễn ra" color="success" icon={<AccessTimeIcon style={{ fontSize: 16 }} />} size="small" />;
        case AuctionStatusValue.Ended:
            // Vẫn dùng Ended cho phiên đã kết thúc nhưng chưa hủy/chưa được xử lý
            return <Chip label="Đã kết thúc" color="warning" icon={<BlockIcon style={{ fontSize: 16 }} />} size="small" />;
        case AuctionStatusValue.Cancelled:
            return <Chip label="Đã hủy" color="error" icon={<BlockIcon style={{ fontSize: 16 }} />} size="small" />;
        case AuctionStatusValue.Pending:
        default:
            return <Chip label="Chờ duyệt/Bắt đầu" color="default" icon={<HistoryIcon style={{ fontSize: 16 }} />} size="small" />;
        /** Đã loại bỏ case AuctionStatusValue.Completed: */
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

    let parts: string[] = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0 || days > 0) parts.push(`${hours} giờ`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} phút`);
    parts.push(`${seconds} giây`);
    
    return parts.join(' ');
};

const formatCurrency = (amount: number): string => 
    `${amount.toLocaleString('vi-VN')} VND`;

const fetchAuctionDetailWithBids = async (idNumber: number): Promise<AuctionDetailWithBids> => {
    if (idNumber <= 0) {
        throw new Error("ID Đấu giá không hợp lệ.");
    }

    const auctionDetailPromise = getAuctionDetail(idNumber) as Promise<AuctionDetailData>; 
    const bidsSearchPromise = searchBids(
        idNumber, null, null, null, null, null, null, null, null, null, null,'newest', 1, 10
    );
    const bidsCountPromise = countBids(
        idNumber, null, null, null, null, null, null, null, null, null
    );
    
    const [auctionDetail, latestBids, totalBidsCount] = await Promise.all([
        auctionDetailPromise, 
        bidsSearchPromise, 
        bidsCountPromise
    ]);
    
    const result: AuctionDetailWithBids = {
        ...auctionDetail,
        latestBids: latestBids, 
        totalBidsCount: totalBidsCount, 
    };

    return result;
};


// ====================================================================
// COMPONENT CHÍNH (ADMIN VIEW - RÚT GỌN)
// ====================================================================
const AuctionDetailPageSimple: React.FC = () => {
    const { auctionId } = useParams<{ auctionId: string }>(); 
    const theme = useTheme();
    const navigate = useNavigate();

    const idNumber = useMemo(() => parseInt(auctionId || '0'), [auctionId]);

    const [auction, setAuction] = useState<AuctionDetailWithBids | null>(null); 
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false); 
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState('');
    
    // Đã loại bỏ State cho Dialog Hoàn tất
    // Đã loại bỏ transactionIdInput

    // State cho Snackbar (Thông báo)
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

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
            setAuction(auctionData);

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu đấu giá:", error);
            setFetchError(`Không thể tải dữ liệu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [idNumber, auctionId]);


    useEffect(() => {
        if (!auction || auction.status !== AuctionStatusValue.Active) return;

        const updateTimer = () => {
            setTimeLeft(getTimerDisplay(auction.endTime));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [auction]);
    
    const handleGoBack = () => {
        navigate('/manage-auction'); 
    };
    
    
    // ====================================================
    // LOGIC XỬ LÝ HÀNH ĐỘNG ADMIN (Rút gọn)
    // ====================================================
    
    const handleUpdateStatus = async (newStatus: AuctionStatus) => {
        if (!auction) return;

        let actionName = '';
        if (newStatus === AuctionStatusValue.Active) actionName = 'Kích hoạt';
        else if (newStatus === AuctionStatusValue.Pending) actionName = 'Chuyển về Chờ duyệt';
        else if (newStatus === AuctionStatusValue.Cancelled) actionName = 'Hủy';
        else {
            // Trường hợp không mong muốn (chẳng hạn như cố gắng gọi Complete)
            setSnackbar({ open: true, message: `Trạng thái ${newStatus} không được hỗ trợ trong giao diện này.`, severity: 'error' });
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} đấu giá ID ${auction.auctionId} không?`)) {
            return;
        }

        setActionLoading(true);
        try {
            // Chỉ dùng updateAuctionStatusApi
            await updateAuctionStatusApi(auction.auctionId, newStatus);
            
            setSnackbar({ open: true, message: `${actionName} đấu giá thành công.`, severity: 'success' });
            await fetchData(); // Tải lại dữ liệu chi tiết

        } catch (error) {
            console.error(`Lỗi khi ${actionName} đấu giá:`, error);
            setSnackbar({ open: true, message: `Thất bại khi ${actionName} đấu giá: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`, severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };
    
    // Đã loại bỏ handleConfirmComplete
    // Đã loại bỏ logic Dialog

    const handleDeleteAuction = async () => {
        if (!auction) return;

        if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN đấu giá ID ${auction.auctionId} không? Hành động này không thể hoàn tác.`)) {
            return;
        }

        setActionLoading(true);
        try {
            await deletedAuctionApi(auction.auctionId);
            
            setSnackbar({ open: true, message: 'Xóa đấu giá thành công.', severity: 'success' });
            setTimeout(() => navigate('/auctions'), 1500); 
            
        } catch (error) {
            console.error('Lỗi khi xóa đấu giá:', error);
            setSnackbar({ open: true, message: `Thất bại khi Xóa đấu giá: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`, severity: 'error' });
        } finally {
            setActionLoading(false);
        }
    };
    // ====================================================

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
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={handleGoBack} 
                    variant="contained" 
                    sx={{ mt: 2 }}
                >
                    Back to Content Moderation
                </Button>
            </Alert>
        );
    }
    
    const isAuctionActive = auction.status === AuctionStatusValue.Active;
    // Đã thay đổi: Ended là trạng thái cuối cùng trước khi bị Hủy hoặc được xử lý (Hoàn tất đã bị loại bỏ)
    const isAuctionEnded = auction.status === AuctionStatusValue.Ended; 
    const isAuctionCancelled = auction.status === AuctionStatusValue.Cancelled;
    const isAuctionPending = auction.status === AuctionStatusValue.Pending;


    // --- RENDER CHÍNH ---
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={handleGoBack} 
                sx={{ mb: 3 }}
                variant="outlined"
            >
                Back to Content Moderation
            </Button>

            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={1} sx={{ mb: 4 }} flexWrap="wrap">
                <GavelIcon color="warning" sx={{ fontSize: '2.5rem' }} /> 
                <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                    Quản lý Đấu giá: {auction.productTitle}
                </Typography>
                {getStatusChip(auction.status)}
            </Stack>
            
            <Divider sx={{ mb: 4 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                
                {/* --- A. THÔNG TIN ĐẤU GIÁ & SẢN PHẨM (LEFT - 5/8) --- */}
                <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
                    
                    {/* THÔNG TIN CHI TIẾT SẢN PHẨM (Giữ nguyên) */}
                    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <InfoIcon color="info" />
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                                Chi tiết Sản phẩm
                            </Typography>
                        </Stack>
                        
                        <Stack 
                            spacing={2} 
                            sx={{ border: `1px dashed ${theme.palette.divider}`, p: 2, borderRadius: 1 }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{auction.productTitle}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    ID Sản phẩm: **{auction.productId}**
                                </Typography>
                                
                                <Button 
                                    component={Link} 
                                    to={`/content/${auction.productId}`} 
                                    variant="outlined" 
                                    size="small"
                                    color="info"
                                    startIcon={<CategoryIcon />}
                                >
                                    Xem Chi tiết Sản phẩm 
                                </Button>
                            </Box>
                        </Stack>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Thông tin liên hệ Người bán: Email **{auction.sellerEmail || 'N/A'}** | Phone **{auction.sellerPhone || 'N/A'}**
                        </Alert>
                    </Paper>

                    {/* THÔNG TIN PHIÊN ĐẤU GIÁ */}
                    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
                            Thông tin Phiên Đấu giá
                        </Typography>
                        
                        <Stack direction="row" flexWrap="wrap" spacing={2} rowGap={2} sx={{ mb: 2 }}>
                            
                            {/* Giá khởi điểm, Giá hiện tại, Thời gian... (Giữ nguyên) */}
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Giá khởi điểm:</Typography>
                                <Typography variant="h6" fontWeight="bold">{formatCurrency(auction.startingPrice)}</Typography>
                            </Box>

                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Giá hiện tại:</Typography>
                                <Typography variant="h5" fontWeight="bold" color="error">{formatCurrency(auction.currentPrice)}</Typography>
                            </Box>
                            
                            <Divider flexItem sx={{ width: '100%' }} />
                            
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Thời gian bắt đầu:</Typography>
                                <Typography>{new Date(auction.startTime).toLocaleString('vi-VN')}</Typography>
                            </Box>
                            
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Thời gian kết thúc:</Typography>
                                <Typography>{new Date(auction.endTime).toLocaleString('vi-VN')}</Typography>
                            </Box>
                            
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">Tiền đặt cọc tối thiểu:</Typography>
                                <Typography fontWeight="bold" color="warning.main">{formatCurrency(auction.depositAmount)}</Typography>
                            </Box>
                            
                            {/* CẬP NHẬT: Chỉ hiển thị Người thắng khi Ended */}
                            {isAuctionEnded && auction.winnerId ? (
                                <Box sx={{ width: '100%', mt: 3 }}>
                                    <Alert severity="info" icon={<CheckCircleIcon />}>
                                        <Typography fontWeight="bold" sx={{ mb: 1 }}>
                                            KẾT QUẢ TẠM THỜI (Đã kết thúc):
                                        </Typography>
                                        
                                        {/* Winner ID (Link) */}
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <AccountCircleIcon fontSize="small" />
                                            <Typography variant="body1">
                                                Người thắng: 
                                                <Button 
                                                    component={Link} 
                                                    to={`/users/${auction.winnerId}`} 
                                                    size="small" 
                                                    sx={{ textTransform: 'none', px: 1 }}
                                                    color="primary"
                                                >
                                                    **User ID: {auction.winnerId}**
                                                </Button>
                                                (Giá thắng: {formatCurrency(auction.currentPrice)})
                                            </Typography>
                                        </Stack>
                                    </Alert>
                                </Box>
                            ) : isAuctionEnded && !auction.winnerId ? (
                                <Box sx={{ width: '100%', mt: 3 }}>
                                    <Alert severity="info">
                                        <Typography fontWeight="bold">Phiên kết thúc không có người thắng:</Typography>
                                        <Typography>Chưa có lượt đặt giá hợp lệ.</Typography>
                                    </Alert>
                                </Box>
                            ) : null}
                        </Stack>
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
                                        bgcolor: bid.isWinning ? theme.palette.success.light + '10' : 'transparent',
                                        '&:last-child': { borderBottom: 'none' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <AccountCircleIcon color={bid.isWinning ? 'success' : 'action'} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography fontWeight="bold" color={bid.isWinning ? 'success.dark' : 'text.primary'}>
                                                {formatCurrency(bid.bidAmount)} 
                                                {bid.isWinning && <Chip label="Giá thắng" color="success" size="small" sx={{ ml: 1 }} />}
                                            </Typography>
                                        }
                                        secondary={`Bidder ID: ${bid.bidderId} | Thời gian: ${new Date(bid.createdAt).toLocaleTimeString('vi-VN')}`}
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
                            <Button size="small" sx={{ mt: 2 }} fullWidth startIcon={<VisibilityIcon />}>
                                Xem tất cả {auction.totalBidsCount} lượt đặt giá
                            </Button>
                        )}
                    </Paper>
                </Box>

                {/* --- B. ACTION (RIGHT - STICKY - 3/8) --- */}
                <Stack 
                    spacing={3} 
                    sx={{ 
                        width: { xs: '100%', md: '41.67%' }, 
                        position: 'sticky', 
                        top: 80, 
                        alignSelf: 'flex-start' ,
                        maxHeight: 'calc(100vh - 100px)',
                        overflowY: 'auto'
                    }}
                >
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[5] }}>
                        
                        <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                            {isAuctionActive ? 'Thời gian còn lại' : 'Trạng thái Phiên'}
                        </Typography>

                        <Alert 
                            severity={
                                isAuctionActive ? 'success' :
                                isAuctionEnded ? 'info' : 
                                (isAuctionPending ? 'warning' : 'error') // Cancelled
                            }
                        >
                            <Typography fontWeight="bold">
                                {isAuctionActive ? `Đang diễn ra: ${timeLeft}` : (
                                    isAuctionEnded ? 'Phiên đấu giá đã KẾT THÚC.' :
                                    isAuctionPending ? 'Phiên đang CHỜ DUYỆT.' : 
                                    'Phiên đã bị HỦY.'
                                )}
                            </Typography>
                        </Alert>
                        
                        <Divider sx={{ my: 3 }} />

                        {/* KHU VỰC HÀNH ĐỘNG ADMIN */}
                        <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
                            Hành động 
                        </Typography>
                        
                        {/* NÚT KÍCH HOẠT (ACTIVE) */}
                        <Button 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            size="large"
                            sx={{ mb: 2 }}
                            onClick={() => handleUpdateStatus(AuctionStatusValue.Active)}
                            disabled={actionLoading || isAuctionActive || isAuctionEnded || isAuctionCancelled}
                            startIcon={actionLoading && !isAuctionActive ? <CircularProgress size={24} color="inherit" /> : <AccessTimeIcon />}
                        >
                            {isAuctionActive ? 'Đang Active' : 'KÍCH HOẠT Đấu giá'}
                        </Button>
                        
                        {/* NÚT CHUYỂN VỀ PENDING (CHỜ DUYỆT) */}
                        <Button 
                            variant="outlined" 
                            color="info" 
                            fullWidth 
                            size="large"
                            sx={{ mb: 2 }}
                            onClick={() => handleUpdateStatus(AuctionStatusValue.Pending)}
                            disabled={actionLoading || isAuctionPending || isAuctionEnded || isAuctionCancelled}
                            startIcon={actionLoading && !isAuctionPending ? <CircularProgress size={24} color="inherit" /> : <AutorenewIcon />}
                        >
                            Chuyển về CHỜ DUYỆT (Pending)
                        </Button>

                        {/* NÚT HỦY (CANCELLED) */}
                        <Button 
                            variant="outlined" 
                            color="error" 
                            fullWidth 
                            size="large"
                            sx={{ mb: 2 }}
                            onClick={() => handleUpdateStatus(AuctionStatusValue.Cancelled)}
                            disabled={actionLoading || isAuctionCancelled}
                            startIcon={actionLoading && !isAuctionCancelled ? <CircularProgress size={24} color="inherit" /> : <BlockIcon />}
                        >
                            HỦY Đấu giá (Cancelled)
                        </Button>

                        <Divider sx={{ my: 2 }} />
                    </Paper>
                </Stack>
            </Stack>

            {/* Snackbar để hiển thị thông báo */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AuctionDetailPageSimple;