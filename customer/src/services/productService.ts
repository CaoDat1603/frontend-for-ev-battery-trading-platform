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

export interface CreateProductRequest {
    title: string;
    price: number; // Sử dụng number cho decimal
    pickupAddress: string;
    productName: string;
    description: string;
    productType: ProductType;
    saleMethod: SaleMethod;
    isSpam?: boolean; // Mặc định là false theo C# DTO, có thể để optional
    registrationCard?: string | null; // Có thể null
    fileUrl?: File | Blob | null; // File hoặc Blob cho upload
    imageUrl?: File | Blob | null; // File hoặc Blob cho upload
}

interface UpdateProductStatusRequest {
    productId: number;
    newStatus: ProductStatus;
}

interface UpdateSaleMeThodRequest {
    productId: number;
    newMethod: SaleMethod;
}

interface VerifiedTransactionRequest {
    transactionId: number;
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
export async function searchForGuest(
    filterStatus: string, 
    searchTerm: string, 
    minPrice?: number | null, 
    maxPrice?: number | null, 
    sellerId?: number | null, 
    pickupAddress?: string | null, 
    sortBy?: 'newest' | 'oldest', 
    saleMethod?: SaleMethod | null,
    isVerified?: boolean | null, 
    productType?: ProductType | null,
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
        isVerified: isVerified !== null && isVerified !== undefined ? String(isVerified) : null,
        productType: productType !== null && productType !== undefined ? String(productType) : null,
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
    
    const url = `${PRODUCT_API_URL}/search?${queryParams}`;

    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(`Failed to shearch product`);
        }
        
        // GIẢ LẬP MAPPING VÀ DỮ LIỆU ĐỂ UI CÓ THỂ RENDER
        const result = await response.json(); 
        const data: ProductData[] = result.data || result; 
        
        return data.map(product => ({
             ...product,
             fileUrl: prefixUrl(product.fileUrl),
             imageUrl: prefixUrl(product.imageUrl),
             
             author: product.author || `user_${product.sellerId}`
        }));


    } catch (error) {
        console.error("Error in getProductsForModeration:", error);
        throw new Error(`Could not connect to service'}`);
    }
}

/**
 * Lấy danh sách sản phẩm dựa trên các bộ lọc (Real API Call).
 * Sử dụng format URL chính xác: pickupAddress = Province, District.
 */
export async function searchForSeller(
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
            console.log(errorText);
            throw new Error(`Failed to shearch Product`);
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
        throw new Error(`Could not connect to Service`);
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
        console.log(`Fetching count: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(`Failed to fetch product count.`);
        }
        
        // SỬA LỖI RESPONSE: Đọc dưới dạng văn bản và chuyển sang số nguyên
        const resultText = await response.text();
        const count = parseInt(resultText.trim(), 10);
        
        // Kiểm tra xem kết quả có phải là một số hợp lệ không
        if (isNaN(count)) {
            console.log(`Invalid response format from count API: Expected number, got "${resultText}"`)
            throw new Error(`Invalid response format from count Product.`);
        }
        
        return count;

    } catch (error) {
        console.error("Error in countProduct:", error);
        throw new Error(`Could not connect to the Service`);
    }
}

export async function countProductSeller(
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
    
    const url = `${PRODUCT_API_URL}/count-seller?${queryParams}`;

    try {
        const headers = getAuthHeaders();
        console.log(`Fetching count: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(`Failed to fetch product count`);
        }
        
        // SỬA LỖI RESPONSE: Đọc dưới dạng văn bản và chuyển sang số nguyên
        const resultText = await response.text();
        const count = parseInt(resultText.trim(), 10);
        
        // Kiểm tra xem kết quả có phải là một số hợp lệ không
        if (isNaN(count)) {
            console.log(`Invalid response format from count API: Expected number, got "${resultText}"`)
            throw new Error("Invalid response format from count Product");
        }
        
        return count;

    } catch (error) {
        console.error("Error in countProduct:", error);
        throw new Error(`Could not connect to the product count.`);
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
            console.log(errorText);
            throw new Error(`Failed to fetch product`);
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
        throw new Error(`Could not connect to the product`);
    }
}

export async function getIsMeProductById(
    productId: number
): Promise<boolean> {
    const url = `${PRODUCT_API_URL}/is-me/${productId}`; 

    try {
        const headers = getAuthHeaders();
        const response = await fetch(url, {
            method: 'GET',
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(`Failed to fetch product`);
        }
        
        // API trả về boolean, nên parse trực tiếp
        const result: boolean = await response.json();
        return result;

    } catch (error) {
        console.error("Error in getIsMeProductById:", error);
        throw new Error(`Could not connect to the product`);
    }
}

/**
 * Hủy gắn nhãn đã kiểm định (Unverify) sản phẩm.
 * Endpoint: DELETE /api/Products/{productId}
 */
export async function deletedProductApi(
    productId: number
): Promise<{ message: string }> {
    const unverifyUrl = `${PRODUCT_API_URL}/${productId}`;

    console.log(`DELETE ${unverifyUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(unverifyUrl, {
            method: 'DELETE', // Sử dụng DELETE
            headers: headers, 
        });
        
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Delete Product successfully.' };

            // Xử lý phản hồi có thể không có body (200 OK hoặc 204 No Content)
            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                }
            } 

            return {
                message: result.message || 'Delete Product successfully.',
            };
        } else {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(
                `Failed to delete product`
            );
        }
    } catch (error) {
        console.error('Error in deleteProductApi:', error);
        throw new Error(
            "Network or processing error when can't delete product,"
        );
    }
}

/**
 * Tạo một sản phẩm mới (Real API Call).
 * Sử dụng FormData để xử lý multipart/form-data, bao gồm cả file upload.
 * @param request Dữ liệu sản phẩm cần tạo, bao gồm cả các file (File | Blob).
 * @returns productId của sản phẩm vừa được tạo.
 */
export async function createProductApi(
    request: CreateProductRequest
): Promise<{ productId: number; message: string }> {
    const url = PRODUCT_API_URL;
    console.log(`POST ${url}`);

    // 1. Tạo FormData
    const formData = new FormData();

    // 2. Thêm các trường dữ liệu
    formData.append('Title', request.title);
    // Sử dụng String() để đảm bảo Price là chuỗi
    formData.append('Price', String(request.price)); 
    formData.append('PickupAddress', request.pickupAddress);
    formData.append('ProductName', request.productName);
    formData.append('Description', request.description);
    
    // Chuyển đổi Enum Value sang string
    formData.append('ProductType', String(request.productType)); 
    formData.append('SaleMethod', String(request.saleMethod));
    
    // IsSpam (mặc định là false)
    formData.append('IsSpam', String(request.isSpam ?? false)); 
    
    // RegistrationCard (có thể null)
    if (request.registrationCard) {
        formData.append('RegistrationCard', request.registrationCard);
    }
    
    // 3. Thêm các trường File (FileUrl, ImageUrl)
    if (request.fileUrl) {
        // Tên trường trong FormData phải khớp với tên trong DTO C# (FileUrl)
        // Tham số thứ 3 là tên file (tùy chọn)
        formData.append('FileUrl', request.fileUrl, 'document.pdf'); 
    }
    if (request.imageUrl) {
        // Tên trường trong FormData phải khớp với tên trong DTO C# (ImageUrl)
        formData.append('ImageUrl', request.imageUrl, 'image.jpg'); 
    }

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
                    productId: result.productId,
                    message: 'Product created successfully.'
                };
            }
            throw new Error('Product created, but failed to retrieve productId from response body.');
            
        } else {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(
                `Failed to create product`
            );
        }
    } catch (error) {
        console.error('Error in createProductApi:', error);
        throw new Error(
            `Network or processing error when creating product`
        );
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
            console.log(errorText);
            throw new Error(
                `Failed to update product status.`
            );
        }
    } catch (error) {
        console.error('Error in updateProductStatusApi:', error);
        throw new Error(
            `Network or processing error when updating product status`
        );
    }
}


/**
 * Cập nhật phương thực bán(Real API Call).
 */
export async function updateSaleMethodApi(
    productId: number,
    newMethod: SaleMethod
): Promise<{ message: string }> {
    const requestBody: UpdateSaleMeThodRequest = { productId, newMethod };
    const updateUrl = `${PRODUCT_API_URL}/sale-method`;
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
                message: result.message || 'Product sale method updated successfully.',
            };
        } else {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(
                `Failed to update product sale method. Sale method`
            );
        }
    } catch (error) {
        console.error('Error in updateProductSaleMethodApi:', error);
        throw new Error(
            `Network or processing error when updating product sale method`
        );
    }
}

export async function verifiedTransactionApi(
    productId: number,
    transactionId: number
): Promise<{ message: string }> {
    const requestBody: VerifiedTransactionRequest = { transactionId };
    const updateUrl = `${PRODUCT_API_URL}/${productId}/verify-transaction`;
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
                message: result.message || 'Product verify transaction successfully.',
            };
        } else {
            const errorText = await response.text();
            console.log(errorText);
            throw new Error(
                `Failed to update product verify transaction. Sale method`
            );
        }
    } catch (error) {
        console.error('Error in verifiedTransactionApi:', error);
        throw new Error(
            `Network or processing error when updating product verify transaction`
        );
    }
}