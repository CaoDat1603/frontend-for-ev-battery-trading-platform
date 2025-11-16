// WishlistPage.tsx

import React from 'react';
import { 
    Container, Typography, Box, CircularProgress, Alert, Divider, useTheme, Stack
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

import { useWishlist } from '../context/WishlistContext'; // Điều chỉnh đường dẫn
import { WishlistCard } from '../components/WishlistCard'; // Điều chỉnh đường dẫn

export const WishlistPage: React.FC = () => {
    const theme = useTheme();
    const { savedPosts, loading, error, refetchWishlist } = useWishlist(); 

    // --- RENDER TRẠNG THÁI LOADING ---
    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="h6" sx={{ mt: 2 }}>Đang tải danh sách yêu thích...</Typography>
            </Container>
        );
    }
    
    // --- RENDER TRẠNG THÁI LỖI ---
    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">
                    Đã xảy ra lỗi khi tải danh sách: **{error}**
                </Alert>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <button onClick={refetchWishlist}>Thử tải lại</button>
                </Box>
            </Container>
        );
    }

    // --- RENDER TRẠNG THÁI RỖNG ---
    if (savedPosts.length === 0) {
        return (
            <Container maxWidth="sm" sx={{ mt: 6, textAlign: 'center' }}>
                <FavoriteBorderIcon sx={{ fontSize: 80, color: theme.palette.grey[400] }} />
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                    Danh sách yêu thích của bạn đang trống
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Thêm các sản phẩm bạn quan tâm vào danh sách yêu thích để dễ dàng theo dõi và quay lại sau này.
                </Typography>
            </Container>
        );
    }

    // --- RENDER DỮ LIỆU ---
    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            {/* Tiêu đề Trang */}
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                💖 Danh sách Yêu thích ({savedPosts.length}/100 sản phẩm)
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Danh sách các WishlistCard sử dụng Stack */}
            <Stack spacing={2}>
                {savedPosts.map((post) => (
                    // Mỗi WishlistCard sẽ tự động có margin-bottom nhờ Stack spacing={2}
                    <WishlistCard key={post.wishlistId} post={post} /> 
                ))}
            </Stack>
        </Container>
    );
};