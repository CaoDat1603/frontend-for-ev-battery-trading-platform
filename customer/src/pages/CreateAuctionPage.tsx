import React, { useState, useMemo, useEffect, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Chip, Button, Alert, 
    CircularProgress, TextField,
    Step, Stepper, StepLabel, StepContent
} from '@mui/material';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';

// ICONS
import GavelIcon from '@mui/icons-material/Gavel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; 
import PaymentIcon from '@mui/icons-material/Payment';

// --- IMPORTS THỰC TẾ ---
import { type ProductData, getProductById } from '../services/productService'; 

// --- IMPORTS HÀM API ĐẤU GIÁ VÀ ĐẶT GIÁ THỰC TẾ ---
import { 
    AuctionStatusValue, 
    DepositStatusValue, 
    type AuctionStatus, 
    type Bid, 
    type AuctionDetailData,
    createAuctionApi,  
    createBidApi,    
    getAuctionDetail,      // <-- ĐÃ THÊM: Để tải lại dữ liệu chi tiết
    updateAuctionStatusApi, // <-- ĐÃ THÊM: Để chuyển trạng thái sang Active
} from '../services/auctionService'; 


// Hàm formatCurrency (Giữ lại)
const formatCurrency = (amount: number): string => 
    `${amount.toLocaleString('vi-VN')} VND`;

