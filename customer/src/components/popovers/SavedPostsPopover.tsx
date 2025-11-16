import React from 'react';
import { 
    Popover, Box, Typography, Button, Divider, 
    List, ListItem, ListItemText, ListItemAvatar, Avatar,
    CircularProgress, IconButton 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';

// ⚠️ QUAN TRỌNG: Import useNavigate từ react-router-dom
import { useNavigate } from 'react-router-dom';

// Import Context và kiểu dữ liệu mới
import { useWishlist, type SavedPost } from '../../context/WishlistContext'; 

interface SavedPostsPopoverProps {
    open: boolean;
    anchorEl: null | HTMLElement;
    handleClose: () => void;
}

// --- Hàm định dạng giá ---
const formatPrice = (price: number): string => 
    `${price.toLocaleString('vi-VN')} VNĐ`;


export const SavedPostsPopover: React.FC<SavedPostsPopoverProps> = ({ 
    open, anchorEl, handleClose 
}) => {
    const theme = useTheme();
    // ⚠️ KHAI BÁO HOOK CHUYỂN HƯỚNG
    const navigate = useNavigate(); 
    
    // 1. Sử dụng Context
    const { savedPosts, loading, error, removeWishlistItem } = useWishlist(); 
    
    const isDataEmpty = !loading && savedPosts.length === 0;

    // Hiển thị tối đa 3 mục (Tôi điều chỉnh từ 1 lên 3 để Popover có ý nghĩa hơn)
    const limitedPosts = savedPosts.slice(0, 1); 

    // 2. Xử lý xóa
    const handleRemove = (e: React.MouseEvent, wishlistId: number) => {
        e.stopPropagation(); // Ngăn chặn sự kiện click lan truyền lên ListItem
        removeWishlistItem(wishlistId);
    };

    // 3. Xử lý chuyển hướng TẤT CẢ (FOOTER BUTTON)
    const handleViewAll = () => {
        handleClose(); // Đóng Popover
        navigate('/manage-wishlists'); // Chuyển hướng đến trang quản lý
    };

    // 4. Xử lý chuyển hướng CHI TIẾT SẢN PHẨM (LIST ITEM)
    const handleNavigateToProduct = (productId: string) => {
        handleClose(); // Đóng Popover
        navigate(`/content/${productId}`); // Chuyển hướng đến trang chi tiết
    };
    
    // --- RENDER TRẠNG THÁI LOADING ---
    if (loading) {
        return (
             <Popover
                 open={open}
                 anchorEl={anchorEl}
                 onClose={handleClose}
                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                 transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                 slotProps={{ paper: { sx: { borderRadius: '8px', mt: 0.5, minWidth: 300, textAlign: 'center' } } }}
             >
                 <Box sx={{ p: 3 }}>
                     <CircularProgress size={20} />
                     <Typography variant="body2" sx={{ mt: 1 }}>Đang tải tin đã lưu...</Typography>
                 </Box>
             </Popover>
        );
    }
    
    // --- RENDER TRẠNG THÁI RỖNG ---
    const renderEmptyState = () => (
        <Box sx={{ minWidth: 350 }}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                    Bạn chưa lưu tin đăng nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Lưu tin yêu thích, tin sẽ hiển thị ở đây để bạn dễ dàng quay lại sau.
                </Typography>
            </Box>
            
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button 
                    fullWidth 
                    color="primary" 
                    sx={{ textTransform: 'none' }}
                    onClick={handleViewAll} // <-- Chuyển hướng đến trang quản lý
                >
                    Đến trang quản lý Wishlist
                </Button>
            </Box>
        </Box>
    );

    // --- RENDER TRẠNG THÁI CÓ DỮ LIỆU ---
    const renderDataState = () => (
        <Box sx={{ minWidth: 350 }}>
            <List dense sx={{ p: 0 }}>
                {limitedPosts.map((post) => ( 
                    <ListItem 
                        key={post.wishlistId} // Dùng wishlistId làm key
                        sx={{ 
                            py: 1.5, 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                        // ⚠️ THÊM LOGIC CHUYỂN HƯỚNG CHI TIẾT SẢN PHẨM
                        onClick={() => handleNavigateToProduct(String(post.id))} 
                    >
                        <ListItemAvatar>
                            <Avatar 
                                variant="rounded" 
                                src={post.imagePath} 
                                alt={post.name} 
                                sx={{ width: 60, height: 60, mr: 1.5 }} 
                            />
                        </ListItemAvatar>
                        <ListItemText
                            primary={post.name}
                            primaryTypographyProps={{ 
                                fontWeight: 'bold', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                            }}
                            secondary={
                                <>
                                    <Typography component="span" variant="body2" color="error.main" fontWeight="bold" display="block">
                                        {formatPrice(post.price)}
                                    </Typography>
                                    <Typography component="span" variant="body2" color="text.secondary">
                                        {post.details}
                                    </Typography>
                                </>
                            }
                            sx={{ pr: 1 }} 
                        />
                         {/* Nút xóa */}
                         <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            size="small"
                            onClick={(e) => handleRemove(e, post.wishlistId)}
                        >
                            <FavoriteIcon sx={{ color: 'red', fontSize: 20 }}/>
                        </IconButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            {/* FOOTER - CHUYỂN HƯỚNG TẤT CẢ */}
            <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button 
                    fullWidth 
                    color="primary" 
                    sx={{ textTransform: 'none' }}
                    onClick={handleViewAll} // <-- Gắn sự kiện chuyển hướng trang quản lý
                >
                    Xem tất cả tin ({savedPosts.length})
                </Button>
            </Box>
        </Box>
    );

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '8px',
                        mt: 0.5,
                        minWidth: 350,
                        maxHeight: 450,
                        overflow: 'auto',
                    },
                },
            }}
        >
            {/* HEADER POPUP */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 2, 
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Typography variant="h6" fontWeight="bold">
                    Tin đăng đã lưu
                </Typography>
            </Box>

            {/* NỘI DUNG POPUP */}
            {isDataEmpty ? renderEmptyState() : renderDataState()}
        </Popover>
    );
};