import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, InputBase, Badge, Avatar, Box, Typography, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';

// --- IMPORT COMPONENT & HOOK ---
import { NotificationPopover } from '../popovers/NotificationPopover';
import { AccountMenuPopover } from '../popovers/AccountMenuPopover';
import { useAdminBadges } from '../../hooks/useAdminBadges';
import { useAdmin } from '../../context/AdminContext';

interface HeaderProps {
    drawerWidth: number;
    open: boolean;
    handleDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ drawerWidth, open, handleDrawerToggle }) => {
    const theme = useTheme();
    const { me, loadingMe } = useAdmin();
    const isLoggedIn = !!me;

    // --- STATE POPOVER ---
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
    const [accountAnchorEl, setAccountAnchorEl] = useState<null | HTMLElement>(null);

    const isNotificationOpen = Boolean(notificationAnchorEl);
    const isAccountOpen = Boolean(accountAnchorEl);

    // --- HANDLE EVENTS ---
    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleAccountClick = (event: React.MouseEvent<HTMLElement>) => {
        setAccountAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => setNotificationAnchorEl(null);
    const handleAccountClose = () => setAccountAnchorEl(null);

    // --- BADGE LOGIC ---
    const { badges, markNotificationsRead } = useAdminBadges(isLoggedIn);
    const hasUnreadNotifications = badges.hasUnreadNotifications;

    const handleNotificationsBadgeClick = (event: React.MouseEvent<HTMLElement>) => {
        handleNotificationClick(event);
        markNotificationsRead();
    };

    // --- LOGOUT ---
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
    };

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
                    ml: open ? `${drawerWidth}px` : 0,
                    backgroundColor: theme.palette.background.paper,
                    zIndex: theme.zIndex.drawer + 1,
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar>
                    {/* Icon mở/đóng Sidebar */}
                    <IconButton
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{
                            mr: 2,
                            color: theme.palette.primary.main,
                            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                            transition: theme.transitions.create(['transform']),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Thanh tìm kiếm */}
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: 1,
                            backgroundColor: theme.palette.action.hover,
                            mr: 2,
                            ml: 4,
                            width: '300px',
                        }}
                    >
                        <Box
                            sx={{
                                p: 1,
                                height: '100%',
                                position: 'absolute',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                        </Box>
                        <InputBase
                            placeholder="Search..."
                            sx={{ p: '8px 8px 8px 40px', width: '100%', color: theme.palette.text.primary }}
                        />
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Notification + Avatar */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            size="large"
                            sx={{ color: theme.palette.text.secondary }}
                            onClick={handleNotificationsBadgeClick}
                        >
                            <Badge
                                badgeContent={hasUnreadNotifications ? '' : 0}
                                color="error"
                                variant="dot"
                            >
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                ml: 3,
                                cursor: 'pointer',
                                p: 1,
                                borderRadius: '4px',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={handleAccountClick}
                        >
                            {!loadingMe && me ? (
                                <>
                                    <Box
                                        sx={{
                                            textAlign: 'right',
                                            mr: 1,
                                            display: { xs: 'none', sm: 'block' },
                                        }}
                                    >
                                        <Typography variant="body2" color="text.primary" fontWeight="bold">
                                            {me.fullName || me.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {me.role || 'Admin'}
                                        </Typography>
                                    </Box>
                                    <Avatar alt={me.fullName} src={me.avatarUrl} />
                                </>
                            ) : (
                                <Typography variant="body2">Đang tải...</Typography>
                            )}
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Popovers */}
            <NotificationPopover
                open={isNotificationOpen}
                anchorEl={notificationAnchorEl}
                handleClose={handleNotificationClose}
                markAllNotificationsSeen={markNotificationsRead}
            />

            <AccountMenuPopover
                open={isAccountOpen}
                anchorEl={accountAnchorEl}
                handleClose={handleAccountClose}
                isLoggedIn={isLoggedIn}
                user={me}
                handleLogout={handleLogout}
            />
        </>
    );
};

export default Header;
