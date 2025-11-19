// src/components/NotificationPopover.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Popover, Box, Typography, Button, Tabs, 
    Tab, Divider, useTheme, Chip, 
    List, ListItem, ListItemText, ListItemAvatar, Avatar,
    CircularProgress, Alert,
    ListItemButton
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { NotificationService } from '../../services/notificationService';
import {type NotificationResponse } from '../../pages/Notification/NotificationResponse';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// --- Khai báo kiểu dữ liệu cho Tab và Props ---
type NotificationTab = 'activity' | 'news';

interface NotificationPopoverProps {
    open: boolean;
    anchorEl: null | HTMLElement;
    handleClose: () => void;
    onUpdateUnreadCount: (count: number) => void;
}

// Giả định hàm lấy User ID đã đăng nhập
const getLoggedInUserId = (): number | null => {
    const userIdStr = localStorage.getItem("userId");
    // Giả định userIdStr là chuỗi số hợp lệ
    return userIdStr ? parseInt(userIdStr) : 1; // Mặc định là 1 cho mục đích demo
};

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ 
    open, anchorEl, handleClose, onUpdateUnreadCount 
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const userId = getLoggedInUserId();

    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [currentTab, setCurrentTab] = useState<NotificationTab>('activity');
    const [selectedFilter, setSelectedFilter] = useState<string>('all'); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    

    // --- ÁNH XẠ SOURCE SANG TYPE MỚI ---
    const getNotificationType = (source: string): string => {
        const lowerSource = source.toLowerCase();
        
        if (lowerSource.includes('ratingservice')) return 'rating';
        if (lowerSource.includes('complaintservice')) return 'complaint';
        if (lowerSource.includes('catalogservice')) return 'catalog';
        if (lowerSource.includes('identityservice')) return 'identity';
        if (lowerSource.includes('orderservice')) return 'order';
        if (lowerSource.includes('paymentservice')) return 'payment';
        if (lowerSource.includes('local')) return 'local';
        // Vẫn giữ lại logic cũ nếu cần thiết (hoặc coi là 'other')
        if (lowerSource.includes('news') || lowerSource.includes('tin tức')) return 'news';
        
        return 'other';
    };

    // --- TẢI DỮ LIỆU TỪ API ---
    const fetchNotifications = useCallback(async () => {
        if (!userId) {
            setError("Người dùng chưa đăng nhập.");
            onUpdateUnreadCount(0); 
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await NotificationService.getByUser(userId);
            // Sắp xếp: Chưa đọc lên đầu
            const sortedData = data.sort((a, b) => {
                if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setNotifications(sortedData);
            
            // Tính toán và gửi số lượng chưa đọc về Header
            const newUnreadCount = sortedData.filter(n => !n.isRead).length;
            onUpdateUnreadCount(newUnreadCount); 

        } catch (err: any) {
            setError(err.message || "Lỗi tải thông báo.");
            onUpdateUnreadCount(0); // Gửi 0 nếu lỗi
        } finally {
            setLoading(false);
        }
    }, [userId, onUpdateUnreadCount]); 

    // --- XỬ LÝ CLICK (ĐÁNH DẤU ĐÃ ĐỌC & ĐIỀU HƯỚNG) ---
    const handleNotificationClick = async (noti: NotificationResponse) => {
        try {
            // 1. Đánh dấu đã đọc trên API nếu chưa đọc
            if (!noti.isRead) {
                await NotificationService.markAsRead(noti.notificationId);

                // Cập nhật trạng thái trong State
                setNotifications(prev =>
                    prev.map(n =>
                        n.notificationId === noti.notificationId ? { ...n, isRead: true } : n
                    )
                );
                // Cập nhật Header sau khi đánh dấu đọc
                const newUnreadCount = notifications.filter(n => !n.isRead && n.notificationId !== noti.notificationId).length;
                onUpdateUnreadCount(newUnreadCount);
            }
            
            // 2. Điều hướng nếu có URL
            if (noti.url) {
                navigate(noti.url);
            }

        } catch (err) {
            console.error("Lỗi khi xử lý thông báo:", err);
            // Vẫn đóng popover dù API đánh dấu đọc lỗi
        } finally {
            handleClose();
        }
    };
    
    // --- LỌC DỮ LIỆU HIỂN THỊ ---
    const filteredNotifications = notifications.filter(noti => {
        const type = getNotificationType(noti.source);
        const isActivity = type !== 'news'; 
        
        // Lọc theo Tab
        const isCorrectTab = currentTab === 'news' ? !isActivity : isActivity;
        if (!isCorrectTab) return false;

        // Lọc theo Filter (chỉ áp dụng cho tab Hoạt Động)
        if (currentTab === 'activity' && selectedFilter !== 'all') {
            return type === selectedFilter;
        }
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // --- CẬP NHẬT: Các nút lọc mới ---
    const activityFilters = [
        { key: 'all', label: `Tất cả (${notifications.filter(n => getNotificationType(n.source) !== 'news').length})` },
        { key: 'rating', label: 'Đánh giá' },
        { key: 'complaint', label: 'Khiếu nại' },
        { key: 'catalog', label: 'Danh mục' },
        { key: 'identity', label: 'Tài khoản' },
        { key: 'order', label: 'Đơn hàng' },
        { key: 'payment', label: 'Thanh toán' },
        { key: 'local', label: 'Nội bộ' },
        { key: 'other', label: 'Khác' },
    ];
    
    useEffect(() => {
        // Chỉ tải khi Popover mở (open === true)
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);
    
    // --- RENDER NỘI DUNG ---
    const renderContent = (list: NotificationResponse[]) => {
        if (loading) {
            return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>;
        }
        if (error) {
            return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
        }
        if (list.length === 0) {
             return (
                 <Box sx={{ p: 3, textAlign: 'center' }}>
                     <Typography variant="body1" color="text.secondary">
                         Hiện tại bạn chưa có thông báo nào.
                     </Typography>
                 </Box>
             );
        }

        return (
            <List sx={{ p: 0 }}>
                {list.map((noti) => (
                    <ListItem 
                        key={noti.notificationId} 
                        disablePadding
                        sx={{ 
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            cursor: 'pointer',
                            // Sử dụng màu nền khác nếu chưa đọc
                            bgcolor: noti.isRead ? theme.palette.background.paper : theme.palette.action.selected,
                            '&:hover': { bgcolor: noti.isRead ? theme.palette.action.hover : theme.palette.action.selected, opacity: 0.9 },
                            transition: 'background-color 0.2s',
                        }}
                        onClick={() => handleNotificationClick(noti)}
                    >
                        <ListItemButton sx={{ py: 1.5 }}>
                            <ListItemAvatar>
                                <Avatar sx={{ 
                                    bgcolor: noti.isRead ? theme.palette.grey[300] : theme.palette.primary.main, 
                                    color: noti.isRead ? theme.palette.text.primary : theme.palette.common.white,
                                    width: 36, height: 36, fontSize: '0.8rem' 
                                }}>
                                    {getNotificationType(noti.source)[0].toUpperCase()}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                                primary={
                                    <Box>
                                        <Typography 
                                            fontWeight={noti.isRead ? 400 : 700} 
                                            component="span"
                                            variant="body2"
                                            display="block"
                                        >
                                            {noti.title}
                                        </Typography>
                                        
                                        {/* BỔ SUNG: Hiển thị message */}
                                        <Typography 
                                            variant="caption" 
                                            color="text.primary" 
                                            sx={{ 
                                                display: 'block', 
                                                fontWeight: noti.isRead ? 400 : 600,
                                                whiteSpace: 'normal',
                                            }}
                                        >
                                            {noti.message}
                                        </Typography>
                                    </Box>
                                } 
                                secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(noti.createdAt).toLocaleString('vi-VN')}
                                        </Typography>
                                    </Box>
                                }
                            />
                            {!noti.isRead && (
                                <CheckCircleIcon 
                                    fontSize="small" 
                                    color="primary" 
                                    sx={{ ml: 1, minWidth: '20px' }} 
                                    titleAccess="Chưa đọc"
                                />
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        );
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '8px',
                        mt: 0.5,
                        minWidth: 400, 
                        maxWidth: 450,
                        maxHeight: 500,
                        overflowY: 'auto', // Đảm bảo popover cuộn được nếu quá dài
                    },
                },
            }}
        >
            <Box sx={{ width: '100%' }}>
                
                {/* 1. HEADER: Tiêu đề và Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1, bgcolor: theme.palette.background.paper }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ p: 2, pb: 0, display: 'flex', justifyContent: 'space-between' }}>
                        Thông Báo
                        {unreadCount > 0 && (
                            <Chip 
                                label={`${unreadCount} mới`} 
                                color="error" 
                                size="small" 
                                sx={{ fontWeight: 'bold' }}
                            />
                        )}
                    </Typography>
                    <Tabs 
                        value={currentTab} 
                        onChange={(e, v) => setCurrentTab(v)} 
                        aria-label="notification tabs"
                        sx={{ px: 2 }}
                    >
                        <Tab 
                            label="Hoạt Động" 
                            value="activity" 
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        />
                        <Tab 
                            label="Tin Tức" 
                            value="news" 
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        />
                    </Tabs>
                </Box>

                {/* 2. FILTER BUTTONS (Chỉ trong tab Hoạt Động) */}
                {currentTab === 'activity' && (
                    <Box sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        overflowX: 'auto', 
                        gap: 1,
                        borderBottom: 1, 
                        borderColor: 'divider',
                        position: 'sticky', // Dán bộ lọc ngay dưới tabs
                        top: 96, // Chiều cao của Header + Tabs (~96px)
                        zIndex: 1,
                        bgcolor: theme.palette.background.paper
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, whiteSpace: 'nowrap' }}>
                            <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" fontWeight="bold">Lọc</Typography>
                        </Box>

                        {activityFilters.map((filter) => (
                            <Chip
                                key={filter.key}
                                label={filter.label}
                                clickable
                                size="small"
                                color={selectedFilter === filter.key ? 'primary' : 'default'}
                                onClick={() => setSelectedFilter(filter.key)}
                                sx={{ 
                                    textTransform: 'none', 
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap',
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* 3. NỘI DUNG */}
                <Box>
                    {renderContent(filteredNotifications)}
                </Box>
                
                {/* 4. FOOTER: KHÔNG CÓ */}
            </Box>
        </Popover>
    );
};