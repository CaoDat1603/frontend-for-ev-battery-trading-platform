import React from "react";

import {
    Popover, Box, Typography, Button, Divider,
    List, ListItem, ListItemText, ListItemIcon, Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";
// UserService không còn cần thiết ở đây, vì logic gọi API đã chuyển sang Header
// import { UserService } from "../../services/userService"; 


// --- ICONS TIỆN ÍCH ---
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; 
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';  
import HistoryIcon from '@mui/icons-material/History';                
import StarBorderIcon from '@mui/icons-material/StarBorder';          

// --- ICONS KHÁC ---
import SettingsIcon from '@mui/icons-material/Settings';               
import HeadsetIcon from '@mui/icons-material/Headset';                
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; 
import LogoutIcon from '@mui/icons-material/Logout';                   

interface UserData {
    name: string;
    avatarUrl: string;
    followers: number;
    following: number;
    eCoin: number;
}

interface AccountMenuPopoverProps {
    open: boolean;
    anchorEl: null | HTMLElement;
    handleClose: () => void;
    // 🚨 THÊM PROP DỮ LIỆU TỪ COMPONENT CHA
    isLoggedIn: boolean; 
    user: UserData | null;
    onLogoutSuccess: () => void;
}

// --- Dữ liệu Menu ---

const utilityLinks = [
    { text: 'Tin đăng đã lưu', icon: FavoriteBorderIcon },
    { text: 'Tìm kiếm đã lưu', icon: BookmarkBorderIcon },
    { text: 'Lịch sử xem tin', icon: HistoryIcon },
    { text: 'Đánh giá từ tôi', icon: StarBorderIcon },
];

const otherLinks = [
    { text: 'Cài đặt tài khoản', icon: SettingsIcon },
    { text: 'Trợ giúp', icon: HeadsetIcon },
    { text: 'Đóng góp ý kiến', icon: ChatBubbleOutlineIcon },
    // Đăng xuất là mục đặc biệt
];


export const AccountMenuPopover: React.FC<AccountMenuPopoverProps> = ({
    open, anchorEl, handleClose, user, isLoggedIn, onLogoutSuccess
}) => {
    const theme = useTheme();
    const navigate = useNavigate();

    // 🚨 Đã loại bỏ useState và useEffect lấy profile ở đây

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        onLogoutSuccess();
        handleClose();
        navigate("/");
    };
    
    const goToAccountSettings = () => {
        handleClose();
        navigate("/account/profile");
    };

    // --- RENDER TRẠNG THÁI CHƯA ĐĂNG NHẬP ---
    const renderLoggedOutState = () => (
        <Box sx={{ p: 2, textAlign: 'center', width: 280 }}>
            {/* 1. Thông báo */}
            <Typography variant="h6" fontWeight="bold">
                Mua thì hời, bán thì lời.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Đăng nhập cái đã!
            </Typography>

            {/* 2. Nút Hành động */}
            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Button
                    variant="outlined"
                    fullWidth
                    sx={{ py: 1.2, fontWeight: 'bold' }}
                    onClick={() => { handleClose(); navigate("/register"); }}
                >
                    Tạo tài khoản
                </Button>
                <Button
                    variant="contained"
                    color="primary" // Sửa color="ecycle" thành color="primary" giả định
                    fullWidth
                    sx={{ py: 1.2, fontWeight: 'bold' }}
                    onClick={() => { handleClose(); navigate("/login"); }}
                >
                    Đăng nhập
                </Button>
            </Box>
        </Box>
    );

    // --- RENDER LOGIC CHÍNH ---
    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}

            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top', 
                horizontal: 'right', 
            }}

            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '8px',
                        mt: 0.5,
                        // Điều chỉnh minWidth cho trạng thái chưa đăng nhập
                        minWidth: isLoggedIn ? 300 : 320,
                        maxWidth: 350,
                        overflow: 'visible',
                        py: isLoggedIn ? 2 : 0 // Bỏ padding trên/dưới nếu chưa đăng nhập
                    },
                },
            }}
        >
            {/* TRẠNG THÁI LOGIN */}
            {isLoggedIn && user ? (
                <Box sx={{ width: '100%' }}>
                    {/* 1. PROFILE HEADER */}
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Avatar
                            src={user.avatarUrl}
                            alt={user.name}
                            sx={{ width: 64, height: 64, mb: 1.5, border: `2px solid ${theme.palette.warning.main}` }}
                        >
                            {user.name[0]}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold">
                            {user.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                Người theo dõi {user.followers}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Đang theo dõi {user.following}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* 2. TIỆN ÍCH */}
                    <List dense sx={{ pt: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 2, mb: 0.5 }}>
                            Tiện ích
                        </Typography>
                        {utilityLinks.map((item) => (
                            <ListItem key={item.text} onClick={handleClose} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                                <ListItemIcon sx={{ minWidth: 40 }}><item.icon /></ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>

                    <Divider sx={{ my: 1 }} />

                    {/* 3. KHÁC */}
                    <List dense sx={{ pt: 0 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 2, mb: 0.5 }}>
                            Khác
                        </Typography>
                        {otherLinks.map((item) => (
                            <ListItem 
                                key={item.text}
                                onClick={() => {
                                    if (item.text === "Cài đặt tài khoản") return goToAccountSettings();
                                    handleClose();
                                }}
                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}><item.icon /></ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                        {/* ĐĂNG XUẤT */}
                        <ListItem 
                            onClick={handleLogout}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <LogoutIcon sx={{ color: theme.palette.error.main }} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Đăng xuất" 
                                primaryTypographyProps={{ color: theme.palette.error.main }} 
                            />
                        </ListItem>
                    </List>
                </Box>

            ) : (
                // Nếu Chưa đăng nhập, hiển thị giao diện Đăng nhập/Tạo tài khoản
                renderLoggedOutState()
            )}
        </Popover>
    );
};