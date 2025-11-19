import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ComplaintService } from '../services/complaintService'; 
import { type ComplaintResponse, type ComplaintStatusString } from './Complaint/ComplaintResponse'; 

// === ENUM THỰC TẾ TỪ BACKEND ===
// 1. ComplaintStatus (Giá trị số: 1, 2, 3...)
const VALID_STATUSES: ComplaintStatusString[] = ['Pending', 'InReview', 'Resolved', 'Rejected', 'Cancelled'];

// 2. Resolution (Giá trị số: 0, 1, 2)
interface ResolutionOption {
    name: string;
    value: number; // Giá trị số 0, 1, 2
}
const RESOLUTION_OPTIONS: ResolutionOption[] = [
    { name: '0 - Hủy giao dịch (cancel_transaction)', value: 0 }, 
    { name: '1 - Hoàn tiền (refund)', value: 1 },
    { name: '2 - Giữ nguyên (keep)', value: 2 },
];
// ===========================================

// Helper: Chuyển đổi tên trạng thái Complaint (string) sang giá trị số (int)
const statusToNumber = (status: ComplaintStatusString): number => {
    switch (status) {
        case 'Pending': return 1;
        case 'InReview': return 2;
        case 'Resolved': return 3;
        case 'Rejected': return 4;
        case 'Cancelled': return 5;
        default: return 1; 
    }
};

