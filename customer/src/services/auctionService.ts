// --- ENUMS & INTERFACES ---
export const AuctionStatusValue = {
    Pending: 0,
    Active: 1,
    Ended: 2,
    Completed: 3,
    Cancelled: 4,
} as const;

export type AuctionStatus = typeof AuctionStatusValue[keyof typeof AuctionStatusValue];

export const DepositStatusValue = {
    Paid: 0,
    Refunded: 1,
    Forfeited: 2,
} as const;

export type DepositStatus = typeof DepositStatusValue[keyof typeof DepositStatusValue];

export interface Bid {
    bidId: number;
    auctionId: number;
    bidderId: number;
    bidAmount: number;
    statusDeposit: DepositStatus;
    isWinning: boolean;
    createdAt: string; 
}

export interface AuctionDetailData {
    auctionId: number;
    productId: number;
    sellerEmail: string | null;
    sellerPhone: string | null;
    winnerId: number | null;
    transactionId: number | null;
    startingPrice: number;
    currentPrice: number;
    depositAmount: number;
    status: AuctionStatus;
    startTime: string; 
    endTime: string; 
    createdAt: string; 
    
    productTitle: string; 
    productImageUrl: string | null;
}

interface UpdateAuctionStatusRequest {
    auctionId: number;
    auctionStatus: AuctionStatus;
}

interface UpdateTransactionRequest {
    bidId: number;
    transactionId: number;
}

const BASE_URL = 'http://localhost:8000'; 
const AUCTION_API_URL = `${BASE_URL}/api/Auctions`; 
const BIDS_API_URL = `${BASE_URL}/api/Bids`; 

const getAuthHeaders = (contentType: string = 'application/json') => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        throw new Error("Authorization token not found. Please log in.");
    }

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json', // Mặc định chấp nhận JSON
    };
    
    // Quan trọng: Chỉ thêm Content-Type nếu không gửi FormData
    if (contentType === 'application/json') {
        headers['Content-Type'] = 'application/json';
    } else if (contentType !== 'multipart/form-data') {
        headers['Content-Type'] = contentType;
    }
    
    return headers;
};

// ================================
//         AUCTION ROUTES
// ================================

export async function getAuctionDetail(auctionId: number): Promise<AuctionDetailData> {
    // Ví dụ: /api/Auctions/123
    const url = `${AUCTION_API_URL}/${auctionId}`; 

    try {
        const headers = getAuthHeaders();
        
        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(`Failed to fetch auction detail. `);
        }

        return await response.json() as AuctionDetailData;

    } catch (error) {
        console.error("Error in getAuctionDetail:", error);
        throw new Error(`Could not connect to the Auction API`);
    }
}


export async function countAuction(
    transactionId?: number | null,
    sellerPhone?: string | null,
    sellerEmail?: string | null,
    winnerId?: number | null, 
    minPrice?: number | null, 
    maxPrice?: number | null,
    startTime?: string | null,
    endTime?: string | null,
    createAt?: string | null,
    updateAt?: string | null,
    deleteAt?: string | null,
    status?: AuctionStatus | null,
    productId?: number | null,
): Promise<number> {
    
        const allParams = {
        productId: productId ? String(productId) : null,
        transactionId: transactionId ? String(transactionId) : null,
        sellerPhone: sellerPhone ? sellerPhone : null,
        sellerEmail: sellerEmail ? sellerEmail : null,
        winnerId: winnerId ? winnerId : null,
        minPrice: minPrice ? minPrice : null,
        maxPrice: maxPrice ? maxPrice : null,
        startTime: startTime ? startTime : null,
        endTime: endTime ? endTime : null,
        createAt: createAt ? createAt : null,
        updateAt: updateAt ? updateAt : null,
        deleteAt: deleteAt ? deleteAt :null,
        status: status ? status : null, 
    }
    
        const params: Record<string, string> = {};

        Object.entries(allParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined && String(value).trim() !== '') { 
                params[key] = String(value);
            }
        });
    
        const queryParams = new URLSearchParams(params).toString();
    
        const url = `${AUCTION_API_URL}/count?${queryParams}`;

    try {
        const headers = getAuthHeaders();
        console.log(`Fetching count: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(`Failed to fetch product count.`);
        }
        
        const resultText = await response.text();
        const count = parseInt(resultText.trim(), 10);
        
        if (isNaN(count)) {
            console.error(resultText);
            throw new Error(`Invalid response format from count "`);
        }
        
        return count;

    } catch (error) {
        console.error("Error in countProduct:", error);
        throw new Error(`Could not connect to the product count `);
    }
}

