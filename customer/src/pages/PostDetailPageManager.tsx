import React, { useState, useEffect, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, Alert, Link as MuiLink,
    Card, CardContent, List, ListItem, ListItemText, ListItemIcon, 
    Dialog, DialogContent, IconButton, CircularProgress, 
    DialogTitle, DialogActions,
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';

// ICONS
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import FmdGoodIcon from '@mui/icons-material/FmdGood'; 
import AttachFileIcon from '@mui/icons-material/AttachFile'; 
import DownloadIcon from '@mui/icons-material/Download'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import CloseIcon from '@mui/icons-material/Close'; 
// ICONS CHO MANAGER ACTIONS
import GavelIcon from '@mui/icons-material/Gavel'; 
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; 
import StarIcon from '@mui/icons-material/Star'; 
import HomeIcon from '@mui/icons-material/Home'; 
import CategoryIcon from '@mui/icons-material/Category'; 
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import CheckIcon from '@mui/icons-material/Check'; // Duyệt (Available)
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'; // Chờ duyệt (Pending)
import BlockIcon from '@mui/icons-material/Block'; // Khóa (Block)
import PauseCircleIcon from '@mui/icons-material/PauseCircle'; // Tạm dừng (Suspended)
import SellIcon from '@mui/icons-material/Sell'; // Đã bán (SoldOut)
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'; // Xóa (Delete)

// --- IMPORT TỪ SERVICE FILE (GIẢ ĐỊNH) ---
// Giả định các hàm API
import { 
    type ProductStatus, 
    ProductStatusValue, 
    type SaleMethod, 
    SaleMethodValue, 
    type ProductData,
    getProductById, 
    updateProductStatusApi, 
    deletedProductApi, 
    // ⭐️ THÊM HÀM API GIẢ ĐỊNH MỚI
    updateSaleMethodApi, 
} from '../services/productService'; 


// --- KHAI BÁO CÁC GIÁ TRỊ CONSTANT CHO PRODUCT TYPE ---
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

// --- INTERFACE CHUẨN HÓA (Dành cho Manager UI) ---
interface PostDetail extends ProductData { 
    rating: number; 
    count: number;
}

// --- FAKE DATA cho ĐÁNH GIÁ SẢN PHẨM ---
const getFakeUIData = (productId: number): { rating: number, count: number } => {
    if (productId === 1) return { rating: 4.8, count: 45 };
    if (productId === 2) return { rating: 3.5, count: 12 };
    return { rating: 0, count: 0 };
};

// --- HELPER FUNCTIONS (Status Chip) ---
const getSaleMethodChip = (method: SaleMethod): JSX.Element => {
    if (method === SaleMethodValue.Auction) {
        return <Chip label="Đấu giá" color="warning" icon={<GavelIcon style={{fontSize: 16}}/>} size="small" />;
    }
    return <Chip label="Giá cố định" color="primary" icon={<ShoppingCartIcon style={{fontSize: 16}}/>} size="small" />;
};

const getStatusChip = (status: ProductStatus): JSX.Element => {
    switch(status) {
        case ProductStatusValue.Available:
            return <Chip label="Còn hàng (Đã duyệt)" color="success" icon={<CheckIcon style={{fontSize: 16}}/>} size="small" />;
        case ProductStatusValue.Pending:
            return <Chip label="Chờ duyệt" color="info" icon={<HourglassEmptyIcon style={{fontSize: 16}}/>} size="small" />;
        case ProductStatusValue.SoldOut:
            return <Chip label="Đã bán" color="error" icon={<SellIcon style={{fontSize: 16}}/>} size="small" />;
        case ProductStatusValue.Block:
            return <Chip label="Đã khóa" color="error" icon={<BlockIcon style={{fontSize: 16}}/>} size="small" />;
        case ProductStatusValue.Suspended:
            return <Chip label="Tạm dừng" color="warning" icon={<PauseCircleIcon style={{fontSize: 16}}/>} size="small" />;
        default:
            return <Chip label="Không rõ trạng thái" color="default" size="small" />;
    }
}


const PostDetailPageManager: React.FC = () => {
    const { postId } = useParams<{ postId: string }>(); 
    const navigate = useNavigate();
    const theme = useTheme();

    const [product, setProduct] = useState<PostDetail | null>(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); 
    const [openImageModal, setOpenImageModal] = useState(false);
    
    // ⭐️ STATE CHO PDF VIEWER (iframe)
    const [showPdfViewer, setShowPdfViewer] = useState(false); 

    // ⭐️ STATE CHO CẬP NHẬT TRẠNG THÁI & XÓA
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionToPerform, setActionToPerform] = useState<'status' | 'delete' | 'saleMethod' | null>(null); // THÊM 'saleMethod'
    const [newStatus, setNewStatus] = useState<ProductStatus | null>(null);
    const [processing, setProcessing] = useState(false);
    
    // ⭐️ STATE MỚI CHO CẬP NHẬT PHƯƠNG THỨC BÁN HÀNG
    const [newSaleMethod, setNewSaleMethod] = useState<SaleMethod | null>(null);
    const [showSaleMethodModal, setShowSaleMethodModal] = useState(false);


    // --- GỌI API VÀ XỬ LÝ DATA ---
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            const idNumber = parseInt(postId || '0');

            if (idNumber > 0) {
                try {
                    const fetchedProductData: ProductData = await getProductById(idNumber);
                    const uiData = getFakeUIData(idNumber);

                    setProduct({
                        ...fetchedProductData,
                        ...uiData, 
                    } as PostDetail);

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


    // --- HÀM XỬ LÝ CẬP NHẬT TRẠNG THÁI VÀ XÓA ---
    const confirmAction = (action: ProductStatus | 'delete') => {
        if (!product || processing) return;
        
        setActionToPerform(action === 'delete' ? 'delete' : 'status');
        setNewStatus(action === 'delete' ? null : action);
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        if (!product || processing) return;
        
        setProcessing(true);
        setShowConfirmModal(false); 

        try {
            if (actionToPerform === 'delete') {
                await deletedProductApi(product.productId);
                alert('Xóa sản phẩm thành công (Xóa mềm).');
                navigate('/manage-posts'); 
            } else if (actionToPerform === 'status' && newStatus !== null) { 
                await updateProductStatusApi(product.productId, newStatus);
                const statusName = Object.keys(ProductStatusValue).find(key => ProductStatusValue[key as keyof typeof ProductStatusValue] === newStatus);
                alert(`Cập nhật trạng thái thành công: ${statusName}`);
                setProduct(prev => prev ? { ...prev, statusProduct: newStatus } : null); 
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định.';
            setError(`Thực hiện hành động thất bại: ${msg}`);
        } finally {
            setProcessing(false);
            setActionToPerform(null);
            setNewStatus(null);
        }
    };
    
    // ⭐️ HÀM XỬ LÝ CẬP NHẬT PHƯƠNG THỨC BÁN HÀNG
    const confirmSaleMethodUpdate = (method: SaleMethod) => {
        if (!product || processing) return;
        
        setActionToPerform('saleMethod');
        setNewSaleMethod(method);
        setShowSaleMethodModal(true);
    };
    
    const handleConfirmSaleMethodUpdate = async () => {
        if (!product || processing || newSaleMethod === null) return;
        
        setProcessing(true);
        setShowSaleMethodModal(false);
        
        try {
            await updateSaleMethodApi(product.productId, newSaleMethod);
            const methodName = Object.keys(SaleMethodValue).find(key => SaleMethodValue[key as keyof typeof SaleMethodValue] === newSaleMethod);
            alert(`Cập nhật phương thức bán hàng thành công: ${methodName}`);
            setProduct(prev => prev ? { ...prev, methodSale: newSaleMethod } : null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định.';
            setError(`Thực hiện hành động thất bại: ${msg}`);
        } finally {
            setProcessing(false);
            setActionToPerform(null);
            setNewSaleMethod(null);
        }
    }
    
    // --- CÁC HÀM XỬ LÝ UI KHÁC ---
    const handleOpenImageModal = () => {
        if (product?.imageUrl) {
            setOpenImageModal(true);
        }
    };
    const handleCloseImageModal = () => {
        setOpenImageModal(false);
    };
    
    // ⭐️ HÀM XỬ LÝ XEM TỆP (Chỉ đổi trạng thái)
    const handleViewFile = (url: string | null) => {
        if (!url || !url.toLowerCase().endsWith('.pdf')) {
            // Nếu không phải PDF hoặc không có URL, chỉ mở tab mới để xem file (nếu có)
            if (url) {
                window.open(url, '_blank');
            }
            return;
        }
        
        // Nếu là PDF, chỉ bật/tắt trình xem nhúng
        setShowPdfViewer(prev => !prev);
    };
    
    const handleDownloadFile = (url: string | null, title: string) => {
        if (url) {
            window.open(url, '_blank');
            console.log(`Downloading file for: ${title}`);
        } else {
            console.error('Không có tệp đính kèm.');
        }
    }
    
    // Kiểm tra xem file đính kèm có phải là PDF hay không
    const isPdf = product?.fileUrl?.toLowerCase().endsWith('.pdf');
    
    // --- RENDER LOAD/ERROR ---
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
                <Button variant="contained" onClick={() => navigate('/manage-posts')} sx={{ mt: 2 }}>
                    <HomeIcon sx={{ mr: 1 }}/> Về Trang Quản lý
                </Button>
            </Alert>
        );
    }

    // --- Breadcrumbs logic ---
    const categoryInfo = getCategoryLinkInfo(product.productType ?? -1);
    const CategoryLinkIcon = categoryInfo.icon;
    
    // --- RENDER CHÍNH ---
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            
            {/* Breadcrumbs (Manager) */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Trang Quản lý
                </Link>
                {' / '}
                <Link to="/manage-posts" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <AssignmentIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Danh sách Tin đăng
                </Link>
                {' / '}
                <MuiLink color="text.primary" sx={{ fontWeight: 'bold' }}>
                    {product.title}
                </MuiLink>
            </Typography>
            
            {/* Tiêu đề chính */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <AssignmentIcon color="primary" sx={{ fontSize: '2.5rem' }} /> 
                <Typography variant="h4" fontWeight="bold">
                    {product.title}
                </Typography>
            </Stack>

            {/* Trạng thái hiện tại của tin đăng */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="span" sx={{ mr: 1 }}>Trạng thái hiện tại:</Typography>
                {getStatusChip(product.statusProduct)}
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                
                {/* --- A. THÔNG TIN CƠ BẢN & NỘI DUNG (65%) --- */}
                <Card sx={{ width: { xs: '100%', md: '65%' }, p: 1 }}>
                    <CardContent>
                        
                        {/* HÌNH ẢNH & TÊN SẢN PHẨM & GIÁ & LOẠI TIN */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
                            
                            {/* HÌNH ẢNH LỚN HƠN */}
                            <Box 
                                sx={{ 
                                    width: 200, height: 200, minWidth: 200,
                                    bgcolor: theme.palette.grey[200], borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', cursor: product.imageUrl ? 'zoom-in' : 'default',
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
                                    {product.isSpam && <Chip label="SPAM" color="error" size="small" />}
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
                            <ListItem disableGutters>
                                <ListItemIcon><VerifiedIcon color="info" /></ListItemIcon>
                                <ListItemText primary="Thẻ Đăng ký (Manager view)" secondary={product.registrationCard || 'Không cung cấp'} />
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
                                            // ⭐️ HÀM GỌI ĐỂ BẬT/TẮT TRÌNH XEM PDF
                                            onClick={() => handleViewFile(product.fileUrl)}
                                            disabled={!product.fileUrl}
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
                        
                        {/* ⭐️ TRÌNH XEM PDF NHÚNG (IFRAME) */}
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

                {/* --- B. MANAGER ACTIONS (35% - STICKY) --- */}
                <Stack sx={{ 
                    width: { xs: '100%', md: '35%' },
                    alignSelf: 'flex-start', 
                    position: 'sticky', 
                    top: theme.spacing(10), 
                }} spacing={3}>
                    
                    {/* HÀNH ĐỘNG CẬP NHẬT PHƯƠNG THỨC BÁN HÀNG */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2], textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Quản lý Phương thức Bán hàng
                        </Typography>
                        <Stack spacing={1} direction="column">
                            {/* Nút chuyển sang Đấu giá */}
                            <Button 
                                startIcon={<GavelIcon />} 
                                variant="outlined" 
                                color="warning" 
                                fullWidth
                                disabled={product.methodSale === SaleMethodValue.Auction || processing}
                                onClick={() => confirmSaleMethodUpdate(SaleMethodValue.Auction)}
                            >
                                Chuyển sang Đấu giá
                            </Button>
                            {/* Nút chuyển sang Giá cố định */}
                            <Button 
                                startIcon={<ShoppingCartIcon />} 
                                variant="outlined" 
                                color="primary" 
                                fullWidth
                                disabled={product.methodSale === SaleMethodValue.FixedPrice || processing}
                                onClick={() => confirmSaleMethodUpdate(SaleMethodValue.FixedPrice)}
                            >
                                Chuyển sang Giá cố định
                            </Button>
                        </Stack>
                    </Paper>
                    
                    {/* HÀNH ĐỘNG CẬP NHẬT TRẠNG THÁI */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2], textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Quản lý Trạng thái Tin đăng
                        </Typography>
                        
                        <Stack spacing={1} direction="column">

                            <Button 
                                startIcon={<SellIcon />} 
                                variant="outlined" 
                                color="primary" 
                                fullWidth
                                disabled={product.statusProduct === ProductStatusValue.SoldOut || product.statusProduct !== ProductStatusValue.Available || processing}
                                onClick={() => confirmAction(ProductStatusValue.SoldOut)}
                            >
                                Đánh dấu Đã bán
                            </Button>
                            
                            <Button 
                                startIcon={<PauseCircleIcon />} 
                                variant="outlined" 
                                color="warning" 
                                fullWidth
                                disabled={product.statusProduct === ProductStatusValue.Suspended || product.statusProduct !== ProductStatusValue.Available || processing}
                                onClick={() => confirmAction(ProductStatusValue.Suspended)}
                            >
                                Tạm dừng (Suspended)
                            </Button>

                            <Divider sx={{ my: 1 }} />
                            
                            {/* NÚT XÓA MỀM */}
                            <Button 
                                startIcon={<DeleteForeverIcon />} 
                                variant="contained"
                                color="error" 
                                fullWidth
                                disabled={processing}
                                onClick={() => confirmAction('delete')}
                            >
                                Xóa Tin đăng (Soft Delete)
                            </Button>
                        </Stack>
                        
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
                            position: 'absolute', right: 8, top: 8,
                            color: 'white', zIndex: 10,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img 
                            src={product.imageUrl} 
                            alt={product.productName} 
                            style={{ 
                                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' 
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* --- D. CONFIRMATION MODAL (STATUS & DELETE) --- */}
            <Dialog
                open={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
            >
                <DialogTitle>{actionToPerform === 'delete' ? "Xác nhận Xóa Tin đăng" : "Xác nhận Cập nhật Trạng thái"}</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn thực hiện hành động này không?
                        <br/>
                        {actionToPerform === 'delete' ? (
                            <Typography component="span" fontWeight="bold" color="error">Hành động này sẽ xóa mềm tin đăng (DELETE).</Typography>
                        ) : (
                            <Typography component="span" fontWeight="bold" color="primary">Tin đăng sẽ được chuyển sang trạng thái: {Object.keys(ProductStatusValue).find(key => ProductStatusValue[key as keyof typeof ProductStatusValue] === newStatus)}.</Typography>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmModal(false)} color="inherit">Hủy</Button>
                    <Button 
                        onClick={handleConfirm} 
                        color={actionToPerform === 'delete' ? 'error' : 'primary'} 
                        variant="contained" 
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {processing ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* ⭐️ E. CONFIRMATION MODAL (SALE METHOD) --- */}
            <Dialog
                open={showSaleMethodModal}
                onClose={() => setShowSaleMethodModal(false)}
            >
                <DialogTitle>Xác nhận Cập nhật Phương thức Bán hàng</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn chuyển phương thức bán hàng thành 
                        <Typography component="span" fontWeight="bold" color="warning" sx={{ mx: 0.5 }}>
                            {newSaleMethod === SaleMethodValue.Auction ? 'Đấu giá (Auction)' : 'Giá cố định (FixedPrice)'}
                        </Typography>
                        không?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSaleMethodModal(false)} color="inherit">Hủy</Button>
                    <Button 
                        onClick={handleConfirmSaleMethodUpdate} 
                        color='primary' 
                        variant="contained" 
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {processing ? 'Đang xử lý...' : 'Xác nhận Chuyển đổi'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PostDetailPageManager;