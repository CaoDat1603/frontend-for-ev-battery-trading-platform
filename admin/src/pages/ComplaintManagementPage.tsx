import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ComplaintService } from '../services/complaintService'; 
import { type ComplaintResponse, type ComplaintListResponse, type ComplaintStatusString } from './Complaint/ComplaintResponse'; 

// === Cấu hình ENUM và Trạng thái lọc ===
const AVAILABLE_STATUSES: (ComplaintStatusString | 'All')[] = [
    'All', 'Pending', 'InReview', 'Resolved', 'Rejected', 'Cancelled'
];

/**
 * Helper: Trả về Tên Enum (string) hoặc undefined để API tự động map.
 * Chúng ta sẽ chuyển từ gửi số (1, 2, 3...) sang gửi tên ("Pending", "Rejected",...)
 */
const statusToFilterValue = (status: string | null): string | undefined => {
    if (!status || status === 'All') {
        return undefined; // Không gửi tham số nếu là 'All'
    }
    // Gửi tên String. API C# sẽ tự động parse "Rejected" thành Enum 4.
    return status; 
};
// =======================================

const ComplaintHandlingPage: React.FC = () => {
    const [complaintsData, setComplaintsData] = useState<ComplaintListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Lấy thông số hiện tại từ URL
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const pageNumber = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');

    // State tạm thời cho ô input lọc User ID
    const [currentUserIdFilter, setCurrentUserIdFilter] = useState(userId || '');


    // ============================================================
    // 1. Fetch Data
    // ============================================================
    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // SỬ DỤNG HELPER MỚI: Trả về tên string (VD: "Rejected")
            const statusFilterValue = statusToFilterValue(status); 
            
            const userIdFilter = userId ? parseInt(userId) : undefined;

            // ComplaintService.getComplaintsPaged giờ nhận string (hoặc undefined) cho status
            const data = await ComplaintService.getComplaintsPaged(
                pageNumber,
                pageSize,
                statusFilterValue, // Gửi String ("Rejected") hoặc undefined
                userIdFilter
            );
            setComplaintsData(data);
        } catch (err: any) {
            // Giữ nguyên logic xử lý lỗi
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pageNumber, pageSize, status, userId]);

    useEffect(() => {
        fetchComplaints();
        setCurrentUserIdFilter(userId || '');
    }, [fetchComplaints, userId]);
    
    // ============================================================
    // 2. Xử lý Lọc và Phân trang (Giữ nguyên)
    // ============================================================
    
    const updateSearchParams = (key: string, value: string | number | null) => {
        const newParams = new URLSearchParams(searchParams);
        
        if (value === null || value === '' || value === 'All') {
            newParams.delete(key);
        } else {
            newParams.set(key, String(value));
        }

        if (key !== 'page') {
            newParams.set('page', '1');
        }
        
        navigate(`?${newParams.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            updateSearchParams('page', newPage);
        }
    };

    const handleUserFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSearchParams('userId', currentUserIdFilter.trim() || null);
    };

    const complaintsList: ComplaintResponse[] = complaintsData?.items ?? [];
    const totalCount: number = complaintsData?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // ============================================================
    // 3. Render (Giữ nguyên)
    // ============================================================

    return (
        <div style={{ padding: '20px' }}>
            <h2>📧 Quản Lý Khiếu Nại</h2>
            <hr />

            {/* Bộ Lọc (Filter Controls) */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                
                {/* Lọc theo Trạng thái */}
                <div>
                    <strong>Trạng thái:</strong>
                    <select 
                        value={status || 'All'} 
                        onChange={(e) => updateSearchParams('status', e.target.value)}
                        style={{ marginLeft: '10px', padding: '5px' }}
                    >
                        {AVAILABLE_STATUSES.map(s => (
                            <option key={s} value={s}>{s === 'All' ? 'Tất cả' : s}</option>
                        ))}
                    </select>
                </div>
                
                {/* Lọc theo User ID */}
                <form onSubmit={handleUserFilterSubmit} style={{ display: 'inline-flex', gap: '10px' }}>
                    <strong>Lọc theo User ID:</strong>
                    <input
                        type="number"
                        placeholder="Nhập User ID"
                        value={currentUserIdFilter}
                        onChange={(e) => setCurrentUserIdFilter(e.target.value)}
                        style={{ padding: '5px', width: '120px' }}
                    />
                    <button type="submit" style={{ padding: '5px 10px' }}>Lọc</button>
                    {userId && <button type="button" onClick={() => updateSearchParams('userId', null)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white' }}>Xóa Lọc</button>}
                </form>
            </div>
            
            <hr />

            {loading && <p>Đang tải danh sách khiếu nại...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {complaintsData && (
                <>
                    {/* Thanh Phân trang & Tổng số */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Tổng số: {totalCount} | Trang: {pageNumber} / {totalPages}</h3>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => handlePageChange(pageNumber - 1)} 
                                disabled={pageNumber <= 1 || loading}
                                style={{ padding: '8px 15px', cursor: pageNumber > 1 && !loading ? 'pointer' : 'not-allowed' }}
                            >
                                Trang Trước
                            </button>
                            <button 
                                onClick={() => handlePageChange(pageNumber + 1)} 
                                disabled={pageNumber >= totalPages || loading}
                                style={{ padding: '8px 15px', cursor: pageNumber < totalPages && !loading ? 'pointer' : 'not-allowed' }}
                            >
                                Trang Sau
                            </button>
                        </div>
                    </div>
                    
                    {/* Danh sách Khiếu nại */}
                    {complaintsList.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {complaintsList.map((c: ComplaintResponse) => (
                                <li key={c.complaintId} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px', backgroundColor: '#f9f9f9' }}>
                                    <strong>ID: {c.complaintId}</strong> - {c.reasonComplaint}
                                    <br />
                                    Trạng thái: **{c.complaintStatus}** | Khiếu nại viên: {c.complaintantId}
                                    <br/>
                                    <a href={`/complaints/${c.complaintId}`}>Xem Chi Tiết</a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Không tìm thấy khiếu nại nào theo điều kiện lọc.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default ComplaintHandlingPage;