export async function searchAuction(
    transactionId?: number | null,
    sellerPhone?: string | null,
    sellerEmail?: string | null,
    winnerId?: number | null, 
    minPrice?: number | null, 
    maxPrice?: number | null,
    startTime?: string | null,
    endTime?: string | null,
    createAt?: string | null,
    updateAt?: string | null,
    deleteAt?: string | null,
    status?: AuctionStatus | null,
    productId?: number | null,
    sortBy?: 'newest' | 'oldest',
    pageNumber?: number | null,
    pageSize?: number | null
): Promise<AuctionDetailData[]> {
    pageNumber = pageNumber || 1;
    pageSize = pageSize || 20;

    const allParams = {
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        sortBy: sortBy || 'newest', 
        productId: productId ? String(productId) : null,
        transactionId: transactionId ? String(transactionId) : null,
        sellerPhone: sellerPhone ? sellerPhone : null,
        sellerEmail: sellerEmail ? sellerEmail : null,
        winnerId: winnerId ? winnerId : null,
        minPrice: minPrice ? minPrice : null,
        maxPrice: maxPrice ? maxPrice : null,
        startTime: startTime ? startTime : null,
        endTime: endTime ? endTime : null,
        createAt: createAt ? createAt : null,
        updateAt: updateAt ? updateAt : null,
        deleteAt: deleteAt ? deleteAt :null,
        status: status ? status : null, 
    }

    const params: Record<string, string> = {};

    Object.entries(allParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') { 
            params[key] = String(value);
        }
    });

    const queryParams = new URLSearchParams(params).toString();

    const url = `${AUCTION_API_URL}/search?${queryParams}`;

    try {
        const headers = getAuthHeaders();

        console.log(`Fetching: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`)
            throw new Error(`Failed to fetch auction. `);
        }

        const result = await response.json(); 
        const data: AuctionDetailData[] = result.data || result; 

        return data.map(auction => ({
             ...auction
        }));
    } catch (error) {
        console.error("Error in searchAuciton:", error);
        throw new Error(`Could not connect to the Auction `);
    }
};

export async function createAuctionApi(
    productId: number,
    startingPrice: number,
    startTime: string,
    endTime: string,
    sellerEmail: string,
    sellerPhone: string,
) : Promise<{ auctionId: number; message: string }> { 
    const url = AUCTION_API_URL;
    console.log(`POST ${url}`);

    const requestBody = {
        productId: productId,
        startingPrice: startingPrice,
        startTime: startTime,
        endTime: endTime,
        sellerEmail: sellerEmail,
        sellerPhone: sellerPhone,
    };

    try {
        const headers = getAuthHeaders();

        const response = await fetch(url, {
            method: 'POST',
            headers: headers, 
            body: JSON.stringify(requestBody), 
        });
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            
            if (contentType && contentType.includes("application/json")) {
                const result = await response.json();
                
                return {
                    auctionId: result.auctionId, 
                    message: 'Auction created successfully.'
                };
            }
            throw new Error('Auction created, but failed to retrieve Auction from response body.');
            
        } else {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(
                `Failed to create Auction.`
            );
        }
    } catch (error) {
        console.error('Error in createAuctionApi:', error);
        throw new Error(
            `Network or processing error when creating Auction`
        );
    }
}

export async function updateAuctionStatusApi(
    auctionId: number,
    auctionStatus: AuctionStatus
): Promise<{ message: string }> {
    const requestBody: UpdateAuctionStatusRequest = { auctionId, auctionStatus };
    const updateUrl = `${AUCTION_API_URL}/status`;
    try {
        const headers = getAuthHeaders();

        console.log(`${updateUrl}`);
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: headers, 
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.message);
            return {
                message: 'Product status Auction successfully.',
            };
        } else {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(
                `Failed to update Auction status.`
            );
        }
    } catch (error) {
        console.error('Error in updateAuctionStatusApi:', error);
        throw new Error(
            `Network or processing error when updating Auction status`
        );
    }
}

