import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ComplaintService } from "../../services/complaintService";
// Chúng ta chỉ cần ComplaintResponse vì service giờ trả về mảng ComplaintResponse[]
import { type ComplaintResponse } from "./ComplaintResponse"; 

// Loading Spinner (Đã chỉnh style)
const LoadingSpinner: React.FC = () => (
    <div style={{ padding: "40px", textAlign: "center", backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <div 
            style={{
                // Màu sắc hiện đại hơn
                border: "4px solid #e0e0e0",
                borderTop: "4px solid #007bff", // Màu xanh dương nổi bật
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
                marginBottom: '10px'
            }}
        ></div>
        <p style={{ color: '#333', fontWeight: '500' }}>Đang tải danh sách khiếu nại...</p>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}
        </style>
    </div>
)

// Logic màu cho trạng thái (Đơn giản hóa)
const getStatusColor = (status: string): string => {
    switch (status) {
        case 'RESOLVED':
            return '#1e7e34'; // Xanh lá đậm
        case 'PENDING':
            return '#ffc107'; // Vàng cam
        case 'REJECTED':
            return '#dc3545'; // Đỏ
        default:
            return '#6c757d'; // Xám
    }
}

const UserComplaintList: React.FC = () => {

    // Các biến State (Giữ nguyên)
    const [complaints, setComplaints] = React.useState<ComplaintResponse[] | null>(null); 
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // useEffect (Giữ nguyên logic)
    React.useEffect(() => {

        const fetchComplaints = async () => {
            try {
                // GỌI SERVICE (Giữ nguyên)
                const data = await ComplaintService.getByComplaintant(1);
                
                // Gán trực tiếp mảng nhận được vào state complaints (Giữ nguyên)
                setComplaints(data); 

            } catch (err: any) {
                // Logic xử lý lỗi (Giữ nguyên)
                setError(err.message || "Lỗi khi tải danh sách khiếu nại.");
                setComplaints(null);
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    },[]);

    // Các điều kiện render (Giữ nguyên)
    if (loading) return <LoadingSpinner />;
    
    // Đã thay đổi style của div error
    if (error) return (
        <div style={{ padding: "20px", margin: "20px auto", maxWidth: "800px", border: "1px solid #dc3545", color: "#721c24", backgroundColor: "#f8d7da", borderRadius: "4px", textAlign: "center" }}>
            <p style={{ fontWeight: "bold", margin: 0 }}>🚨 Lỗi: {error}</p>
        </div>
    );
    
    // Đã thay đổi style của div không có dữ liệu
    if (!complaints || complaints.length === 0) {
        return (
            <div style={{ padding: "20px", margin: "20px auto", maxWidth: "800px", border: "1px solid #007bff", color: "#004085", backgroundColor: "#cce5ff", borderRadius: "4px", textAlign: "center" }}>
                <p style={{ fontWeight: "bold", margin: 0 }}>Không có khiếu nại nào từ bạn.</p>
            </div>
        );
    }

    // --- HIỂN THỊ DANH SÁCH (Đã chỉnh style) ---
    return (
        <div style={{ padding: "20px", margin: "0 auto", maxWidth: "900px" }}>
            <h2 style={{ 
                borderBottom: "3px solid #007bff", 
                paddingBottom: "10px", 
                marginBottom: "20px", 
                color: "#333",
                fontWeight: "700"
            }}>
                Danh Sách Khiếu Nại của Bạn 
                <span style={{ 
                    fontSize: "0.8em", 
                    marginLeft: "10px", 
                    backgroundColor: "#007bff", 
                    color: "white", 
                    padding: "4px 8px", 
                    borderRadius: "12px" 
                }}>
                    {complaints.length} mục
                </span>
            </h2>
            
            <ul style={{ listStyle: "none", padding: 0 }}>
                {complaints.map((complaint: ComplaintResponse) => ( 
                    <li 
                        key={complaint.complaintId} 
                        style={{ 
                            border: "1px solid #ddd", 
                            padding: "15px", 
                            marginBottom: "15px", 
                            borderRadius: "8px", 
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            transition: "box-shadow 0.3s ease",
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                        }}
                        // Style hover tạm thời, có thể cần CSS Module để áp dụng đầy đủ
                        onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)")}
                        onMouseOut={(e) => (e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)")}
                    >
                        {/* LEFT SIDE: Thông tin chi tiết */}
                        <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: "0 0 5px 0", fontSize: "1.1em" }}>
                                <strong>ID:</strong> 
                                <span style={{ color: '#007bff', marginLeft: '5px', fontWeight: 'bold' }}>
                                    #{complaint.complaintId}
                                </span>
                            </p>
                            <p style={{ margin: "0 0 5px 0" }}>
                                <strong>Lý do:</strong> {complaint.reasonComplaint}
                            </p>
                            <p style={{ margin: "0", display: 'flex', alignItems: 'center' }}>
                                <strong>Trạng thái:</strong> 
                                <span style={{ 
                                    backgroundColor: getStatusColor(complaint.complaintStatus), 
                                    color: 'white', 
                                    padding: '3px 8px', 
                                    borderRadius: '15px', 
                                    marginLeft: '10px', 
                                    fontWeight: 'bold',
                                    fontSize: '0.9em'
                                }}>
                                    {complaint.complaintStatus}
                                </span>
                            </p>
                        </div>
                        
                        {/* RIGHT SIDE: Nút xem chi tiết */}
                        <Link 
                            to={`/complaints/${complaint.complaintId}`}
                            style={{ 
                                textDecoration: 'none',
                                padding: '8px 15px',
                                backgroundColor: '#28a745', // Màu xanh lá nổi bật cho nút hành động
                                color: 'white',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                transition: 'background-color 0.3s ease',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e7e34')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                        >
                            Xem chi tiết
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserComplaintList;