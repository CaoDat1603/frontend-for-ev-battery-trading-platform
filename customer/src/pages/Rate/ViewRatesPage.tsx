// src/pages/Rate/ViewRatesPage.tsx

import React, { useState, useEffect, useCallback } from "react";
// Import hook cần thiết
import { useSearchParams } from "react-router-dom"; 

import { RateService } from "../../services/rateService"; 
import type { RateResponse, RateImageDto, RateListResponse } from "./RateResponse"; 
const IMAGE_BASE_URL = "http://localhost:8000/rating";
const AVATAR_BASE_URL = "http://localhost:8000/identity";

// --- Component phụ: Hiển thị ảnh ---
const RateImage: React.FC<{ image: RateImageDto }> = ({ image }) => {
    // Ghép Base URL với URL tương đối từ API
    const fullImageUrl = `${IMAGE_BASE_URL}${image.imageUrl}`; 

    return (
        <div className="rate-image-item">
            <img 
                // Sử dụng URL tuyệt đối
                src={fullImageUrl} 
                alt={`Ảnh đánh giá ${image.rateImageId}`} // Đổi imageId thành rateImageId
                style={{ 
                    width: '100px', 
                    height: '100px', 
                    objectFit: 'cover', 
                    margin: '0', 
                    borderRadius: '4px',
                    border: '1px solid #eee'
                }}
            />
        </div>
    );
};

// --- Component phụ: Hiển thị ngôi sao ---
const StarRating: React.FC<{ score: number }> = ({ score }) => {
    const roundedScore = Math.round(score);
    const filledStars = '★'.repeat(roundedScore);
    const emptyStars = '☆'.repeat(5 - roundedScore);
    
    return (
        <span style={{ color: '#FF9529', fontSize: '1.2em' }}>
            {filledStars}
            <span style={{ color: '#ccc' }}>{emptyStars}</span>
        </span>
    );
};

// --- Component chính: Hiển thị một đánh giá ---
const RateItem: React.FC<{ rate: RateResponse }> = ({ rate }) => {
    // Sử dụng các trường bạn đã chỉ định (kể cả lỗi chính tả nếu có)
    const reviewerName = rate.reviwerIsName || rate.userName || `User ${rate.rateBy}`;
    
    // --- BƯỚC MỚI: XỬ LÝ URL AVATAR ---
    let reviewerAvatar = 'https://via.placeholder.com/50'; // Avatar mặc định
    if (rate.reviwerIsAvartar) {
        // Kiểm tra nếu là URL tương đối (bắt đầu bằng /)
        if (rate.reviwerIsAvartar.startsWith('/')) {
            reviewerAvatar = `${AVATAR_BASE_URL}${rate.reviwerIsAvartar}`;
        } else {
            // Trường hợp URL đầy đủ hoặc placeholder khác
            reviewerAvatar = rate.reviwerIsAvartar; 
        }
    }
    return (
        <div style={{ 
            padding: '20px', 
            marginBottom: '15px', 
            borderRadius: '10px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            {/* Header: Avatar, Tên, Điểm */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img 
                        src={reviewerAvatar} 
                        alt={reviewerName} 
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #007bff' }}
                    />
                    <div>
                        <strong style={{ fontSize: '1.2em', color: '#1a1a1a' }}>{reviewerName}</strong>
                        <p style={{ margin: 0, fontSize: '0.9em', color: '#6c757d' }}>
                            {rate.userId ? `Đánh giá cho User ID: ${rate.userId}` : `Đánh giá cho Product ID: ${rate.productId}`}
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <StarRating score={rate.score} />
                    <p style={{ margin: 0, fontSize: '0.9em', color: '#888', fontWeight: 'bold' }}>{rate.score}/5</p>
                </div>
            </div>

            {/* Comment */}
            <div>
                <strong style={{ color: '#333' }}>💬 Bình luận:</strong>
                <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', backgroundColor: '#f9f9ff', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #007bff' }}>
                    {rate.comment}
                </p>
            </div>
            
            {/* Images */}
            {rate.images.length > 0 && (
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '15px' }}>
                    <strong style={{ color: '#333' }}>🖼️ Ảnh đính kèm:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {rate.images.map(img => <RateImage key={img.rateImageId} image={img} />)}
                    </div>
                </div>
            )}

            {/* Footer: Dates and Rate ID */}
            <div style={{ fontSize: '0.75em', color: '#aaa', textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontWeight: 'bold' }}>#ID: {rate.rateId}</span>
                <div>
                    <p style={{ margin: 0 }}>Tạo lúc: {new Date(rate.createdAt).toLocaleString()}</p>
                    {rate.updatedAt && <p style={{ margin: 0 }}>Cập nhật: {new Date(rate.updatedAt).toLocaleString()}</p>}
                </div>
            </div>
        </div>
    );
};