export async function updateAuctionCompleteStatusApi(
    auctionId: number,
    transactionId: number
): Promise<{ message: string }> {
    const updateUrl = `${AUCTION_API_URL}/${auctionId}/complete?transactionId=${transactionId}`;
    try {
        const headers = getAuthHeaders();

        console.log(`${updateUrl}`);
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: headers
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.message);
            return {
                message: 'Update status Auction successfully.',
            };
        } else {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(
                `Failed to update Auction status.`
            );
        }
    } catch (error) {
        console.error('Error in updateAuctionCompleteStatusApi:', error);
        throw new Error(
            `Network or processing error when updating Auction status`
        );
    }
}

export async function deletedAuctionApi(
    auctionId: number
): Promise<{ message: string }> {
const unverifyUrl = `${AUCTION_API_URL}/${auctionId}`;
console.log(`DELETE ${unverifyUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(unverifyUrl, {
            method: 'DELETE', 
            headers: headers, 
        });
        
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Delete Auction successfully.' };

            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                }
            } 

            return {
                message: result.message || 'Delete Auction successfully.',
            };
        } else {
            const errorText = await response.text();
            console.error(errorText);
            throw new Error(
                `Failed to delete Auction`
            );
        }
    } catch (error) {
        console.error('Error in deletedAuctionApi:', error);
        throw new Error(
            `Network or processing error when can't delete Auction`
        );
    }
};


//================================
//          BIDS ROUTES
//============================

export async function countBids(
    auctionId?: number | null,
    placedAfter?: string | null,
    placedBefore?: string | null,
    bidderId?: number | null, 
    minAmount?: number | null, 
    maxAmount?: number | null,
    isWinning?: boolean | null,
    createAt?: string | null,
    updateAt?: string | null,
    deleteAt?: string | null,
    statusDeposit?: DepositStatus | null,
): Promise<number> {
    
        const allParams = {
        auctionId: auctionId ? String(auctionId) : null,
        isWinning: isWinning ?? null,
        bidderId: bidderId ? bidderId : null,
        minAmount: minAmount ? minAmount : null,
        maxAmount: maxAmount ? maxAmount : null,
        placedAfter: placedAfter ? placedAfter : null,
        placedBefore: placedBefore ? placedBefore : null,
        createAt: createAt ? createAt : null,
        updateAt: updateAt ? updateAt : null,
        deleteAt: deleteAt ? deleteAt :null,
        statusDeposit: statusDeposit ? statusDeposit : null, 
    }
    
        const params: Record<string, string> = {};

        Object.entries(allParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined && String(value).trim() !== '') { 
                params[key] = String(value);
            }
        });
    
        const queryParams = new URLSearchParams(params).toString();
    
        const url = `${BIDS_API_URL}/count?${queryParams}`;

    try {
        const headers = getAuthHeaders();
        console.log(`Fetching count: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Bid count.`);
        }
        
        const resultText = await response.text();
        const count = parseInt(resultText.trim(), 10);
        
        if (isNaN(count)) {
            throw new Error(`Invalid response format from count`);
        }
        
        return count;

    } catch (error) {
        console.error("Error in countBid:", error);
        throw new Error(`Could not connect to the Bid count`);
    }
}

