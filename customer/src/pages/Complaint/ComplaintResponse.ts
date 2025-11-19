export interface ComplaintResponse {
    complaintId: number;
    transactionId: number;
    complaintantId: number;
    againstUserId: number;
    reasonComplaint: string;
    description: string;
    evidenceUrl?: string | null;
    complaintStatus : string;
    createdAt: string;
    resolvedAt?: string | null;
    resolvedBy?: number | null;
}

export interface ComplaintCountResponse {
    userId: number;
    complaintCount: number;
}
export interface ComplaintListResponse {
    items: ComplaintResponse[];
    total: number;
}