// --- Component ViewRatesPage ---

const ViewRatesPage: React.FC = () => {
    // Đọc cả hai tham số từ URL
    const [searchParams] = useSearchParams();
    const urlUserId = searchParams.get("userId");
    const urlProductId = searchParams.get("productId"); // Thêm đọc productId

    // Xác định ID nào được sử dụng và tiêu đề hiển thị
    let targetId = urlUserId || urlProductId;
    let targetType = urlUserId ? 'User' : (urlProductId ? 'Product' : null);
    let headerText = targetType ? `Đánh Giá ${targetType} ID: ${targetId}` : 'Đánh Giá (Thiếu ID)';
    let errorTarget = targetType ? `${targetType} ID: ${targetId}` : 'ID';

    const [rateData, setRateData] = useState<RateListResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const rates = rateData?.items || []; 
    
    // Hàm fetch được bọc trong useCallback, nhận targetId và targetType
    const handleFetchRates = useCallback(async (idToFetch: string | null, type: 'User' | 'Product' | null) => {
        if (!idToFetch || !type) {
            setError("Vui lòng cung cấp User ID (?userId=1) hoặc Product ID (?productId=1) trong URL.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            let result: RateListResponse;
            
            // Gọi service tương ứng
            if (type === 'User') {
                result = await RateService.getRatingByUserId(idToFetch);
            } else if (type === 'Product') {
                // Giả định có service getRatingByProductId
                // Cần đảm bảo RateService có hàm này
                result = await RateService.getRatingByProductId(idToFetch); 
            } else {
                return; // Không nên xảy ra
            }

            setRateData(result); 
        } catch (err: any) {
            setError(err.message || `Lỗi khi tải đánh giá cho ${type} ID ${idToFetch}.`);
            setRateData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // useEffect để tự động chạy khi URL thay đổi
    useEffect(() => {
        // Lấy lại các giá trị mới nhất
        const currentTargetId = urlUserId || urlProductId;
        const currentTargetType = urlUserId ? 'User' : (urlProductId ? 'Product' : null);

        if (currentTargetId && currentTargetType) {
            handleFetchRates(currentTargetId, currentTargetType);
        } else {
            setRateData(null);
            setError("Vui lòng cung cấp User ID (?userId=...) hoặc Product ID (?productId=...) trong URL.");
        }
    }, [urlUserId, urlProductId, handleFetchRates]); // Tự động gọi khi urlUserId hoặc urlProductId thay đổi

    return (
        <div style={{ maxWidth: '850px', margin: '0 auto', padding: '30px', backgroundColor: '#f4f7fa', minHeight: '100vh' }}>
            <h2 style={{ 
                color: '#0056b3', 
                borderBottom: '3px solid #0056b3', 
                paddingBottom: '15px', 
                marginBottom: '30px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                paddingTop: '15px'
            }}>
                ⭐ Danh Sách {headerText}
            </h2>

            {error && <p style={{ color: 'white', padding: '15px', backgroundColor: '#dc3545', border: '1px solid #b00', borderRadius: '5px', fontWeight: 'bold' }}>
                🛑 Lỗi: {error}
            </p>}
            
            {loading && <p style={{ textAlign: 'center', padding: '30px', color: '#007bff', fontSize: '1.2em' }}>
                Đang tải dữ liệu... Vui lòng chờ.
            </p>}

            {/* Thông tin phân trang */}
            {!loading && rateData && (
                <div style={{ marginBottom: '20px', color: '#0056b3', fontSize: '0.95em', padding: '10px', backgroundColor: '#e9f7ff', borderRadius: '5px', borderLeft: '4px solid #007bff' }}>
                    **{rateData.totalItems}** kết quả được tìm thấy. (Trang {rateData.pageNumber} / {rateData.totalPages})
                </div>
            )}

            {/* Hiển thị danh sách đánh giá */}
            {!loading && rates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {rates.map(rate => (
                        <RateItem key={rate.rateId} rate={rate} />
                    ))}
                </div>
            ) : (
                !loading && !error && targetId && (
                    <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                        <p style={{ color: '#888', fontSize: '1.1em' }}>🔍 Không tìm thấy đánh giá nào cho **{errorTarget}**.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default ViewRatesPage;