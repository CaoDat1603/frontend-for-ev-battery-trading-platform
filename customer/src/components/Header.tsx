// Header.tsx

import React, { useState, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
    AppBar, Toolbar, Button, IconButton, InputBase, Box, Avatar, Badge, Typography
} from '@mui/material';

// ********** LOGO **********
import MyLogo from '../assets/my-logo.jpg';

// Import Icons
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

// Import Component Popovers
import LocationPropsPopover from './popovers/LocationDialog';
import { CategoryMenu } from './popovers/CategoryMenu';
import { SavedPostsPopover} from './popovers/SavedPostsPopover';
import { NotificationPopover } from './popovers/NotificationPopover';
import { AccountMenuPopover } from './popovers/AccountMenuPopover';

// Import Context (Đảm bảo đường dẫn đúng)
import { useLocationContext } from '../context/LocationContext';

// Import constants & data
import { LOCATION_STORAGE_KEY } from '../utils/constants';
import { VIETNAM_PROVINCES, type Province, type District } from '../data/vietnamLocations';


// --- DỮ LIỆU CỐ ĐỊNH ---
const ALL_VIETNAM_OPTION: Province = { id: 0, name: 'Toàn quốc', districts: [] };
const LOCATION_DATA = VIETNAM_PROVINCES;

// --- CUSTOM COMPONENT LOCATION SELECT ---
interface LocationSelectProps {
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    city: Province | null;
    district: District | null;
}

const LocationSelect: React.FC<LocationSelectProps> = ({ onClick, city, district }) => {
    let displayLocation = 'Chọn khu vực';

    if (city && city.id === ALL_VIETNAM_OPTION.id) {
        displayLocation = 'Toàn quốc';
    } else if (city) {
        displayLocation = city.name;
        if (district) {
            displayLocation = district.name;
        }
    }

    return (
        <Button
            onClick={onClick}
            sx={{
                backgroundColor: '#f0f0f0',
                borderRadius: '8px',
                color: 'text.primary',
                textTransform: 'none',
                fontWeight: 'bold',
                padding: '8px 16px',
                '&:hover': { backgroundColor: '#e0e0e0' },
                maxWidth: 200,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
            }}
            startIcon={<LocationOnIcon sx={{ color: '#02e110ff' }} />}
            endIcon={<KeyboardArrowDownIcon />}
        >
            {displayLocation}
        </Button>
    );
};


// --- PROPS MỚI CHO HEADER ---
interface HeaderProps {
    // Chỉ truyền searchTerm, vì location sẽ được quản lý bởi Context
    onSearch: (searchTerm: string) => void;
}

