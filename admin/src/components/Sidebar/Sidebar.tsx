import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, useTheme, styled } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';           // Quản lý người dùng
import VisibilityIcon from '@mui/icons-material/Visibility'; // Kiểm duyệt nội dung
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Quản lý Giao dịch
import ReportIcon from '@mui/icons-material/Report';         // Xử lý Khiếu nại
import GavelIcon from '@mui/icons-material/Gavel';         // Xử lý Khiếu nại
import PolicyIcon from '@mui/icons-material/Policy';       // Thiết lập Phí/Hoa hồng
import SettingsIcon from '@mui/icons-material/Settings';
import { Link, useLocation } from 'react-router-dom';

import MyLogo from '../../assets/my-logo.jpg'; 

const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' }, // Trang chủ
    { text: 'User Management', icon: <GroupIcon />, path: '/users' },
    { text: 'Content Moderation', icon: <VisibilityIcon />, path: '/content' },
    { text: 'Auctions', icon: <GavelIcon />, path: '/auctions' },
    { text: 'Transactions', icon: <AttachMoneyIcon />, path: '/transactions' },
    { text: 'Complaints', icon: <ReportIcon />, path: '/complaints' },
    { text: 'Finance Settings', icon: <PolicyIcon />, path: '/finance' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    
];

interface SidebarProps {
  drawerWidth: number;
  collapsedWidth: number; // Đã thêm prop này
  open: boolean;
}

// Styled component cho ListItemText để xử lý ẩn/hiện mượt mà
const HiddenText = styled(ListItemText, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }: { theme?: any; open: boolean }) => ({
        opacity: open ? 1 : 0,
        width: open ? 'auto' : 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        transition: theme.transitions.create('opacity', {
            duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
        }),
    }),
);

const isPathActive = (currentPath: string, navPath: string): boolean => {
    // 1. Xử lý trường hợp đặc biệt: '/' (Dashboard) chỉ khớp khi chính xác là '/'
    if (navPath === '/') {
        return currentPath === '/';
    }
    
    // 2. Xử lý các đường dẫn khác (vd: /content, /users)
    // Nếu currentPath là /content/p001, và navPath là /content
    // Ta kiểm tra xem currentPath có BẮT ĐẦU bằng navPath hay không.
    // Thêm '/' vào cuối navPath để tránh khớp nhầm:
    // /content/somename KHỚP /content/
    // /content KHÔNG KHỚP /contentsomething
    return currentPath.startsWith(navPath + '/');
};

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, collapsedWidth, open }) => {
    const theme = useTheme();
    const location = useLocation();
    const currentPath = location.pathname;

    const drawer = (
        <Box>
            {/* Vùng Logo/Tên dự án (Giữ nguyên) */}
            <Toolbar sx={{ 
                display: 'flex', 
                justifyContent: open ? 'flex-start' : 'center', 
                alignItems: 'center',
                height: '64px',
                backgroundColor: theme.palette.background.paper,
                px: open ? 2 : 0, 
            }}>
                <Box 
                    component="img"
                    src={MyLogo}
                    sx={{ 
                        height: open ? '50px' : '40px', 
                        cursor: 'pointer',
                        borderRadius: '8px', 
                        transition: theme.transitions.create(['height', 'margin']),
                    }}
                />
            </Toolbar>
            
            {/* Vùng Danh sách Điều hướng */}
            <List sx={{ mt: 1 }}>
                {navItems.map((item) => {
                    // SỬA LỖI: Cập nhật logic kiểm tra 'selected'
                    const isSelected = isPathActive(currentPath, item.path) || currentPath === item.path;

                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton 
                                component={Link}
                                to={item.path}
                                // Áp dụng logic kiểm tra mới
                                selected={isSelected} 
                                sx={{
                                    justifyContent: open ? 'initial' : 'center', 
                                    minHeight: 48,
                                    padding: open ? '10px 16px' : '10px 10px', 
                                    // Bổ sung style cho trường hợp selected (hoặc active)
                                    '&.Mui-selected': {
                                        backgroundColor: theme.palette.primary.main,
                                        color: theme.palette.primary.contrastText,
                                        '&:hover': { backgroundColor: theme.palette.primary.dark },
                                        '& .MuiListItemIcon-root': { color: theme.palette.primary.contrastText },
                                    },
                                    '&:hover:not(.Mui-selected)': {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                    color: theme.palette.text.secondary,
                                }}
                            >
                            <ListItemIcon 
                                sx={{ 
                                    minWidth: 40, 
                                    mr: open ? 3 : 'auto',
                                    justifyContent: 'center',
                                    // Đảm bảo icon có màu contrastText khi được chọn
                                    color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.secondary 
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <HiddenText primary={item.text} open={open} /> 
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

  return (
    <Box
      component="nav"
      // Thay đổi độ rộng Box ngoài cùng
      sx={{ width: { sm: open ? drawerWidth : collapsedWidth }, flexShrink: { sm: 0 } }} 
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            // <<< SỬ DỤNG COLLAPSED_WIDTH TẠI ĐÂY >>>
            width: open ? drawerWidth : collapsedWidth, 
            backgroundColor: theme.palette.background.paper,
            overflowX: 'hidden', 
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
            }),
          },
        }}
        // Không dùng prop 'open' trên Drawer khi 'variant="permanent"'
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;