// ManageAuctionsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
    searchAuction, 
    countAuction, 
    updateAuctionStatusApi,
    AuctionStatusValue,
    type AuctionDetailData,
    type AuctionStatus,
    searchBidsMe, 
    getAuctionDetail,
} from '../services/auctionService'; 
// *** IMPORT CẦN THIẾT TỪ PRODUCT SERVICE ***
import { searchForSeller, SaleMethodValue } from '../services/productService'; 
import { AuctionCard } from '../components/AuctionCard'; 

// --- KHAI BÁO CẤU HÌNH VÀ MÀU CHỦ ĐẠO ---
const CURRENT_USER_ID = 1; 
const PAGE_SIZE = 5; 
const ECYCLE_COLOR = '#1cff2bff'; 
const ECYCLE_COLOR_HOVER = '#1cff2b94';
const TEXT_COLOR = '#0a2309'; 

// *** HÀM MỚI CHO TAB 'myProducts' ***
const getMyAuctions = async (pageNumber: number, pageSize: number): Promise<{ data: AuctionDetailData[], total: number }> => {
    
    try {
        // BƯỚC 1: Lấy danh sách Product của Seller hiện tại (sellerId = null) có trạng thái Available và phương thức Auction
        const productDataList = await searchForSeller(
            'Available', // statusProduct = Available
            '',          // searchTerm
            null, null,  // min/maxPrice
            null,        // sellerId: null để backend tự xác định qua token
            null, "newest", null, null, null, 
            SaleMethodValue.Auction, // methodSale = Auction
            null, // Filters khác
            1, 50 // Tải đủ sản phẩm để xử lý (phân trang client side sau)
        );
        
        const allAuctionDetails: (AuctionDetailData & { createdAt: string, productId: number })[] = [];
        
        // BƯỚC 2: Kiểm tra từng Product ID để tìm Auction đang Active
        // Giả định AuctionDetailData phải có productId (được thêm khi fetch)
        const auctionPromises = productDataList.map(async (product) => {
            try {
                // Giả định API searchAuction có thể lọc theo productId (tham số đầu tiên)
                const auctions = await searchAuction(
                    null, null, null, null, null, null, null, null, null, null, null,
                    AuctionStatusValue.Active, // Chỉ lấy Auction đang hoạt động
                    product.productId, 
                     'newest', 1, 1 // Chỉ cần Auction mới nhất
                );
                
                // Nếu tìm thấy Auction đang Active, lấy Auction đầu tiên (mới nhất)
                if (auctions && auctions.length > 0) {
                    // Thêm trường productId và startTime (dùng làm createdAt) để sắp xếp sau
                    return { 
                        ...auctions[0], 
                        createdAt: auctions[0].startTime, 
                        productId: product.productId 
                    } as AuctionDetailData & { createdAt: string, productId: number };
                }
            } catch (e) {
                // Bỏ qua nếu có lỗi fetch auction cho 1 product cụ thể
                console.warn(`Could not fetch active auction for product ${product.productId}`, e);
            }
            return null; 
        });
        
        const resultsWithNull = await Promise.all(auctionPromises);
        
        // Lọc bỏ kết quả null và chuẩn hóa danh sách Auction
        const validAuctions = resultsWithNull.filter(
            (a): a is AuctionDetailData & { createdAt: string, productId: number } => a !== null
        );

        // BƯỚC 3: Sắp xếp theo thời gian tạo Auction (startTime) từ mới nhất đến sớm nhất
        // (Đây chính là 'newest' vì auctions[0] là mới nhất)
        validAuctions.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const total = validAuctions.length;
        
        // BƯỚC 4: Thực hiện Phân trang thủ công
        const startIndex = (pageNumber - 1) * pageSize;
        const pagedAuctions = validAuctions.slice(startIndex, startIndex + pageSize);
        
        return {
            data: pagedAuctions,
            total: total
        };
    } catch (e) {
        console.error("Lỗi trong getMyAuctions:", e);
        // Trả về dữ liệu rỗng nếu có lỗi trong quá trình fetch/lọc
        return { data: [], total: 0 };
    }
}
// --- KẾT THÚC HÀM MỚI ---

