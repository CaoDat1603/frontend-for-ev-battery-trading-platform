// AuctionCard.tsx

import React, { useState, useEffect } from 'react';
// IMPORT HOOK CHUYỂN HƯỚNG TỪ REACT-ROUTER-DOM
import { useNavigate } from 'react-router-dom'; 
// Giả định import từ file API
import { type AuctionDetailData, AuctionStatusValue } from '../services/auctionService'; 
// IMPORT CÁC HÀM VÀ INTERFACE TỪ PRODUCT SERVICE
import { getProductById, type ProductData, ProductType } from '../services/productService'; 
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface AuctionCardProps {
    auction: AuctionDetailData & { productId: number }; // Giả định: Bổ sung productId vào AuctionDetailData
    isBidder: boolean; 
    isSeller: boolean; 
    // Giữ nguyên onActionClick cho các hành động cần logic bên ngoài (cancel/complete)
    onActionClick: (action: 'view' | 'cancel' | 'complete', auctionId: number) => void; 
}

// Màu chủ đạo
const ECYCLE_COLOR = '#1cff2bff'; 
const ECYCLE_COLOR_HOVER = '#1cff2b94';
const TEXT_COLOR = '#0a2309';

// *** HÀM MỚI: Lấy User ID từ Local Storage ***
const getCurrentUserId = (): number | null => {
    // Giả định: User ID được lưu dưới key 'userId' và là một chuỗi số
    const userId = localStorage.getItem('userId');
    if (userId) {
        // Chuyển đổi sang số và trả về, nếu không hợp lệ thì trả về null
        return parseInt(userId, 10) || null;
    }
    return null; 
};

const getStatusName = (status: number) => {
    return Object.keys(AuctionStatusValue).find(
        key => (AuctionStatusValue as any)[key] === status
    ) || 'Unknown';
};

const getStatusStyle = (status: number): React.CSSProperties => {
    switch (status) {
        case AuctionStatusValue.Active:
            return { color: 'green', fontWeight: 'bold' };
        case AuctionStatusValue.Ended:
            return { color: 'blue', fontWeight: 'bold' };
        case AuctionStatusValue.Cancelled:
            return { color: 'red', fontWeight: 'bold' };
        case AuctionStatusValue.Completed:
            return { color: 'purple', fontWeight: 'bold' };
        default:
            return { color: 'orange' };
    }
};

