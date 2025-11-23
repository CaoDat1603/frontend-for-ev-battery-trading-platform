import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Card, CardMedia, CardContent, 
    IconButton, Chip, Button
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite'; 
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import GavelIcon from '@mui/icons-material/Gavel'; 
import VerifiedIcon from '@mui/icons-material/Verified';
import { useTheme } from '@mui/material/styles';

// ✅ Import Wishlist Context
import { useWishlist } from '../context/WishlistContext'; 
import { type ProductData } from '../services/productService'; // Import ProductData nếu cần

// ✅ IMPORT DỊCH VỤ ĐẤU GIÁ VÀ KIỂU DỮ LIỆU
// Giả định AuctionDetailData và searchAuction nằm trong file này hoặc file auctionService
import { searchAuction, type AuctionDetailData } from '../services/auctionService'; 
// Giả định AuctionStatus được định nghĩa
type AuctionStatus = 0 | 1 | 2 | 3 | 4; // Ví dụ: 0=Pending, 1=Active, 2=Completed, 3=Cancelled, 4=Expired


// --- Kiểu dữ liệu cho Tin đăng ---
export interface PostData {
    productId: number;
    sellerId: number;
    productName: string;
    productType: number;
    title: string;
    price: number; 
    pickupAddress: string; 
    description: string; 
    createdAt: string; 
    imageUrl: string | null; 
    isVerified: boolean; 
    saleMethod: number; // 0: FixedPrice (Mua Ngay), 1: Auction (Đấu Giá)
}

interface PostCardProps {
    post: PostData;
}

// Helper function để định dạng tiền tệ VNĐ
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

