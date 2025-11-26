import React, { useState, useEffect, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Divider, Chip, Button, Alert, Link as MuiLink,
    Card, CardContent, List, ListItem, ListItemText, ListItemIcon, 
    Dialog, DialogContent, IconButton, CircularProgress
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';

// ICONS
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import FmdGoodIcon from '@mui/icons-material/FmdGood'; 
import AttachFileIcon from '@mui/icons-material/AttachFile'; 
import DownloadIcon from '@mui/icons-material/Download'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import CloseIcon from '@mui/icons-material/Close'; 
import GavelIcon from '@mui/icons-material/Gavel';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';

// --- IMPORT TỪ SERVICE FILE (Product Service) ---
// Giả định các import này đã tồn tại và hoạt động
import { 
    type ProductStatus, 
    ProductStatusValue,
    type SaleMethod, 
    SaleMethodValue, 
    type ProductData,
    getProductById,
} from '../services/productService'; 

// --- IMPORT DỊCH VỤ ĐẤU GIÁ (Auction Service) ---
import { 
    searchAuction, 
    type AuctionDetailData, 
    type AuctionStatus 
} from '../services/auctionService'; 

import { UserService } from '../services/userService';

// --- CONSTANTS VÀ HELPERS ---
const PRODUCT_TYPE_VALUES = {
    ElectricBattery: 0,
    ElectricCarBattery: 1,
    ElectricScooterBattery: 2,
} as const;

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

interface ProductDetail extends ProductData { 
    rating: number;
    count: number;
    buyerId: number;
}

// FAKE DATA cho ĐÁNH GIÁ SẢN PHẨM
//const getFakeUIData = (productId: number): { rating: number, count: number } => {
//    if (productId === 1) return { rating: 4.8, count: 45 };
//    if (productId === 2) return { rating: 3.5, count: 12 };
//    // Giả lập ID 3 là SoldOut/Suspended để test
//    if (productId === 3) return { rating: 4.1, count: 20 }; 
//    return { rating: 0, count: 0 };
//};

const getSaleMethodChip = (method: SaleMethod): JSX.Element => {
    if (method === SaleMethodValue.Auction) {
        return <Chip label="Đấu giá" color="warning" icon={<GavelIcon style={{fontSize: 16}}/>} size="small" />;
    }
    return <Chip label="Giá cố định" color="primary" icon={<ShoppingCartIcon style={{fontSize: 16}}/>} size="small" />;
};

const getCurrentUserId = (): number => {
  const stored = localStorage.getItem('userId');
  return stored ? parseInt(stored, 10) : 0;
};

// ✅ CHỨC NĂNG: Lấy thông báo lỗi trạng thái cụ thể
const getUnavailableStatusMessage = (status: ProductStatus, postId: string | undefined): string => {
    
    switch (status) {
        case ProductStatusValue.Block:
            return `Tin đăng #${postId} đã bị **chặn** vĩnh viễn và không thể giao dịch.`;
        case ProductStatusValue.Pending:
            return `Tin đăng #${postId} đang **chờ duyệt** và chưa được kích hoạt bán.`;
        case ProductStatusValue.SoldOut: 
            return `Tin đăng #${postId} đã **bán hết** hoặc giao dịch đã hoàn tất.`;
        case ProductStatusValue.Suspended:
            return `Tin đăng #${postId} đã bị **tạm ngưng** do vi phạm quy tắc.`;
        case ProductStatusValue.Available:
        default:
            return `Tin đăng #${postId} không khả dụng (Trạng thái: ${status}).`;
    }
}

// ✅ CHỨC NĂNG: Lấy Chip hiển thị trạng thái
const getStatusChip = (status: ProductStatus): JSX.Element => {
    switch (status) {
        case ProductStatusValue.Available:
            return <Chip label="Còn hàng" color="success" size="small" />;
        case ProductStatusValue.SoldOut:
            return <Chip label="Đã bán hết" color="default" size="small" variant="outlined" />;
        case ProductStatusValue.Suspended:
            return <Chip label="Tạm ngưng" color="error" size="small" />;
        case ProductStatusValue.Block:
            return <Chip label="Bị chặn" color="error" size="small" />;
        case ProductStatusValue.Pending:
            return <Chip label="Chờ duyệt" color="info" size="small" />;
        default:
            return <Chip label={`Trạng thái: ${status}`} color="default" size="small" />;
    }
}
// --------------------------------------------------------------------------


const ProductDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>(); 
    const navigate = useNavigate();
    const theme = useTheme();

    const [product, setProduct] = useState<ProductDetail | null>(null); 
    const [loading, setLoading] = useState(true);
    // error: Chỉ dùng cho lỗi API (Không tìm thấy ID, Server lỗi)
    const [error, setError] = useState<string | null>(null); 
    // State để lưu thông điệp trạng thái (SoldOut/Suspended)
    const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null); 
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [openImageModal, setOpenImageModal] = useState(false);
    const [sellerName, setSellerName] = useState<string>('Đang tải...'); 

    const buyerId = getCurrentUserId();
    
    // --- GỌI API VÀ XỬ LÝ DATA ---
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            setUnavailableMessage(null);
            const idNumber = parseInt(postId || '0');

            if (idNumber > 0) {
                try {
                    const fetchedProductData: ProductData = await getProductById(idNumber);
                    //const uiData = getFakeUIData(idNumber);
                    
                    // ✅ BƯỚC 1: LUÔN set product data nếu fetch thành công (để hiển thị thông tin)
                    const productDetail: ProductDetail = {
                        ...fetchedProductData,
                        //...uiData, 
                        buyerId
                    } as ProductDetail;

                    setProduct(productDetail); 
                    
                    // ✅ BƯỚC 2: KIỂM TRA trạng thái và set thông báo vô hiệu hóa action
                    if (fetchedProductData.statusProduct !== ProductStatusValue.Available) {
                        const message = getUnavailableStatusMessage(
                            fetchedProductData.statusProduct, 
                            postId
                        );
                        setUnavailableMessage(message);
                    } 
                    
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
                    // Chỉ set Error và setProduct(null) khi lỗi fetch API/ID không hợp lệ
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

    useEffect(() => {
        // Chỉ chạy khi product đã được tải thành công và có sellerId
        if (product && product.sellerId) {
            const fetchSellerName = async (sellerId: number) => {
                setSellerName('Đang tải...'); // Set trạng thái tải
                try {
                    // Giả định UserService và getUserById đã được import
                    const userData = await UserService.getUserById(sellerId);
                    
                    // Giả định response data có trường 'fullname'
                    const name = `${userData.fullname || ''}`.trim();
                    
                    // Nếu tên trống, hiển thị ID hoặc một tên mặc định
                    setSellerName(name || `ID Người bán: ${sellerId}`); 
                } catch (error) {
                    console.error(`Lỗi khi lấy tên người bán (ID: ${sellerId}):`, error);
                    setSellerName(`ID Người bán: ${sellerId}`); // Hiển thị ID nếu lỗi
                }
            };
            
            fetchSellerName(product.sellerId);
        } else if (product && !product.sellerId) {
             // Trường hợp product đã load nhưng không có sellerId (ID = 0 hoặc null)
             setSellerName('Người bán không xác định'); 
        }
    }, [product?.sellerId]);

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
            console.error('Không có tệp đính kèm.');
        }
    }
    
    // Hàm xử lý Đấu giá (Omitted for brevity, assumed correct)
    const handleBidAction = async () => {
        if (!product) return;
        setIsActionLoading(true);
        try {
            const searchResults: AuctionDetailData[] = await searchAuction(
                null, null, null, null, null, null, null, null, null, null, null, null, 
                product.productId, 
                'newest', 1, 10
            );

            const activeAuction = searchResults.find(
                 (auction: any) => auction.status === 1 || auction.status === 0
            );
            
            if (activeAuction && activeAuction.auctionId) {
                const auctionId = activeAuction.auctionId; 
                console.log(`Tìm thấy Auction ID: ${auctionId}. Chuyển đến trang chi tiết đấu giá.`);
                navigate(`/detail-auction/${auctionId}/${product.sellerId}`);
            } else {
                const latestAuction = searchResults[0]; 
                if (latestAuction && latestAuction.auctionId) {
                     //alert(`Phiên đấu giá đã kết thúc. Chuyển đến xem kết quả: ${latestAuction.auctionId}`);
                     navigate(`/detail-auction/${latestAuction.auctionId}/${product.sellerId}`);
                } else {
                     //alert(`Sản phẩm chưa có phiên đấu giá nào. Tạo phiên đấu giá mới.`);
                     navigate(`/create-auction/${product.productId}/${product.sellerId}`)
                }
            }
        } catch (err) {
            console.error("Lỗi khi tìm kiếm hoặc điều hướng đấu giá:", err);
            alert("Lỗi kiểm tra trạng thái đấu giá. Vui lòng thử lại.");
        } finally {
            setIsActionLoading(false);
        }
    };

    // Hàm xử lý Mua hàng/Đấu giá 
    const handleAction = () => {
        // ✅ CHỈ CHO PHÉP ACTION KHI STATUS LÀ AVAILABLE
        if (!product || product.statusProduct !== ProductStatusValue.Available) return;
        
        if (product.methodSale === SaleMethodValue.Auction) {
            handleBidAction();
        } else {
            navigate(`/invoice-detail/${product.productId}`, {
                state: {
                    productId: product.productId,
                    title: product.title,
                    productName: product.productName,
                    price: product.price,
                    sellerId: product.sellerId,
                    productType: product.productType,
                },
            });
        }
    };

    const handleSellerClick = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        // Điều hướng đến trang xem hồ sơ người dùng
        navigate(`/view-user/${product?.sellerId}`);
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

    // Hiển thị lỗi chỉ khi KHÔNG CÓ DỮ LIỆU SẢN PHẨM (Lỗi fetch API)
    if (error && !product) {
        const displayId = postId || 'N/A';
        return (
            <Alert severity="error" sx={{ m: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight="bold">Lỗi:</Typography>
                    <Chip label={displayId} color="error" size="small" variant="outlined" />
                    <Typography dangerouslySetInnerHTML={{ __html: error || 'Không tìm thấy tin đăng.' }} />
                </Stack>
                <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
                    <HomeIcon sx={{ mr: 1 }}/> Về Trang chủ
                </Button>
            </Alert>
        );
    }
    
    if (!product) return null;

    // --- LOGIC HIỂN THỊ ---
    const categoryInfo = getCategoryLinkInfo(product.productType ?? -1);
    const CategoryLinkIcon = categoryInfo.icon;
    // FLAG QUAN TRỌNG: Kiểm tra trạng thái để vô hiệu hóa nút
    const isActionAvailable = product.statusProduct === ProductStatusValue.Available;

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Breadcrumbs */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Trang chủ
                </Link>
                {' / '}
                <Link to={categoryInfo.path} style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <CategoryLinkIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> {categoryInfo.name}
                </Link>
                {' / '}
                <MuiLink color="text.primary" sx={{ fontWeight: 'bold' }}>
                    {product.title}
                </MuiLink>
            </Typography>
            
            {/* Tiêu đề chính */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <AssignmentIcon color="primary" sx={{ fontSize: '2.5rem' }} /> 
                <Typography variant="h4" fontWeight="bold">
                    {product.title}
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                
                {/* --- A. THÔNG TIN CƠ BẢN & NỘI DUNG (65%) --- */}
                <Card sx={{ width: { xs: '100%', md: '65%' }, p: 1 }}>
                    <CardContent>
                        
                        {/* HÌNH ẢNH & TÊN SẢN PHẨM & GIÁ & LOẠI TIN */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
                            {/* HÌNH ẢNH */}
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
                                    <img src={product.imageUrl} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                    {/* HIỂN THỊ CHIP TRẠNG THÁI HIỆN TẠI */}
                                    {getStatusChip(product.statusProduct)} 
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
                                    secondary={<Box component="span" 
                                        sx={{ fontWeight: 'bold' }} onClick={handleSellerClick}>{`${sellerName}`}</Box>}
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
                    width: { xs: '100%', md: '35%' }, alignSelf: 'flex-start', position: 'sticky', top: theme.spacing(10), 
                }} spacing={3}>
                    
                    {/* HÀNH ĐỘNG MUA HÀNG/ĐẤU GIÁ */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2], textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            {product.methodSale === SaleMethodValue.Auction ? 'Tham gia Đấu giá' : 'Mua hàng'}
                        </Typography>
                        
                        {/* HIỂN THỊ THÔNG BÁO TRẠNG THÁI KHÔNG KHẢ DỤNG (Nếu có) */}
                        {!isActionAvailable && unavailableMessage && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography dangerouslySetInnerHTML={{ __html: unavailableMessage }} />
                            </Alert>
                        )}
                        
                        <Button 
                            startIcon={isActionLoading ? <CircularProgress size={20} color="inherit" /> : (product.methodSale === SaleMethodValue.Auction ? <GavelIcon /> : <ShoppingCartIcon />)} 
                            variant="contained" 
                            color={product.methodSale === SaleMethodValue.Auction ? 'warning' : 'success'} 
                            size="large"
                            fullWidth
                            onClick={handleAction}
                            // Vô hiệu hóa khi đang tải HOẶC khi không khả dụng
                            disabled={isActionLoading || !isActionAvailable} 
                        >
                            {product.methodSale === SaleMethodValue.Auction ? 'Đấu giá ngay' : 'Mua ngay'}
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {isActionAvailable 
                                ? (product.methodSale === SaleMethodValue.Auction 
                                    ? 'Nhấn để xem/tham gia phiên đấu giá đang hoạt động.' 
                                    : 'Đặt hàng để nhận hàng tận nơi.')
                                : 'Hành động giao dịch đã bị vô hiệu hóa do trạng thái tin đăng.'
                            }
                        </Typography>
                    </Paper>

                    {/* HIỂN THỊ ĐÁNH GIÁ SẢN PHẨM */}
                    <Paper sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <StarIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">Đánh giá sản phẩm</Typography>
                        </Stack>
                        
                       {/*product.count > 0 ? ( 
//                            <Box>
//                                <Typography variant="h4" fontWeight="bold" color="primary">
//                                    {product.rating.toFixed(1)}/5
//                                </Typography>
//                                <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
//                                    {[1, 2, 3, 4, 5].map(i => (
//                                        <StarIcon 
//                                            key={i} 
//                                            color={i <= Math.round(product.rating) ? 'warning' : 'disabled'} 
//                                            fontSize="small"
//                                        />
//                                    ))}
//                                    <Typography variant="body2" color="text.secondary">
 //                                       ({product.count} đánh giá)
 //                                   </Typography>
//                                </Stack>
//                                <Button size="small" variant="outlined" sx={{ mt: 1 }}>
//                                    Xem tất cả đánh giá
//                                </Button>
 //                           </Box>
//                        ) : (
//                            <Alert severity="info" sx={{ p: 1 }}>Chưa có đánh giá nào cho sản phẩm này.</Alert>
//                        )}*/}
                        <Button size="small" variant="outlined" sx={{ mt: 1 }}
                        onClick={() => 
                            navigate(`/view-rates?productId=${product.sellerId}`)
                        }>
                                      Xem tất cả đánh giá
                        </Button>
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
                        sx={{ position: 'absolute', right: 8, top: 8, color: 'white', zIndex: 10, }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img 
                            src={product.imageUrl} 
                            alt={product.productName} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Box>
    );
};

export default ProductDetailPage;