import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom"; // Import hook để đọc URL parameters
import { RateService } from "../../services/rateService"; 
import type { RateResponse } from "./RateResponse"; 

// Hàm giả lập đọc ID người dùng đã đăng nhập từ localStorage
const getRateByUserId = (): number => {
    // Giả định userId của người đang đăng nhập được lưu ở đây
    const rateBy = localStorage.getItem("userId"); 
    return rateBy ? parseInt(rateBy) : 0; // Trả về 0 nếu không tìm thấy
};

const CreateUserRatePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const urlUserId = searchParams.get("userId");
    const urlFeedbackId = searchParams.get("feedbackId");
    const loggedInUserId = getRateByUserId();

    // State cho form, khởi tạo từ URL và localStorage
    const [formData, setFormData] = useState({
        feedbackId: (urlFeedbackId ? parseInt(urlFeedbackId) : null) as number | null,
        userId: (urlUserId ? parseInt(urlUserId) : 0), // Người dùng được đánh giá
        rateBy: loggedInUserId, // ID của người đánh giá
        score: 5,
        comment: "",
    });

    const [files, setFiles] = useState<File[]>([]); 
    const [result, setResult] = useState<RateResponse | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userNameDisplay, setUserNameDisplay] = useState("..."); // State tạm thời để hiển thị tên/ID User

    // Cập nhật formData khi URL hoặc loggedInUserId thay đổi
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            userId: urlUserId ? parseInt(urlUserId) : prev.userId,
            feedbackId: urlFeedbackId ? parseInt(urlFeedbackId) : prev.feedbackId,
            rateBy: loggedInUserId,
        }));
        
        // Cập nhật tên hiển thị
        setUserNameDisplay(urlUserId ? `User ID: ${urlUserId}` : "Không xác định");

    }, [urlUserId, urlFeedbackId, loggedInUserId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseInt(value) : null) : value,
        }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };
    
    // Component hiển thị ngôi sao
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setMessage(null);

        if (!formData.rateBy || formData.rateBy === 0) {
            setMessage("Lỗi: Không tìm thấy ID người đánh giá (rateBy) trong localStorage.");
            setLoading(false);
            return;
        }
        if (!formData.userId || formData.userId === 0) {
            setMessage("Lỗi: User ID được đánh giá (userId) không hợp lệ.");
            setLoading(false);
            return;
        }

        try {
            // 1. Tạo đánh giá
            const createdRate = await RateService.postUserRating(formData);
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
        <div style={{ maxWidth: '650px', margin: '30px auto', padding: '30px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ color: '#007bff', borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '30px', textAlign: 'center' }}>
                ✍️ Tạo Đánh Giá **{userNameDisplay}**
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
                    <label htmlFor="comment" style={labelStyle}>📝 Bình Luận:</label>
                    <textarea 
                        name="comment" 
                        value={formData.comment} 
                        onChange={handleChange} 
                        placeholder="Chia sẻ nhận xét của bạn về người dùng này..." 
                        required 
                        style={inputStyle} 
                        rows={4}
                    />
                </div>

                {/* File Input */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>📸 Ảnh Đính Kèm (Không bắt buộc):</label>
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <small style={{ color: '#888', marginTop: '5px' }}>Chọn tối đa 5 ảnh.</small>
                </div>

                {/* Hidden/Info Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
                    <p style={{ margin: 0 }}>**Target User ID:** {formData.userId || 'Chưa có'} </p>
                    <p style={{ margin: 0 }}>**Feedback ID:** {formData.feedbackId || 'Không'}</p>
                    <p style={{ margin: 0, gridColumn: 'span 2' }}>**Đánh giá bởi (Bạn):** {formData.rateBy || 'LỖI (Không có trong LocalStorage)'}</p>
                </div>


                <button type="submit" disabled={loading} style={buttonStyle(loading)}>
                    {loading ? "Đang gửi..." : "🚀 Gửi Đánh Giá User"}
                </button>
            </form>

            {/* Message and Result Display */}
            {message && <p style={messageStyle(message.startsWith("❌"))}>{message}</p>}
            
            {result && (
                <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                    <h3 style={{ color: '#007bff' }}>Kết quả API Trả về:</h3>
                    <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', backgroundColor: '#f4f4f4', padding: '10px', borderRadius: '5px', fontSize: '0.85em' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CreateUserRatePage;

// --- STYLING CONSTANTS ---
const inputStyle: React.CSSProperties = {
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '1em',
    width: '100%',
    boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333'
};

const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
};

const buttonStyle = (loading: boolean): React.CSSProperties => ({
    padding: '15px',
    cursor: loading ? 'not-allowed' : 'pointer',
    backgroundColor: loading ? '#6c757d' : '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
});

const messageStyle = (isError: boolean): React.CSSProperties => ({
    marginTop: '20px', 
    padding: '15px', 
    borderRadius: '6px', 
    fontWeight: 'bold',
    backgroundColor: isError ? '#f8d7da' : '#d4edda',
    color: isError ? '#721c24' : '#155724',
    border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`
});