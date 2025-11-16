export interface WishlistData {
    wishlistId: number;
    userId: number;
    productId: number;
    createdAt: string | null;
    deletedAt: string | null;
}

const BASE_URL = 'http://localhost:8000/'; 
const WISHLIST_API_URL = `${BASE_URL}/api/wishlist`; 

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


export async function countWishlist(
    wishlistId?: number | null, 
    productId?: number | null,
): Promise<number> {
    
    // 1. Định nghĩa TẤT CẢ các tham số (bao gồm cả mặc định)
    const allParams = {        
        wishlistId: wishlistId ? String(wishlistId) : null,
        productId: productId ? String(productId) : null,
    };
    
    // 2. Xây dựng Object params CHỈ chứa giá trị hợp lệ
    const params: Record<string, string> = {};

    // Thêm các tham số có giá trị (loại bỏ null, undefined, và chuỗi rỗng)
    Object.entries(allParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') { 
            params[key] = String(value);
        }
    });
    
    // 4. Chuyển đổi Object thành chuỗi query (đảm bảo không có & thừa)
    const queryParams = new URLSearchParams(params).toString();
    
    const url = `${WISHLIST_API_URL}/count?${queryParams}`;

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
        
        return count;

    } catch (error) {
        console.error("Error in countProduct:", error);
        throw new Error(`Could not connect to the product count API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function searchWishlist(
    wishlistId?: number | null, 
    productId?: number | null,
    sortBy?: 'newest' | 'oldest',
    pageNumber?: number | null,
    pageSize?: number | null
): Promise<WishlistData[]> {
    pageNumber = pageNumber || 1;
    pageSize = pageSize || 20;

    const allParams = {
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        sortBy: sortBy || 'newest', 
        wishlistId: wishlistId ? String(wishlistId) : null,
        productId: productId ? String(productId) : null,
    }

    const params: Record<string, string> = {};

    // Thêm các tham số có giá trị (loại bỏ null, undefined, và chuỗi rỗng)
    Object.entries(allParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') { 
            params[key] = String(value);
        }
    });

    const queryParams = new URLSearchParams(params).toString();

    const url = `${WISHLIST_API_URL}/search?${queryParams}`;

    try {
        const headers = getAuthHeaders();

        console.log(`Fetching: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch wishlist. Status: ${response.status}. Error: ${errorText}`);
        }

        const result = await response.json(); 
        const data: WishlistData[] = result.data || result; 

        return data.map(wishlist => ({
             ...wishlist
        }));
    } catch (error) {
        console.error("Error in searchWishlist:", error);
        throw new Error(`Could not connect to the Wishlist API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export async function createWishlistApi(
    productId: number
) : Promise<{ wishlistId: number; message: string }> {
    const url = WISHLIST_API_URL;
    console.log(`POST ${url}`);

    const formData = new FormData();

    formData.append('ProductId', String(productId));

    try {
        const headersWithAuth = getAuthHeaders('multipart/form-data');

        const { 'Content-Type': _, ...finalHeaders } = headersWithAuth;

        const response = await fetch(url, {
            method: 'POST',
            headers: finalHeaders, 
            body: formData,
        });
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            
            if (contentType && contentType.includes("application/json")) {
                const result = await response.json();
                
                return {
                    wishlistId: result.wishlistId,
                    message: 'Wishlist created successfully.'
                };
            }
            throw new Error('Wishlist created, but failed to retrieve wishlistId from response body.');
            
        } else {
            const errorText = await response.text();
            throw new Error(
                `Failed to create wishlist. Status: ${response.status}. Error: ${errorText}`
            );
        }
    } catch (error) {
        console.error('Error in createWishlistApi:', error);
        throw new Error(
            `Network or processing error when creating wishlist: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
}

export async function deletedWishlistApi(
    wishlistId: number
): Promise<{ message: string }> {
const unverifyUrl = `${WISHLIST_API_URL}/${wishlistId}`;
console.log(`DELETE ${unverifyUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(unverifyUrl, {
            method: 'DELETE', // Sử dụng DELETE
            headers: headers, 
        });
        
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Delete Wishlist successfully.' };

            // Xử lý phản hồi có thể không có body (200 OK hoặc 204 No Content)
            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                }
            } 

            return {
                message: result.message || 'Delete Wishlist successfully.',
            };
        } else {
            const errorText = await response.text();
            throw new Error(
                `Failed to delete Wishlist. Response: ${errorText}`
            );
        }
    } catch (error) {
        console.error('Error in deletedWishlistApi:', error);
        throw new Error(
            `Network or processing error when can't delete Wishlist: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`
        );
    }
};