const getProductTypeName = (type: number): string => {
    if (type === undefined || type === null) return 'Không xác định';

    switch(type) {
        case 0: return 'Ắc quy điện'; 
        case 1: return 'Ắc quy ô tô điện'; 
        case 2: return 'Ắc quy xe máy điện'; 
        default: return 'Không xác định';
    }
};

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, isBidder, isSeller, onActionClick }) => {
    // *** KHỞI TẠO HOOK CHUYỂN HƯỚNG ***
    const navigate = useNavigate();
    
    const statusText = getStatusName(auction.status);
    const isCompletedOrEnded = auction.status === AuctionStatusValue.Ended || auction.status === AuctionStatusValue.Completed;
    // *** SỬ DỤNG HÀM LẤY ID TỪ LOCAL STORAGE ***
    const currentUserId = getCurrentUserId(); 
    
    const [productDetails, setProductDetails] = useState<ProductData | null>(null);
    const [isProductLoading, setIsProductLoading] = useState(true);

    useEffect(() => {
        if (auction.productId) { 
            const fetchProduct = async () => {
                setIsProductLoading(true); 
                try {
                    const product = await getProductById(auction.productId);
                    setProductDetails(product);
                } catch (error) {
                    console.error("Lỗi khi tải chi tiết sản phẩm:", error);
                    setProductDetails(null);
                } finally {
                    setIsProductLoading(false);
                }
            };
            fetchProduct();
        } else {
            setIsProductLoading(false);
        }
    }, [auction.productId]); 

    const buttonBaseStyle: React.CSSProperties = {
        padding: '8px 15px', 
        marginRight: '10px', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.3s'
    };

    if (isProductLoading) {
        return (
            <div style={{ padding: '15px', border: `1px solid ${ECYCLE_COLOR_HOVER}`, borderRadius: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                Đang tải chi tiết sản phẩm gốc...
            </div>
        );
    }
    
    const imageUrl = productDetails?.imageUrl || auction.productImageUrl;
    const productName = productDetails?.title || auction.productTitle; 
    const productType = productDetails?.productType || 0; 
    const pickupAddress = productDetails?.pickupAddress || 'Không rõ địa chỉ';
    const productDescription = productDetails?.description || 'Không có mô tả chi tiết';
    // Lấy Seller ID từ chi tiết sản phẩm
    const sellerId = productDetails?.sellerId;
   
    // *** HÀM XỬ LÝ CLICK ĐÃ CẬP NHẬT (bao gồm logic chuyển hướng mới cho Seller) ***
    const handleLocalActionClick = (action: 'view' | 'cancel' | 'complete', auctionId: number) => {
        if (action === 'view') {
            const isCurrentUserSeller = currentUserId !== null && sellerId !== undefined && currentUserId === sellerId;

            if (isCurrentUserSeller) {
                // *** CHUYỂN HƯỚNG CHO NGƯỜI BÁN ***
                navigate(`/manage-auction-detail/${auctionId}`); 
            } else {
                // *** CHUYỂN HƯỚNG CHO NGƯỜI MUA/KHÁC ***
                navigate(`/detail-auction/${auctionId}/${sellerId}`); 
            }
        } else {
            // Chuyển giao các hành động cần xử lý bên ngoài (cancel/complete) cho component cha
            onActionClick(action, auctionId);
        }
    };

    return (
        <div style={{ 
            border: `1px solid ${ECYCLE_COLOR_HOVER}`, 
            borderRadius: '8px', 
            padding: '15px', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
            backgroundColor: isBidder ? '#f0fff0' : isSeller ? '#fffbf5' : '#ffffff', 
            transition: 'box-shadow 0.3s',
            display: 'flex', 
            gap: '15px'
        }}>
            {/* Ảnh sản phẩm (Left) */}
            {imageUrl && (
                <div style={{ flexShrink: 0, width: '150px', height: '150px' }}>
                    <img 
                        src={imageUrl} 
                        alt={productName} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                    />
                </div>
            )}
            
            {/* Nội dung chi tiết (Right) */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 5px 0', color: TEXT_COLOR, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {productName} 
                </h3>
                
                {/* THÔNG TIN CHI TIẾT SẢN PHẨM GỐC */}
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#555' }}>
                    <strong>Loại SP:</strong> {getProductTypeName(productType)}
                </p>
                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9em' }}>
                    {productDescription.substring(0, 80) + (productDescription.length > 80 ? '...' : '')}
                </p>
                
                {/* Thông tin Đấu giá */}
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    Giá Hiện Tại: <span style={{ color: 'darkred' }}>
                        {auction.currentPrice.toLocaleString('vi-VN')} VNĐ
                    </span>
                </p>
                
                {/* Địa chỉ và Trạng thái */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 10px 0', fontSize: '0.9em' }}>
                    <LocationOnIcon style={{ fontSize: '18px', color: ECYCLE_COLOR, marginRight: '5px' }} />
                    <span style={{ color: '#555', marginRight: '15px' }}>
                        Địa chỉ: {pickupAddress}
                    </span>
                    <span style={{ borderLeft: '1px solid #ccc', paddingLeft: '15px' }}>
                        <strong>Trạng Thái:</strong> <span style={getStatusStyle(auction.status)}>
                            {statusText}
                        </span>
                    </span>
                </div>

                {auction.endTime && <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}><strong>Kết thúc:</strong> {new Date(auction.endTime).toLocaleString()}</p>}

                {(isBidder && isCompletedOrEnded && auction.winnerId) && (
                    <p style={{ fontWeight: 'bold', padding: '5px', borderRadius: '4px', textAlign: 'center', backgroundColor: auction.winnerId === currentUserId ? ECYCLE_COLOR_HOVER : '#f8d7da', color: auction.winnerId === currentUserId ? TEXT_COLOR : 'darkred', margin: '5px 0' }}>
                        {auction.winnerId === currentUserId ? '🏆 BẠN ĐÃ THẮNG PHIÊN ĐẤU GIÁ NÀY!' : `Người thắng: ID ${auction.winnerId}`}
                    </p>
                )}
            
                {/* Khu vực Hành động */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <button 
                        onClick={() => handleLocalActionClick('view', auction.auctionId)}
                        style={{ ...buttonBaseStyle, backgroundColor: '#007bff', color: 'white' }}
                    >
                        Xem Chi Tiết Đấu Giá
                    </button>
                    
                    {isSeller && auction.status === AuctionStatusValue.Pending && (
                        <button 
                            onClick={() => handleLocalActionClick('cancel', auction.auctionId)}
                            style={{ ...buttonBaseStyle, backgroundColor: '#dc3545', color: 'white' }}
                        >
                            Hủy Phiên
                        </button>
                    )}
                    
                    {isSeller && auction.status === AuctionStatusValue.Ended && (
                        <button 
                            onClick={() => handleLocalActionClick('complete', auction.auctionId)}
                            style={{ ...buttonBaseStyle, backgroundColor: ECYCLE_COLOR, color: '#000' }}
                        >
                            Xác Nhận Hoàn Thành
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};