import React, { useState, useEffect, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, Alert, Link as MuiLink,
    Card, CardContent, List, ListItem, ListItemText, ListItemIcon, 
    Dialog, DialogContent, IconButton, CircularProgress
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';

// ICONS
import AssignmentIcon from '@mui/icons-material/Assignment'; // Icon thêm vào tiêu đề
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import FmdGoodIcon from '@mui/icons-material/FmdGood'; 
import AttachFileIcon from '@mui/icons-material/AttachFile'; 
import DownloadIcon from '@mui/icons-material/Download'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import CloseIcon from '@mui/icons-material/Close'; 
import GavelIcon from '@mui/icons-material/Gavel'; // Icon Đấu giá
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Icon Mua ngay
import StarIcon from '@mui/icons-material/Star'; // Icon Đánh giá
import HomeIcon from '@mui/icons-material/Home'; // Icon Trang chủ
import CategoryIcon from '@mui/icons-material/Category'; // Icon Danh mục
// ✅ ICON MỚI CHO DANH MỤC
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';

// --- IMPORT TỪ SERVICE FILE ---
import { 
    type ProductStatus, 
    ProductStatusValue,
    type ProductType, // Vẫn import Type
    type SaleMethod, 
    SaleMethodValue, 
    type ProductData,
    getProductById, // <-- Hàm API cần dùng
} from '../services/productService'; 

// --- KHAI BÁO CÁC GIÁ TRỊ CONSTANT CHO PRODUCT TYPE (Dựa trên context) ---
const PRODUCT_TYPE_VALUES = {
    ElectricBattery: 0,
    ElectricCarBattery: 1,
    ElectricScooterBattery: 2,
} as const;


// --- INTERFACE VÀ MAP CHO BREADCRUMBS ---
interface CategoryLinkInfo {
    name: string;
    icon: React.ElementType;
    path: string;
}

const getCategoryLinkInfo = (type: number): CategoryLinkInfo => {
    const defaultInfo: CategoryLinkInfo = { name: 'Danh mục khác', icon: CategoryIcon, path: '/categories' };

    switch (type) {
        case PRODUCT_TYPE_VALUES.ElectricCarBattery:
            return { name: 'Ô tô điện', icon: DirectionsCarIcon, path: '/car-ecycle' };
        case PRODUCT_TYPE_VALUES.ElectricScooterBattery:
            return { name: 'Xe máy điện', icon: TwoWheelerIcon, path: '/scooter-ecycle' };
        case PRODUCT_TYPE_VALUES.ElectricBattery:
            return { name: 'Pin xe điện', icon: BatteryChargingFullIcon, path: '/battery-ecycle' };
        default:
            return defaultInfo;
    }
};

// Hàm helper để chuyển đổi giá trị số sang chuỗi hiển thị
const getProductTypeString = (type: number): string => {
    // Sử dụng helper mới để lấy tên danh mục tiếng Việt
    return getCategoryLinkInfo(type).name;
};

// --- INTERFACE CHUẨN HÓA (Dành cho Client UI) ---
interface ProductDetail extends ProductData { 
    // Giữ nguyên ProductData DTO
    rating: number; // Thêm rating và count cho dễ xử lý review
    count: number;
    // Đã loại bỏ deadline
}

// --- FAKE DATA cho ĐÁNH GIÁ SẢN PHẨM ---
const getFakeUIData = (productId: number): { rating: number, count: number } => {
    // Đã loại bỏ deadline
    if (productId === 1) return { rating: 4.8, count: 45 };
    if (productId === 2) return { rating: 3.5, count: 12 };
    return { rating: 0, count: 0 };
};

// --- HELPER FUNCTIONS (Cập nhật để hiển thị cho Khách) ---
const getSaleMethodChip = (method: SaleMethod): JSX.Element => {
    if (method === SaleMethodValue.Auction) {
        return <Chip label="Đấu giá" color="warning" icon={<GavelIcon style={{fontSize: 16}}/>} size="small" />;
    }
    return <Chip label="Giá cố định" color="primary" icon={<ShoppingCartIcon style={{fontSize: 16}}/>} size="small" />;
};


const ProductDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>(); 
    const navigate = useNavigate();
    const theme = useTheme();

    const [product, setProduct] = useState<ProductDetail | null>(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); 

    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [openImageModal, setOpenImageModal] = useState(false);
    
    // --- GỌI API VÀ XỬ LÝ DATA ---
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            const idNumber = parseInt(postId || '0');

            if (idNumber > 0) {
                try {
                    // Giả lập lấy dữ liệu từ API
                    const fetchedProductData: ProductData = await getProductById(idNumber);
                    const uiData = getFakeUIData(idNumber);

                    // Chỉ hiển thị tin đăng đang 'Available' cho khách
                    if (fetchedProductData.statusProduct !== ProductStatusValue.Available) {
                        setError(`Tin đăng ${postId} đã bị gỡ, đã bán, hoặc đang chờ duyệt.`);
                        setProduct(null);
                    } else {
                        setProduct({
                            ...fetchedProductData,
                            ...uiData, 
                        } as ProductDetail);
                    }

                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
                    setError(`Không thể tải chi tiết tin đăng: ${errorMessage}`);
                    setProduct(null);
                }
            } else {
                setError(`ID Tin đăng không hợp lệ: ${postId}`);
                setProduct(null);
            }
            setLoading(false);
        };

        fetchProduct();
    }, [postId]);

    const handleOpenImageModal = () => {
        if (product?.imageUrl) {
            setOpenImageModal(true);
        }
    };
    const handleCloseImageModal = () => {
        setOpenImageModal(false);
    };

    const handleDownloadFile = (url: string | null, title: string) => {
        if (url) {
            window.open(url, '_blank');
            console.log(`Downloading file for: ${title}`);
        } else {
            // Thay thế alert bằng console log để tránh lỗi iFrame
            console.error('Không có tệp đính kèm.');
        }
    }
    
    // Hàm xử lý mua hàng/đấu giá (Giả lập)
    const handleAction = () => {
        if (!product) return;
        if (product.methodSale === SaleMethodValue.Auction) {
            console.log(`Sẵn sàng tham gia đấu giá cho sản phẩm ${product.productName}!`);
        } else {
            console.log(`Sản phẩm ${product.productName} đã được thêm vào giỏ hàng!`);
        }
        // Thay thế alert bằng console log/snackbar giả lập
    };

    const isPdf = product?.fileUrl?.toLowerCase().endsWith('.pdf');
    
    // --- 4. RENDER ---
    if (loading && !product) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
                <Typography sx={{ml: 2}}>Đang tải chi tiết tin đăng...</Typography>
            </Box>
        );
    }

    if (error || !product) {
        const displayId = postId || 'N/A';
        return (
            <Alert severity="error">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight="bold">Lỗi:</Typography>
                    <Chip label={displayId} color="error" size="small" variant="outlined" />
                    <Typography>{error || 'Không tìm thấy tin đăng.'}</Typography>
                </Stack>
                <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
                    <HomeIcon sx={{ mr: 1 }}/> Về Trang chủ
                </Button>
            </Alert>
        );
    }

    // --- Breadcrumbs logic MỚI ---
    const categoryInfo = getCategoryLinkInfo(product.productType ?? -1);
    const CategoryLinkIcon = categoryInfo.icon;
    
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Breadcrumbs */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Trang chủ
                </Link>
                {' / '}
                {/* ✅ CẬP NHẬT LINK DANH MỤC */}
                <Link to={categoryInfo.path} style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <CategoryLinkIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> {categoryInfo.name}
                </Link>
                {' / '}
                <MuiLink color="text.primary" sx={{ fontWeight: 'bold' }}>
                    {product.title}
                </MuiLink>
            </Typography>
            
            {/* Tiêu đề chính (Thêm Icon) */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                {/* ✅ THÊM ICON TRƯỚC TIÊU ĐỀ */}
                <AssignmentIcon color="primary" sx={{ fontSize: '2.5rem' }} /> 
                <Typography variant="h4" fontWeight="bold">
                    {product.title}
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                
                {/* --- A. THÔNG TIN CƠ BẢN & NỘI DUNG (65%) --- */}
                <Card sx={{ width: { xs: '100%', md: '65%' }, p: 1 }}>
                    <CardContent>
                        
                        {/* HÌNH ẢNH LỚN HƠN & TÊN SẢN PHẨM & GIÁ & LOẠI TIN */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
                            
                            {/* ✅ HÌNH ẢNH LỚN HƠN (200x200) */}
                            <Box 
                                sx={{ 
                                    width: 200, // Tăng kích thước
                                    height: 200, // Tăng kích thước
                                    minWidth: 200,
                                    bgcolor: theme.palette.grey[200], 
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    cursor: product.imageUrl ? 'zoom-in' : 'default',
                                }}
                                onClick={handleOpenImageModal}
                            >
                                {product.imageUrl ? (
                                    <img 
                                        src={product.imageUrl} 
                                        alt={product.productName} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Typography variant="caption" color="text.secondary">No Image</Typography>
                                )}
                            </Box>

                            {/* Tên Sản phẩm, Giá, Loại tin */}
                            <Stack spacing={1}>
                                {/* ✅ THÊM TÊN SẢN PHẨM Ở TRÊN GIÁ TIỀN */}
                                <Typography variant="h6" fontWeight="bold" color="text.primary">
                                    {product.productName}
                                </Typography>
                                
                                <Typography variant="caption" color="text.secondary">Giá bán:</Typography>
                                <Typography variant="h5" color="error" fontWeight="bold">
                                    {product.price.toLocaleString('vi-VN')} VND
                                </Typography>
                                
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                    {getSaleMethodChip(product.methodSale)}
                                    {product.isVerified && <Chip label="Đã kiểm định" color="success" icon={<VerifiedIcon style={{fontSize: 16}}/>} size="small" />}
                                    {product.statusProduct === ProductStatusValue.Available && <Chip label="Còn hàng" color="success" size="small" />}
                                </Stack>
                            </Stack>
                        </Stack>

                        <Divider sx={{ mb: 3 }} />

                        {/* Metadata */}
                        <List disablePadding dense>
                            <ListItem disableGutters>
                                <ListItemIcon><FmdGoodIcon color="warning" /></ListItemIcon>
                                <ListItemText primary="Địa điểm giao dịch" secondary={<Typography fontWeight="bold">{product.pickupAddress}</Typography>} />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                <ListItemText 
                                    primary="Người đăng" 
                                    secondary={<Box component="span" sx={{ fontWeight: 'bold' }}>
                                            {product.author || `User ID: ${product.sellerId}`} 
                                        </Box>}
                                />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon><AccessTimeIcon color="action" /></ListItemIcon>
                                <ListItemText primary="Ngày đăng" secondary={new Date(product.createdAt).toLocaleDateString()} />
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemIcon><CategoryIcon color="secondary" /></ListItemIcon>
                                <ListItemText primary="Danh mục sản phẩm" secondary={categoryInfo.name} />
                            </ListItem>
                        </List>
                        
                        <Divider sx={{ my: 3 }} />

                        {/* MÔ TẢ CHI TIẾT */}
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Mô tả chi tiết:</Typography>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.grey[100], whiteSpace: 'pre-wrap', mb: 3 }}>
                            <Typography variant="body1">
                                {product.description}
                            </Typography>
                        </Paper>

                        {/* TÀI LIỆU ĐÍNH KÈM */}
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Tài liệu đính kèm:</Typography>
                        <List disablePadding dense>
                            <ListItem disableGutters secondaryAction={
                                <Stack direction="row" spacing={1}>
                                    {isPdf && (
                                        <Button 
                                            variant="outlined" size="small" startIcon={<VisibilityIcon />}
                                            onClick={() => setShowPdfViewer(!showPdfViewer)}
                                        >
                                            {showPdfViewer ? 'Ẩn PDF' : 'Xem PDF'}
                                        </Button>
                                    )}
                                    <Button 
                                        variant="contained" size="small" startIcon={<DownloadIcon />}
                                        disabled={!product.fileUrl}
                                        onClick={() => handleDownloadFile(product.fileUrl, product.title)}
                                    >
                                        Tải xuống
                                    </Button>
                                </Stack>
                            }>
                                <ListItemIcon><AttachFileIcon color="info" /></ListItemIcon>
                                <ListItemText 
                                    primary="Tài liệu" 
                                    secondary={product.fileUrl ? product.fileUrl.split('/').pop() : 'Không có tệp đính kèm'}
                                />
                            </ListItem>
                        </List>
                        
                        {/* TRÌNH XEM PDF NHÚNG */}
                        {showPdfViewer && isPdf && product.fileUrl && (
                            <Box sx={{ mt: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: '4px', height: 600 }}>
                                <iframe 
                                    src={product.fileUrl} 
                                    title={`PDF Viewer for ${product.productName}`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                >
                                    Trình duyệt không hỗ trợ PDF. Vui lòng tải xuống.
                                </iframe>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* --- B. ACTION VÀ ĐÁNH GIÁ (35% - STICKY) --- */}
                <Stack sx={{ 
                    width: { xs: '100%', md: '35%' },
                    alignSelf: 'flex-start', 
                    position: 'sticky', 
                    top: theme.spacing(10), 
                }} spacing={3}>
                    
                    {/* HÀNH ĐỘNG MUA HÀNG/ĐẤU GIÁ */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2], textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            {product.methodSale === SaleMethodValue.Auction ? 'Tham gia Đấu giá' : 'Mua ngay'}
                        </Typography>
                        
                        <Button 
                            startIcon={product.methodSale === SaleMethodValue.Auction ? <GavelIcon /> : <ShoppingCartIcon />} 
                            variant="contained" 
                            color={product.methodSale === SaleMethodValue.Auction ? 'warning' : 'success'} 
                            size="large"
                            fullWidth
                            onClick={handleAction}
                        >
                            {product.methodSale === SaleMethodValue.Auction ? 'Đấu giá ngay' : 'Mua ngay'}
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {product.methodSale === SaleMethodValue.Auction 
                                ? 'Liên hệ người bán để biết chi tiết đấu giá.' 
                                : 'Đặt hàng để nhận hàng tận nơi.'}
                        </Typography>
                    </Paper>

                    {/* HIỂN THỊ ĐÁNH GIÁ SẢN PHẨM */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <StarIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">Đánh giá sản phẩm</Typography>
                        </Stack>
                        
                        {product.count > 0 ? (
                            <Box>
                                <Typography variant="h4" fontWeight="bold" color="primary">
                                    {product.rating.toFixed(1)}/5
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <StarIcon 
                                            key={i} 
                                            color={i <= Math.round(product.rating) ? 'warning' : 'disabled'} 
                                            fontSize="small"
                                        />
                                    ))}
                                    <Typography variant="body2" color="text.secondary">
                                        ({product.count} đánh giá)
                                    </Typography>
                                </Stack>
                                <Button size="small" variant="outlined" sx={{ mt: 1 }}>
                                    Xem tất cả đánh giá
                                </Button>
                            </Box>
                        ) : (
                            <Alert severity="info" sx={{ p: 1 }}>Chưa có đánh giá nào cho sản phẩm này.</Alert>
                        )}
                    </Paper>

                </Stack>
            </Stack>

            {/* --- C. IMAGE MODAL/DIALOG (Lightbox) --- */}
            {product.imageUrl && (
                <Dialog 
                    open={openImageModal} 
                    onClose={handleCloseImageModal} 
                    maxWidth="md" 
                    fullWidth
                    sx={{
                        '& .MuiDialog-paper': { 
                            bgcolor: 'rgba(0, 0, 0, 0.9)', 
                            maxWidth: '90vw', 
                            maxHeight: '90vh' 
                        }
                    }}
                >
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseImageModal}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'white',
                            zIndex: 10,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img 
                            src={product.imageUrl} 
                            alt={product.productName} 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain' 
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Box>
    );
};

export default ProductDetailPage;