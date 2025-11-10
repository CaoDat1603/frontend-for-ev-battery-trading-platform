import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Card, CardMedia, CardContent, 
    IconButton, Chip, Button
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import GavelIcon from '@mui/icons-material/Gavel'; 
import VerifiedIcon from '@mui/icons-material/Verified';
import { useTheme } from '@mui/material/styles';

// --- Kiểu dữ liệu cho Tin đăng (ĐỒNG BỘ VỚI ProductData) ---
// Đã đổi tên interface từ Post thành PostData để phản ánh dữ liệu sản phẩm
// Thêm thuộc tính saleMethod để xác định dạng sản phẩm (FixedPrice: 0, Auction: 1)
export interface PostData {
    productId: number;
    title: string;
    price: number; 
    // Các trường dưới đây được mapping từ ProductData
    pickupAddress: string; 
    description: string; 
    createdAt: string; 
    imageUrl: string | null; 
    isVerified: boolean; 
    // Đã đổi tên thành saleMethod để dễ hiểu hơn, nhưng giá trị vẫn là số (0/1)
    saleMethod: number; // 0: FixedPrice (Mua Ngay), 1: Auction (Đấu Giá)
    // Các trường khác từ ProductData không cần thiết cho Card view thì bỏ qua
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
    
    // Nếu quá lâu, trả về ngày tháng đơn giản
    return past.toLocaleDateString('vi-VN');
};


export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    // SỬ DỤNG useMemo để tính toán các giá trị hiển thị
    const formattedPrice = useMemo(() => formatCurrency(post.price), [post.price]);
    const displayTimeAgo = useMemo(() => timeAgo(post.createdAt), [post.createdAt]);
    // SỬ DỤNG thuộc tính MỚI: saleMethod
    const isAuction = post.saleMethod === 1; // 1: Auction, 0: FixedPrice

    // Xử lý sự kiện click vào Card để chuyển sang trang chi tiết
    const handleCardClick = () => {
        // Sử dụng productId để điều hướng
        navigate(`/content/${post.productId}`);
        console.log(`View post ${post.productId}`);
    };
    
    // Giả định hàm thêm/xóa khỏi mục yêu thích
    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        console.log(`Toggle favorite for post ${post.productId}`);
    };

    // Hàm giả định cho hành động Mua Ngay
    const handleBuyNow = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        console.log(`Tiến hành Mua Ngay sản phẩm: ${post.title}`);
    };

    // Hàm giả định cho hành động Đấu Giá
    const handleBid = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(`Bắt đầu Đấu Giá sản phẩm: ${post.title}`);
    };

    return (
        <Card 
            sx={{ 
                width: 240, 
                height: 420, 
                cursor: 'pointer', 
                position: 'relative',
                borderRadius: '8px',
                // Cải thiện khả năng responsive cho container nhỏ hơn 
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
                    // Sử dụng imageUrl từ ProductData
                    image={post.imageUrl || 'https://placehold.co/400x300/e0e0e0/505050?text=No+Image'}
                    alt={post.title}
                    sx={{ objectFit: 'cover' }}
                />

                {/* Tag thời gian (Tính toán từ createdAt) */}
                <Chip 
                    icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
                    label={displayTimeAgo}
                    size="small"
                    sx={{ 
                        position: 'absolute', 
                        bottom: 8, 
                        left: 8, 
                        bgcolor: 'rgba(0,0,0,0.6)', 
                        color: 'white', 
                        '.MuiChip-label': { px: 1, py: 0.2 },
                        '.MuiChip-icon': { color: 'white !important', ml: 0.5 },
                        height: 20
                    }}
                />
                
                {/* Tag Tin đã kiểm định (isVerified) */}
                {post.isVerified && (
                    <Chip
                        icon={<VerifiedIcon sx={{ fontSize: '12px !important' }} />}
                        label="Đã kiểm định"
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: theme.palette.success.main, // Màu xanh lá cây cho đã kiểm định
                            color: 'white',
                            fontWeight: 'bold',
                            height: 20,
                            '.MuiChip-icon': { color: 'white !important', ml: 0.5 },
                        }}
                    />
                )}

                {/* Nút Favorite */}
                <IconButton
                    size="small"
                    onClick={handleToggleFavorite}
                    sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': { bgcolor: 'white' }
                    }}
                >
                    <FavoriteBorderIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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
                    {/* Sử dụng giá đã định dạng */}
                    {formattedPrice}
                </Typography>

                {/* Tiêu đề (GIỚI HẠN 2 DÒNG) */}
                <Typography 
                    gutterBottom 
                    variant="subtitle1" 
                    component="div"
                    fontWeight={600}
                    sx={{ 
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 1,
                        height: 60 
                    }}
                >
                    {post.title}
                </Typography>
                
                {/* Chi tiết (Tạm dùng Description) */}
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                        mb: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis'
                    }} 
                >
                    {post.description || 'Không có mô tả chi tiết.'}
                </Typography>

                {/* Vị trí */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'text.secondary', 
                    mb: 1,
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                }}>
                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, flexShrink: 0 }} />
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                        }}
                    >
                        {/* Sử dụng pickupAddress */}
                        {post.pickupAddress}
                    </Typography>
                </Box>

                {/* KHỐI 2 BUTTON (MUA NGAY & ĐẤU GIÁ) - Hiển thị tùy theo SaleMethod */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {/* Nút MUA NGAY (Chỉ hiển thị nếu là FixedPrice hoặc cả hai) */}
                    {post.saleMethod === 0 && ( // Chỉ hiển thị Mua Ngay nếu là FixedPrice
                        <Button 
                            variant="contained" 
                            size="small" 
                            fullWidth 
                            startIcon={<StorefrontIcon />}
                            onClick={handleBuyNow}
                            sx={{ 
                                textTransform: 'uppercase', 
                                fontWeight: 'bold',
                                fontSize: 12,
                                px: 0.5,
                                py: 0.7,
                                bgcolor: theme.palette.primary.main,
                                '&:hover': { bgcolor: theme.palette.primary.dark }
                            }}
                        >
                            Mua ngay
                        </Button>
                    )}

                    {/* Nút ĐẤU GIÁ (Chỉ hiển thị nếu là Auction hoặc cả hai) */}
                    {isAuction && ( // Hiển thị Đấu Giá nếu là Auction
                        <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            startIcon={<GavelIcon />}
                            onClick={handleBid}
                            sx={{ 
                                textTransform: 'uppercase', 
                                fontWeight: 'bold',
                                fontSize: 12,
                                px: 0.5,
                                py: 0.7,
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                '&:hover': { borderColor: theme.palette.primary.dark, color: theme.palette.primary.dark }
                            }}
                        >
                            Đấu giá
                        </Button>
                    )}
                    
                    {/* Trường hợp cả 2 phương thức: Bạn có thể cần điều chỉnh logic ở đây 
                        để hiển thị cả hai nút hoặc chỉ một nút ưu tiên. 
                        Hiện tại, nếu API cho phép FixedPrice (0) VÀ Auction (1), 
                        bạn sẽ phải bổ sung logic để kiểm tra cả hai,
                        hoặc API chỉ trả về MỘT phương thức bán hàng chính.
                        Tôi giữ logic hiện tại: FixedPrice -> Mua Ngay, Auction -> Đấu Giá.
                    */}
                </Box>
                
            </CardContent>
        </Card>
    );
};