// --- COMPONENT CHÍNH: HEADER ---
export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
    const navigate = useNavigate();
    // LẤY HÀM CẬP NHẬT CONTEXT
    const { setActiveLocationName } = useLocationContext();

    //  Lấy user từ context
    const { user, loading } = useUser();
    const isLoggedIn = !loading && Boolean(user);
    const avatarUrl = user?.avatarUrl || '';
    const userName = user?.userFullName || '';


    // ********** STATE QUẢN LÝ TÌM KIẾM **********
    const [searchTerm, setSearchTerm] = useState('');

    // ********** STATE VỊ TRÍ **********
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [selectedCity, setSelectedCity] = useState<Province | null>(ALL_VIETNAM_OPTION);
    const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
    const isPopoverOpen = Boolean(anchorEl);

    // ********** LOGIC TÌM KIẾM QUAN TRỌNG **********
    const handleSearchSubmit = () => {
        // GỌI CALLBACK CHO SEARCH
        onSearch(searchTerm);
        // Sau khi tìm kiếm, bạn thường muốn chuyển hướng:
        // navigate(`/car-ecycle?q=${searchTerm}`);
    };

    // ********** HIỆU ỨNG 1: ĐỌC DỮ LIỆU TỪ LOCAL STORAGE **********
    useEffect(() => {
        try {
            const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
            if (savedLocation) {
                const { city, district } = JSON.parse(savedLocation);
                const initialCity = city || ALL_VIETNAM_OPTION;
                const initialDistrict = district || null;

                setSelectedCity(initialCity);
                setSelectedDistrict(initialDistrict);

                // CẬP NHẬT CONTEXT KHI LOAD TỪ LOCAL STORAGE
                const initialLocationName = initialDistrict?.name || initialCity?.name || ALL_VIETNAM_OPTION.name;
                setActiveLocationName(initialLocationName);
            } else {
                // Đảm bảo Context được thiết lập nếu không có trong Local Storage
                setActiveLocationName(ALL_VIETNAM_OPTION.name);
            }
        } catch (error) {
            console.error("Could not load location from local storage", error);
        }
    }, []);

    // ********** XỬ LÝ CHỌN VỊ TRÍ VÀ CẬP NHẬT CONTEXT **********
    const handleSelectLocation = (city: Province | null, district: District | null) => {

        const finalCity = city || ALL_VIETNAM_OPTION;
        const finalDistrict = district || null;

        setSelectedCity(finalCity);
        setSelectedDistrict(finalDistrict);
        handleClose();

        // ********** GHI DỮ LIỆU MỚI VÀO LOCAL STORAGE **********
        try {
            const locationToSave = JSON.stringify({
                city: finalCity,
                district: finalDistrict
            });
            localStorage.setItem(LOCATION_STORAGE_KEY, locationToSave);
        } catch (error) {
            console.error("Could not save location to local storage", error);
        }

        // 🚨 CẬP NHẬT CONTEXT VỚI VỊ TRÍ MỚI
        const locationName = finalDistrict?.name || finalCity?.name || ALL_VIETNAM_OPTION.name;
        setActiveLocationName(locationName);

        // Không cần gọi onSearch ở đây, EcycleCategoryPage sẽ tự động reload
        // nhờ việc lắng nghe Context.
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // --- Các state/hàm khác (Giữ nguyên) ---
    const [anchorElAccount, setAnchorElAccount] = useState<null | HTMLElement>(null);
    const isAccountOpen = Boolean(anchorElAccount);

    const handleAccountMenuOpen = (event: ReactMouseEvent<HTMLElement>) => { setAnchorElAccount(event.currentTarget); };
    const handleAccountMenuClose = () => { setAnchorElAccount(null); };
    const handleLoginRedirect = () => { navigate("/login"); };

    const [anchorElMenu, setAnchorElMenu] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(anchorElMenu);
    const handleMenuOpen = (event: MouseEvent<HTMLElement>) => { setAnchorElMenu(event.currentTarget); };
    const handleMenuClose = () => { setAnchorElMenu(null); };

    const [anchorElSaved, setAnchorElSaved] = useState<null | HTMLElement>(null);
    const isSavedOpen = Boolean(anchorElSaved);
    const handleSavedOpen = (event: ReactMouseEvent<HTMLElement>) => { if (!isLoggedIn) { handleLoginRedirect(); return; } setAnchorElSaved(event.currentTarget); };
    const handleSavedClose = () => { setAnchorElSaved(null); };

    const [anchorElNoti, setAnchorElNoti] = useState<null | HTMLElement>(null);
    const isNotiOpen = Boolean(anchorElNoti);
    const handleNotiOpen = (event: ReactMouseEvent<HTMLElement>) => { if (!isLoggedIn) { handleLoginRedirect(); return; } setAnchorElNoti(event.currentTarget); };
    const handleNotiClose = () => { setAnchorElNoti(null); };

    const [hasNewNotifications, setHasNewNotifications] = useState(true);
    const [isAuctionActive, setIsAuctionActive] = useState(true);
    //const userSavedPosts: SavedPost[] = mockSavedPosts;
    const open = Boolean(anchorEl);

    // ********** LOGIC MỚI CHO NÚT ĐẤU GIÁ **********
    const handleAuctionClick = () => {
        if (!isLoggedIn) {
            handleLoginRedirect(); // Chuyển hướng đến trang /login
            return;
        }
        // Chuyển hướng đến trang quản lý đấu giá nếu đã đăng nhập
        navigate("/manage-auction"); 
    };

    // **********************************************************************************
    return (
        <AppBar position="static" color="inherit" elevation={1}>
            <Toolbar sx={{
                paddingX: 3,
                minHeight: 64,
                gap: 2,
            }}>

                {/* 1. Menu Icon */}
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 1 }}
                    onClick={handleMenuOpen}
                >
                    <MenuIcon />
                </IconButton>

                {/* 2. Logo */}
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '100px' }}>
                        <Box
                            component="img"
                            src={MyLogo}
                            alt="Ecycle Logo - Về trang chủ"
                            sx={{
                                height: '42px',
                                cursor: 'pointer',
                                borderRadius: '8px',
                            }}
                        />
                    </Box>
                </Link>

                {/* 3. Vùng chọn Khu vực */}
                <LocationSelect
                    onClick={handleClick}
                    city={selectedCity}
                    district={selectedDistrict}
                />

                {/* 4. Thanh Tìm kiếm */}
                <Box
                    sx={{
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        maxWidth: 800,
                        marginRight: 2,
                    }}
                >
                    <InputBase
                        placeholder="Tìm xe cộ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                        sx={{
                            ml: 2,
                            flex: 1,
                            fontSize: '1rem',
                            color: 'text.secondary',
                        }}
                        startAdornment={
                            <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                        }
                    />
                    <IconButton
                        type="submit"
                        onClick={handleSearchSubmit}
                        color={"primary" as "ecycle"}
                        aria-label="search"
                    >
                        <SearchIcon sx={{ color: 'black' }} />
                    </IconButton>
                </Box>

                {/* 5. Các nút Hành động */}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

                    {/* NÚT ĐẤU GIÁ (ĐÃ THÊM onClick) */}
                    <Badge variant="dot" color="error" invisible={!isAuctionActive}>
                        <IconButton 
                            color="inherit" 
                            aria-label="auction"
                            onClick={handleAuctionClick} // <--- ĐÃ ÁP DỤNG HÀM MỚI
                        >
                            <GavelIcon />
                        </IconButton>
                    </Badge>

                    {/* NÚT ĐÁNH DẤU (TIN ĐÃ LƯU) */}
                    <IconButton color="inherit" aria-label="favorites" onClick={handleSavedOpen}><FavoriteBorderIcon /></IconButton>

                    {/* NÚT THÔNG BÁO */}
                    <Badge variant="dot" color="error" invisible={!hasNewNotifications}>
                        <IconButton color="inherit" aria-label="notifications" onClick={handleNotiOpen}>
                            <NotificationsNoneIcon />
                        </IconButton>
                    </Badge>

                    {/* Nút Đăng nhập/Quản lý tin */}
                    {isLoggedIn && (
                        <Button variant="outlined" color="inherit" 
                        sx={{ textTransform: 'none', borderRadius: '8px', borderColor: '#f0f0f0', marginLeft: 1, paddingX: 2 }}
                        onClick={() => navigate("/manage-posts")}>
                            Quản lý tin
                        </Button>
                    )}

                    {/* Nút Đăng tin */}
                    {isLoggedIn && (
                    <Button
                        variant="contained"
                        color={"primary" as "ecycle"}
                        onClick={() => navigate("/create-post")}
                        sx={{
                            fontWeight: 'bold',
                            textTransform: 'none',
                            borderRadius: '8px',
                            paddingX: 2,
                        }}
                        startIcon={<LocalOfferIcon />}
                    >
                        Đăng tin
                    </Button>)}

                    {/* Nút Đăng tin */}
                    {!isLoggedIn && (
                    <Button
                        variant="contained"
                        color={"primary" as "ecycle"}
                        onClick={() => navigate("/login")}
                        sx={{
                            fontWeight: 'bold',
                            textTransform: 'none',
                            borderRadius: '8px',
                            paddingX: 2,
                        }}
                    >
                        Đăng nhập
                    </Button>)}

                    {/* NÚT TÀI KHOẢN */}
                    <Button
                        variant="outlined"
                        color="inherit"
                        aria-label="Tài khoản và Menu"
                        onClick={handleAccountMenuOpen}
                        sx={{
                            minWidth: 0,
                            padding: '8px 10px',
                            borderColor: '#d4d4d4ff',
                            textTransform: 'none',
                            '& .MuiButton-startIcon, & .MuiButton-endIcon': { margin: 0 },
                        }}
                        startIcon={
                            isLoggedIn ? (
                                <Avatar alt={userName} src={avatarUrl} sx={{ width: 24, height: 24 }} />
                            ) : (
                                <AccountCircleIcon sx={{ fontSize: '24px' }} />
                            )
                        }
                        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '20px' }} />}
                    >
                    </Button>
                </Box>
            </Toolbar>

            {/* ********** CÁC POPVER ********** */}
            <AccountMenuPopover open={isAccountOpen} anchorEl={anchorElAccount} handleClose={handleAccountMenuClose} />

            <LocationPropsPopover
                open={isPopoverOpen}
                handleClose={handleClose}
                anchorEl={anchorEl}
                onSelect={handleSelectLocation} 
                currentCity={selectedCity}
                currentDistrict={selectedDistrict}
                initialLocations={LOCATION_DATA}
            />

            <CategoryMenu open={isMenuOpen} anchorEl={anchorElMenu} handleClose={handleMenuClose} />
            <SavedPostsPopover 
                open={isSavedOpen} 
                anchorEl={anchorElSaved} 
                handleClose={handleSavedClose} 
            />
            <NotificationPopover open={isNotiOpen} anchorEl={anchorElNoti} handleClose={handleNotiClose} />

        </AppBar>
    );
};