const getStatusChip = (status: AuctionStatus): JSX.Element => {
    switch (status) {
        case AuctionStatusValue.Active: return <Chip label="Đang diễn ra" color="success" icon={<AccessTimeIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Ended: return <Chip label="Đã kết thúc" color="warning" icon={<BlockIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Completed: return <Chip label="Hoàn tất" color="primary" icon={<CheckCircleIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Cancelled: return <Chip label="Đã hủy" color="error" icon={<BlockIcon style={{ fontSize: 16 }} />} />;
        case AuctionStatusValue.Pending:
        default: return <Chip label="Chờ duyệt/Bắt đầu" color="default" icon={<HistoryIcon style={{ fontSize: 16 }} />} />;
    }
};

// --- DỮ LIỆU KHỞI TẠO (Không đổi) ---
const AUCTION_DURATION_DAYS = 5; 

const calculateEndTime = (now: Date): string => {
    return new Date(now.getTime() + AUCTION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
};

const getInitialData = (productId: number, product: ProductData | null): AuctionDetailData => {
    const now = new Date();
    const startTimePending = new Date(now.getTime() + 60 * 1000).toISOString(); 
    const endTime = calculateEndTime(now);
    
    const startingPrice = product?.price || 0;
    const productTitle = product?.title || `Sản phẩm ID ${productId} (Đang tải...)`;
    const productImageUrl = product?.imageUrl || null;
    
    const calculatedDeposit = Math.max(500000, startingPrice * 0.1); 
    
    return {
        auctionId: 0, 
        productId: productId, 
        productTitle: productTitle,
        productImageUrl: productImageUrl,
        winnerId: null,
        startingPrice: startingPrice,
        currentPrice: startingPrice, 
        depositAmount: calculatedDeposit, 
        status: startingPrice > 0 ? AuctionStatusValue.Pending : AuctionStatusValue.Cancelled, 
        startTime: startTimePending, 
        endTime: endTime, 
        createdAt: new Date().toISOString(),
        sellerEmail: product?.author || null, 
        sellerPhone: null, 
    } as AuctionDetailData; 
};


// --- COMPONENT CHÍNH ---
const CreateAuctionPage: React.FC = () => {
    const { productId, sellerId } = useParams<{ productId: string; sellerId: string }>(); 
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    // GIẢ ĐỊNH DỮ LIỆU
    const DUMMY_SELLER_EMAIL = 'seller@example.com'; 
    const DUMMY_SELLER_PHONE = '0901234567';
    const DUMMY_BIDDER_ID = 100; // ID người dùng hiện tại

    const idNumber = useMemo(() => parseInt(productId || '0'), [productId]); 

    const sellerIdFromUrl = useMemo(() => parseInt(sellerId || '0'), [sellerId]); 

    const [productDetail, setProductDetail] = useState<ProductData | null>(null);
    const [isFetchingProduct, setIsFetchingProduct] = useState(true);

    const initialAuctionState = useMemo(() => idNumber > 0 ? getInitialData(idNumber, productDetail) : null, [idNumber, productDetail]);
    const [auction, setAuction] = useState<AuctionDetailData | null>(initialAuctionState); 
    const [loading, setLoading] = useState(false);
    
    const minInputBid = auction ? auction.startingPrice : 0;
    const [currentBidAmount, setCurrentBidAmount] = useState<number>(minInputBid);
    
    // --- [NEW] STATE QUẢN LÝ THANH TOÁN CỌC ---
    const [paymentTransactionId, setPaymentTransactionId] = useState<number | null>(null);

    // --- [NEW] EFFECT KIỂM TRA THANH TOÁN TỪ URL ---
    useEffect(() => {
        //const status = searchParams.get("paymentStatus");
        const txIdParam = searchParams.get("transactionId");

        setPaymentTransactionId(Number(txIdParam));
    }, [searchParams]);

    // --- [NEW] HÀM CHUYỂN HƯỚNG SANG TRANG THANH TOÁN (INVOICE) ---
    const handleGoToDeposit = () => {
        if (!auction) return;

        // Lấy URL hiện tại để trang Invoice biết đường quay lại
        const currentPath = window.location.pathname + window.location.search;

        navigate(`/invoice-detail/${idNumber}/${auction.productId}`, {
            state: {
                productId: auction.productId,
                title: `Đặt cọc phiên đấu giá: ${auction.productTitle}`,
                productName: auction.productTitle,
                price: auction.depositAmount, // Số tiền cần thanh toán là tiền cọc
                sellerId: sellerIdFromUrl, // Hoặc ID hệ thống nhận cọc
                productType: 3, // [QUAN TRỌNG] Type 4: Phí/Cọc đấu giá
                
                returnUrl: currentPath // Truyền link để quay về
            }
        });
    };
    // --- EFFECT LẤY DỮ LIỆU SẢN PHẨM THỰC TẾ (Không đổi) ---
    useEffect(() => {
        if (idNumber > 0) {
            setIsFetchingProduct(true);
            
            getProductById(idNumber)
                .then(product => {
                    setProductDetail(product);
                    
                    const initialData = getInitialData(idNumber, product);
                    setAuction(initialData);
                    setCurrentBidAmount(initialData.startingPrice); 
                })
                .catch(err => {
                    console.error("Lỗi lấy chi tiết sản phẩm:", err);
                    setAuction(null); 
                })
                .finally(() => {
                    setIsFetchingProduct(false);
                });
        }
    }, [idNumber]);

    // Đồng bộ giá khởi điểm (Không đổi)
    useEffect(() => {
        if (auction && auction.startingPrice > 0) {
            setCurrentBidAmount(auction.startingPrice);
        }
    }, [auction]);


    const error = idNumber <= 0 ? `Product ID không hợp lệ: ${productId}` : null;
    
    // --- HÀM XỬ LÝ CHÍNH ĐÃ SỬA ĐỔI (TUẦN TỰ 4 BƯỚC) ---
    const handlePlaceBidAndActivate = async () => {
        if (!auction || auction.status !== AuctionStatusValue.Pending) {
            alert('Chỉ có thể kích hoạt khi phiên ở trạng thái Chờ duyệt.');
            return;
        }

        if (currentBidAmount < auction.startingPrice) {
            alert(`Giá đặt tối thiểu phải là Giá khởi điểm: ${formatCurrency(auction.startingPrice)}!`);
            return;
        }
        
        setLoading(true);
        
        try {
            let newAuctionId = auction.auctionId;

            // 1. GỌI API TẠO AUCTION THỰC TẾ
            if (newAuctionId === 0) {
                console.log('--- CALL API: createAuctionApi ---');
                const createAuctionResponse = await createAuctionApi(
                    auction.productId,
                    auction.startingPrice,
                    auction.startTime, 
                    auction.endTime,
                    DUMMY_SELLER_EMAIL, 
                    DUMMY_SELLER_PHONE 
                );
                newAuctionId = createAuctionResponse.auctionId;
                
                // Cập nhật tạm auctionId trên UI
                setAuction(prev => prev ? ({ ...prev, auctionId: newAuctionId }) : null);
            }
            
            // Đảm bảo có ID để thực hiện các bước tiếp theo
            if (newAuctionId === 0) throw new Error("Không thể lấy Auction ID sau khi tạo.");

            // 2. GỌI API CHUYỂN TRẠNG THÁI SANG ACTIVE 
            console.log(`--- CALL API: updateAuctionStatusApi (Auction #${newAuctionId} -> Active) ---`);
            await updateAuctionStatusApi(
                newAuctionId,
                AuctionStatusValue.Active 
            );
            
            // Cập nhật UI tạm thời (optional)
            setAuction(prev => prev ? ({ ...prev, status: AuctionStatusValue.Active }) : null);


            // 3. GỌI API TẠO BID ĐẦU TIÊN THỰC TẾ (Sử dụng giá đã nhập)
            console.log('--- CALL API: createBidApi ---');
            await createBidApi(
                newAuctionId,
                DUMMY_BIDDER_ID, 
                String(currentBidAmount), 
                DUMMY_SELLER_EMAIL, // Giả định người bán cũng là người đặt bid đầu tiên
                DUMMY_SELLER_PHONE,
                paymentTransactionId ? paymentTransactionId : undefined
            ); 

            // 4. LẤY LẠI DỮ LIỆU CHÍNH XÁC TỪ SERVER 
            console.log(`--- CALL API: getAuctionDetail (Refresh Data for #${newAuctionId}) ---`);
            const finalAuctionDetail = await getAuctionDetail(newAuctionId);
            setAuction(finalAuctionDetail);
            
            alert(`Thành công! Phiên đấu giá #${newAuctionId} đã được KÍCH HOẠT và bạn đã Đặt giá đầu tiên ${formatCurrency(finalAuctionDetail.currentPrice)}!`);

        } catch (err) {
            console.error('Lỗi khi Tạo Auction/Cập nhật Status/Đặt Bid:', err);
            const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
            alert(`Đã xảy ra lỗi: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    // --- KẾT THÚC HÀM XỬ LÝ CHÍNH ĐÃ SỬA ĐỔI ---

    // Hàm hiển thị giá trị hoặc "A/N" (Không đổi)
    const displayValue = (value: string | number | null | undefined): string | JSX.Element => {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return <Typography component="span" fontStyle="italic" color="text.disabled">A/N</Typography>;
        }
        if (typeof value === 'number') return formatCurrency(value);
        return value;
    };
    
    const isAuctionPending = auction?.status === AuctionStatusValue.Pending;

    if (error || isFetchingProduct || !auction) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="50vh">
                {isFetchingProduct ? (
                    <CircularProgress />
                ) : (
                    <Alert severity="error" sx={{ m: 3 }}>
                        <Typography fontWeight="bold">Lỗi:</Typography>
                        <Typography>{error || 'Không thể tải chi tiết sản phẩm hoặc Sản phẩm không tồn tại.'}</Typography>
                        <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }} startIcon={<HomeIcon />}>
                            Về Trang chủ
                        </Button>
                    </Alert>
                )}
                {isFetchingProduct && <Typography sx={{ mt: 2 }}>Đang tải thông tin sản phẩm...</Typography>}
            </Box>
        );
    }
    
    if (loading) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Đang thực hiện hành động: **Tạo Auction**, **Kích hoạt** và **Đặt Bid đầu tiên**...</Typography>
            </Box>
        );
    }

    // Nếu đã tải xong và có dữ liệu auction (Không đổi)
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Trang chủ
                </Link>
                {' / '}
                <Typography component="span" color="text.primary" fontWeight="bold">
                    Khởi tạo Phiên Đấu giá cho Sản phẩm #{auction.productId}
                </Typography>
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <GavelIcon color="primary" sx={{ fontSize: '2.5rem' }} /> 
                <Typography variant="h4" fontWeight="bold">
                    Sản phẩm: {auction.productTitle}
                </Typography>
                {getStatusChip(auction.status)}
                {auction.auctionId > 0 && 
                    <Chip label={`Auction ID: ${auction.auctionId}`} color="info" size="small" variant="outlined" />
                }
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                
                {/* --- A. THÔNG TIN CƠ BẢN (LEFT) --- */}
                <Box sx={{ width: { xs: '100%', md: '58.33%' } }}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        
                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mt: 1, mb: 2 }}>
                            Thông tin Phiên Đấu giá
                        </Typography>
                        
                        <Stack direction="row" flexWrap="wrap" spacing={2} sx={{ mb: 2 }}>
                            
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Giá khởi điểm (Product Price):</Typography>
                                <Typography variant="h6" fontWeight="bold">{displayValue(auction.startingPrice)}</Typography>
                            </Box>

                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Tiền đặt cọc (Giả định):</Typography>
                                <Typography fontWeight="bold" color="warning.main">{displayValue(auction.depositAmount)}</Typography>
                            </Box>
                            
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Thời gian dự kiến bắt đầu:</Typography>
                                <Typography>{auction.startTime ? new Date(auction.startTime).toLocaleString('vi-VN') : displayValue(null)}</Typography>
                            </Box>
                            
                            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}> 
                                <Typography variant="body2" color="text.secondary">Thời gian kết thúc (5 ngày):</Typography>
                                <Typography fontWeight="bold" color="error.main">{auction.endTime ? new Date(auction.endTime).toLocaleString('vi-VN') : displayValue(null)}</Typography>
                            </Box>

                             <Box sx={{ width: '100%' }}> 
                                <Typography variant="body2" color="text.secondary">Email/Tác giả Người bán:</Typography>
                                <Typography>{displayValue(auction.sellerEmail)}</Typography>
                            </Box>

                        </Stack>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <HistoryIcon color="info" />
                            <Typography variant="h6" fontWeight="bold">Lịch sử Đặt giá</Typography>
                        </Stack>
                        <Alert severity="info">
                                Phiên đấu giá đang **Chờ kích hoạt**, chưa có lịch sử đặt giá.
                        </Alert>
                    </Paper>
                </Box>

                {/* --- B. HÀNH ĐỘNG (RIGHT - STICKY) --- */}
                <Stack spacing={3} sx={{ width: { xs: '100%', md: '41.67%' }, position: 'sticky', top: theme.spacing(10), alignSelf: 'flex-start' }}>
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[5] }}>
                        <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                            Quy trình Kích hoạt
                        </Typography>

                        {!isAuctionPending ? (
                            <Alert severity="success">
                                <Typography fontWeight="bold">Phiên đã Active!</Typography>
                                <Button component={Link} to={`/auction/${auction.auctionId}`} variant="outlined" sx={{ mt: 1 }}>
                                    Xem Chi Tiết
                                </Button>
                            </Alert>
                        ) : (
                            /* --- SỬ DỤNG STEPPER ĐỂ HIỂN THỊ QUY TRÌNH 2 BƯỚC --- */
                            <Stepper orientation="vertical" activeStep={paymentTransactionId ? 1 : 0}>
                                
                                {/* BƯỚC 1: THANH TOÁN CỌC */}
                                <Step expanded={true}>
                                    <StepLabel 
                                        optional={paymentTransactionId ? <Typography variant="caption" color="success.main">Đã hoàn thành</Typography> : null}
                                        error={!paymentTransactionId}
                                    >
                                        <Typography fontWeight="bold">Bước 1: Đặt cọc phiên đấu giá</Typography>
                                    </StepLabel>
                                    <StepContent>
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            Bạn cần thanh toán khoản cọc <b>{formatCurrency(auction.depositAmount)}</b> để đảm bảo tính xác thực của phiên đấu giá.
                                        </Typography>
                                        
                                        {paymentTransactionId ? (
                                            <Alert severity="success" icon={<CheckCircleIcon />}>
                                                Đã thanh toán thành công.<br/>Mã GD: <b>#{paymentTransactionId}</b>
                                            </Alert>
                                        ) : (
                                            <Button 
                                                variant="contained" 
                                                color="warning" 
                                                fullWidth 
                                                startIcon={<PaymentIcon />}
                                                onClick={handleGoToDeposit}
                                            >
                                                Thanh toán Cọc ngay
                                            </Button>
                                        )}
                                    </StepContent>
                                </Step>

                                {/* BƯỚC 2: KÍCH HOẠT VÀ ĐẶT GIÁ */}
                                <Step expanded={true}>
                                    <StepLabel>
                                        <Typography fontWeight="bold">Bước 2: Đặt giá đầu & Kích hoạt</Typography>
                                    </StepLabel>
                                    <StepContent>
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            Nhập giá bạn muốn đặt (tối thiểu bằng giá khởi điểm) để mở phiên.
                                        </Typography>

                                        <TextField
                                            label="Số tiền muốn đặt (VND)"
                                            fullWidth
                                            type="number"
                                            value={currentBidAmount}
                                            onChange={(e) => setCurrentBidAmount(Math.max(minInputBid, parseInt(e.target.value) || 0))}
                                            disabled={!paymentTransactionId} // Khóa nếu chưa cọc
                                            sx={{ mb: 2 }}
                                        />

                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            fullWidth 
                                            size="large"
                                            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <AttachMoneyIcon />}
                                            onClick={handlePlaceBidAndActivate}
                                            // Khóa nút nếu chưa cọc HOẶC đang loading
                                            disabled={loading || !paymentTransactionId || currentBidAmount < minInputBid} 
                                        >
                                            {loading ? 'ĐANG XỬ LÝ...' : 'KÍCH HOẠT ĐẤU GIÁ'}
                                        </Button>
                                        
                                        {!paymentTransactionId && (
                                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                                * Vui lòng hoàn thành Bước 1 để mở khóa.
                                            </Typography>
                                        )}
                                    </StepContent>
                                </Step>
                            </Stepper>
                        )}
                    </Paper>
                </Stack>
            </Stack>
        </Box>
    );
};

export default CreateAuctionPage;