// Helper function để tính thời gian đã trôi qua
const timeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ngày trước`;
    
    return past.toLocaleDateString('vi-VN');
};


export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    // ✅ SỬA: Lấy 'savedPosts' và 'toggleWishlistItem' từ Context
    const { savedPosts, toggleWishlistItem } = useWishlist(); 

    // ✅ Logic kiểm tra: sử dụng 'savedPosts' và 'post.productId'
    const isSaved = savedPosts.some(item => item.id === post.productId);

    const formattedPrice = useMemo(() => formatCurrency(post.price), [post.price]);
    const displayTimeAgo = useMemo(() => timeAgo(post.createdAt), [post.createdAt]);
    const isAuction = post.saleMethod === 1;

    const handleCardClick = () => {
        navigate(`/content/${post.productId}`);
    };
    
    // ✅ Cập nhật hàm thêm/xóa khỏi mục yêu thích (Wishlist)
    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        
        // Truyền productId cho hàm toggle
        const itemToToggle = { productId: post.productId };

        toggleWishlistItem(itemToToggle);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        // Nếu là mua ngay: chuyển sang màn hình chi tiết hóa đơn
            navigate(`/invoice-detail/${post.productId}`, {
                state: {
                    productId: post.productId,
                    title: post.title,
                    productName: post.productName,
                    price: post.price,
                    sellerId: post.sellerId,
                    productType: post.productType,
                },
            });
    };

    // ✅ CẬP NHẬT HÀM XỬ LÝ ĐẤU GIÁ (ASYNC)
    const handleBid = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            // ✅ BƯỚC 1: Gọi hàm searchAuction với productId
            // Giả định chúng ta chỉ quan tâm đến các phiên đấu giá đang Active (1) hoặc Pending (0)
            const activeStatuses: AuctionStatus[] = [0, 1]; // 0: Pending, 1: Active
            
            // Dù hàm searchAuction chỉ có 1 trường status (không phải statuses), 
            // chúng ta sẽ chỉ tìm kiếm các phiên có trạng thái "Active" (1)
            // hoặc phải dựa vào cách API hỗ trợ lọc mảng. 
            // Dựa trên hàm bạn cung cấp (chỉ có 1 tham số 'status'), chúng ta sẽ 
            // tìm kiếm các phiên Đấu giá BẤT KỲ của Product đó (status=null)
            // hoặc chỉ tìm phiên Active (1) để đơn giản hóa. 
            
            // Tạm thời bỏ qua filter status để tìm TẤT CẢ các phiên đấu giá cho sản phẩm này.
            const searchResults: AuctionDetailData[] = await searchAuction(
                // Chỉ truyền productId, các tham số khác để null
                null, null, null, null, null, null, null, null, null, null, null, null, 
                post.productId, 
                'newest', 1, 10
            );

            if (searchResults && searchResults.length > 0) {
                // ✅ BƯỚC 2A: Tìm thấy Auction đang hoạt động/chờ duyệt
                const existingAuction = searchResults[0]; 
                
                // Sử dụng trường 'transactionId' (giả định là auctionId) 
                // hoặc tìm một trường phù hợp, ví dụ: 'auctionId' (nếu có)
                const auctionId = existingAuction.auctionId; // Hoặc existingAuction.auctionId
                
                if (auctionId) {
                    console.log(`Tìm thấy Auction ID: ${auctionId}. Chuyển đến trang chi tiết.`);
                    // Điều hướng đến trang chi tiết đấu giá
                    navigate(`/detail-auction/${auctionId}/${post.sellerId}`);
                } else {
                     // Nếu tìm thấy nhưng không có ID đấu giá hợp lệ (xảy ra lỗi data)
                    throw new Error("Dữ liệu đấu giá không hợp lệ (Missing Auction ID).");
                }
            } else {
                // ✅ BƯỚC 2B: Không tìm thấy Auction
                console.log("Không tìm thấy Auction. Chuyển đến trang tạo mới.");
                
                // Điều hướng đến trang tạo đấu giá mới
                navigate(`/create-auction/${post.productId}/${post.sellerId}`);
            }

        } catch (error) {
            console.error("Lỗi khi tìm kiếm hoặc điều hướng đấu giá:", error);
            // Có thể hiển thị thông báo lỗi cho người dùng
            alert("Lỗi kiểm tra trạng thái đấu giá. Vui lòng thử lại.");
        }
    };
    // HẾT CẬP NHẬT handleBid

    return (
        <Card 
            sx={{ 
                width: 240, 
                height: 420, 
                cursor: 'pointer', 
                position: 'relative',
                borderRadius: '8px',
                minWidth: { xs: 240, sm: 240 },
                maxWidth: 280,
                flexShrink: 0,
                '&:hover': { boxShadow: 6 } 
            }}
            elevation={2}
            onClick={handleCardClick}
        >
            {/* 1. Phần Ảnh (Media) */}
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="180"
                    image={post.imageUrl || 'https://placehold.co/400x300/e0e0e0/505050?text=No+Image'}
                    alt={post.title}
                    sx={{ objectFit: 'cover' }}
                />

                {/* Tag thời gian & Kiểm định (Giữ nguyên) */}
                <Chip 
                    icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
                    label={displayTimeAgo}
                    size="small"
                    sx={{ 
                        position: 'absolute', 
                        bottom: 8, left: 8, 
                        bgcolor: 'rgba(0,0,0,0.6)', 
                        color: 'white', 
                        '.MuiChip-label': { px: 1, py: 0.2 },
                        '.MuiChip-icon': { color: 'white !important', ml: 0.5 },
                        height: 20
                    }}
                />
                
                {post.isVerified && (
                    <Chip
                        icon={<VerifiedIcon sx={{ fontSize: '12px !important' }} />}
                        label="Đã kiểm định"
                        size="small"
                        sx={{
                            position: 'absolute', top: 8, left: 8,
                            bgcolor: theme.palette.success.main, 
                            color: 'white', fontWeight: 'bold', height: 20,
                            '.MuiChip-icon': { color: 'white !important', ml: 0.5 },
                        }}
                    />
                )}

                {/* ✅ KHỐI ICON FAVORITE ĐÃ CẬP NHẬT */}
                <IconButton
                    size="small"
                    onClick={handleToggleFavorite}
                    sx={{ 
                        position: 'absolute', top: 8, right: 8, 
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': { bgcolor: 'white' }
                    }}
                >
                    {isSaved ? (
                        // Đã lưu: Icon đặc ruột màu đỏ
                        <FavoriteIcon sx={{ color: 'red', fontSize: 20 }} />
                    ) : (
                        // Chưa lưu: Icon trái tim rỗng màu xám
                        <FavoriteBorderIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    )}
                </IconButton>
            </Box>

            {/* 2. Phần Nội dung (Content) */}
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                
                {/* Giá */}
                <Typography 
                    variant="h6" 
                    color="error.main" 
                    fontWeight="bold" 
                    sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                    {formattedPrice}
                </Typography>

                {/* Tiêu đề */}
                <Typography 
                    gutterBottom 
                    variant="subtitle1" 
                    component="div"
                    fontWeight={600}
                    sx={{ 
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', mb: 1, height: 60 
                    }}
                >
                    {post.title}
                </Typography>
                
                {/* Chi tiết */}
                <Typography 
                    variant="body2" color="text.secondary"
                    sx={{ 
                        mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }} 
                >
                    {post.description || 'Không có mô tả chi tiết.'}
                </Typography>

                {/* Vị trí */}
                <Box sx={{ 
                    display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1,
                    whiteSpace: 'nowrap', overflow: 'hidden', 
                }}>
                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.pickupAddress}
                    </Typography>
                </Box>

                {/* KHỐI BUTTON */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {post.saleMethod === 0 && (
                        <Button 
                            variant="contained" size="small" fullWidth 
                            startIcon={<StorefrontIcon />}
                            onClick={handleBuyNow}
                            sx={{ 
                                textTransform: 'uppercase', fontWeight: 'bold', fontSize: 12,
                                px: 0.5, py: 0.7, bgcolor: theme.palette.primary.main,
                                '&:hover': { bgcolor: theme.palette.primary.dark }
                            }}
                        >
                            Mua ngay
                        </Button>
                    )}

                    {isAuction && (
                        <Button 
                            variant="outlined" size="small" fullWidth 
                            startIcon={<GavelIcon />}
                            // ✅ GỌI HÀM ASYNC ĐÃ CẬP NHẬT
                            onClick={handleBid} 
                            sx={{ 
                                textTransform: 'uppercase', fontWeight: 'bold', fontSize: 12,
                                px: 0.5, py: 0.7, 
                                borderColor: theme.palette.primary.main, color: theme.palette.primary.main,
                                '&:hover': { borderColor: theme.palette.primary.dark, color: theme.palette.primary.dark }
                            }}
                        >
                            Đấu giá
                        </Button>
                    )}
                </Box>
                
            </CardContent>
        </Card>
    );
};