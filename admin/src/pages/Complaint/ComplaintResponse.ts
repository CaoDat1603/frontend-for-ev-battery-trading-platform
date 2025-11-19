// Các trạng thái khiếu nại (dùng tên string khớp với Enum để gửi lên API)
export type ComplaintStatusString = 'Pending' | 'InReview' | 'Resolved' | 'Rejected' | 'Cancelled';

export interface ComplaintResponse {
    complaintId: number; 
    transactionId: number | null;
    complaintantId: number;
    againstUserId: number;
    reasonComplaint: string; // Lý do khiếu nại (thay thế cho 'title')
    description: string;
    evidenceUrl: string | null;
    complaintStatus: ComplaintStatusString; // Trạng thái khiếu nại
    resolution: string; // Quyết định/Giải quyết (string)
    resolvedBy: number | null;
    createdAt: string;
    resolvedAt: string | null;
}

export interface ComplaintListResponse {
    items: ComplaintResponse[]; // Danh sách khiếu nại
    totalCount: number; // Tổng số lượng
    pageNumber: number;
    pageSize: number;
}

export interface ComplaintCountResponse {
    // Giả định structure này vẫn được giữ
    total: number;
    pending: number;
    resolved: number;
    processing: number;
}