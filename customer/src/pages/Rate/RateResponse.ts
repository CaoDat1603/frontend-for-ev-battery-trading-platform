// src/pages/Rate/interface/RateResponse.ts

// src/pages/Rate/interface/RateResponse.ts

export interface RateImageDto {
    // Sửa imageId thành rateImageId
    rateImageId: number; 
    // Sửa url thành imageUrl
    imageUrl: string;     
    createdAt: string; // Thêm trường này nếu muốn
}

// ... (các interface khác giữ nguyên)

export interface RateResponse {
    rateId: number;
    feedbackId: number | null;
    userId: number | null;
    userName: string; // Cần Hiển thị
    productId: number | null; 
    rateBy: number;
    reviwerIsName: string | null; // Cần hiển thị
    reviwerIsAvartar: string | null;  // Cần Hiển thị
    score: number; // Cần hiển thị
    comment: string; // Cần Hiện thị
    createdAt: string; // Cần hiển thị
    updatedAt: string | null; // Cần hiên thị
    images: RateImageDto[]; // Cần hiển thị
}

/**
 * Interface cho phản hồi API có phân trang
 */
export interface RateListResponse {
    items: RateResponse[];
    totalItems: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}