// src/pages/HomePage.tsx

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, CircularProgress, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
// --- Imports từ các component con và service ---
import { ProductCategories } from '../components/ProductCategories';
import { PostCard, type PostData } from '../components/PostCard'; 
import { searchForGuest, type ProductData, SaleMethodValue } from '../services/productService'; 
import { useLocationContext } from '../context/LocationContext'; // 🚨 IMPORT CONTEXT

import WelcomBaner from '../assets/welcome_banner.png';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    // 🚨 SỬ DỤNG CONTEXT ĐỂ LẤY VỊ TRÍ
    const { activeLocationName } = useLocationContext(); 
    
    // Thêm trạng thái để lưu danh sách tin đăng
    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hàm ánh xạ dữ liệu ProductData từ API sang PostData cho PostCard
    const mapProductToPostData = (product: ProductData): PostData => ({
        productId: product.productId,
        title: product.title,
        price: product.price,
        pickupAddress: product.pickupAddress,
        description: product.description,
        createdAt: product.createdAt,
        imageUrl: product.imageUrl,
        isVerified: product.isVerified,
        saleMethod: product.methodSale, 
    });

    // useEffect để gọi API khi component được mount HOẶC activeLocationName thay đổi
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            
            // 🚨 XỬ LÝ ĐỊA ĐIỂM: 
            // Nếu là 'Toàn quốc', truyền undefined. 
            // Nếu là tên Tỉnh/Thành, truyền tên đó.
            const locationFilter = activeLocationName === 'Toàn quốc' ? undefined : activeLocationName;

            try {
                const productList: ProductData[] = await searchForGuest(
                    'Available', 
                    '', 
                    undefined, 
                    undefined, 
                    undefined, 
                    locationFilter, // 🚨 TRUYỀN BIẾN LỌC ĐỊA ĐIỂM
                    'newest', 
                    undefined, 
                    undefined, 
                    undefined,
                    1, // Trang 1
                    4 // Lấy 10 tin đăng mới nhất trên Homepage
                );
                
                const mappedPosts = productList.map(mapProductToPostData);
                setPosts(mappedPosts);

            } catch (err) {
                console.error("Lỗi khi tải tin đăng:", err);
                setError("Không thể tải danh sách tin đăng. Vui lòng thử lại sau.");
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [activeLocationName]); // 🚨 QUAN TRỌNG: Lắng nghe activeLocationName

    const handleViewMore = () => {
        // Chuyển hướng đến trang SearchPostPage
        window.location.href = '/search-post';
    };

    // Tạo tiêu đề động
    const postListTitle = activeLocationName === 'Toàn quốc' 
        ? 'Tin đăng mới nhất trên toàn quốc'
        : `Tin đăng mới nhất tại ${activeLocationName}`;


    return (
        <Box sx={{ flexGrow: 1, pb: 4 }}>
            <Box
                component="img"
                src={WelcomBaner} 
                alt="Chào mừng đến với Nền tảng xe điện"
                sx={{
                    width: '100%',
                    height: { xs: 150, sm: 200, md: 450 }, 
                    objectFit: 'cover', 
                }}
            />

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                
                {/* 1. Hàng Icon Danh mục Sản phẩm */}
                <Box 
                    sx={{ 
                        mb: 4, 
                        bgcolor: 'white', 
                        borderRadius: 2, 
                        boxShadow: 1, 
                        mt: 0, 
                        border: '1px solid #eee' 
                    }}
                >
                    <ProductCategories />
                </Box>

                
                {/* 2. KHỐI LỚN BAO GỒM DANH SÁCH VÀ NÚT XEM THÊM */}
                <Box 
                    sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 2, 
                        boxShadow: 1, 
                        p: 2, 
                        border: '1px solid #eee' 
                    }}
                >
                    
                    {/* Tiêu đề Danh sách ĐỘNG */}
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                        {postListTitle} {/* 🚨 SỬ DỤNG TIÊU ĐỀ ĐỘNG */}
                    </Typography>

                    {/* Hiển thị Loading, Error hoặc Danh sách */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                            <Typography sx={{ ml: 2 }}>Đang tải tin đăng...</Typography>
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
                    )}

                    {!loading && !error && posts.length === 0 && (
                        <Typography variant="subtitle1" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                            Không tìm thấy tin đăng nào tại **{activeLocationName}**.
                        </Typography>
                    )}

                    {!loading && !error && posts.length > 0 && (
                        <Box 
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap', 
                                gap: 2, 
                            }}
                        >
                            {/* SỬ DỤNG DỮ LIỆU TỪ STATE */}
                            {posts.map((post) => (
                                <Box
                                    key={post.productId}
                                    sx={{
                                        flexBasis: {
                                            xs: '100%', 
                                            sm: 'calc(50% - 8px)', 
                                            md: 'calc(33.333% - 10.66px)', 
                                            lg: 'calc(20% - 12.8px)' // 5 cột (~20%)
                                        },
                                        flexShrink: 0, 
                                        flexGrow: 1, 
                                        display: 'flex', 
                                        justifyContent: 'center',
                                    }}
                                >
                                    <PostCard post={post} />
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Nút Xem thêm */}
                    <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            sx={{ 
                                textTransform: 'none',
                                fontWeight: 'bold',
                                py: 1, px: 4, 
                                borderRadius: '8px' 
                            }}
                            onClick={() => navigate("/search-post")}
                        >
                            Xem thêm tin đăng ({posts.length > 0 ? 'Hiển thị thêm' : 'Giả định'})
                        </Button>
                    </Box>

                </Box>

            </Container>
        </Box>
    );
};