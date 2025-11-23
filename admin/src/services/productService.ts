// src/services/productService.ts (ĐÃ SỬA LỖI QUERY PARAMS & DTOs VÀ THÊM FILTERS)

import { Block } from "@mui/icons-material";

// --- ĐỊNH NGHĨA TYPES/ENUMS ---
export const ProductStatusValue = {
    Block: 0,
    Pending: 1,
    Available: 2,
    Suspended: 3,
    SoldOut: 4,
} as const;
export type ProductStatus = (typeof ProductStatusValue)[keyof typeof ProductStatusValue];

export const SaleMethodValue = {
    FixedPrice: 0,
    Auction: 1,
} as const;
export type SaleMethod = (typeof SaleMethodValue)[keyof typeof SaleMethodValue];

export const ProductType = {
    ElectricBattery: 0,
    ElectricCarBattery: 1,
    ElectricScooterBattery: 2,
} as const;

export type ProductType = (typeof ProductType)[keyof typeof ProductType];

// --- INTERFACES DỮ LIỆU ---
export interface ProductData {
    productId: number;
    title: string;
    price: number; 
    sellerId: number;
    statusProduct: ProductStatus; 
    pickupAddress: string;
    productName: string;
    description: string;
    productType: ProductType;
    methodSale: SaleMethod; 
    registrationCard: string | null;
    fileUrl: string | null;
    imageUrl: string | null;
    moderatedBy: number | null;
    createdAt: string; 
    updatedAt: string | null;
    deletedAt: string | null;

    author: string; 
    isSpam: boolean;
    isVerified: boolean;
}

interface UpdateProductStatusRequest {
    productId: number;
    newStatus: ProductStatus;
}


// --- CONFIG & API URLs ---
const BASE_URL = 'http://localhost:8000/'; // <-- URL CƠ SỞ ĐÃ ĐỊNH NGHĨA
const PRODUCT_API_URL = `${BASE_URL}/api/products`; 


// --- HELPER FUNCTION: THÊM TIỀN TỐ URL ---

/**
 * Thêm tiền tố BASE_URL vào một đường dẫn nếu nó tồn tại và là đường dẫn tương đối.
 * @param path Đường dẫn tương đối (ví dụ: '/uploads/...')
 * @returns Đường dẫn tuyệt đối (ví dụ: 'http://localhost:8102/uploads/...')
 */
