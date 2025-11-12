import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Box, Typography, Container, 
    Button, Chip, IconButton, useTheme,
    Divider, CircularProgress, Alert,
    Menu, MenuItem 
} from '@mui/material';
import {Link} from 'react-router-dom';

import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import GridViewIcon from '@mui/icons-material/GridView';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home'; 
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

// --- Imports từ component con và service ---
import { PostCard, type PostData} from '../components/PostCard'; 
import { PaginationBar } from '../components/PaginationBar'; 
import { 
    type ProductType,
    searchForGuest, 
    countProduct, 
    type ProductData, 
    SaleMethodValue, 
    type SaleMethod 
} from '../services/productService'; 
import { useLocationContext } from '../context/LocationContext'; 

// 🚨 IMPORT DỮ LIỆU TỈNH THÀNH CHÍNH XÁC
import { VIETNAM_PROVINCES } from '../data/vietnamLocations'; 
import { useRef } from 'react'; // Bổ sung useRef

// --- TRÍCH XUẤT DỮ LIỆU ĐỊA ĐIỂM SỬ DỤNG TRONG COMPONENT ---
// Danh sách tên các tỉnh/thành phố lớn (dùng cho sidebar)
const VIETNAM_PROVINCE_NAMES: string[] = VIETNAM_PROVINCES.map(p => p.name);

// Danh sách 4 địa điểm phổ biến để hiển thị ở khối Lọc chính
const POPULAR_LOCATIONS: string[] = VIETNAM_PROVINCE_NAMES.slice(0, 4); 


// --- Dữ liệu tĩnh cho Lọc KHÁC ---
const mockPriceRanges = [
    'Giá dưới 200 triệu', 'Giá 200 triệu - 300 triệu', 
    'Giá 300 triệu - 400 triệu', 'Giá 400 triệu - 500 triệu',
    'Giá 500 triệu - 600 triệu', 'Giá trên 600 triệu' 
];
const mockSaleMethods = ['Mua ngay (Cố định)', 'Đấu giá (Auction)']; 

// Định nghĩa các Tùy chọn Sắp xếp
const sortOptions = [
    { label: 'Tin mới nhất', value: 'newest' },
    { label: 'Tin cũ nhất', value: 'oldest' },
];


// --- Component Lọc Phụ (Sidebar) ---
interface FilterSectionProps {
    title: string;
    items: string[];
    isInitiallyOpen?: boolean;
    initialDisplayLimit?: number; 
    onItemClick?: (item: string) => void; 
}

const FilterSection: React.FC<FilterSectionProps> = ({ 
    title, 
    items, 
    isInitiallyOpen = true,
    initialDisplayLimit = 4,
    onItemClick
}) => {
    const [isOpen, setIsOpen] = useState(isInitiallyOpen);
    const [showAll, setShowAll] = useState(false); 

    const displayedItems = showAll ? items : items.slice(0, initialDisplayLimit);
    const hasMoreItems = items.length > initialDisplayLimit;

    const handleToggleShowAll = () => {
        setShowAll(!showAll);
    };

    return (
        <Box sx={{ mb: 2 }}>
            <Box 
                onClick={() => setIsOpen(!isOpen)} 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    mb: 1
                }}
            >
                <Typography variant="h6" fontWeight="bold">
                    {title}
                </Typography>
                {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </Box>
            
            {isOpen && (
                <Box>
                    {displayedItems.map((item, index) => (
                        <Button 
                            key={index} 
                            fullWidth 
                            variant="text" 
                            onClick={() => onItemClick && onItemClick(item)} 
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 0.5, color: 'text.primary' }}
                        >
                            {item}
                        </Button>
                    ))}
                    
                    {hasMoreItems && (
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ textAlign: 'center', mt: 1, cursor: 'pointer' }}
                            onClick={handleToggleShowAll}
                        >
                            {showAll ? 'Thu gọn ▲' : 'Xem thêm ▾'} 
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};


// --- PROPS CHO COMPONENT CHÍNH ---
interface EcycleCategoryPageProps {
    // Giá trị tìm kiếm được truyền từ LayoutMain
    globalSearchTerm?: string; 
    onHeaderSearch?: (searchTerm: string) => void; 
}

// -----------------------------------------------------------------
// --- COMPONENT CHÍNH EcycleCategoryPage ---
// -----------------------------------------------------------------