const ComplaintDetailPage: React.FC = () => {
    const { complaintId } = useParams<{ complaintId: string }>();
    const navigate = useNavigate();
    
    const [complaint, setComplaint] = useState<ComplaintResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State cho update: Gửi số cho cả hai Enum
    const [newStatus, setNewStatus] = useState<ComplaintStatusString>('Pending');
    const [newResolution, setNewResolution] = useState<number>(0); 
    
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    
    // ============================================================
    // 1. Lấy chi tiết khiếu nại
    // ============================================================
    const fetchComplaint = async () => {
        if (!complaintId) return;
        setLoading(true);
        setError(null);
        try {
            const id = parseInt(complaintId);
            const data = await ComplaintService.getComplaintById(id);
            setComplaint(data);
            
            setNewStatus(data.complaintStatus);
            // Giả định Resolution trong data là string/text, nên ta đặt default là 0 cho form. 
            // Nếu API trả về Resolution là số, bạn cần mapping nó vào setNewResolution(data.resolution)
            setNewResolution(0); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaint();
    }, [complaintId]);


    // ============================================================
    // 2. Xử lý Cập nhật (Admin) - Gửi GIÁ TRỊ SỐ cho cả Status và Resolution
    // ============================================================
    const handleUpdateComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const id = parseInt(complaintId || '0'); 
        if (!id || !complaint) return;

        setIsUpdating(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        const adminId = 10; 
        
        // PAYLOAD CUỐI CÙNG GỬI LÊN API
        const updateBody = {
            complaintId: id,
            complaintStatus: statusToNumber(newStatus), // Gửi số (1, 2, 3...)
            resolution: newResolution, // Gửi số (0, 1, 2)
            // Gán ID Admin (số nguyên) hoặc null
            resolvedBy: newStatus === 'Resolved' || newStatus === 'Rejected' ? adminId : null, 
        };

        try {
            // Đảm bảo ComplaintService gửi JSON.stringify(updateBody) với Content-Type: application/json
            await ComplaintService.updateComplaint(id, updateBody); 
            setUpdateSuccess(true);
            await fetchComplaint(); 
        } catch (err: any) {
             let errorMessage = err.message;
             try {
                // Thử parse body lỗi để lấy thông báo chi tiết
                const errorData = JSON.parse(err.message);
                if (errorData.errors) {
                    errorMessage = Object.values(errorData.errors).flat().join('; ');
                }
             } catch {}
            setUpdateError(`Cập nhật lỗi: ${errorMessage}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // ============================================================
    // 3. Xử lý Xóa mềm (Admin)
    // ============================================================
    const handleDeleteComplaint = async () => {
        if (!complaintId || !window.confirm(`Bạn có chắc chắn muốn xóa (soft delete) khiếu nại #${complaintId} không?`)) {
            return;
        }

        setIsUpdating(true);
        setUpdateError(null);

        try {
            await ComplaintService.deleteComplaint(parseInt(complaintId));
            alert(`Khiếu nại #${complaintId} đã được xóa mềm thành công.`);
            navigate('/complaints'); 
        } catch (err: any) {
            setUpdateError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };
    
    // Helper: Tìm tên Resolution để hiển thị trên UI
    const getCurrentResolutionName = (value: number) => {
        // Nếu API trả về resolution là TEXT, bạn phải đổi hàm này để dùng text đó.
        return RESOLUTION_OPTIONS.find(opt => opt.value === value)?.name ?? 'Chưa xác định';
    };


    return (
        <div style={{ padding: '20px' }}>
            <h2>🔎 Chi Tiết Khiếu Nại #{complaintId}</h2>
            
            <hr />

            {loading && <p>Đang tải chi tiết khiếu nại...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {complaint && (
                <>
                    {/* Phần Chi Tiết Hiện Có */}
                    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
                        <h3>{complaint.reasonComplaint}</h3>
                        <p><strong>ID Khiếu nại:</strong> {complaint.complaintId}</p>
                        <p><strong>Trạng thái hiện tại:</strong> <span style={{ fontWeight: 'bold', color: complaint.complaintStatus === 'Resolved' ? 'green' : complaint.complaintStatus === 'Pending' ? 'orange' : 'blue' }}>{complaint.complaintStatus}</span></p>
                        <p><strong>Quyết định đã thực hiện:</strong> <em>{getCurrentResolutionName(0)} (Cần mapping từ API Response)</em></p>
                    </div>

                    <hr />

                    {/* Phần Quản Lý Admin */}
                    <h2>🛠️ Công Cụ Admin</h2>
                    {updateError && <p style={{ color: 'red' }}>{updateError}</p>}
                    {updateSuccess && <p style={{ color: 'green' }}>Cập nhật thành công!</p>}
                    
                    {/* Form Cập nhật */}
                    <form onSubmit={handleUpdateComplaint} style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                        <h4>Cập nhật trạng thái và Quyết định</h4>
                        
                        {/* Cập nhật Status */}
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="status">Trạng thái:</label>
                            <select 
                                id="status" 
                                value={newStatus} 
                                onChange={(e) => setNewStatus(e.target.value as ComplaintStatusString)}
                                disabled={isUpdating}
                                style={{ marginLeft: '10px', padding: '5px' }}
                            >
                                {VALID_STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Cập nhật Resolution (Enum) */}
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="resolution">Quyết định (Enum):</label>
                            <select 
                                id="resolution" 
                                value={newResolution} 
                                onChange={(e) => setNewResolution(parseInt(e.target.value))}
                                disabled={isUpdating}
                                style={{ marginLeft: '10px', padding: '5px' }}
                            >
                                {RESOLUTION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.8em', color: '#666' }}>Sẽ gửi giá trị số 0, 1, 2 lên API.</p>
                        </div>

                        <button type="submit" disabled={isUpdating} style={{ backgroundColor: 'green', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }}>
                            {isUpdating ? 'Đang Cập nhật...' : 'Lưu Thay Đổi (PUT)'}
                        </button>
                    </form>

                    {/* Nút Xóa */}
                    <button 
                        onClick={handleDeleteComplaint} 
                        disabled={isUpdating} 
                        style={{ backgroundColor: 'red', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }}
                    >
                        {isUpdating ? 'Đang Xóa...' : 'Xóa mềm Khiếu nại (DELETE)'}
                    </button>
                </>
            )}
        </div>
    );
};

export default ComplaintDetailPage;