import React, { useState, useEffect, useCallback, type JSX, useMemo } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Button, Chip, TextField, Select, MenuItem, InputLabel, FormControl,
    CircularProgress, Alert, 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import SearchIcon from '@mui/icons-material/Search';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh'; 

// === 1. IMPORT TỪ FILE SERVICE CHUYÊN BIỆT & DATA ===
import { 
    type ProductData, 
    type ProductStatus, 
    type SaleMethod, 
    ProductStatusValue, 
    SaleMethodValue, 
    getProductsForModeration, 
    updateProductStatusApi,
    verifyProductApi,
    unverifyProductApi,
    ProductType
} from '../services/productService'; 
import { VIETNAM_PROVINCES, type District, type Province } from '../data/vietnamLocations'; 
// ===========================================

// Hàm helper được giữ lại trong component (chỉ phục vụ UI)
const getStatusString = (status: ProductStatus): string => {
    switch (status) {
        case ProductStatusValue.Available: return 'Available';
        case ProductStatusValue.Suspended: return 'Suspended';
        case ProductStatusValue.SoldOut: return 'Sold Out';
        case ProductStatusValue.Block: return 'Block';
        default: return 'Pending';
    }
}
// Hàm Helper cho Chip Status
const getStatusChip = (status: ProductStatus): JSX.Element => {
    let color: 'default' | 'success' | 'error' | 'warning' = 'default';
    const statusString = getStatusString(status);

    if (status === ProductStatusValue.Available) color = 'success';
    else if (status === ProductStatusValue.Block || status === ProductStatusValue.Suspended) color = 'error';
    else if (status === ProductStatusValue.SoldOut) color = 'default';
    else if (status === ProductStatusValue.Pending) color = 'warning';

    return (
        <Chip 
            label={statusString} 
            size="small"
            color={color}
            variant="outlined"
        />
    );
};

// Định nghĩa kiểu dữ liệu cho Filter
interface ProductFilters {
    filterStatus: string;
    filterDate: string;
    searchTerm: string;
    minPrice: string;
    maxPrice: string;
    sellerId: string;
    filterProvince: number | 'All'; 
    filterDistrict: number | 'All'; 
    sortBy: 'newest' | 'oldest';
    saleMethod: string;
    filterIsSpam: string; 
    filterIsVerified: string; 
    productType: string;
    createAt: string;
}

const defaultFilters: ProductFilters = {
    filterStatus: 'All',
    filterDate: '',
    searchTerm: '',
    minPrice: '',
    maxPrice: '',
    sellerId: '',
    filterProvince: 'All',
    filterDistrict: 'All',
    sortBy: 'newest',
    saleMethod: 'All',
    filterIsSpam: 'All',
    filterIsVerified: 'All',
    productType: 'All',
    createAt: '',
};

const ContentModerationPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    // --- TRẠNG THÁI (STATE) ---
    const [products, setProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState<boolean>(true); 
    const [error, setError] = useState<string | null>(null); 
    
    // State lưu trữ TẤT CẢ giá trị lọc hiện tại (chưa áp dụng)
    const [currentFilters, setCurrentFilters] = useState<ProductFilters>(defaultFilters);

    // State lưu trữ giá trị lọc ĐÃ ÁP DỤNG (dùng để call API)
    const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(defaultFilters);
    
    // State trigger: Dùng để force gọi API, kể cả khi appliedFilters không thay đổi.
    const [searchTrigger, setSearchTrigger] = useState<number>(0); 
    
    const { 
        filterStatus, filterDate, searchTerm, minPrice, maxPrice, 
        sellerId, filterProvince, filterDistrict, sortBy, saleMethod,
        filterIsSpam, filterIsVerified, productType, createAt, 
    } = currentFilters;

    // Hàm chung để cập nhật các trường lọc & xử lý reset Quận/Huyện khi Tỉnh thay đổi
    const handleFilterChange = (field: keyof ProductFilters, value: string | number | 'newest' | 'oldest' | 'All') => {
        if (field === 'filterProvince') {
            setCurrentFilters(prev => ({ 
                ...prev, 
                filterProvince: value as number | 'All', 
                filterDistrict: 'All' 
            }));
        } else {
            setCurrentFilters(prev => ({ ...prev, [field]: value as any })); 
        }
    };
    
    // --- LOGIC LỌC QUẬN/HUYỆN PHỤ THUỘC ---
    const selectedProvince = useMemo(() => {
        if (filterProvince === 'All') return null;
        return VIETNAM_PROVINCES.find(p => p.id === filterProvince);
    }, [filterProvince]);

    const districtsList = useMemo(() => {
        return selectedProvince ? selectedProvince.districts : [];
    }, [selectedProvince]);
    
    // --- LOGIC TÌM KIẾM/ĐẶT LẠI ---
    
    const handleSearch = () => {
        // Áp dụng các filter hiện tại vào appliedFilters 
        setAppliedFilters(currentFilters);
        // Kích hoạt State Trigger để force API call
        setSearchTrigger(prev => prev + 1);
    };

    const handleReset = () => {
        // Đặt lại cả currentFilters và appliedFilters
        setCurrentFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        // Kích hoạt State Trigger để force API call với bộ lọc mặc định
        setSearchTrigger(prev => prev + 1);
    };

    // --- LOGIC TẠO PICKUP ADDRESS (SỬ DỤNG appliedFilters) ---
    const currentPickupAddress = useMemo(() => {
        if (appliedFilters.filterProvince === 'All') return null;
        
        const selectedProv = VIETNAM_PROVINCES.find(p => p.id === appliedFilters.filterProvince);
        if (!selectedProv) return null;

        let address = selectedProv.name; 
        
        if (appliedFilters.filterDistrict !== 'All') {
            const selectedDist = selectedProv.districts.find(d => d.id === appliedFilters.filterDistrict);
            if (selectedDist) {
                address = `${address}, ${selectedDist.name}`; 
            }
        }
        
        return address; 
    }, [appliedFilters.filterProvince, appliedFilters.filterDistrict]);

    // Hàm chuyển đổi 'All' | 'True' | 'False' sang boolean | null
    const convertFilterToBoolean = (filterValue: string): boolean | null => {
        if (filterValue === 'True') return true;
        if (filterValue === 'False') return false;
        return null;
    }

    // --- LOGIC FETCH DATA (SỬ DỤNG appliedFilters) ---
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { 
            filterStatus, searchTerm, filterDate, minPrice, maxPrice, 
            sellerId, sortBy, saleMethod, filterIsSpam, filterIsVerified,
            productType, createAt,
        } = appliedFilters;

        try {
            // Sửa lỗi kiểu dữ liệu: Ép kiểu kết quả về SaleMethod | null
            const method: SaleMethod | null = saleMethod === 'All' 
                ? null 
                : SaleMethodValue[saleMethod as keyof typeof SaleMethodValue] as SaleMethod; 

            // Chuyển đổi giá trị boolean filters
            const isSpamFilter = convertFilterToBoolean(filterIsSpam);
            const isVerifiedFilter = convertFilterToBoolean(filterIsVerified);

            const productTypeFilter = productType === 'All' 
                ? null 
                : ProductType[productType as keyof typeof ProductType] as ProductType;

            const createAtFilter = createAt 
                ? new Date(createAt).toISOString() // Chuyển về ISO 8601 (UTC)
                : null;

            const data = await getProductsForModeration(
                filterStatus, 
                searchTerm, 
                filterDate,
                minPrice ? Number(minPrice) : null,
                maxPrice ? Number(maxPrice) : null,
                sellerId ? Number(sellerId) : null,
                currentPickupAddress, 
                sortBy,
                method,
                isSpamFilter, 
                isVerifiedFilter, 
                productTypeFilter,
                createAtFilter,
            );
            setProducts(data);
            
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setError('Failed to load content from the server. Check API connection and CORS.');
        } finally {
            setLoading(false);
        }
    }, [
        appliedFilters, // Phụ thuộc vào appliedFilters để lấy giá trị lọc mới nhất
        currentPickupAddress,
    ]); 

    // Thực hiện fetch khi component mount hoặc searchTrigger thay đổi
    useEffect(() => {
        fetchProducts(); 
    }, [
        fetchProducts, 
        searchTrigger // PHỤ THUỘC MỚI: Bắt buộc chạy lại khi searchTrigger thay đổi
    ]); 


    // --- LOGIC ACTIONS ---
    const handleRowClick = (productId: number) => { 
        navigate(`/content/${productId}`); 
    };

    const updateProductStatus = useCallback(async (id: number, newStatus: ProductStatus) => { 
        try {
            await updateProductStatusApi(id, newStatus);
            
            // Cập nhật trạng thái UI cục bộ
            setProducts(prevProducts => prevProducts.map(product => 
                product.productId === id ? { ...product, statusProduct: newStatus } : product
            ));

        } catch (e) {
            console.error('Error updating status:', e);
            alert(`Failed to update product ${id} status: ${e instanceof Error ? e.message : 'Unknown Error'}`);
        }
    }, []);

    // NOTE: Các hàm verifyProduct/unverifyProduct nên cập nhật trạng thái isVerified
    // để UI hiển thị đúng, thay vì chỉ tạo ra bản sao {...product}.
    const verifyProduct = useCallback(async (id: number) => { 
        try {
            await verifyProductApi(id);

            // Cập nhật trạng thái UI cục bộ: isVerified = true
            setProducts(prevProducts => prevProducts.map(product => 
                product.productId === id ? { ...product, isVerified: true } : product
            ));
        } catch (e) {
            console.error('Error updating verification status:', e);
            throw new Error(`Failed to verify product: ${e instanceof Error ? e.message : 'Unknown Error'}`);
        }
    }, []);

    const unverifyProduct = useCallback(async (id: number) => {
        try {
            await unverifyProductApi(id);
            // Cập nhật trạng thái UI cục bộ: isVerified = false
            setProducts(prevProducts => prevProducts.map(product =>
                product.productId === id ? { ...product, isVerified: false } : product
            ));
        } catch (e) {
            console.error('Error updating verification status:', e);
            throw new Error(`Failed to unverify product: ${e instanceof Error ? e.message : 'Unknown Error'}`);
        }
    }, []);

    const toggleVerification = (id: number, currentStatus: boolean) => {
        // Tối ưu hóa: Tránh re-render toàn bộ products nếu chưa cần thiết
        const action = currentStatus ? unverifyProduct : verifyProduct;

        // BẮT ĐẦU: Giả định trạng thái mới trên UI ngay lập tức
        setProducts(products.map(product => 
            product.productId === id ? { ...product, isVerified: !currentStatus } : product
        ));

        // Gọi API
        action(id)
        .then(() => {
            console.log(`Product ${id} verification status toggled.`);
        })
        .catch((e) => {
            // Rollback UI change nếu API thất bại
            setProducts(products.map(product =>
                product.productId === id ? { ...product, isVerified: currentStatus } : product
            ));
            // Hiển thị lỗi
            alert(`Failed to toggle product ${id} verification status: ${e instanceof Error ? e.message : 'Unknown Error'}`);
        });
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Đang tải danh sách sản phẩm...</Typography>
            </Box>
        );
    }
    
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }


return (
    <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <VisibilityIcon color="action" fontSize="large" /> 
            <Typography variant="h5" fontWeight="bold">
                Content Moderation
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
                
                {/* 1. Tìm kiếm chung (Search Term) */}
                <TextField
                    size="small"
                    placeholder="Search post titles..."
                    variant="outlined"
                    value={searchTerm} 
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
                    sx={{ minWidth: 200 }}
                />

                {/* 11. Lọc theo Loại sản phẩm (Product Type) */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Product Type</InputLabel>
                    <Select
                    value={productType}
                    label="Product Type"
                    onChange={(e) => handleFilterChange('productType', e.target.value)}
                >
                        <MenuItem value="All">All Types</MenuItem>
                        <MenuItem value="ElectricBattery">Electric Battery</MenuItem>
                        <MenuItem value="ElectricCarBattery">Electric Car Battery</MenuItem>
                        <MenuItem value="ElectricScooterBattery">Electric Scooter Battery</MenuItem>
                    </Select>
                </FormControl>

                {/* 2. Lọc theo Status */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filterStatus} label="Status" onChange={(e) => handleFilterChange('filterStatus', e.target.value)} >
                        <MenuItem value="All">All Statuses</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Available">Available</MenuItem> 
                        <MenuItem value="Block">Block</MenuItem> 
                        <MenuItem value="Suspended">Suspended</MenuItem> 
                        <MenuItem value="SoldOut">Sold Out</MenuItem> 
                    </Select>
                </FormControl>
                
                {/* 3. Lọc theo Phương thức bán (Sale Method) */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Method</InputLabel>
                    <Select value={saleMethod} label="Method" onChange={(e) => handleFilterChange('saleMethod', e.target.value)} >
                        <MenuItem value="All">All Methods</MenuItem>
                        <MenuItem value="FixedPrice">Fixed Price</MenuItem>
                        <MenuItem value="Auction">Auction</MenuItem>
                    </Select>
                </FormControl>
                
                {/* 4. Seller ID/Author */}
                <TextField
                    size="small"
                    label="Seller ID"
                    type="number"
                    value={sellerId}
                    onChange={(e) => handleFilterChange('sellerId', e.target.value)}
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
                
                {/* 7. Lọc theo Tỉnh/Thành phố (SELECT) */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Province/City</InputLabel>
                    <Select
                        value={filterProvince}
                        label="Province/City"
                        onChange={(e) => handleFilterChange('filterProvince', e.target.value as number | 'All')}
                    >
                        <MenuItem value={'All'}>All Provinces</MenuItem>
                        {VIETNAM_PROVINCES.map((province) => (
                            <MenuItem key={province.id} value={province.id}>
                                {province.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                {/* 8. Lọc theo Quận/Huyện (SELECT phụ thuộc) */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>District</InputLabel>
                    <Select
                        value={filterDistrict}
                        label="District"
                        disabled={filterProvince === 'All'} 
                        onChange={(e) => handleFilterChange('filterDistrict', e.target.value as number | 'All')}
                    >
                        <MenuItem value={'All'}>All Districts</MenuItem>
                        {districtsList.map((district) => (
                            <MenuItem key={district.id} value={district.id}>
                                {district.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                {/* 9. Lọc theo Spam/Reported */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Spam</InputLabel>
                    <Select 
                        value={filterIsSpam} 
                        label="Spam" 
                        onChange={(e) => handleFilterChange('filterIsSpam', e.target.value)} 
                    >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="True">Spam/Reported</MenuItem>
                        <MenuItem value="False">Not Spam</MenuItem>
                    </Select>
                </FormControl>

                {/* 10. Lọc theo Verified */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Verified</InputLabel>
                    <Select 
                        value={filterIsVerified} 
                        label="Verified" 
                        onChange={(e) => handleFilterChange('filterIsVerified', e.target.value)} 
                    >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="True">Verified</MenuItem>
                        <MenuItem value="False">Not Verified</MenuItem>
                    </Select>
                </FormControl>

                {/* 11. Kiểu sắp xếp (Sort By) */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select value={sortBy} label="Sort By" onChange={(e) => handleFilterChange('sortBy', e.target.value as 'newest' | 'oldest')} >
                        <MenuItem value="newest">Newest</MenuItem>
                        <MenuItem value="oldest">Oldest</MenuItem>
                    </Select>
                </FormControl>

                {/* 12. Lọc theo Ngày tạo (Create Date) */}
                <TextField
                    size="small"
                    label="Create At"
                    type="date"
                    value={createAt}
                    onChange={(e) => handleFilterChange('createAt', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                />

                {/* Nút Tìm kiếm và Đặt lại */}
                <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}> 
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<SearchIcon />} 
                        onClick={handleSearch}
                    >
                        Tìm kiếm
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        startIcon={<RefreshIcon />}
                        onClick={handleReset}
                    >
                        Đặt lại
                    </Button>
                </Stack>
            </Box>

            <TableContainer>
                <Table size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Author/Seller</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell align="center">Spam</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Alert severity="info" sx={{ m: 1 }}>Không có sản phẩm nào khớp với bộ lọc.</Alert>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow 
                                    key={product.productId} 
                                    hover
                                    onClick={(e) => {
                                        // Ngăn chặn sự kiện click row nếu người dùng click vào nút hoặc chip
                                        if (e.target instanceof HTMLElement && e.target.closest('button, .MuiChip-root')) { return; }
                                        handleRowClick(product.productId); 
                                    }}
                                    sx={{ 
                                        cursor: 'pointer',
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        ...(product.isSpam && { bgcolor: theme.palette.error.light + '1A' }) 
                                    }}
                                >
                                    <TableCell>{product.productId}</TableCell>
                                    <TableCell sx={{ fontWeight: product.isSpam ? 'bold' : 'normal', color: product.isSpam ? theme.palette.error.dark : 'text.primary' }}>
                                        {product.isSpam && <FlagIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.error.dark }} />}
                                        {product.title}
                                    </TableCell>
                                    <TableCell>{product.author} ({product.sellerId})</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {product.price.toLocaleString('vi-VN')} đ
                                        <Chip 
                                            label={product.methodSale === SaleMethodValue.Auction ? 'Auction' : 'Sale'} 
                                            size="small" 
                                            color={product.methodSale === SaleMethodValue.Auction ? 'secondary' : 'primary'} 
                                            sx={{ ml: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell>{product.pickupAddress}</TableCell>
                                    <TableCell>{product.createdAt.substring(0, 10)}</TableCell>
                                    <TableCell align="center">
                                        {product.isSpam ? <Chip label="SPAM" size="small" color="error" /> : 'No'}
                                    </TableCell>
                                    <TableCell align="center">{getStatusChip(product.statusProduct)}</TableCell>
                                    
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            
                                            {/* Nút Phê duyệt/Từ chối */}
                                            {product.statusProduct === ProductStatusValue.Pending && (
                                                <>
                                                    <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />} onClick={() => updateProductStatus(product.productId, ProductStatusValue.Available)} >Approve</Button>
                                                    <Button variant="outlined" color="error" size="small" startIcon={<BlockIcon sx={{ fontSize: 16 }} />} onClick={() => updateProductStatus(product.productId, ProductStatusValue.Block)} >Block</Button>
                                                </>
                                            )}

                                            {/* Nút Gắn nhãn "Đã kiểm định" */}
                                            {product.statusProduct === ProductStatusValue.Available && (
                                                <Button 
                                                    variant={product.isVerified ? "contained" : "outlined"}
                                                    color="primary" 
                                                    size="small"
                                                    startIcon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => toggleVerification(product.productId, product.isVerified)}
                                                    sx={{ minWidth: 100 }}
                                                >
                                                    {product.isVerified ? 'Verified' : 'Verify'}
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

        </Paper>
    </Box>
);
};

export default ContentModerationPage;