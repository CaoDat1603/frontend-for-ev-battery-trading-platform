import React, { useState, useEffect, useCallback, type JSX, useMemo, useRef } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Button, Chip, TextField, Select, MenuItem, InputLabel, FormControl,
    CircularProgress, Alert, Avatar, Container // Giữ Container
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SellIcon from '@mui/icons-material/Sell';
import VerifiedIcon from '@mui/icons-material/Verified';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh'; 
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

// Icons cho Breadcrumb
import HomeIcon from '@mui/icons-material/Home';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';

// --- Imports từ component con và service ---
import { PaginationBar } from '../components/PaginationBar'; // 🚨 IMPORT COMPONENT PHÂN TRANG

// === 1. IMPORT TỪ FILE SERVICE CHUYÊN BIỆT & DATA ===
import { 
    type ProductData, 
    type ProductStatus, 
    type SaleMethod, 
    ProductStatusValue, 
    SaleMethodValue, 
    searchForSeller, 
    deletedProductApi, 
    countProductSeller, // 🚨 IMPORT HÀM ĐẾM SỐ LƯỢNG
    updateProductStatusApi, // Giữ lại cho Actions
    ProductType
} from '../services/productService'; 
import { VIETNAM_PROVINCES } from '../data/vietnamLocations'; 
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
    let color: 'default' | 'success' | 'error' | 'warning' | 'primary' = 'default';
    const statusString = getStatusString(status);

    if (status === ProductStatusValue.Available) color = 'success';
    else if (status === ProductStatusValue.Block || status === ProductStatusValue.Suspended) color = 'error';
    else if (status === ProductStatusValue.SoldOut) color = 'primary'; 
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

// Định nghĩa kiểu dữ liệu cho Filter (Giữ nguyên)
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

const ProductManagementPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    
    // --- MOCK USER ID ---
    const LOGGED_IN_SELLER_ID: number | null = null; 
    
    // --- STATE CHO DỮ LIỆU VÀ PHÂN TRANG ---
    const itemsPerPage = 6; // Đặt số lượng mục trên mỗi trang
    const [products, setProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState<boolean>(true); 
    const [error, setError] = useState<string | null>(null); 
    const [currentPage, setCurrentPage] = useState(1); // 🚨 STATE TRANG HIỆN TẠI
    const [totalPosts, setTotalPosts] = useState(0); // 🚨 STATE TỔNG SỐ LƯỢNG

    // Tính toán tổng số trang
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    // --- STATE CHO LỌC VÀ TÌM KIẾM ---
    const initialFilters = useMemo(() => ({
        ...defaultFilters,
        sellerId: LOGGED_IN_SELLER_ID ? String(LOGGED_IN_SELLER_ID) : '',
    }), [LOGGED_IN_SELLER_ID]);
    
    const [currentFilters, setCurrentFilters] = useState<ProductFilters>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(initialFilters);
    
    // 🚨 useRef để theo dõi thay đổi của appliedFilters (cho việc reset trang)
    const appliedFiltersRef = useRef(appliedFilters);


    const { 
        filterStatus, searchTerm, minPrice, maxPrice, 
        filterProvince, filterDistrict, sortBy, saleMethod,
        filterIsSpam, filterIsVerified, productType, createAt, sellerId, // Giữ sellerId ở đây để truyền vào API
    } = currentFilters;

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
    
    const selectedProvince = useMemo(() => {
        if (filterProvince === 'All') return null;
        return VIETNAM_PROVINCES.find(p => p.id === filterProvince);
    }, [filterProvince]);

    const districtsList = useMemo(() => {
        return selectedProvince ? selectedProvince.districts : [];
    }, [selectedProvince]);
    
    const handleSearch = () => {
        // 🚨 Khi tìm kiếm, áp dụng filters và reset về trang 1
        setAppliedFilters(currentFilters);
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        // Nếu đã ở trang 1, việc gọi API sẽ do useEffect [appliedFilters] xử lý
    };

    const handleReset = () => {
        // 🚨 Khi reset, áp dụng filters mặc định và reset về trang 1
        setCurrentFilters(initialFilters);
        setAppliedFilters(initialFilters);
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
        // Nếu đã ở trang 1, việc gọi API sẽ do useEffect [appliedFilters] xử lý
    };

    const currentPickupAddress = useMemo(() => {
        if (appliedFilters.filterProvince === 'All') return null;
        
        const selectedProv = VIETNAM_PROVINCES.find(p => p.id === appliedFilters.filterProvince);
        if (!selectedProv) return null;

        let address = selectedProv.name; 
        
        if (appliedFilters.filterDistrict !== 'All') {
            const selectedDist = selectedProv.districts.find(d => d.id === appliedFilters.filterDistrict);
            if (selectedDist) {
                address = `${selectedDist.name}, ${address}`; 
            }
        }
        
        return address; 
    }, [appliedFilters.filterProvince, appliedFilters.filterDistrict]);

    const convertFilterToBoolean = (filterValue: string): boolean | null => {
        if (filterValue === 'True') return true;
        if (filterValue === 'False') return false;
        return null;
    }


    // --- HÀM GỌI API (BAO GỒM TÌM KIẾM VÀ ĐẾM) ---
    const fetchProducts = useCallback(async (page: number, currentFilters: typeof appliedFilters) => {
        setLoading(true);
        setError(null);

        const { 
            filterStatus, searchTerm, minPrice, maxPrice, 
            sortBy, saleMethod, filterIsSpam, filterIsVerified,
            productType, createAt, sellerId
        } = currentFilters;

        const method: SaleMethod | null = saleMethod === 'All' 
            ? null 
            : SaleMethodValue[saleMethod as keyof typeof SaleMethodValue] as SaleMethod; 
        
        const isSpamFilter = convertFilterToBoolean(filterIsSpam);
        const isVerifiedFilter = convertFilterToBoolean(filterIsVerified);

        const productTypeFilter = productType === 'All' 
            ? null 
            : ProductType[productType as keyof typeof ProductType] as ProductType;

        const createAtFilter = createAt ? new Date(createAt).toISOString() : null;

        // Các tham số chung cho cả 2 API
        const commonSearchParams = {
            filterStatus,
            minPrice: minPrice ? Number(minPrice) : null,
            maxPrice: maxPrice ? Number(maxPrice) : null,
            sellerId: sellerId ? Number(sellerId) : LOGGED_IN_SELLER_ID,
            pickupAddress: currentPickupAddress,
            saleMethod: method,
            isSpam: isSpamFilter,
            isVerified: isVerifiedFilter,
            productType: productTypeFilter,
            createdAt: createAtFilter
        };

        try {
            // 🚨 GỌI ĐỒNG THỜI HÀM TÌM KIẾM (CÓ PHÂN TRANG) VÀ HÀM ĐẾM
            const [productListResult, totalCountResult] = await Promise.all([
                // 1. Lấy dữ liệu trang
                searchForSeller(
                    commonSearchParams.filterStatus, 
                    searchTerm, 
                    commonSearchParams.minPrice,
                    commonSearchParams.maxPrice,
                    null, 
                    commonSearchParams.pickupAddress, 
                    sortBy,
                    commonSearchParams.saleMethod,
                    commonSearchParams.isSpam, 
                    commonSearchParams.isVerified, 
                    commonSearchParams.productType,
                    commonSearchParams.createdAt,
                    page, // 🚨 TRUYỀN THAM SỐ TRANG
                    itemsPerPage // 🚨 TRUYỀN THAM SỐ SỐ LƯỢNG/TRANG
                ),
                // 2. Lấy tổng số lượng (KHÔNG CÓ searchTerm, sortBy, page, itemsPerPage)
                countProductSeller(
                    commonSearchParams.filterStatus, 
                    currentFilters.searchTerm,
                    commonSearchParams.minPrice, 
                    commonSearchParams.maxPrice,
                    null,
                    commonSearchParams.pickupAddress,
                    commonSearchParams.saleMethod,
                    commonSearchParams.isSpam,
                    commonSearchParams.isVerified,
                    commonSearchParams.productType,
                    commonSearchParams.createdAt
                ),
            ]);
            
            setProducts(productListResult);
            setTotalPosts(totalCountResult); // 🚨 CẬP NHẬT TỔNG SỐ LƯỢNG
            
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setError('Failed to load products from the server. Check API connection.');
            setTotalPosts(0);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [
        itemsPerPage,
        currentPickupAddress,
        LOGGED_IN_SELLER_ID 
    ]); 

    
    // 🚨 useEffect 1: THEO DÕI THAY ĐỔI CỦA BỘ LỌC (appliedFilters)
    useEffect(() => {
        // So sánh appliedFilters hiện tại với appliedFilters đã lưu trong ref
        if (JSON.stringify(appliedFilters) !== JSON.stringify(appliedFiltersRef.current)) {
            // Cập nhật ref cho lần chạy tiếp theo
            appliedFiltersRef.current = appliedFilters; 
            
            // Nếu bộ lọc thay đổi, ta phải reset về trang 1
            if (currentPage !== 1) {
                // Chỉ reset về 1, việc gọi API sẽ do useEffect [currentPage] xử lý
                setCurrentPage(1);
            } else {
                // Nếu đã ở trang 1, gọi fetchProducts ngay lập tức với filters mới
                fetchProducts(1, appliedFilters);
            }
        }
    }, [appliedFilters, fetchProducts]); 

    
    // 🚨 useEffect 2: THEO DÕI THAY ĐỔI CỦA TRANG (currentPage)
    useEffect(() => {
        // Luôn chạy khi currentPage thay đổi.
        // Kiểm tra xem appliedFilters có bị thay đổi cùng lúc hay không (trường hợp setCurrentPage(1) ở trên)
        const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(appliedFiltersRef.current);

        // Gọi fetchProducts nếu: 
        // 1. Chuyển từ trang X sang trang Y (currentPage thay đổi)
        // 2. Hoặc là trang 1, và filters KHÔNG thay đổi (ví dụ: lần đầu load)
        if (currentPage !== 1 || !filtersChanged) {
             fetchProducts(currentPage, appliedFilters);
             window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang
        }
        
        // Cập nhật appliedFiltersRef để đảm bảo filtersChange không còn đúng trong lần chạy tiếp theo
        appliedFiltersRef.current = appliedFilters; 
    }, [currentPage, fetchProducts]); // Dependency: currentPage và fetchProducts


    // Hàm thay đổi trang
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };
    
    // --- LOGIC ACTIONS (Giữ nguyên) ---
    const markAsSoldOut = useCallback(async (id: number) => { 
        if (!window.confirm('Are you sure you want to mark this product as Sold Out?')) return;
        try {
            await updateProductStatusApi(id, ProductStatusValue.SoldOut);
            
            setProducts(prevProducts => prevProducts.map(product => 
                product.productId === id ? { ...product, statusProduct: ProductStatusValue.SoldOut } : product
            ));

        } catch (e) {
            console.error('Error marking as Sold Out:', e);
            alert(`Failed to mark product ${id} as Sold Out: ${e instanceof Error ? e.message : 'Unknown Error'}`);
        }
    }, []);

    const handleDeleteProduct = useCallback(async (id: number) => {
        if (!window.confirm('Are you sure you want to DELETE this product (Soft Delete)?')) return;
        try {
            await deletedProductApi(id);

            // Sau khi xóa, không chỉ cập nhật UI mà còn cần fetch lại trang hiện tại (hoặc trang trước nếu xóa ở trang cuối)
            // Để đơn giản, ta chỉ cần gọi lại fetchProducts.
            // setProducts(prevProducts => prevProducts.filter(product => product.productId !== id));
            fetchProducts(currentPage, appliedFilters); 

        } catch (e) {
            console.error('Error deleting product:', e);
            alert(`Failed to delete product ${id}: ${e instanceof Error ? e.message : 'Unknown Error'}`);
        }
    }, [fetchProducts, currentPage, appliedFilters]);
    
    const handleRowClick = (productId: number) => { 
        navigate(`/detail-post-manage/${productId}`); 
    };


    // --- RENDER LOGIC ---
    if (loading && totalPosts === 0) { // Chỉ hiển thị spinner nếu chưa có dữ liệu nào
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
    <Box sx={{ flexGrow: 1, pb: 4, bgcolor: '#f5f5f5' }}> 
        <Container maxWidth="xl" sx={{ pt: 3 }}> 
            
            {/* Breadcrumb (Đường dẫn) */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                    <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Trang chủ
                </Link>
                {' / '}
                <Box component="span" sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 'bold', 
                    textDecoration: 'none' 
                }}>
                    <SellIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Quản lý Sản phẩm
                </Box>
            </Typography>
            
            {/* Tiêu đề chính */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <SellIcon color="primary" fontSize="large" /> 
                <Typography variant="h5" fontWeight="bold">
                    Quản lý Tin Đăng ({totalPosts.toLocaleString()} sản phẩm)
                </Typography>
            </Stack>

            <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: theme.shadows[1] }}>
                
                {/* Thanh Công cụ Lọc/Tìm kiếm (Giữ nguyên) */}
                <Box 
                    sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 2, 
                        mb: 3,
                        alignItems: 'center',
                    }}
                >
                    
                    {/* Các FormControl và TextField giữ nguyên... */}
                    <TextField
                        size="small"
                        placeholder="Search post titles..."
                        variant="outlined"
                        value={searchTerm} 
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
                        sx={{ minWidth: 200 }}
                    />

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
                    
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Method</InputLabel>
                        <Select value={saleMethod} label="Method" onChange={(e) => handleFilterChange('saleMethod', e.target.value)} >
                            <MenuItem value="All">All Methods</MenuItem>
                            <MenuItem value="FixedPrice">Fixed Price</MenuItem>
                            <MenuItem value="Auction">Auction</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <TextField
                        size="small"
                        label="Min Price"
                        type="number"
                        value={minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 120 }}
                    />
                    <TextField
                        size="small"
                        label="Max Price"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 120 }}
                    />
                    
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

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Spam</InputLabel>
                        <Select value={filterIsSpam} label="Spam" onChange={(e) => handleFilterChange('filterIsSpam', e.target.value)} >
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="True">Spam/Reported</MenuItem>
                            <MenuItem value="False">Not Spam</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Verified</InputLabel>
                        <Select value={filterIsVerified} label="Verified" onChange={(e) => handleFilterChange('filterIsVerified', e.target.value)} >
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="True">Verified</MenuItem>
                            <MenuItem value="False">Not Verified</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select value={sortBy} label="Sort By" onChange={(e) => handleFilterChange('sortBy', e.target.value as 'newest' | 'oldest')} >
                            <MenuItem value="newest">Newest</MenuItem>
                            <MenuItem value="oldest">Oldest</MenuItem>
                        </Select>
                    </FormControl>
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
                                <TableCell align="center">Image</TableCell> 
                                <TableCell>Title</TableCell> 
                                <TableCell>Price</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Submitted</TableCell>
                                <TableCell align="center">Verified</TableCell>
                                <TableCell align="center">Spam</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Hiển thị Loading Row khi đang tải dữ liệu */}
                            {loading && totalPosts > 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <CircularProgress size={24} sx={{ mr: 2 }} /> 
                                        <Typography variant="body2">Đang tải dữ liệu trang {currentPage}...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
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
                                            if (e.target instanceof HTMLElement && e.target.closest('button, .MuiChip-root')) { return; }
                                            handleRowClick(product.productId); 
                                        }}
                                        sx={{ 
                                            cursor: 'pointer',
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            ...((product.isSpam || product.statusProduct === ProductStatusValue.Block) && { bgcolor: theme.palette.error.light + '1A' }) 
                                        }}
                                    >
                                        <TableCell align="center">
                                            {product.imageUrl ? (
                                                <Avatar variant="rounded" src={product.imageUrl} alt={product.title} sx={{ width: 48, height: 48 }} />
                                            ) : (
                                                <ImageNotSupportedIcon sx={{ width: 48, height: 48, color: theme.palette.action.disabled }} />
                                            )}
                                        </TableCell>
                                        
                                        <TableCell>
                                            <Typography 
                                                variant="body1" 
                                                sx={{ 
                                                    fontWeight: product.isSpam ? 'bold' : 'normal', 
                                                    color: product.isSpam ? theme.palette.error.dark : 'text.primary' 
                                                }}
                                            >
                                                {product.title}
                                            </Typography>
                                        </TableCell>
                                        
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {product.price.toLocaleString('vi-VN')} đ
                                            <Chip 
                                                label={product.methodSale === SaleMethodValue.Auction ? 'Auction' : 'Sale'} 
                                                size="small" 
                                                color={product.methodSale === SaleMethodValue.Auction ? 'secondary' : 'primary'} 
                                                sx={{ ml: 1, height: 20 }}
                                            />
                                        </TableCell>
                                        
                                        <TableCell>{product.pickupAddress}</TableCell>
                                        
                                        <TableCell>{product.createdAt.substring(0, 10)}</TableCell>

                                        <TableCell align="center">
                                            {product.isVerified ? (
                                                <VerifiedIcon color="primary" sx={{ fontSize: 20 }} />
                                            ) : (
                                                <Chip label="No" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        
                                        <TableCell align="center">
                                            {product.isSpam ? <Chip label="SPAM" size="small" color="error" /> : 'No'}
                                        </TableCell>
                                        
                                        <TableCell align="center">{getStatusChip(product.statusProduct)}</TableCell>
                                        
                                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                
                                                {product.statusProduct === ProductStatusValue.Available && (
                                                    <Button 
                                                        variant="contained" 
                                                        color="secondary" 
                                                        size="small"
                                                        startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => markAsSoldOut(product.productId)}
                                                        sx={{ minWidth: 100 }}
                                                    >
                                                        Sold Out
                                                    </Button>
                                                )}
                                                
                                                <Button 
                                                    variant="outlined" 
                                                    color="error" 
                                                    size="small"
                                                    startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => handleDeleteProduct(product.productId)}
                                                    sx={{ minWidth: 80 }}
                                                >
                                                    Delete
                                                </Button>
                                                
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                {/* 🚨 PHÂN TRANG */}
                {!loading && !error && totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <PaginationBar 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </Box>
                )}

            </Paper>
        </Container>
    </Box>
);
};

export default ProductManagementPage;