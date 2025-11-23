import React, { useState, useEffect, useCallback, type JSX } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Button, Chip, TextField, Select, MenuItem, InputLabel, FormControl,
    CircularProgress, Alert,
    Pagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import GavelIcon from '@mui/icons-material/Gavel';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DeleteIcon from '@mui/icons-material/Delete';

// === 1. IMPORT TỪ FILE SERVICE CHUYÊN BIỆT & DATA ===
import { 
    type AuctionStatus,
    type AuctionDetailData,
    AuctionStatusValue,
    searchAuction,
    updateAuctionStatusApi,
    updateAuctionCompleteStatusApi,
    deletedAuctionApi,
    countAuction,
} from '../services/auctionService'; // Giả định service nằm ở đây
// ===========================================

// Hàm helper được giữ lại trong component (chỉ phục vụ UI)
const getStatusString = (status: AuctionStatus): string => {
    switch (status) {
        case AuctionStatusValue.Active: return 'Active';
        case AuctionStatusValue.Ended: return 'Ended';
        case AuctionStatusValue.Completed: return 'Completed';
        case AuctionStatusValue.Cancelled: return 'Cancelled';
        default: return 'Pending';
    }
}

// Hàm Helper cho Chip Status
const getStatusChip = (status: AuctionStatus): JSX.Element => {
    let color: 'default' | 'primary' | 'success' | 'error' | 'warning' = 'default';
    let icon: JSX.Element | undefined = undefined;
    const statusString = getStatusString(status);

    if (status === AuctionStatusValue.Active) {
        color = 'success';
        icon = <PlayArrowIcon />;
    }
    else if (status === AuctionStatusValue.Pending) {
        color = 'warning';
        icon = <HourglassEmptyIcon />;
    }
    else if (status === AuctionStatusValue.Ended) {
        color = 'primary';
    }
    else if (status === AuctionStatusValue.Completed) {
        color = 'success';
        icon = <CheckCircleOutlineIcon />;
    }
    else if (status === AuctionStatusValue.Cancelled) {
        color = 'error';
        icon = <BlockIcon />;
    }

    return (
        <Chip 
            label={statusString} 
            size="small"
            color={color}
            variant="outlined"
            icon={icon}
        />
    );
};

// Định nghĩa kiểu dữ liệu cho Filter (tương ứng với searchAuction params)
interface AuctionFilters {
    filterStatus: string;
    minPrice: string;
    maxPrice: string;
    sellerId: string;
    winnerId: string;
    productId: string;
    sortBy: 'newest' | 'oldest';
    startTime: string; 
    endTime: string;
    createAt: string;
}

const defaultFilters: AuctionFilters = {
    filterStatus: 'All',
    minPrice: '',
    maxPrice: '',
    sellerId: '',
    winnerId: '',
    productId: '',
    sortBy: 'newest',
    startTime: '', 
    endTime: '',
    createAt: '',
};

const PAGE_SIZE = 10;

const AuctionManagementPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    // --- TRẠNG THÁI (STATE) ---
    const [auctions, setAuctions] = useState<AuctionDetailData[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true); 
    const [error, setError] = useState<string | null>(null); 
    
    // State lưu trữ TẤT CẢ giá trị lọc hiện tại (chưa áp dụng)
    const [currentFilters, setCurrentFilters] = useState<AuctionFilters>(defaultFilters);

    // State lưu trữ giá trị lọc ĐÃ ÁP DỤNG (dùng để call API)
    const [appliedFilters, setAppliedFilters] = useState<AuctionFilters>(defaultFilters);
    
    // State trigger: Dùng để force gọi API, kể cả khi appliedFilters không thay đổi.
    const [searchTrigger, setSearchTrigger] = useState<number>(0); 
    
    const { 
        filterStatus, minPrice, maxPrice, sellerId, winnerId, 
        productId, sortBy, startTime, endTime, createAt,
    } = currentFilters;

    // Hàm chung để cập nhật các trường lọc
    const handleFilterChange = (field: keyof AuctionFilters, value: string | number | 'newest' | 'oldest' | 'All') => {
        setCurrentFilters(prev => ({ ...prev, [field]: value as any })); 
    };
    
    // --- LOGIC TÌM KIẾM/ĐẶT LẠI ---
    
    const handleSearch = () => {
        setPage(1); // Reset về trang 1 khi tìm kiếm
        setAppliedFilters(currentFilters);
        setSearchTrigger(prev => prev + 1);
    };

    const handleReset = () => {
        setCurrentFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setPage(1);
        setSearchTrigger(prev => prev + 1);
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        setSearchTrigger(prev => prev + 1); // Trigger lại fetch với page mới
    };

    // --- LOGIC FETCH DATA (SỬ DỤNG appliedFilters) ---
    const fetchAuctions = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { 
            filterStatus, minPrice, maxPrice, sellerId, winnerId, 
            productId, sortBy, startTime, endTime, createAt,
        } = appliedFilters;

        try {
            const statusFilter: AuctionStatus | null = filterStatus === 'All' 
                ? null 
                : AuctionStatusValue[filterStatus as keyof typeof AuctionStatusValue] as AuctionStatus;
            
            // Hàm countAuction được gọi trước
            const count = await countAuction(
                null, // transactionId
                null, // sellerPhone
                null, // sellerEmail
                winnerId ? Number(winnerId) : null, 
                minPrice ? Number(minPrice) : null,
                maxPrice ? Number(maxPrice) : null,
                startTime ? new Date(startTime).toISOString() : null,
                endTime ? new Date(endTime).toISOString() : null,
                createAt ? new Date(createAt).toISOString() : null,
                null, // updateAt
                null, // deleteAt
                statusFilter, 
                productId ? Number(productId) : null,
            );
            setTotalCount(count);
            
            // Gọi searchAuction
            const data = await searchAuction(
                null, // transactionId
                null, // sellerPhone
                null, // sellerEmail
                winnerId ? Number(winnerId) : null, 
                minPrice ? Number(minPrice) : null,
                maxPrice ? Number(maxPrice) : null,
                startTime ? new Date(startTime).toISOString() : null,
                endTime ? new Date(endTime).toISOString() : null,
                createAt ? new Date(createAt).toISOString() : null,
                null, // updateAt
                null, // deleteAt
                statusFilter, 
                productId ? Number(productId) : null,
                sortBy,
                page,
                PAGE_SIZE,
            );
            setAuctions(data);
            
        } catch (err) {
            console.error('Failed to fetch auctions:', err);
            setError('Failed to load auctions from the server. Check API connection and logs.');
        } finally {
            setLoading(false);
        }
    }, [appliedFilters, page, searchTrigger]); 

    // Thực hiện fetch khi component mount, filters/page thay đổi, hoặc searchTrigger thay đổi
    useEffect(() => {
        fetchAuctions(); 
    }, [fetchAuctions, searchTrigger]); 


    // --- LOGIC ACTIONS ---
    const handleRowClick = (auctionId: number) => { 
        navigate(`/auction-detail/${auctionId}`); // Giả định route xem chi tiết
    };

    const updateAuctionStatus = useCallback(async (id: number, newStatus: AuctionStatus, transactionId?: number) => { 
        try {
            if (newStatus === AuctionStatusValue.Completed && transactionId) {
                await updateAuctionCompleteStatusApi(id, transactionId);
            } else {
                await updateAuctionStatusApi(id, newStatus);
            }
            
            // Cập nhật trạng thái UI cục bộ (Optimistic Update)
            setAuctions(prevAuctions => prevAuctions.map(auction => 
                auction.auctionId === id ? { ...auction, status: newStatus } : auction
            ));

        } catch (e) {
            console.error('Error updating status:', e);
            alert(`Failed to update auction ${id} status: ${e instanceof Error ? e.message : 'Unknown Error'}`);
            // Force re-fetch để rollback trạng thái nếu cần
            setSearchTrigger(prev => prev + 1);
        }
    }, []);

    const handleDeleteAuction = useCallback(async (id: number) => {
        if (!window.confirm(`Are you sure you want to delete auction ID ${id}?`)) return;
        
        try {
            await deletedAuctionApi(id);
            // Cập nhật UI: Lọc bỏ auction đã xóa
            setAuctions(prevAuctions => prevAuctions.filter(auction => auction.auctionId !== id));
            setTotalCount(prev => prev - 1);
        } catch (e) {
            console.error('Error deleting auction:', e);
            alert(`Failed to delete auction ${id}: ${e instanceof Error ? e.message : 'Unknown Error'}`);
        }
    }, []);


    // --- RENDER LOGIC ---
    if (loading && totalCount === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Đang tải danh sách đấu giá...</Typography>
            </Box>
        );
    }
    
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }


