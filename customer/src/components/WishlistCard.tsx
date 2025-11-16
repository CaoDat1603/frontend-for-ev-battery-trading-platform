// WishlistCard.tsx

import React from 'react';
import { 
    Card, CardContent, CardMedia, Typography, Box, IconButton, 
    Stack, useTheme 
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom'; // IMPORT useNavigate

import { type SavedPost, useWishlist } from '../context/WishlistContext';
import { type ProductData } from '../services/productService'; 

interface WishlistCardProps {
    post: SavedPost;
}

const formatPrice = (price: number): string => 
    `${price.toLocaleString('vi-VN')} VNĐ`;

export const WishlistCard: React.FC<WishlistCardProps> = ({ post }) => {
    const theme = useTheme();
    const navigate = useNavigate(); 
    const { removeWishlistItem } = useWishlist(); 

    const product: ProductData = post.productData; 

    const handleRemove = () => {
        removeWishlistItem(post.wishlistId);
    };
    
    // HÀM XỬ LÝ CHUYỂN HƯỚNG CHI TIẾT SẢN PHẨM
    const handleNavigateToProduct = () => {
        navigate(`/content/${post.id}`); 
    };

    return (
        <Card 
            sx={{ 
                display: 'flex', 
                mb: 2, 
                boxShadow: 3, 
                borderRadius: '8px',
                width: '100%', 
                cursor: 'pointer', // THÊM CON TRỎ CHỈ DẪN
                '&:hover': {
                    boxShadow: 6,
                }
            }}
        >
            {/* Box bọc phần nội dung có thể click (Ảnh và Chi tiết) */}
            <Box 
                sx={{ display: 'flex', flexGrow: 1 }} 
                onClick={handleNavigateToProduct} // GẮN SỰ KIỆN CLICK TỔNG
            >
                {/* Ảnh sản phẩm */}
                <CardMedia
                    component="img"
                    sx={{ width: 150, height: 150, objectFit: 'cover', flexShrink: 0 }}
                    image={post.imagePath}
                    alt={post.name}
                />
                
                {/* Nội dung chi tiết */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <CardContent sx={{ flex: '1 0 auto', pb: 1 }}>
                        {/* Header: Tên sản phẩm */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography component="div" variant="h6" fontWeight="bold" sx={{ 
                                flexGrow: 1, 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                pr: 1 
                            }}>
                                {post.name}
                            </Typography>
                        </Box>

                        {/* Chi tiết (Giá, Địa chỉ, Mô tả) */}
                        <Stack spacing={0.5}>
                            <Typography variant="subtitle1" color="error.main" fontWeight="bold">
                                {formatPrice(post.price)}
                            </Typography>
                            <Typography variant="subtitle1" color="black">
                                Sản phẩm: {product.productName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Địa chỉ: {product.pickupAddress || 'Không có thông tin địa chỉ'}
                                </Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Box>
            </Box>
            
            {/* Nút xóa riêng biệt, không bị ảnh hưởng bởi Box onClick */}
            <Box sx={{ p: 1, flexShrink: 0 }}>
                <IconButton 
                    aria-label="remove from wishlist"
                    onClick={(e) => { 
                        e.stopPropagation(); // CHẶN CLICK LAN TRUYỀN
                        handleRemove(); 
                    }}
                    sx={{ mt: -1 }}
                >
                    <FavoriteIcon sx={{ color: 'red' }} />
                </IconButton>
            </Box>
        </Card>
    );
};