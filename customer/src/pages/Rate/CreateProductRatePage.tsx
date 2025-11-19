// src/pages/Rate/CreateProductRatePage.tsx

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Import hook để đọc URL parameters
import { RateService } from "../../services/rateService"; 
import type { RateResponse } from "./RateResponse"; 

// Hàm giả lập đọc ID người dùng đã đăng nhập từ localStorage
const getRateByUserId = (): number => {
    // Lấy ID người dùng (rateBy) từ localStorage
    const rateBy = localStorage.getItem("userId"); 
    // Giả lập ID: 100 nếu không tìm thấy (chỉ để đảm bảo form có giá trị)
    return rateBy ? parseInt(rateBy) : 100; 
};

// Component hiển thị input ngôi sao
const StarRatingInput: React.FC<{ score: number, setScore: (s: number) => void }> = ({ score, setScore }) => (
    <div style={{ fontSize: '1.5em', cursor: 'pointer', display: 'flex', gap: '5px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
            <span 
                key={s} 
                onClick={() => setScore(s)} 
                style={{ color: s <= score ? '#FF9529' : '#ccc', transition: 'color 0.2s' }}
            >
                ★
            </span>
        ))}
    </div>
);


const CreateProductRatePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const urlProductId = searchParams.get("productId");
    const urlFeedbackId = searchParams.get("feedbackId");
    const loggedInUserId = getRateByUserId();

    // State cho form, khởi tạo từ URL và localStorage
    const [formData, setFormData] = useState({
        feedbackId: (urlFeedbackId ? parseInt(urlFeedbackId) : null) as number | null,
        productId: (urlProductId ? parseInt(urlProductId) : 0), // Product được đánh giá
        rateBy: loggedInUserId, // ID của người đánh giá
        score: 5,
        comment: "",
    });

    const [files, setFiles] = useState<File[]>([]);
    const [result, setResult] = useState<RateResponse | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [productDisplay, setProductDisplay] = useState(urlProductId ? `Product ID: ${urlProductId}` : "Không xác định");

    // Đồng bộ state khi URL hoặc loggedInUserId thay đổi
    useEffect(() => {
        const newProductId = urlProductId ? parseInt(urlProductId) : 0;
        const newFeedbackId = urlFeedbackId ? parseInt(urlFeedbackId) : null;

        setFormData(prev => ({
            ...prev,
            productId: newProductId,
            feedbackId: newFeedbackId,
            rateBy: loggedInUserId,
        }));

        setProductDisplay(urlProductId ? `Product ID: ${urlProductId}` : "Không xác định");

    }, [urlProductId, urlFeedbackId, loggedInUserId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            // Xử lý giá trị rỗng/null cho type number
            [name]: type === 'number' ? (value ? parseInt(value) : null) : value, 
        }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files).slice(0, 5)); // Giới hạn 5 ảnh
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setMessage(null);

        if (!formData.rateBy || formData.rateBy === 0) {
            setMessage("❌ Lỗi: Không tìm thấy ID người đánh giá (rateBy) trong localStorage.");
            setLoading(false);
            return;
        }
        if (!formData.productId || formData.productId === 0) {
            setMessage("❌ Lỗi: Product ID được đánh giá (productId) không hợp lệ.");
            setLoading(false);
            return;
        }

        try {
            // 1. Tạo đánh giá Product
            const createdRate = await RateService.postProductRating(formData);
            setResult(createdRate);
            
            // 2. Nếu có ảnh, tải ảnh lên
            if (files.length > 0) {
                await RateService.postRatingImage(createdRate.rateId, files);
                setMessage("✅ Gửi đánh giá thành công và tải ảnh lên hoàn tất!");
            } else {
                setMessage("✅ Gửi đánh giá thành công!");
            }

        } catch (err: any) {
            setMessage(`❌ Lỗi: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <h2 style={headerStyle}>
                ✍️ Tạo Đánh Giá Sản Phẩm **{productDisplay}**
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Score Input */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>⭐ Điểm Đánh Giá (1-5):</label>
                    <StarRatingInput 
                        score={formData.score} 
                        setScore={(s) => setFormData(prev => ({ ...prev, score: s }))} 
                    />
                </div>

                {/* Comment Input */}
                <div style={formGroupStyle}>
                    <label htmlFor="comment" style={labelStyle}>📝 Bình Luận Chi Tiết:</label>
                    <textarea 
                        name="comment" 
                        value={formData.comment} 
                        onChange={handleChange} 
                        placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này..." 
                        required 
                        style={inputStyle} 
                        rows={4}
                    />
                </div>

                {/* File Input */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>📸 Ảnh Đính Kèm ({files.length} ảnh):</label>
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <small style={{ color: '#888', marginTop: '5px' }}>Chọn tối đa 5 ảnh. Ảnh sẽ được gửi sau khi tạo đánh giá.</small>
                </div>

                {/* Info Fields (Không thể chỉnh sửa, chỉ hiển thị thông tin lấy từ URL/Local) */}
                <div style={infoBoxStyle}>
                    <p style={infoPStyle}>**Product ID:** {formData.productId || 'Chưa có'}</p>
                    <p style={infoPStyle}>**Feedback ID:** {formData.feedbackId || 'Không'}</p>
                    <p style={{...infoPStyle, gridColumn: 'span 2'}}>**Đánh giá bởi (Bạn):** {formData.rateBy || 'LỖI'}</p>
                </div>

                <button type="submit" disabled={loading} style={buttonStyle(loading)}>
                    {loading ? "Đang gửi..." : "🚀 Gửi Đánh Giá Sản Phẩm"}
                </button>
            </form>

            {/* Message and Result Display */}
            {message && <p style={messageStyle(message.startsWith("❌"))}>{message}</p>}
            
            {result && (
                <div style={resultBoxStyle}>
                    <h3 style={{ color: '#007bff' }}>Kết quả API Trả về:</h3>
                    <pre style={preStyle}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CreateProductRatePage;

// --- STYLING CONSTANTS ---
const containerStyle: React.CSSProperties = { 
    maxWidth: '650px', 
    margin: '30px auto', 
    padding: '30px', 
    backgroundColor: '#ffffff', 
    borderRadius: '12px', 
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
};

const headerStyle: React.CSSProperties = { 
    color: '#17a2b8', 
    borderBottom: '3px solid #17a2b8', 
    paddingBottom: '15px', 
    marginBottom: '30px', 
    textAlign: 'center' 
};

const inputStyle: React.CSSProperties = {
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '1em',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
};

const labelStyle: React.CSSProperties = {
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#495057'
};

const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
};

const infoBoxStyle: React.CSSProperties = {
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '10px', 
    backgroundColor: '#e9ecef', 
    padding: '15px', 
    borderRadius: '8px', 
    border: '1px dashed #adb5bd'
};

const infoPStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '0.9em',
    color: '#495057'
};

const buttonStyle = (loading: boolean): React.CSSProperties => ({
    padding: '15px',
    cursor: loading ? 'not-allowed' : 'pointer',
    backgroundColor: loading ? '#6c757d' : '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '1.1em',
    transition: 'background-color 0.3s'
});

const messageStyle = (isError: boolean): React.CSSProperties => ({
    marginTop: '25px', 
    padding: '15px', 
    borderRadius: '6px', 
    fontWeight: 'bold',
    backgroundColor: isError ? '#f8d7da' : '#d4edda',
    color: isError ? '#721c24' : '#155724',
    border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`
});

const resultBoxStyle: React.CSSProperties = {
    marginTop: '30px', 
    padding: '20px', 
    backgroundColor: '#fff', 
    borderRadius: '8px',
    border: '1px solid #ddd'
};

const preStyle: React.CSSProperties = {
    overflowX: 'auto', 
    whiteSpace: 'pre-wrap', 
    backgroundColor: '#f8f9fa', 
    padding: '15px', 
    borderRadius: '5px', 
    fontSize: '0.85em',
    border: '1px solid #eee'
};