return (
    <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <GavelIcon color="primary" fontSize="large" /> 
            <Typography variant="h5" fontWeight="bold">
                Auction Management 
            </Typography>
        </Stack>

        <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: theme.shadows[1] }}>
            
            {/* Thanh Công cụ Lọc/Tìm kiếm */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 2, 
                    mb: 3,
                    alignItems: 'center',
                }}
            >
                
                {/* 1. Lọc theo Status */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filterStatus} label="Status" onChange={(e) => handleFilterChange('filterStatus', e.target.value)} >
                        <MenuItem value="All">All Statuses</MenuItem>
                        {Object.keys(AuctionStatusValue).map((key) => (
                            <MenuItem key={key} value={key}>{key}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                {/* 2. Product ID */}
                <TextField
                    size="small"
                    label="Product ID"
                    type="number"
                    value={productId}
                    onChange={(e) => handleFilterChange('productId', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 100 }}
                />

                {/* 3. Seller ID */}
                <TextField
                    size="small"
                    label="Seller ID"
                    type="number"
                    value={sellerId}
                    onChange={(e) => handleFilterChange('sellerId', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 100 }}
                />

                {/* 4. Winner ID */}
                <TextField
                    size="small"
                    label="Winner ID"
                    type="number"
                    value={winnerId}
                    onChange={(e) => handleFilterChange('winnerId', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 100 }}
                />

                {/* 5. Khoảng giá (Min Price) */}
                <TextField
                    size="small"
                    label="Min Price"
                    type="number"
                    value={minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 120 }}
                />

                {/* 6. Khoảng giá (Max Price) */}
                <TextField
                    size="small"
                    label="Max Price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 120 }}
                />
                
                {/* 7. Lọc theo Ngày tạo (Create Date) */}
                <TextField
                    size="small"
                    label="Created At"
                    type="date"
                    value={createAt}
                    onChange={(e) => handleFilterChange('createAt', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                />
                
                {/* 8. Lọc theo Ngày bắt đầu (Start Time) */}
                <TextField
                    size="small"
                    label="Start Time"
                    type="date"
                    value={startTime}
                    onChange={(e) => handleFilterChange('startTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                />

                {/* 9. Lọc theo Ngày kết thúc (End Time) */}
                <TextField
                    size="small"
                    label="End Time"
                    type="date"
                    value={endTime}
                    onChange={(e) => handleFilterChange('endTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                />

                {/* 10. Kiểu sắp xếp (Sort By) */}
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select value={sortBy} label="Sort By" onChange={(e) => handleFilterChange('sortBy', e.target.value as 'newest' | 'oldest')} >
                        <MenuItem value="newest">Newest</MenuItem>
                        <MenuItem value="oldest">Oldest</MenuItem>
                    </Select>
                </FormControl>

                {/* Nút Tìm kiếm và Đặt lại */}
                <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}> 
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<SearchIcon />} 
                        onClick={handleSearch}
                    >
                        Search
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        startIcon={<RefreshIcon />}
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                </Stack>
            </Box>

            <TableContainer>
                <Table size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Product Title</TableCell>
                            <TableCell>Start Price / Deposit</TableCell>
                            <TableCell>Current Price</TableCell>
                            <TableCell>Winner ID</TableCell>
                            <TableCell>Start / End Time</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {auctions.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Alert severity="info" sx={{ m: 1 }}>No auctions match the filters.</Alert>
                                </TableCell>
                            </TableRow>
                        ) : (
                            auctions.map((auction) => (
                                <TableRow 
                                    key={auction.auctionId} 
                                    hover
                                    onClick={(e) => {
                                        if (e.target instanceof HTMLElement && e.target.closest('button, .MuiChip-root')) { return; }
                                        handleRowClick(auction.auctionId); 
                                    }}
                                    sx={{ 
                                        cursor: 'pointer',
                                        '&:last-child td, &:last-child th': { border: 0 },
                                    }}
                                >
                                    <TableCell>{auction.auctionId}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{auction.productTitle}</Typography>
                                        <Typography variant="caption" color="text.secondary">Product ID: {auction.productId}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {auction.startingPrice.toLocaleString('vi-VN')} đ 
                                        <Chip 
                                            label={`Deposit: ${auction.depositAmount.toLocaleString('vi-VN')} đ`} 
                                            size="small" 
                                            color="secondary" 
                                            variant="outlined"
                                            sx={{ ml: 1, mt: 0.5 }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                        {auction.currentPrice.toLocaleString('vi-VN')} đ
                                    </TableCell>
                                    <TableCell>{auction.winnerId ?? 'N/A'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        Start: {new Date(auction.startTime).toLocaleString('en-GB', { hour12: false })}
                                        <br />
                                        End: {new Date(auction.endTime).toLocaleString('en-GB', { hour12: false })}
                                    </TableCell>
                                    <TableCell align="center">{getStatusChip(auction.status)}</TableCell>
                                    
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ minWidth: 250 }}>
                                            
                                            {/* Action: Approve Pending Auction */}
                                            {auction.status === AuctionStatusValue.Pending && (
                                                <Button variant="contained" color="success" size="small" startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />} onClick={() => updateAuctionStatus(auction.auctionId, AuctionStatusValue.Active)} >
                                                    Activate
                                                </Button>
                                            )}

                                            {/* Action: Mark as Completed (Requires Winner & Transaction ID) */}
                                            {auction.status === AuctionStatusValue.Ended && auction.winnerId && (
                                                // NOTE: Cần Transaction ID, ở đây giả định 1 (cần UI nhập liệu thực tế)
                                                <Button variant="contained" color="primary" size="small" startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />} onClick={() => updateAuctionStatus(auction.auctionId, AuctionStatusValue.Completed, 1)} > 
                                                    Complete
                                                </Button>
                                            )}
                                            
                                            {/* Action: Cancel Auction (Any Active/Pending) */}
                                            {(auction.status === AuctionStatusValue.Pending || auction.status === AuctionStatusValue.Active) && (
                                                <Button variant="outlined" color="error" size="small" startIcon={<BlockIcon sx={{ fontSize: 16 }} />} onClick={() => updateAuctionStatus(auction.auctionId, AuctionStatusValue.Cancelled)} >
                                                    Cancel
                                                </Button>
                                            )}
                                            
                                            {/* Action: Delete Auction */}
                                            {(auction.status === AuctionStatusValue.Cancelled || auction.status === AuctionStatusValue.Ended || auction.status === AuctionStatusValue.Completed) && (
                                                <Button variant="outlined" color="inherit" size="small" startIcon={<DeleteIcon sx={{ fontSize: 16 }} />} onClick={() => handleDeleteAuction(auction.auctionId)} >
                                                    Delete
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {/* Thanh Phân trang */}
            {totalCount > PAGE_SIZE && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={Math.ceil(totalCount / PAGE_SIZE)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )}
        </Paper>
    </Box>
);
};

export default AuctionManagementPage;