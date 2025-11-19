import React from "react";
import { useLocation } from "react-router-dom";
import { ComplaintService } from "../../services/complaintService";

// Thay thế ENUM bằng CONST OBJECT LITERAL (Giữ nguyên)
const ReasonComplaint = {
    WRONG_ITEM: "WRONG_ITEM",
    LATE_DELIV: "LATE_DELIV",
    CANCLE_PUR: "CANCLE_PUR",
    ERROR_PAYMENT: "ERROR_PAYMENT",
} as const;

// Định nghĩa kiểu dữ liệu cho Lý do khiếu nại (Literal Union Type) (Giữ nguyên)
type ComplaintReasonType = typeof ReasonComplaint[keyof typeof ReasonComplaint];

// Custom hook để lấy query parameters (Giữ nguyên)
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
}

// Hàm chuyển đổi key enum sang chuỗi thân thiện hơn (Giữ nguyên)
const formatReason = (reason: ComplaintReasonType): string => {
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

// Hàm giả định lấy Complaintant ID từ LocalStorage (Giữ nguyên)
const getComplaintantIdFromStorage = (): number | null => {
    const idString = localStorage.getItem("userId"); 
    if (idString) {
        const id = parseInt(idString, 10);
        return isNaN(id) ? null : id;
    }
    return 1; 
};


const CreateComplaint: React.FC = () => {
    const query = useQuery();
    
    // Lấy ID từ URL
    const transactionIdFromUrl = query.get("transactionId");
    // LẤY againstUserId (Người bị khiếu nại) TỪ URL
    const againstUserIdFromUrl = query.get("againstuserid"); 

    // LẤY complaintantId (Người khiếu nại) TỪ LOCAL STORAGE (hoặc giả định)
    const complaintantId = getComplaintantIdFromStorage() || 0; 

    const [reasonComplaint, setReasonComplaint] = React.useState<ComplaintReasonType | ''>('');
    const [description, setDescription] = React.useState("");
    const [file, setFile] = React.useState<File | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [isError, setIsError] = React.useState(false);

    // Xử lý giá trị ID
    const transactionId = transactionIdFromUrl ? parseInt(transactionIdFromUrl, 10) : 101; 
    const againstUserId = againstUserIdFromUrl ? parseInt(againstUserIdFromUrl, 10) : 2; 

    React.useEffect(() => {
        // Kiểm tra tính hợp lệ của các ID cần thiết
        if (isNaN(transactionId) || isNaN(againstUserId) || isNaN(complaintantId)) {
             setIsError(true);
             setMessage("Thông tin ID giao dịch/người bị khiếu nại/người khiếu nại không hợp lệ.");
        }
    }, [transactionId, againstUserId, complaintantId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setIsError(false);
        
        if (isNaN(transactionId) || isNaN(againstUserId) || isNaN(complaintantId)) {
            setMessage("Thiếu hoặc sai ID giao dịch/người bị khiếu nại/người khiếu nại.");
            setIsError(true);
            setLoading(false);
            return;
        }

        if (!reasonComplaint || !description) {
            setMessage("Vui lòng chọn Lý do và điền Mô tả.");
            setIsError(true);
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("transactionId", transactionId.toString());
        formData.append("complaintantId", complaintantId.toString()); 
        formData.append("againstUserId", againstUserId.toString()); 
        formData.append("reasonComplaint", reasonComplaint);
        formData.append("description", description);
        if (file) {
            // ĐÃ KIỂM TRA: Tên trường này phải khớp với tên trường mà API backend (Node/Java/Python) mong đợi.
            // Nếu backend mong đợi tên là 'evidenceFile', bạn đã đặt đúng.
            formData.append("evidenceUrl", file); 
        }
        
        try {
            const result = await ComplaintService.createComplaint(formData);
            setMessage(`Tạo khiếu nại thành công! ID: ${result.complaintId}`);
            setIsError(false);
            setReasonComplaint('');
            setDescription("");
            setFile(null);
            // Cần reset file input thủ công vì nó không liên kết với state
            (e.target as HTMLFormElement).reset(); 
        } catch (err: any) {
            setMessage(err.message || "Lỗi không xác định khi gửi khiếu nại.");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };
    
    // --- STYLES ---

    const containerStyle: React.CSSProperties = { 
        padding: "30px", 
        maxWidth: "650px", 
        margin: "30px auto",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    };

    const headerStyle: React.CSSProperties = {
        borderBottom: "2px solid #007bff",
        paddingBottom: "10px",
        marginBottom: "20px",
        color: "#333",
    };

    const infoBoxStyle: React.CSSProperties = {
        padding: "10px",
        backgroundColor: "#eaf4ff",
        borderRadius: "5px",
        marginBottom: "15px",
        fontSize: "0.9em",
        borderLeft: "5px solid #007bff"
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', 
        padding: '12px', 
        border: '1px solid #ccc', 
        borderRadius: '5px', 
        marginTop: '5px',
        boxSizing: 'border-box',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '12px', 
        backgroundColor: loading ? '#6c757d' : '#28a745', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.3s'
    };

    const messageStyle: React.CSSProperties = {
        marginTop: "20px", 
        padding: "10px 15px",
        borderRadius: "5px",
        fontWeight: "bold",
        backgroundColor: isError ? "#f8d7da" : "#d4edda", // Đỏ nhạt/Xanh lá nhạt
        color: isError ? "#721c24" : "#155724", // Đỏ đậm/Xanh lá đậm
    };

    // --- RENDER ---
    return (
        <div style={containerStyle}>
            <h2 style={headerStyle}>Tạo Khiếu Nại Mới <span style={{ color: '#007bff' }}>#GiaoDịch{transactionId}</span></h2>

            <div style={infoBoxStyle}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Thông tin cơ bản:</p>
                <p style={{ margin: "5px 0 0 0" }}>Người khiếu nại (ID): <strong style={{ color: '#28a745' }}>{complaintantId}</strong></p>
                <p style={{ margin: "0" }}>Người bị khiếu nại (ID): <strong style={{ color: '#dc3545' }}>{againstUserId}</strong></p>
            </div>
            
            {message && <div style={messageStyle}>{message}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div className="form-group">
                    <label style={{ fontWeight: '600', display: 'block' }}>Lý do khiếu nại:</label>
                    <select 
                        value={reasonComplaint} 
                        onChange={(e) => setReasonComplaint(e.target.value as ComplaintReasonType)}
                        required 
                        style={inputStyle}
                    >
                        <option value="" disabled>--- Chọn lý do khiếu nại ---</option>
                        {Object.values(ReasonComplaint).map((reason) => (
                            <option key={reason} value={reason}>
                                {formatReason(reason)} 
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label style={{ fontWeight: '600', display: 'block' }}>Mô tả chi tiết (Tối thiểu 50 ký tự):</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required 
                        rows={5}
                        minLength={50}
                        style={inputStyle}
                        placeholder="Mô tả chi tiết vấn đề, bao gồm thời gian và hậu quả..."
                    />
                </div>
                
                <div className="form-group">
                    <label style={{ fontWeight: '600', display: 'block' }}>File bằng chứng (Hình ảnh/Video):</label>
                    <input 
                        type="file" 
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        style={{ ...inputStyle, padding: '12px 0 12px 0', border: 'none', backgroundColor: 'transparent' }} // Tùy chỉnh cho input type file
                    />
                    {file && <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#007bff' }}>Đã chọn file: <strong>{file.name}</strong></p>}
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading} 
                    style={buttonStyle}
                    onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1e7e34')}
                    onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#28a745')}
                >
                    {loading ? "⌛ Đang gửi..." : "Gửi Khiếu Nại"}
                </button>
            </form>
        </div>
    );
};

export default CreateComplaint;