export async function countBidsMe(
    auctionId?: number | null,
    placedAfter?: string | null,
    placedBefore?: string | null,
    minAmount?: number | null, 
    maxAmount?: number | null,
    isWinning?: boolean | null,
    createAt?: string | null,
    updateAt?: string | null,
    deleteAt?: string | null,
    statusDeposit?: DepositStatus | null,
): Promise<number> {
    
        const allParams = {
        auctionId: auctionId ? String(auctionId) : null,
        isWinning: isWinning ?? null,
        minAmount: minAmount ? minAmount : null,
        maxAmount: maxAmount ? maxAmount : null,
        placedAfter: placedAfter ? placedAfter : null,
        placedBefore: placedBefore ? placedBefore : null,
        createAt: createAt ? createAt : null,
        updateAt: updateAt ? updateAt : null,
        deleteAt: deleteAt ? deleteAt :null,
        statusDeposit: statusDeposit ? statusDeposit : null, 
    }
    
        const params: Record<string, string> = {};

        Object.entries(allParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined && String(value).trim() !== '') { 
                params[key] = String(value);
            }
        });
    
        const queryParams = new URLSearchParams(params).toString();
    
        const url = `${BIDS_API_URL}/count/me?${queryParams}`;

    try {
        const headers = getAuthHeaders();
        console.log(`Fetching count: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(`Failed to fetch Bid count.`);
        }
        
        const resultText = await response.text();
        const count = parseInt(resultText.trim(), 10);
        
        if (isNaN(count)) {
            throw new Error(`Invalid response format from coun`);
        }
        
        return count;

    } catch (error) {
        console.error("Error in countBid:", error);
        throw new Error(`Could not connect to the Bid count`);
    }
}

export async function searchBidsMe(
    auctionId?: number | null,
    placedAfter?: string | null,
    placedBefore?: string | null,
    minAmount?: number | null, 
    maxAmount?: number | null,
    isWinning?: boolean | null,
    createAt?: string | null,
    updateAt?: string | null,
    deleteAt?: string | null,
    statusDeposit?: DepositStatus | null,
    sortBy?: 'newest' | 'oldest',
    pageNumber?: number | null,
    pageSize?: number | null
): Promise<Bid[]> {
    pageNumber = pageNumber || 1;
    pageSize = pageSize || 20;

    const allParams = {
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        sortBy: sortBy || 'newest', 
        auctionId: auctionId ? String(auctionId) : null,
        isWinning: isWinning ?? null,
        minAmount: minAmount ? minAmount : null,
        maxAmount: maxAmount ? maxAmount : null,
        placedAfter: placedAfter ? placedAfter : null,
        placedBefore: placedBefore ? placedBefore : null,
        createAt: createAt ? createAt : null,
        updateAt: updateAt ? updateAt : null,
        deleteAt: deleteAt ? deleteAt :null,
        statusDeposit: statusDeposit ? statusDeposit : null, 
    }

    const params: Record<string, string> = {};

    Object.entries(allParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') { 
            params[key] = String(value);
        }
    });

    const queryParams = new URLSearchParams(params).toString();

    const url = `${BIDS_API_URL}/search/me?${queryParams}`;

    try {
        const headers = getAuthHeaders();

        console.log(`Fetching: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(`Failed to fetch Bid.`);
        }

        const result = await response.json(); 
        const data: Bid[] = result.data || result; 

        return data.map(bids => ({
             ...bids
        }));
    } catch (error) {
        console.error("Error in searchAuciton:", error);
        throw new Error(`Could not connect to the Bid`);
    }
};

export async function searchBids(
    auctionId?: number | null,
    placedAfter?: string | null,
    placedBefore?: string | null,
    bidderId?: number | null, 
    minAmount?: number | null, 
    maxAmount?: number | null,
    isWinning?: boolean | null,
    createAt?: string | null,
    updateAt?: string | null,
    deleteAt?: string | null,
    statusDeposit?: DepositStatus | null,
    sortBy?: 'newest' | 'oldest',
    pageNumber?: number | null,
    pageSize?: number | null
): Promise<Bid[]> {
    pageNumber = pageNumber || 1;
    pageSize = pageSize || 20;

    const allParams = {
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        sortBy: sortBy || 'newest', 
        auctionId: auctionId ? String(auctionId) : null,
        isWinning: isWinning ?? null,
        bidderId: bidderId ? bidderId : null,
        minAmount: minAmount ? minAmount : null,
        maxAmount: maxAmount ? maxAmount : null,
        placedAfter: placedAfter ? placedAfter : null,
        placedBefore: placedBefore ? placedBefore : null,
        createAt: createAt ? createAt : null,
        updateAt: updateAt ? updateAt : null,
        deleteAt: deleteAt ? deleteAt :null,
        statusDeposit: statusDeposit ? statusDeposit : null, 
    }

    const params: Record<string, string> = {};

    Object.entries(allParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') { 
            params[key] = String(value);
        }
    });

    const queryParams = new URLSearchParams(params).toString();

    const url = `${BIDS_API_URL}/search?${queryParams}`;

    try {
        const headers = getAuthHeaders();

        console.log(`Fetching: ${url}`);
        const response = await fetch(url, {
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(`Failed to fetch Bid. `);
        }

        const result = await response.json(); 
        const data: Bid[] = result.data || result; 

        return data.map(bids => ({
             ...bids
        }));
    } catch (error) {
        console.error("Error in searchAuciton:", error);
        throw new Error(`Could not connect to the Bid `);
    }
};

