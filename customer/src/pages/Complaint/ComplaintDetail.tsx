import React from "react";
import { useParams } from "react-router-dom";
import { ComplaintService } from "../../services/complaintService";
import { type ComplaintResponse } from "./ComplaintResponse";

// --- LOGIC MÀU CHO TRẠNG THÁI ---
interface StatusStyle {
    backgroundColor: string;
    color: string;
    label: string;
}

const ReasonComplaint = {
    WRONG_ITEM: "WRONG_ITEM",
    LATE_DELIV: "LATE_DELIV",
    CANCLE_PUR: "CANCLE_PUR",
    ERROR_PAYMENT: "ERROR_PAYMENT",
} as const;

const getStatusStyle = (status: string): StatusStyle => {
    switch (status) {
        case 'RESOLVED':
            return { backgroundColor: '#e6ffed', color: '#1e7e34', label: 'ĐÃ GIẢI QUYẾT' }; // Xanh lá nhạt
        case 'PENDING':
            return { backgroundColor: '#fffbe6', color: '#ffc107', label: 'CHỜ XỬ LÝ' }; // Vàng nhạt
        case 'REJECTED':
            return { backgroundColor: '#f8d7da', color: '#dc3545', label: 'ĐÃ TỪ CHỐI' }; // Đỏ nhạt
        default:
            return { backgroundColor: '#f0f0f0', color: '#6c757d', label: 'KHÔNG XÁC ĐỊNH' };
    }
}



// Loading Spinner (Đã chỉnh style)
const LoadingSpinner: React.FC = () => (
    <div style={{ padding: "40px", textAlign: "center", backgroundColor: '#f9f9f9', borderRadius: '8px', maxWidth: '600px', margin: '20px auto' }}>
        <div 
            style={{
                border: "4px solid #e0e0e0",
                borderTop: "4px solid #007bff", 
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
                marginBottom: '10px'
            }}
        ></div>
        <p style={{ color: '#333', fontWeight: '500' }}>Đang tải chi tiết khiếu nại...</p>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}
        </style>
    </div>
);

// Hàm chuyển đổi key enum sang chuỗi thân thiện hơn (Giữ nguyên)
const formatReason = (reason: string): string => {
    switch (reason) {
        case ReasonComplaint.WRONG_ITEM:
            return "Sai sản phẩm/món hàng";
        case ReasonComplaint.LATE_DELIV:
            return "Giao hàng trễ";
        case ReasonComplaint.CANCLE_PUR:
            return "Hủy đơn hàng không mong muốn";
        case ReasonComplaint.ERROR_PAYMENT:
            return "Lỗi thanh toán";
        default:
            return reason;
    }
}