export const ElectricScooterBatteryPage: React.FC<EcycleCategoryPageProps> = ({ globalSearchTerm }) => {
    const theme = useTheme();
    
    // 🚨 LẤY LOCATION TỪ CONTEXT
    const { activeLocationName } = useLocationContext(); 
    
    // --- State cho API và Phân trang ---
    const itemsPerPage = 6; 
    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1); 
    const [totalPosts, setTotalPosts] = useState(0); 

    // --- State cho Lọc ---
    const [minPriceFilter, setMinPriceFilter] = useState<number | null>(null);
    const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
    const [activePriceLabel, setActivePriceLabel] = useState<string | null>(null); 
    const [activePickupAddress, setActivePickupAddress] = useState<string | undefined>(undefined); 
    const [activeSaleMethod, setActiveSaleMethod] = useState<SaleMethod | undefined>(undefined); 
    const [isVerifiedFilter, setIsVerifiedFilter] = useState<boolean | undefined>(undefined); 
    
    // --- State cho Sắp xếp và Menu ---
    const [activeSortOption, setActiveSortOption] = useState<'newest' | 'oldest'>('newest'); 
    const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [priceMenuAnchorEl, setPriceMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [saleMethodMenuAnchorEl, setSaleMethodMenuAnchorEl] = useState<null | HTMLElement>(null);

    // Tính toán tổng số trang dựa trên totalPosts thực tế
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    // --- LOGIC HELPER ---

    // Hàm chuyển đổi giá trị chuỗi thành min/max price
    const parsePriceRange = (label: string): { min: number | null, max: number | null } => {
        const TRIEU = 1000000;
        if (label === 'Giá dưới 200 triệu') {
            return { min: null, max: 200 * TRIEU };
        }
        if (label === 'Giá trên 600 triệu') {
            return { min: 600 * TRIEU, max: null };
        }
        const match = label.match(/Giá (\d+) triệu - (\d+) triệu/);
        if (match) {
            const min = parseInt(match[1], 10) * TRIEU;
            const max = parseInt(match[2], 10) * TRIEU;
            return { min, max };
        }
        return { min: null, max: null };
    };

    // --- CÁC HANDLER LỌC VÀ SẮP XẾP ---
    
    const handlePriceFilterClick = (label: string) => {
        const { min, max } = parsePriceRange(label);
        setCurrentPage(1); 
        setMinPriceFilter(min);
        setMaxPriceFilter(max);
        setActivePriceLabel(label);
    };
    
    const handleSaleMethodClick = (methodLabel: string) => {
        const newMethod: SaleMethod = (methodLabel.includes('Đấu giá') 
            ? SaleMethodValue.Auction 
            : SaleMethodValue.FixedPrice) as SaleMethod;
            
        setCurrentPage(1); 
        setActiveSaleMethod(newMethod);
    };

    const handleLocationFilterClick = (location: string) => {
        setCurrentPage(1); 
        // 🚨 SỬ DỤNG STATE NỘI BỘ (thay thế Location Context khi user chủ động lọc)
        setActivePickupAddress(location); 
    };

    const handleVerifiedFilterChange = (value: boolean | undefined) => {
        setCurrentPage(1);
        if (isVerifiedFilter === value) {
            setIsVerifiedFilter(undefined);
        } else {
            setIsVerifiedFilter(value);
        }
    };
    
    const handleSortOptionClick = (optionValue: 'newest' | 'oldest') => {
        setCurrentPage(1); 
        setActiveSortOption(optionValue);
        setSortMenuAnchorEl(null); 
    };
    
    // --- HANDLER CHO MENU LỌC CHÍNH (Đã được thêm) ---
    const handleClosePriceMenu = () => setPriceMenuAnchorEl(null);
    const handleCloseSaleMethodMenu = () => setSaleMethodMenuAnchorEl(null);

    const handlePriceMenuItemClick = (label: string) => {
        handlePriceFilterClick(label);
        handleClosePriceMenu();
    };

    const handleSaleMethodMenuItemClick = (methodLabel: string) => {
        handleSaleMethodClick(methodLabel);
        handleCloseSaleMethodMenu();
    };

    // --- CÁC HANDLER XÓA LỌC CỤ THỂ ---
    
    const handleClearPriceFilter = () => {
        setCurrentPage(1);
        setMinPriceFilter(null);
        setMaxPriceFilter(null);
        setActivePriceLabel(null);
    };

    const handleClearSaleMethodFilter = () => {
        setCurrentPage(1);
        setActiveSaleMethod(undefined);
    };

    const handleClearLocationFilter = () => {
        setCurrentPage(1);
        // 🚨 Xóa lọc địa điểm nội bộ, quay về dùng giá trị từ Context
        setActivePickupAddress(undefined); 
    };
    
    const handleClearVerifiedFilter = () => {
        setCurrentPage(1);
        setIsVerifiedFilter(undefined);
    };

    // Hàm xóa TẤT CẢ lọc
    const handleClearAllFilters = () => {
        setCurrentPage(1);
        setMinPriceFilter(null);
        setMaxPriceFilter(null);
        setActivePriceLabel(null);
        // KHÔNG clear globalSearchTerm, chỉ clear activePickupAddress
        setActivePickupAddress(undefined); 
        setActiveSaleMethod(undefined);
        setIsVerifiedFilter(undefined); 
        setActiveSortOption('newest'); 
    };

    // Hàm ánh xạ dữ liệu ProductData từ API sang PostData cho PostCard
    const mapProductToPostData = (product: ProductData): PostData => ({
        productId: product.productId,
        title: product.title,
        price: product.price || 0, 
        pickupAddress: product.pickupAddress,
        description: product.description, 
        createdAt: product.createdAt, 
        imageUrl: product.imageUrl || null, 
        isVerified: product.isVerified || false, 
        saleMethod: product.methodSale, 
    });

    // Gom tất cả bộ lọc vào một đối tượng duy nhất (KHÔNG bao gồm currentPage)
    const filters = useMemo(() => {
        
        // 🚨 Xử lý địa chỉ: Ưu tiên lọc nội bộ, sau đó đến Context, nếu là 'Toàn quốc' thì là undefined.
        const finalPickupAddress = activePickupAddress 
                                     || (activeLocationName === 'Toàn quốc' ? undefined : activeLocationName);

        return {
            filterStatus: 'Available', 
            // 🚨 Đảm bảo searchTerm luôn là string
            searchTerm: globalSearchTerm || '',
            minPrice: minPriceFilter,
            maxPrice: maxPriceFilter,
            pickupAddress: finalPickupAddress, 
            saleMethod: activeSaleMethod,
            isVerified: isVerifiedFilter,
            sortBy: activeSortOption,
        }
    }, [
        globalSearchTerm, minPriceFilter, maxPriceFilter, 
        activePickupAddress, activeSaleMethod, isVerifiedFilter, 
        activeSortOption, activeLocationName // Lắng nghe Context
    ]);
    
    // Sử dụng useRef để lưu trữ giá trị filters trước đó
    const filtersRef = useRef(filters);


    // Hàm gọi API (Nhận page number VÀ currentFilters)
    const fetchPosts = useCallback(async (page: number, currentFilters: typeof filters) => {
        setLoading(true);
        setError(null);
        try {
            
            // 1. GỌI CẢ HAI HÀM API ĐỒNG THỜI
            const [productListResult, totalCountResult] = await Promise.all([
                // Lấy dữ liệu trang
                searchForGuest(
                    currentFilters.filterStatus,
                    currentFilters.searchTerm,
                    currentFilters.minPrice,
                    currentFilters.maxPrice,
                    undefined,        
                    currentFilters.pickupAddress,
                    currentFilters.sortBy,     
                    currentFilters.saleMethod,
                    currentFilters.isVerified,  
                    2,          
                    page,                
                    itemsPerPage         
                ),
                // Lấy tổng số lượng (Đảm bảo truyền CÙNG tham số lọc)
                countProduct(
                    currentFilters.filterStatus,
                    currentFilters.searchTerm,
                    currentFilters.minPrice,
                    currentFilters.maxPrice,
                    undefined, 
                    currentFilters.pickupAddress,
                    currentFilters.saleMethod,
                    false, 
                    currentFilters.isVerified,
                    2,
                    undefined
                ),
            ]);
            
            // 2. CẬP NHẬT STATE
            const mappedPosts = productListResult.map(mapProductToPostData);
            setPosts(mappedPosts);
            setTotalPosts(totalCountResult); 

        } catch (err) {
            console.error("Lỗi khi tải tin đăng:", err);
            setError("Không thể tải danh sách tin đăng. Vui lòng thử lại sau.");
            setPosts([]);
            setTotalPosts(0); 
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]); // Dependency: Chỉ cần itemsPerPage

    
    // 🚨 LOGIC FIX LỖI CHUYỂN TRANG: THEO DÕI SỰ THAY ĐỔI CỦA BỘ LỌC
    useEffect(() => {
        // So sánh filters hiện tại với filters đã lưu trong ref (sử dụng JSON.stringify cho mục đích đơn giản)
        if (JSON.stringify(filters) !== JSON.stringify(filtersRef.current)) {
            // Cập nhật ref cho lần chạy tiếp theo
            filtersRef.current = filters; 
            
            // Nếu bộ lọc thay đổi, ta phải reset về trang 1
            if (currentPage !== 1) {
                // Chỉ reset về 1, việc gọi API sẽ do useEffect [currentPage] xử lý
                setCurrentPage(1);
            } else {
                // Nếu đã ở trang 1, gọi fetchPosts ngay lập tức với filters mới
                fetchPosts(1, filters);
            }
        }
    }, [filters]); 

    
    // 🚨 LOGIC FIX LỖI CHUYỂN TRANG: CHỈ GỌI API KHI CHUYỂN TRANG
    useEffect(() => {
        // Luôn chạy khi currentPage thay đổi
        
        // Kiểm tra xem filters có bị thay đổi cùng lúc hay không (trường hợp setCurrentPage(1) ở trên)
        const filtersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current);

        // Trường hợp 1: Chuyển từ trang 2, 3... về trang 1 (currentPage thay đổi, filters không thay đổi)
        // Trường hợp 2: Chuyển từ trang 1 sang 2, 3...
        // Trường hợp 3: Lần đầu tiên load/gọi API
        
        // Ta cần đảm bảo fetchPosts được gọi khi currentPage thay đổi (từ 1->2, 2->1)
        
        // Nếu currentPage không phải là 1 (chuyển tiếp), HOẶC là 1 nhưng filters không thay đổi 
        // (người dùng nhấn nút Trang 1) thì gọi API.
        if (currentPage !== 1 || !filtersChanged) {
             fetchPosts(currentPage, filters);
             window.scrollTo({ top: 0, behavior: 'smooth' }); 
        }
        
        // Cập nhật filtersRef để đảm bảo filtersChange không còn đúng trong lần chạy tiếp theo
        filtersRef.current = filters; 
    }, [currentPage]);
    
    // Hàm thay đổi trang
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };

    // Lấy nhãn Sắp xếp hiện tại
    const currentSortLabel = sortOptions.find(opt => opt.value === activeSortOption)?.label || 'Tin mới nhất';


    // ***************************************************************
    // KHỐI LỌC CHÍNH (RENDER)
    // ***************************************************************
    const renderFilterBox = () => (
        <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 2, 
            boxShadow: 1, 
            p: 3, 
            border: '1px solid #eee', 
            mb: 3 
        }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                Chọn Tác giả / Xe Điện
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                **{totalPosts.toLocaleString()}** xe điện cũ mới giá tốt nhất 27/10/2025
            </Typography>

            {/* HÀNG LỌC CHÍNH (Chips) */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                <Chip 
                    label="Lọc" 
                    sx={{ bgcolor: theme.palette.primary.main, color: 'white', fontWeight: 'bold' }}
                />
                
                {/* LỌC GIÁ: Triển khai Menu */}
                <Button 
                    variant="outlined" 
                    endIcon={<KeyboardArrowDownIcon />} 
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                    onClick={(event) => setPriceMenuAnchorEl(event.currentTarget)}
                >
                    Giá
                </Button>
                {/* MENU GIÁ */}
                <Menu
                    anchorEl={priceMenuAnchorEl}
                    open={Boolean(priceMenuAnchorEl)}
                    onClose={handleClosePriceMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    {mockPriceRanges.map((label) => (
                        <MenuItem 
                            key={label} 
                            onClick={() => handlePriceMenuItemClick(label)}
                            selected={activePriceLabel === label}
                        >
                            {label}
                        </MenuItem>
                    ))}
                </Menu>
                
                {/* LỌC PHƯƠNG THỨC BÁN (Loại tin): Triển khai Menu */}
                <Button 
                    variant="outlined" 
                    endIcon={<KeyboardArrowDownIcon />} 
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                    onClick={(event) => setSaleMethodMenuAnchorEl(event.currentTarget)}
                >
                    Loại tin
                </Button>
                {/* MENU PHƯƠNG THỨC BÁN */}
                <Menu
                    anchorEl={saleMethodMenuAnchorEl}
                    open={Boolean(saleMethodMenuAnchorEl)}
                    onClose={handleCloseSaleMethodMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    {mockSaleMethods.map((label) => {
                        const method = label.includes('Đấu giá') ? SaleMethodValue.Auction : SaleMethodValue.FixedPrice;
                        return (
                            <MenuItem 
                                key={label} 
                                onClick={() => handleSaleMethodMenuItemClick(label)}
                                selected={activeSaleMethod === method}
                            >
                                {label}
                            </MenuItem>
                        );
                    })}
                </Menu>
                
                {/* LỌC IS VERIFIED */}
                <Chip
                    label="Đã kiểm định"
                    icon={<CheckCircleIcon />}
                    onClick={() => handleVerifiedFilterChange(true)}
                    onDelete={isVerifiedFilter === true ? handleClearVerifiedFilter : undefined}
                    deleteIcon={<CloseIcon />}
                    color={isVerifiedFilter === true ? 'primary' : 'default'}
                    variant={isVerifiedFilter === true ? 'filled' : 'outlined'}
                    sx={{ textTransform: 'none', fontWeight: 'medium' }}
                />

                {/* HIỂN THỊ CHIP LỌC GIÁ ĐANG HOẠT ĐỘNG */}
                {activePriceLabel && (
                    <Chip
                        label={activePriceLabel}
                        onDelete={handleClearPriceFilter} 
                        deleteIcon={<CloseIcon />}
                        color="secondary"
                        variant="outlined"
                        sx={{ textTransform: 'none', fontWeight: 'medium' }}
                    />
                )}
                
                {/* HIỂN THỊ CHIP LỌC PHƯƠNG THỨC BÁN HÀNG */}
                {activeSaleMethod !== undefined && (
                    <Chip
                        label={activeSaleMethod === SaleMethodValue.FixedPrice ? 'Mua ngay' : 'Đấu giá'}
                        onDelete={handleClearSaleMethodFilter} 
                        deleteIcon={<CloseIcon />}
                        color="secondary"
                        variant="outlined"
                        sx={{ textTransform: 'none', fontWeight: 'medium' }}
                    />
                )}
                
                {/* HIỂN THỊ CHIP LỌC KHU VỰC NỘI BỘ */}
                {activePickupAddress && (
                    <Chip
                        label={`Địa điểm: ${activePickupAddress}`}
                        onDelete={handleClearLocationFilter} 
                        deleteIcon={<CloseIcon />}
                        color="secondary"
                        variant="outlined"
                        sx={{ textTransform: 'none', fontWeight: 'medium' }}
                    />
                )}
                
                <Button 
                    variant="text" 
                    sx={{ color: theme.palette.text.secondary, textTransform: 'none', ml: 'auto' }}
                    onClick={handleClearAllFilters} 
                >
                    Xóa lọc
                </Button>
            </Box>

            {/* LỌC THEO KHU VỰC VÀ ĐỊA ĐIỂM */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', borderTop: '1px solid #eee', pt: 2 }}>
                <Typography variant="body2" fontWeight="medium">Khu vực:</Typography>
                {POPULAR_LOCATIONS.map((loc, index) => ( 
                    <Button 
                        key={index}
                        variant="contained" 
                        size="small"
                        onClick={() => handleLocationFilterClick(loc)} 
                        sx={{ 
                            textTransform: 'none', 
                            borderRadius: 2,
                            // Dùng filters.pickupAddress để check trạng thái đang chọn
                            bgcolor: filters.pickupAddress === loc ? theme.palette.primary.light : theme.palette.grey[100],
                            color: filters.pickupAddress === loc ? theme.palette.primary.contrastText : theme.palette.text.primary,
                            fontWeight: 'normal',
                            '&:hover': { bgcolor: theme.palette.grey[200] }
                        }}
                    >
                        {loc}
                    </Button>
                ))}
                <Button 
                    variant="text" 
                    size="small"
                    startIcon={<LocationOnIcon />}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 'bold', 
                        color: theme.palette.primary.main 
                    }}
                >
                    Gần tôi
                </Button>
            </Box>
        </Box>
    );


    return (
        <Box sx={{ flexGrow: 1, pb: 4, bgcolor: '#f5f5f5' }}>
            
            <Container maxWidth="lg" sx={{ pt: 3 }}>
                
                {/* Breadcrumb và Tiêu đề */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <Link to="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>
                        <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Trang chủ
                    </Link>
                    {' / '}
                    <Link to="/scooter-ecycle" style={{ textDecoration: 'text.primary', color: 'black', fontWeight: 'bold', }}>
                        <TwoWheelerIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Xe máy điện
                    </Link>
                </Typography>
                
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {totalPosts.toLocaleString()} xe điện cũ mới giá tốt nhất 27/10/2025
                </Typography>

                {/* KHỐI LỌC CHÍNH */}
                {renderFilterBox()}

                {/* DANH SÁCH SẢN PHẨM VÀ SIDEBAR LỌC CHI TIẾT */}
                <Box 
                    sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 2, 
                        boxShadow: 1, 
                        p: 2, 
                        border: '1px solid #eee' 
                    }}
                >
                    
                    {/* Hàng Sắp xếp và Chế độ xem */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight="bold" sx={{ mr: 2 }}>Tất cả</Typography>
                            <Typography color="text.secondary">Sắp xếp:</Typography>
                            
                            <Button 
                                variant="text" 
                                endIcon={<KeyboardArrowDownIcon />}
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 'bold', 
                                    color: theme.palette.text.primary 
                                }}
                                onClick={(event) => setSortMenuAnchorEl(event.currentTarget)}
                            >
                                {currentSortLabel}
                            </Button>
                            
                            {/* MENU SẮP XẾP */}
                            <Menu
                                anchorEl={sortMenuAnchorEl}
                                open={Boolean(sortMenuAnchorEl)}
                                onClose={() => setSortMenuAnchorEl(null)}
                            >
                                {sortOptions.map((option) => (
                                    <MenuItem 
                                        key={option.value} 
                                        onClick={() => handleSortOptionClick(option.value as 'newest' | 'oldest')}
                                        selected={option.value === activeSortOption}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Menu>

                        </Box>
                        <IconButton size="small" sx={{ borderRadius: 2 }}>
                            <GridViewIcon />
                        </IconButton>
                    </Box>

                    {/* VÙNG CHỨA CỘT CHÍNH (75%) VÀ CỘT PHỤ (25%) */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                        
                        {/* CỘT CHÍNH: Danh sách sản phẩm (75%) */}
                        <Box sx={{ 
                            width: { xs: '100%', md: '75%' }, 
                            pr: { xs: 0, md: 2 } 
                        }}>
                            {/* Loading, Error, Empty State */}
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                    <Typography sx={{ ml: 2 }}>Đang tải tin đăng...</Typography>
                                </Box>
                            )}
                            {error && (
                                <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
                            )}
                            {!loading && !error && posts.length === 0 && (
                                <Typography variant="subtitle1" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                                    Không tìm thấy tin đăng nào.
                                </Typography>
                            )}

                            {/* Danh sách Tin đăng */}
                            {!loading && !error && posts.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {posts.map((post) => (
                                        <Box
                                            key={post.productId}
                                            sx={{
                                                width: { xs: '100%', sm: '50%', md: '33.333%' }, 
                                                pb: 2, 
                                                display: 'flex', 
                                                justifyContent: 'center' 
                                            }}
                                        >
                                            <PostCard post={post} />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>

                        {/* CỘT PHỤ: Sidebar Lọc (25%) */}
                        <Box sx={{ 
                            width: { xs: '100%', md: '25%' }, 
                            display: { xs: 'none', md: 'block' },
                            pl: { xs: 0, md: 2 } 
                        }}>
                            <Box sx={{ p: 0, position: 'sticky', top: 80 }}>
                                
                                {/* Lọc theo Khu vực */}
                                <FilterSection 
                                    title="Lọc theo khu vực" 
                                    items={VIETNAM_PROVINCE_NAMES} // 🚨 Dữ liệu từ VIETNAM_PROVINCES
                                    onItemClick={handleLocationFilterClick} 
                                />
                                <Divider sx={{ mb: 2 }} />
                                
                                {/* Lọc theo PHƯƠNG THỨC BÁN HÀNG */}
                                <FilterSection
                                    title="Phương thức bán hàng"
                                    items={mockSaleMethods}
                                    onItemClick={handleSaleMethodClick}
                                    initialDisplayLimit={2}
                                />
                                <Divider sx={{ mb: 2 }} />

                                {/* Lọc theo Khoảng giá */}
                                <FilterSection 
                                    title="Lọc theo khoảng giá" 
                                    items={mockPriceRanges} 
                                    onItemClick={handlePriceFilterClick} 
                                />
                                <Divider sx={{ mb: 2 }} />
                                
                            </Box>
                        </Box>

                    </Box>
                </Box>
                
                {/* PHÂN TRANG */}
                {!loading && !error && totalPages > 1 && (
                    <PaginationBar 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}

            </Container>
        </Box>
    );
};