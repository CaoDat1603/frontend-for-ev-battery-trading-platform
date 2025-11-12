import React from "react";

import {
    Popover, Box, Typography, Button, Divider,
    List, ListItem, ListItemText, ListItemIcon, Avatar, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";


// --- ICONS TIỆN ÍCH ---
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // Tin đăng đã lưu
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';   // Tìm kiếm đã lưu
import HistoryIcon from '@mui/icons-material/History';                 // Lịch sử xem tin
import StarBorderIcon from '@mui/icons-material/StarBorder';           // Đánh giá từ tôi

// --- ICONS KHÁC ---
import SettingsIcon from '@mui/icons-material/Settings';               // Cài đặt tài khoản
import HeadsetIcon from '@mui/icons-material/Headset';                 // Trợ giúp
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Đóng góp ý kiến
import LogoutIcon from '@mui/icons-material/Logout';                   // Đăng xuất

interface AccountMenuPopoverProps {
    open: boolean;
    anchorEl: null | HTMLElement;
    handleClose: () => void;
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
    open, anchorEl, handleClose
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, setUser, loading } = useUser();

    const isLoggedIn = !!user;

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        setUser(null);
        handleClose();
        navigate("/");
    };
    
    const goToAccountSettings = () => {
        handleClose();
        navigate("/account/profile");
    };

    // --- RENDER TRẠNG THÁI CHƯA ĐĂNG NHẬP (image_0a9a27.png) ---
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
                    color="ecycle"
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
                vertical: 'bottom', // Neo từ dưới cùng của nút bấm
                horizontal: 'right', // Neo từ phía bên phải của nút bấm
            }}
            transformOrigin={{
                vertical: 'top', // Bắt đầu Popover từ đỉnh của nó
                horizontal: 'right', // Căn phải Popover với nút bấm
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
            {loading ? (
                <Box sx={{ width: 280, display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : isLoggedIn && user ? (
                <Box sx={{ width: '100%' }}>
                    {/* 1. PROFILE HEADER */}
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Avatar
                            src={user.avatarUrl}
                            alt={user.userFullName}
                            sx={{ width: 64, height: 64, mb: 1.5, border: `2px solid ${theme.palette.warning.main}` }}
                        >
                            {user.userFullName[0]}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold">
                            {user.userFullName}
                        </Typography>
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