const ComplaintDetail: React.FC = () => {
    const { complaintId } = useParams<{ complaintId: string }>();
    const [complaint, setComplaint] = React.useState<ComplaintResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!complaintId) {
            setError("Thiếu ID khiếu nại.");
            setLoading(false);
            return;
        }

        const fetchComplaint = async () => {
            try {
                const id = parseInt(complaintId, 10);
                if (isNaN(id)) {
                    throw new Error("ID khiếu nại không hợp lệ.");
                }
                const data = await ComplaintService.getComplaintById(id);
                setComplaint(data);
            } catch (err: any) {
                setError(err.message || "Lỗi khi tải chi tiết khiếu nại.");
            } finally {
                setLoading(false);
            }
        };

        fetchComplaint();
    }, [complaintId]);

    if (loading) return <LoadingSpinner />;
    
    if (error) return (
        <div style={{ padding: "20px", margin: "20px auto", maxWidth: "800px", border: "1px solid #dc3545", color: "#721c24", backgroundColor: "#f8d7da", borderRadius: "4px", textAlign: "center" }}>
            <p style={{ fontWeight: "bold", margin: 0 }}>🚨 Lỗi: {error}</p>
        </div>
    );
    
    if (!complaint) return (
        <div style={{ padding: "20px", margin: "20px auto", maxWidth: "800px", border: "1px solid #007bff", color: "#004085", backgroundColor: "#cce5ff", borderRadius: "4px", textAlign: "center" }}>
            <p style={{ fontWeight: "bold", margin: 0 }}>Không tìm thấy khiếu nại ID: {complaintId}.</p>
        </div>
    );

    const statusInfo = getStatusStyle(complaint.complaintStatus);

    return (
        <div style={{ 
            padding: "30px", 
            margin: "30px auto", 
            maxWidth: "800px", 
            backgroundColor: "#fff", 
            borderRadius: "12px", 
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            fontFamily: 'Arial, sans-serif' 
        }}>
            
            {/* --- HEADER --- */}
            <div style={{ 
                borderBottom: "2px solid #007bff", 
                paddingBottom: "15px", 
                marginBottom: "20px", 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ color: "#333", margin: 0, fontWeight: "700" }}>
                    Chi Tiết Khiếu Nại 
                    <span style={{ color: "#dc3545", marginLeft: "10px" }}>#{complaint.complaintId}</span>
                </h2>
                <div style={{ 
                    padding: "6px 12px", 
                    borderRadius: "20px", 
                    fontWeight: "bold",
                    fontSize: "0.9em",
                    ...statusInfo 
                }}>
                    {statusInfo.label}
                </div>
            </div>

            {/* --- NỘI DUNG CHÍNH (LÝ DO & MÔ TẢ) --- */}
            <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #eee", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#007bff" }}>Lý do Khiếu nại</h3>
                <p style={{ 
                    margin: "0 0 15px 0", 
                    fontSize: "1.1em", 
                    fontWeight: "600",
                    color: '#fb0202ff'
                }}>
                    {formatReason(complaint.reasonComplaint)}
                </p>
                
                <h3 style={{ margin: "15px 0 10px 0", color: "#555" }}>Mô tả chi tiết</h3>
                <p style={{ 
                    whiteSpace: 'pre-wrap', 
                    backgroundColor: '#f9f9f9', 
                    padding: '10px', 
                    borderRadius: '4px',
                    borderLeft: '4px solid #ccc'
                }}>
                    {complaint.description}
                </p>
            </div>

            {/* --- THÔNG TIN NGƯỜI DÙNG VÀ THỜI GIAN --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                
                <InfoBox label="Người khiếu nại (ID)" value={complaint.complaintantId} color="#28a745" />
                <InfoBox label="Chống lại người dùng (ID)" value={complaint.againstUserId} color="#dc3545" />
                <InfoBox label="Ngày tạo" value={new Date(complaint.createdAt).toLocaleDateString()} color="#6c757d" />
                {complaint.resolvedAt && <InfoBox label="Ngày giải quyết" value={new Date(complaint.resolvedAt).toLocaleDateString()} color="#007bff" />}

            </div>
            
            {/* --- BẰNG CHỨNG --- */}
            {complaint.evidenceUrl && (
                <div style={{ marginTop: "25px", paddingTop: "15px", borderTop: "1px dashed #ccc" }}>
                    <p style={{ margin: "0", fontWeight: "bold", color: "#555" }}>Bằng chứng đính kèm:</p>
                    <a 
                        href={`http://localhost:8000/complaint${complaint.evidenceUrl}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                            display: 'inline-block',
                            marginTop: '5px',
                            padding: '8px 15px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                    >
                        Tải/Xem File Bằng Chứng
                    </a>
                </div>
            )}
        </div>
    );
};

// --- CUSTOM COMPONENT NHỎ ĐỂ HIỂN THỊ THÔNG TIN ---
interface InfoBoxProps {
    label: string;
    value: string | number;
    color: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ label, value, color }) => (
    <div style={{ 
        padding: '10px 15px', 
        borderLeft: `3px solid ${color}`, 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px' 
    }}>
        <p style={{ margin: 0, fontSize: '0.85em', color: '#6c757d', fontWeight: '500' }}>{label}</p>
        <p style={{ margin: '3px 0 0 0', fontSize: '1.1em', fontWeight: 'bold', color: color }}>{value}</p>
    </div>
);


export default ComplaintDetail;