type Tab = 'active' | 'bidded' | 'myProducts';

export const ManageAuctionsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('active');
    // Bổ sung kiểu dữ liệu cho productId (có thể cần cho AuctionCard)
    const [auctions, setAuctions] = useState<(AuctionDetailData & { productId?: number })[]>([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchDataAndCount = useCallback(async (tab: Tab, page: number) => {
        setLoading(true);
        setError(null);
        let data: (AuctionDetailData & { productId?: number })[] = [];
        let count: number = 0; 

        try {
            if (tab === 'active') {
                count = await countAuction(
                    undefined, undefined, undefined, undefined, undefined, undefined, 
                    undefined, undefined, undefined, undefined, undefined, 
                    AuctionStatusValue.Active 
                );
                
                data = await searchAuction(
                    undefined, undefined, undefined, undefined, undefined, undefined, 
                    undefined, undefined, undefined, undefined, undefined, 
                    AuctionStatusValue.Active, 
                    undefined, 'newest', page, PAGE_SIZE 
                );

            } else if (tab === 'bidded') {
                // Logic đếm Auction ID độc nhất
                const allBids = await searchBidsMe(
                    undefined, undefined, undefined, undefined, undefined, undefined, 
                    undefined, undefined, undefined, undefined, 'newest', 1, 1000 
                );

                const uniqueAuctionIds = Array.from(new Set(allBids.map(bid => bid.auctionId)));
                count = uniqueAuctionIds.length; 

                const startIndex = (page - 1) * PAGE_SIZE;
                const endIndex = startIndex + PAGE_SIZE;
                const auctionIdsForCurrentPage = uniqueAuctionIds.slice(startIndex, endIndex);

                if (auctionIdsForCurrentPage.length > 0) {
                    const auctionDetailPromises = auctionIdsForCurrentPage.map(auctionId => 
                        getAuctionDetail(auctionId).catch(err => null)
                    );
                    const auctionsWithNull = await Promise.all(auctionDetailPromises);
                    data = auctionsWithNull.filter((auction): auction is AuctionDetailData => auction !== null);
                } else {
                    data = [];
                }

            } else if (tab === 'myProducts') {
                // *** SỬ DỤNG HÀM MỚI ***
                const result = await getMyAuctions(page, PAGE_SIZE); 
                // Cần đảm bảo rằng data trả về có thể được gán vào state
                data = result.data as (AuctionDetailData & { productId?: number })[]; 
                count = result.total;
            }

            setAuctions(data);
            setTotalCount(count); 

        } catch (err) {
            setError(`Lỗi khi tải dữ liệu: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
            setTotalCount(0);
            setAuctions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDataAndCount(activeTab, pageNumber);
    }, [activeTab, pageNumber, fetchDataAndCount]);
    
    const handleTabChange = (tab: Tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
            setPageNumber(1); 
        }
    }

    const handleActionClick = async (action: 'view' | 'cancel' | 'complete', auctionId: number) => {
        if (action === 'view') {
            alert(`Chuyển đến trang chi tiết Auction ID: ${auctionId}`);
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn ${action === 'cancel' ? 'HỦY' : 'HOÀN THÀNH'} Auction ID ${auctionId} không?`)) {
            return;
        }

        try {
            const newStatus = action === 'cancel' ? AuctionStatusValue.Cancelled : AuctionStatusValue.Completed;
            await updateAuctionStatusApi(auctionId, newStatus as AuctionStatus); 
            alert(`Cập nhật trạng thái Auction ID ${auctionId} thành công!`);
            
            fetchDataAndCount(activeTab, pageNumber); 

        } catch (err) {
            alert(`Lỗi khi cập nhật trạng thái: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
            console.error(err);
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const getTabStyle = (tab: Tab): React.CSSProperties => ({
        padding: '10px 20px',
        cursor: 'pointer',
        border: 'none',
        borderBottom: activeTab === tab ? `3px solid ${ECYCLE_COLOR}` : '3px solid transparent',
        backgroundColor: activeTab === tab ? `${ECYCLE_COLOR_HOVER}` : 'transparent',
        color: TEXT_COLOR,
        marginRight: '5px',
        borderRadius: '5px 5px 0 0',
        fontWeight: 'bold',
        transition: 'all 0.3s'
    });
    
    const PaginationButton: React.FC<{ direction: 'prev' | 'next' }> = ({ direction }) => {
        const isPrev = direction === 'prev';
        const disabled = isPrev ? pageNumber === 1 || loading : pageNumber === totalPages || loading;
        
        const handleClick = () => {
            if (isPrev) {
                setPageNumber(p => Math.max(1, p - 1));
            } else {
                setPageNumber(p => Math.min(totalPages, p + 1));
            }
        };

        return (
            <button
                onClick={handleClick}
                disabled={disabled}
                style={{ 
                    padding: '8px 15px', 
                    border: `1px solid ${ECYCLE_COLOR}`, 
                    borderRadius: '20px', 
                    backgroundColor: disabled ? '#f0f0f0' : ECYCLE_COLOR, 
                    color: disabled ? '#aaa' : '#000',
                    fontWeight: 'bold',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s',
                    minWidth: '120px'
                }}
            >
                {isPrev ? '< Trang Trước' : 'Trang Sau >'}
            </button>
        );
    };

    return (
        <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ color: TEXT_COLOR, borderBottom: `2px solid ${ECYCLE_COLOR}`, paddingBottom: '10px' }}>
                Danh sách Quản Lý Đấu Giá ♻️
            </h2>
            
            {/* Thanh Tab */}
            <div style={{ marginBottom: '20px', display: 'flex' }}>
                <button style={getTabStyle('active')} onClick={() => handleTabChange('active')}>
                    🔥 Đang Hoạt Động
                </button>
                <button style={getTabStyle('bidded')} onClick={() => handleTabChange('bidded')}>
                    💰 Tôi Đã Tham Gia
                </button>
                <button style={getTabStyle('myProducts')} onClick={() => handleTabChange('myProducts')}>
                    📦 Sản Phẩm Của Tôi
                </button>
            </div>

            {/* Hiển thị trạng thái */}
            {loading && <p style={{ textAlign: 'center', color: TEXT_COLOR }}>Đang tải dữ liệu...</p>}
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            
            {/* Tổng quan và Phân trang */}
            {!loading && totalCount > 0 && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '20px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    border: `1px solid ${ECYCLE_COLOR_HOVER}`
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: TEXT_COLOR }}>
                        Tìm thấy {totalCount} phiên đấu giá.
                    </p>
                    
                    {/* Thanh điều hướng phân trang */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PaginationButton direction="prev" />
                        <span style={{ margin: '0 5px', fontWeight: 'bold', color: TEXT_COLOR }}>
                            Trang {pageNumber} / {totalPages}
                        </span>
                        <PaginationButton direction="next" />
                    </div>
                </div>
            )}
            
            {!loading && !error && auctions.length === 0 && totalCount === 0 && (
                <p style={{ textAlign: 'center', padding: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
                    Không tìm thấy phiên đấu giá nào trong mục này.
                </p>
            )}

            {/* Danh sách Auction Card */}
            <div style={{ display: 'grid', gap: '10px' }}>
                {!loading && !error && auctions.map(auction => (
                    <AuctionCard 
                        // Ép kiểu cho productId để AuctionCard không lỗi
                        key={auction.auctionId}
                        auction={auction as AuctionDetailData & { productId: number }} 
                        isBidder={activeTab === 'bidded'}
                        isSeller={activeTab === 'myProducts'} // Vì logic lọc đã đảm bảo đây là sản phẩm của mình
                        onActionClick={handleActionClick}
                    />
                ))}
            </div>
            
            {/* Phân trang dưới cùng */}
            {!loading && totalCount > PAGE_SIZE && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #ccc' }}>
                     <PaginationButton direction="prev" />
                    <span style={{ margin: '0 5px', alignSelf: 'center', fontWeight: 'bold', color: TEXT_COLOR }}>
                        Trang {pageNumber} / {totalPages}
                    </span>
                    <PaginationButton direction="next" />
                </div>
            )}

        </div>
    );
};