export async function createBidApi(
    auctionId: number,
    bidderId: number,
    amount: string,
    sellerEmail: string,
    sellerPhone: string,
    transactionId?: number,
) : Promise<{ bidId: number; message: string }> { 
    const url = BIDS_API_URL; 
    console.log(`POST ${url}`);

    if (transactionId == null) transactionId = 0;
    const requestBody = {
        auctionId: auctionId,
        bidderId: bidderId,
        amount: amount,
        sellerEmail: sellerEmail,
        sellerPhone: sellerPhone,
        transactionId: transactionId,
    };

    try {
        const headers = getAuthHeaders();

        const response = await fetch(url, {
            method: 'POST',
            headers: headers, 
            body: JSON.stringify(requestBody), 
        });

        if (response.ok) {
            const contentType = response.headers.get("content-type");
            
            if (contentType && contentType.includes("application/json")) {
                const result = await response.json();
                
                return {
                    bidId: result.bidId || result.wishlistId, 
                    message: 'Bid created successfully.'
                };
            }
            throw new Error('Bid created, but failed to retrieve Bid from response body.');
            
        } else {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(
                `Failed to create Bid. `
            );
        }
    } catch (error) {
        console.error('Error in createBidApi:', error);
        throw new Error(
            `Network or processing error when creating Bid`
        );
    }
}

export async function deletedBidApi(
    bidId: number
): Promise<{ message: string }> {
const unverifyUrl = `${BIDS_API_URL}/${bidId}`;
console.log(`DELETE ${unverifyUrl}`);
    try {
        const headers = getAuthHeaders();
        const response = await fetch(unverifyUrl, {
            method: 'DELETE', 
            headers: headers, 
        });
        
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let result = { message: 'Delete bidId successfully.' };

            if (contentType && contentType.includes("application/json")) {
                try {
                    result = await response.json();
                } catch (e) {
                    console.warn(`200 OK received but failed to parse JSON: ${e}`);
                }
            } 

            return {
                message:   'Delete bidId successfully.',
            };
        } else {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(
                `Failed to delete bidId`
            );
        }
    } catch (error) {
    
        console.error('Error in deletedBidApi:', error);
        throw new Error(
            `Network or processing error when can't delete bid`
        );
    }
};

export async function getAuctionsIBidded(): Promise<AuctionDetailData[]> {
    try {
        const bids = await searchBidsMe(
            undefined, undefined, undefined, 
            undefined, undefined, undefined, 
            undefined, undefined, undefined, 
            undefined, 'newest', 1, 1000 
        );

        if (bids.length === 0) {
            return [];
        }

        const auctionIds = bids.map(bid => bid.auctionId);
        const uniqueAuctionIds = [...new Set(auctionIds)];

        const auctionDetailPromises = uniqueAuctionIds.map(id => 
            getAuctionDetail(id).catch(err => {
                console.error(`Error fetching detail for auction ID ${id}:`, err);
                return null; 
            })
        );

        const auctions = await Promise.all(auctionDetailPromises);
        
        return auctions.filter((auction): auction is AuctionDetailData => auction !== null);
        
    } catch (error) {
        console.error("Error in getAuctionsIBidded:", error);
        throw new Error(`Failed to fetch bidded auctions`);
    }
}

export async function updateTransactionApi(
    bidId: number,
    transactionId: number
): Promise<{ message: string }> {
    const requestBody: UpdateTransactionRequest = { bidId, transactionId };
    const updateUrl = `${AUCTION_API_URL}/transaction`;
    try {
        const headers = getAuthHeaders();

        console.log(`${updateUrl}`);
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: headers, 
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.message);
            return {
                message: 'Update transaction for bid successfully.',
            };
        } else {
            const errorText = await response.text();
            console.error(`Status: ${response.status}. Error: ${errorText}`);
            throw new Error(
                `Failed to Update transaction for bid.`
            );
        }
    } catch (error) {
        console.error('Error in updateTransactionApi:', error);
        throw new Error(
            `Network or processing error when Update transaction for bid`
        );
    }
}

export async function getIsMeWinnerById(
    auctionId: number
): Promise<boolean> {
    const url = `${AUCTION_API_URL}/is-me-winner/${auctionId}`; 

    try {
        const headers = getAuthHeaders();
        const response = await fetch(url, {
            method: 'GET',
            headers: headers, 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(errorText);
            throw new Error(`Failed to fetch Error`);
        }
        
        // API trả về boolean, nên parse trực tiếp
        const result: boolean = await response.json();
        return result;

    } catch (error) {
        console.error("Error in getIsMeWinnerById:", error);
        throw new Error(`Could not connect to Service`);
    }
}