const prefixUrl = (path: string | null): string | null => {
    if (!path) {
        return null;
    }
    // Nếu đường dẫn đã có http/https, coi như là tuyệt đối và trả về nguyên trạng.
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Đảm bảo không có dấu '/' thừa hoặc thiếu giữa BASE_URL và path
    const trimmedPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}products/${trimmedPath}`;
};

/**
 * Lấy Bearer Token từ localStorage và tạo Headers cho request được bảo vệ.
 * @returns Object chứa Headers
 * @throws Error nếu không tìm thấy token.
 */
const getAuthHeaders = (contentType: string = 'application/json') => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        throw new Error("Authorization token not found. Please log in.");
    }

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json', // Mặc định chấp nhận JSON
    };
    
    // Chỉ thêm Content-Type nếu nó không phải là 'multipart/form-data' 
    // (Vì FormData sẽ tự động set Content-Type)
    if (contentType === 'application/json') {
        headers['Content-Type'] = 'application/json';
    } else if (contentType !== 'multipart/form-data') {
        headers['Content-Type'] = contentType;
    }
    
    return headers;
};

// --- SERVICE FUNCTIONS ---

/**
 * Lấy danh sách sản phẩm dựa trên các bộ lọc (Real API Call).
 * Sử dụng format URL chính xác: pickupAddress = Province, District.
 */
export async function getProductsForModeration(
    filterStatus: string, 
    searchTerm: string, 
    minPrice?: number | null, 
    maxPrice?: number | null, 
    sellerId?: number | null, 
    pickupAddress?: string | null, 
    sortBy?: 'newest' | 'oldest', 
    saleMethod?: SaleMethod | null,
    isSpam?: boolean | null,
    isVerified?: boolean | null, 
    productType?: ProductType | null,
    createAt?: string | null,

    pageNumber?: number | null,
    pageSize?: number | null
): Promise<ProductData[]> {
    
    // Pagination & Sorting (Default)
    pageNumber = pageNumber || 1;
    pageSize = pageSize || 20;
    
    // 1. Định nghĩa TẤT CẢ các tham số (bao gồm cả mặc định)
    const allParams = {
        // Luôn có
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        sortBy: sortBy || 'newest', 
        
        // Tùy chọn (Filters)
        q: searchTerm,
        // filterDate (startDate) được giả định là không có trong API mẫu, tạm bỏ qua việc truyền nó
        minPrice: minPrice ? String(minPrice) : null,
        maxPrice: maxPrice ? String(maxPrice) : null,
        sellerId: sellerId ? String(sellerId) : null,
        pickupAddress: pickupAddress, 
        saleMethod: saleMethod !== null && saleMethod !== undefined ? String(saleMethod) : null,
        isSpam: isSpam !== null && isSpam !== undefined ? String(isSpam) : null,
        isVerified: isVerified !== null && isVerified !== undefined ? String(isVerified) : null,
        productType: productType !== null && productType !== undefined ? String(productType) : null,
        createAt: createAt || null,
    };
    
    // 2. Xây dựng Object params CHỈ chứa giá trị hợp lệ
    const params: Record<string, string> = {};

    // Thêm các tham số có giá trị (loại bỏ null, undefined, và chuỗi rỗng)
    Object.entries(allParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') { 
            params[key] = String(value);
        }
    });

    // 3. Xử lý logic đặc biệt cho Status (chỉ thêm nếu KHÔNG phải là 'All')
    if (filterStatus !== 'All' && filterStatus) {
        // Chuyển chuỗi ('Pending') sang giá trị số (0)
        params.status = String(ProductStatusValue[filterStatus as keyof typeof ProductStatusValue]);
    }
    
    // 4. Chuyển đổi Object thành chuỗi query (đảm bảo không có & thừa)
    const queryParams = new URLSearchParams(params).toString();
    
    const url = `${PRODUCT_API_URL}/search/all?${queryParams}`;

    try {
        const headers = getAuthHeaders();

        console.log(`Fetching: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch products. Status: ${response.status}. Error: ${errorText}`);
        }
        
        // GIẢ LẬP MAPPING VÀ DỮ LIỆU ĐỂ UI CÓ THỂ RENDER
        const result = await response.json(); 
        const data: ProductData[] = result.data || result; 
        
        return data.map(product => ({
             ...product,
             // ✅ BỔ SUNG LOGIC THÊM TIỀN TỐ URL Ở ĐÂY
             fileUrl: prefixUrl(product.fileUrl),
             imageUrl: prefixUrl(product.imageUrl),
             
             author: product.author || `user_${product.sellerId}`
        }));


    } catch (error) {
        console.error("Error in getProductsForModeration:", error);
        throw new Error(`Could not connect to the product API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function countProduct(
    filterStatus: string, 
    searchTerm?: string | null,
    minPrice?: number | null, 
    maxPrice?: number | null, 
    sellerId?: number | null, 
    pickupAddress?: string | null, 
    saleMethod?: SaleMethod | null,
    isSpam?: boolean | null,
    isVerified?: boolean | null, 
    productType?: ProductType | null,
    createAt?: string | null
): Promise<number> {
    
    // 1. Định nghĩa TẤT CẢ các tham số (bao gồm cả mặc định)
    const allParams = {        
        // Tùy chọn (Filters)
        q: searchTerm,
        // filterDate (startDate) được giả định là không có trong API mẫu, tạm bỏ qua việc truyền nó
        minPrice: minPrice ? String(minPrice) : null,
        maxPrice: maxPrice ? String(maxPrice) : null,
        sellerId: sellerId ? String(sellerId) : null,
        pickupAddress: pickupAddress, 
        saleMethod: saleMethod !== null && saleMethod !== undefined ? String(saleMethod) : null,
        isSpam: isSpam !== null && isSpam !== undefined ? String(isSpam) : null,
        isVerified: isVerified !== null && isVerified !== undefined ? String(isVerified) : null,
        productType: productType !== null && productType !== undefined ? String(productType) : null,
        createAt: createAt || null,
    };
    
    // 2. Xây dựng Object params CHỈ chứa giá trị hợp lệ
    const params: Record<string, string> = {};

    // Thêm các tham số có giá trị (loại bỏ null, undefined, và chuỗi rỗng)
    Object.entries(allParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') { 
            params[key] = String(value);
        }
    });

    // 3. Xử lý logic đặc biệt cho Status (chỉ thêm nếu KHÔNG phải là 'All')
    if (filterStatus !== 'All' && filterStatus) {
        // Chuyển chuỗi ('Pending') sang giá trị số (0)
        params.status = String(ProductStatusValue[filterStatus as keyof typeof ProductStatusValue]);
    }
    
    // 4. Chuyển đổi Object thành chuỗi query (đảm bảo không có & thừa)
    const queryParams = new URLSearchParams(params).toString();
    
    const url = `${PRODUCT_API_URL}/count?${queryParams}`;

    try {
        const headers = getAuthHeaders();
        console.log(`Fetching count: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch product count. Status: ${response.status}. Error: ${errorText}`);
        }
        
        // SỬA LỖI RESPONSE: Đọc dưới dạng văn bản và chuyển sang số nguyên
        const resultText = await response.text();
        const count = parseInt(resultText.trim(), 10);
        
        // Kiểm tra xem kết quả có phải là một số hợp lệ không
        if (isNaN(count)) {
            throw new Error(`Invalid response format from count API: Expected number, got "${resultText}"`);
        }
        console.log(`✅ Total products matching filters: ${count}`);
        
        return count;

    } catch (error) {
        console.error("Error in countProduct:", error);
        throw new Error(`Could not connect to the product count API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Sửa tên tham số để phản ánh đúng ý định: lấy bằng ID
export async function getProductById(
    productId: number 
): Promise<ProductData> {
    // Sửa URL để phản ánh đúng ý định: lấy bằng ID
    const url = `${PRODUCT_API_URL}/${productId}`; 

    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch product by ID. Status: ${response.status}. Error: ${errorText}`);
        }
        
        // Lấy kết quả (giả định đây là đối tượng sản phẩm duy nhất)
        const result = await response.json(); 
        const product: ProductData = result.data || result; // Lấy đối tượng sản phẩm

        // Trả về một đối tượng ProductData duy nhất (KHÔNG DÙNG .map)
        return {
            ...product,
            // ✅ BỔ SUNG LOGIC THÊM TIỀN TỐ URL Ở ĐÂY
            fileUrl: prefixUrl(product.fileUrl),
            imageUrl: prefixUrl(product.imageUrl),

            author: product.author || `user_${product.sellerId}`
        };

    } catch (error) {
        console.error("Error in getProductById:", error);
        throw new Error(`Could not connect to the product API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Cập nhật trạng thái sản phẩm (Real API Call).
 */
export async function updateProductStatusApi(
    productId: number,
    newStatus: ProductStatus
): Promise<{ message: string }> {
    const requestBody: UpdateProductStatusRequest = { productId, newStatus };
    const updateUrl = `${PRODUCT_API_URL}/status`;
    try {
        const headers = getAuthHeaders();
        console.log(`${updateUrl}`);
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: headers, 
            body: JSON.stringify(requestBody),
        });

        // ✅ Kiểm tra phản hồi và xử lý hợp lệ
        if (response.ok) {
            const result = await response.json();
            return {
                message: result.message || 'Product status updated successfully.',
            };
        } else {
            const errorText = await response.text();
            throw new Error(
                `Failed to update product status. Status: ${response.status}. Response: ${errorText}`
            );
        }
    } catch (error) {
        console.error('Error in updateProductStatusApi:', error);
        throw new Error(
            `Network or processing error when updating product status: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
}

// Các hàm dịch vụ bổ sung có thể được thêm ở đây...
// Ví dụ: Hàm để đánh dấu sản phẩm là spam, xác minh sản phẩm, v.v.
/**
 * Gắn nhãn đã kiểm định sản phẩm
 */
export async function verifyProductApi(
    productId: number
): Promise<{ message: string }> {
    const verifyUrl = `${PRODUCT_API_URL}/${productId}/verified`;
    console.log(`${verifyUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(verifyUrl, {
            method: 'PATCH',
            headers: headers, 
        });
        // ✅ Kiểm tra phản hồi và xử lý hợp lệ
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Product updated successfully.' };

            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                    // Nếu lỗi parse, vẫn coi là thành công vì status 200
                }
            } 
            // Nếu không có Content-Type hoặc Content-Length là 0, dùng giá trị mặc định

            return {
                message: result.message || 'Product updated successfully.',
            };
        } else {
            const errorText = await response.text();
            throw new Error(
                `Failed to update product. Response: ${errorText}`
            );
        }
    } catch (error) {
        console.error('Error in verifyProductApi:', error);
        throw new Error(
            `Network or processing error when updating product: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
}

/**
 * Hủy gắn nhãn đã kiểm định (Unverify) sản phẩm.
 * Endpoint: DELETE /api/Products/{productId}/verified
 */
export async function unverifyProductApi(
    productId: number
): Promise<{ message: string }> {
    const unverifyUrl = `${PRODUCT_API_URL}/${productId}/verified`;
    console.log(`DELETE ${unverifyUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(unverifyUrl, {
            method: 'DELETE', // Sử dụng DELETE
            headers: headers, 
        });
        
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Product unverified successfully.' };

            // Xử lý phản hồi có thể không có body (200 OK hoặc 204 No Content)
            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                }
            } 

            return {
                message: result.message || 'Product unverified successfully.',
            };
        } else {
            const errorText = await response.text();
            throw new Error(
                `Failed to unverify product. Response: ${errorText}`
            );
        }
    } catch (error) {
        console.error('Error in unverifyProductApi:', error);
        throw new Error(
            `Network or processing error when unverifying product: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
}

/**
 * Đánh dấu sản phẩm là Spam.
 * Endpoint: PATCH /api/Products/{productId}/spam
 */
export async function markProductAsSpamApi(
    productId: number
): Promise<{ message: string }> {
    const spamUrl = `${PRODUCT_API_URL}/${productId}/spam`;
    console.log(`PATCH ${spamUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(spamUrl, {
            method: 'PATCH', // Sử dụng PATCH
            headers: headers, 
        });
        
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Product successfully marked as spam.' };

            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                }
            } 

            return {
                message: result.message || 'Product successfully marked as spam.',
            };
        } else {
            const errorText = await response.text();
            throw new Error(
                `Failed to mark product as spam. Response: ${errorText}`
            );
        }
    } catch (error) {
        console.error('Error in markProductAsSpamApi:', error);
        throw new Error(
            `Network or processing error when marking product as spam: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
}

/**
 * Bỏ đánh dấu Spam cho sản phẩm.
 * Endpoint: DELETE /api/Products/{productId}/spam
 */
export async function unmarkProductAsSpamApi(
    productId: number
): Promise<{ message: string }> {
    const spamUrl = `${PRODUCT_API_URL}/${productId}/spam`;
    console.log(`DELETE ${spamUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(spamUrl, {
            method: 'DELETE', // Sử dụng DELETE
            headers: headers, 
        });
        
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Spam status removed successfully.' };

            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                }
            } 

            return {
                message: result.message || 'Spam status removed successfully.',
            };
        } else {
            const errorText = await response.text();
            throw new Error(
                `Failed to remove spam status. Response: ${errorText}`
            );
        }
    } catch (error) {
        console.error('Error in unmarkProductAsSpamApi:', error);
        throw new Error(
            `Network or processing error when removing spam status: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
}