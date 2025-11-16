import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { searchWishlist, deletedWishlistApi, createWishlistApi, type WishlistData } from "../services/wishlistService";
import { getProductById, type ProductData } from "../services/productService"; 
import { CircularProgress } from '@mui/material';

// --- Khai báo kiểu dữ liệu cho Tin đã lưu đã được TÁI CẤU TRÚC ---
export interface SavedPost { 
    id: number; // productId
    wishlistId: number; // Id của Wishlist để xóa
    imagePath: string; 
    name: string; 
    price: number; 
    details: string; 
    productData: ProductData; 
}

// ✅ THÊM: Kiểu dữ liệu tối thiểu cần thiết để toggle
export interface WishlistItemToToggle { 
    productId: number;
    // Bạn có thể thêm các trường khác nếu API tạo mới yêu cầu
}

interface WishlistContextType {
    // ✅ Đã sửa tên: 'savedPosts'
    savedPosts: SavedPost[]; 
    loading: boolean;
    error: string | null;
    refetchWishlist: () => Promise<void>;
    removeWishlistItem: (wishlistId: number) => Promise<void>;
    // ✅ THÊM: Hàm thêm/xóa
    toggleWishlistItem: (item: WishlistItemToToggle) => Promise<void>; 
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const prefixUrl = (path: string | null): string | null => {
    if (!path) return null;
    // Giả định: 'http://localhost:8000/identity' là base URL cho hình ảnh
    return path.startsWith('http') ? path : `http://localhost:8000/identity${path}`; 
};


export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadWishlist = useCallback(async (pageSize: number = 100) => {
        setLoading(true);
        setError(null);
        try {
            // Lấy danh sách Wishlist (pageSize lớn hơn để đảm bảo PostCard có dữ liệu)
            const wishlistItems = await searchWishlist(
                undefined, undefined, 'newest', 1, pageSize
            );

            if (wishlistItems.length === 0) {
                setSavedPosts([]);
                return;
            }

            const productPromises = wishlistItems.map(async (item) => {
                const product = await getProductById(item.productId);
                
                return {
                    id: product.productId,
                    wishlistId: item.wishlistId,
                    imagePath: prefixUrl(product.imageUrl) || '',
                    name: product.title,
                    price: product.price,
                    details: product.productName,
                    productData: product,
                } as SavedPost;
            });

            const fetchedPosts = await Promise.all(productPromises);
            setSavedPosts(fetchedPosts);

        } catch (err: any) {
            console.error("Lỗi tải Wishlist:", err);
            setError(err.message || "Không thể tải danh sách yêu thích.");
            setSavedPosts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const removeWishlistItem = async (wishlistId: number) => {
        try {
            await deletedWishlistApi(wishlistId);
            // Cập nhật state local
            setSavedPosts(prev => prev.filter(post => post.wishlistId !== wishlistId));
        } catch (err: any) {
            console.error("Lỗi xóa Wishlist:", err);
            throw err;
        }
    };
    
    // ✅ ĐỊNH NGHĨA HÀM TOGGLE
    const toggleWishlistItem = async (item: WishlistItemToToggle) => {
        const { productId } = item;
        
        // 1. Kiểm tra trạng thái hiện tại
        const existingPost = savedPosts.find(post => post.id === productId);

        if (existingPost) {
            // Đã lưu -> XÓA
            try {
                await removeWishlistItem(existingPost.wishlistId); 
            } catch (err) {
                 console.error("Lỗi xóa Wishlist:", err);
            }
        } else {
            
            
            // Chưa lưu -> THÊM MỚI
            try {
                // Gọi API thêm mới và sau đó tải lại danh sách
                await createWishlistApi(productId); 
                await loadWishlist(); // Tải lại để cập nhật WishlistId mới
            } catch (err: any) {
                console.error("Lỗi thêm Wishlist:", err);
                alert(`Lỗi thêm sản phẩm: ${err.message}`);
            }
        }
    };

    useEffect(() => {
        loadWishlist();
    }, [loadWishlist]);

    return (
        <WishlistContext.Provider value={{ 
            savedPosts, 
            loading, 
            error, 
            refetchWishlist: loadWishlist,
            removeWishlistItem,
            // ✅ Đã expose hàm toggle
            toggleWishlistItem, 
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
};