// src/pages/UserDetailPage.tsx
import React, { useState, useEffect, useCallback, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Paper, Button, Divider, Stack, CircularProgress,
    Chip, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CancelIcon from '@mui/icons-material/Cancel'; 
import { useSnackbar } from 'notistack';

// Import Service 
import { AdminService } from '../services/adminService'; 

// --- CẤU TRÚC DỮ LIỆU USER THỰC TẾ (ĐÃ THÊM role) ---
interface UserDetail {
    userId: number; 
    userFullName: string;
    email: string;
    phone: string | null; 
    userAddress: string | null;
    userBirthday: string | null;
    contactPhone: string | null;
    avatar: string | null;
    citizenIdCard: string | null;
    // ĐÃ THÊM: Role của người dùng
    role: 'Guest' | 'Member' | 'Admin' | 'Moderator'; // Giả định các role
    userStatus: 'Active' | 'Locked' | 'Disabled'; 
    profileStatus: 'Pending' | 'Verified' | 'Rejected'; 
    createdAt: string; 
    rejectionReason: string | null;
}
// ------------------------------------

// --- HÀM HELPER ĐỂ HIỂN THỊ CHIP ROLE ---
const getRoleChip = (role: UserDetail['role']): JSX.Element => {
    let color: 'default' | 'primary' | 'error' | 'warning' | 'success' = 'default';
    if (role === 'Admin') color = 'primary';
    else if (role === 'Moderator') color = 'success';
    else if (role === 'Guest') color = 'warning';
    else if (role === 'Member') color = 'default';

    return (
        <Chip 
            label={role} 
            size="small"
            color={color} 
            sx={{ fontWeight: 'bold' }}
        />
    );
};
// -----------------------------------------------------------------


// Giả định BASE_URL (Thay thế bằng BASE_URL thực tế)
const BASE_URL_FOR_ASSETS = 'http://your-api-base-url.com'; 

const UserDetailPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>(); 
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    // State
    // Cập nhật state để chứa UserDetail mới (bao gồm role)
    const [user, setUser] = useState<UserDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [rejectionReason, setRejectionReason] = useState<string>('');

    const idToFetch = userId ? parseInt(userId) : null;

    // --- LOGIC GỌI API ---
    const fetchUserDetail = useCallback(async () => {
        if (!idToFetch) return;

        setIsLoading(true);
        try {
            // LƯU Ý: Đảm bảo AdminService.getUserById trả về dữ liệu có chứa thuộc tính 'role'
            // Dữ liệu mock/thực tế phải khớp với interface UserDetail
            const data: UserDetail = await AdminService.getUserById(idToFetch);
            setUser(data);
        } catch (error) {
            console.error("Failed to fetch user details:", error);
            enqueueSnackbar(`Error loading details for User ID: ${userId}`, { variant: "error" });
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [idToFetch, userId, enqueueSnackbar]);
    
    useEffect(() => {
        fetchUserDetail();
    }, [fetchUserDetail]);

    // --- HÀM XỬ LÝ ACTIONS (THAO TÁC QUẢN TRỊ) ---

    const handleEnableUser = async () => {
        if (!idToFetch) return;
        try {
            await AdminService.enableUser(idToFetch);
            setUser(prev => prev ? { ...prev, userStatus: 'Active' } : null);
            enqueueSnackbar(`User ${idToFetch} successfully Activated.`, { variant: 'success' });
        } catch (error) {
            enqueueSnackbar(`Failed to activate user ${idToFetch}.`, { variant: 'error' });
        }
    };
    
    const handleDisableUser = async () => {
        if (!idToFetch) return;
        try {
            await AdminService.disableUser(idToFetch);
            setUser(prev => prev ? { ...prev, userStatus: 'Disabled' } : null);
            enqueueSnackbar(`User ${idToFetch} successfully Disabled.`, { variant: 'warning' });
        } catch (error) {
            enqueueSnackbar(`Failed to disable user ${idToFetch}.`, { variant: 'error' });
        }
    };

    const handleVerifyProfile = async () => {
        if (!idToFetch) return;
        try {
            await AdminService.verifyUser(idToFetch); 
            setUser(prev => prev ? { ...prev, profileStatus: 'Verified' } : null);
            enqueueSnackbar(`Profile ${idToFetch} successfully Verified.`, { variant: 'success' });
        } catch (error) {
            enqueueSnackbar(`Failed to verify profile ${idToFetch}.`, { variant: 'error' });
        }
    };
    
    const handleOpenRejectDialog = () => {
        setIsDialogOpen(true);
    };

    const handleRejectUser = async () => {
        if (!idToFetch) return;
        setIsDialogOpen(false); 
        
        try {
            await AdminService.rejectUser(idToFetch, rejectionReason);
            setUser(prev => prev ? { ...prev, profileStatus: 'Rejected', rejectionReason: rejectionReason || null } : null);
            enqueueSnackbar(`Profile ${idToFetch} successfully Rejected.`, { variant: 'error' });
            setRejectionReason('');
        } catch (error) {
            enqueueSnackbar(`Failed to reject profile ${idToFetch}.`, { variant: 'error' });
        }
    };

    // --- RENDER CONTENT ---
    if (!idToFetch) {
        return (
            <Box>
                <Typography variant="h5" color="error">Invalid User ID.</Typography>
                <Button variant="contained" onClick={() => navigate('/users')} sx={{ mt: 2 }}>
                    Go back to User List
                </Button>
            </Box>
        );
    }
    
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading user data...</Typography>
            </Box>
        );
    }

    if (!user) {
        return (
            <Box>
                <Typography variant="h5" color="error">User ID: {userId} not found!</Typography>
                <Button variant="contained" onClick={() => navigate('/users')} sx={{ mt: 2 }}>
                    Go back to User List
                </Button>
            </Box>
        );
    }
    
    // --- Component Chi tiết Người dùng ---
    
    const isUserActive = user.userStatus === 'Active';
    const avatarUrl = user.avatar ? `${BASE_URL_FOR_ASSETS}${user.avatar}` : undefined;

    return (
        <Box>
            {/* Nút quay lại */}
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate('/users')} 
                sx={{ mb: 3 }}
            >
                Back to User Management
            </Button>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                        {user.userFullName}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="subtitle1" color="text.secondary">
                            User ID: {user.userId}
                        </Typography>
                        {/* HIỂN THỊ ROLE (ĐÃ THÊM VÀO ĐÂY) */}
                        {getRoleChip(user.role)}
                    </Stack>
                </Box>
                
                {/* KHU VỰC ACTIONS: HIỂN THỊ TẤT CẢ CÁC NÚT */}
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                    
                    {/* 1. Hành động Verification */}
                    <Tooltip title="Set profile status to Verified">
                        <Button 
                            variant="contained" 
                            color="success"
                            startIcon={<VerifiedUserIcon />}
                            onClick={handleVerifyProfile}
                            size="small"
                        >
                            Verify
                        </Button>
                    </Tooltip>
                    
                    <Tooltip title="Set profile status to Rejected (requires reason)">
                        <Button 
                            variant="outlined" 
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={handleOpenRejectDialog}
                            size="small"
                        >
                            Reject
                        </Button>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    
                    {/* 2. Hành động Account Status */}
                    
                    <Tooltip title="Set account status to Disabled">
                        <Button 
                            variant="outlined" 
                            color="error" 
                            startIcon={<BlockIcon />}
                            onClick={handleDisableUser}
                            size="small"
                        >
                            Disable
                        </Button>
                    </Tooltip>

                    <Tooltip title="Set account status to Active">
                        <Button 
                            variant="contained" 
                            color="warning" 
                            startIcon={<LockOpenIcon />}
                            onClick={handleEnableUser}
                            size="small"
                        >
                            Activate
                        </Button>
                    </Tooltip>
                </Stack>
            </Stack>

            <Paper sx={{ p: 4, borderRadius: '8px' }}>
                <Stack spacing={4}>
                    
                    {/* 1. Thông tin cơ bản */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Personal Information</Typography>
                        <Divider />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 10 }} sx={{ mt: 2 }} alignItems="flex-start">
                            
                            {/* Avatar */}
                            <Box>
                                <Typography color="text.secondary">Avatar</Typography>
                                <Avatar 
                                    alt={user.userFullName} 
                                    src={avatarUrl} 
                                    sx={{ width: 80, height: 80, mt: 1, border: '1px solid #eee' }} 
                                />
                            </Box>
                            
                            {/* Chi tiết liên hệ */}
                            <Box>
                                <Typography color="text.secondary">Email</Typography>
                                <Typography fontWeight="medium">{user.email}</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Typography color="text.secondary">Phone (Main)</Typography>
                                    <Typography fontWeight="medium">{user.phone || 'N/A'}</Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography color="text.secondary">Address</Typography>
                                <Typography fontWeight="medium">{user.userAddress || 'N/A'}</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Typography color="text.secondary">Birthday</Typography>
                                    <Typography fontWeight="medium">{user.userBirthday ? new Date(user.userBirthday).toLocaleDateString() : 'N/A'}</Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                    
                    {/* 2. Trạng thái & Verification */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Account & Profile Status</Typography>
                        <Divider />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 10 }} sx={{ mt: 2 }}>
                            <Box>
                                <Typography color="text.secondary">Account Status</Typography>
                                <Chip 
                                    label={user.userStatus} 
                                    color={isUserActive ? 'success' : 'error'} 
                                    size="small"
                                />
                            </Box>
                            <Box>
                                <Typography color="text.secondary">Profile Verification</Typography>
                                <Chip 
                                    label={user.profileStatus} 
                                    color={user.profileStatus === 'Verified' ? 'primary' : (user.profileStatus === 'Pending' ? 'warning' : 'error')}
                                    icon={user.profileStatus === 'Verified' ? <VerifiedUserIcon sx={{ fontSize: 16 }} /> : undefined}
                                    size="small"
                                />
                                {user.rejectionReason && (
                                    <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                                        Reason: {user.rejectionReason}
                                    </Typography>
                                )}
                            </Box>
                            <Box>
                                <Typography color="text.secondary">Created At (UTC)</Typography>
                                <Typography fontWeight="medium">
                                    {new Date(user.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })} 
                                    {' '} 
                                    {new Date(user.createdAt).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                    
                </Stack>
            </Paper>
            
            {/* Modal Nhập Lý do Từ chối */}
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Reject User Profile</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Please specify the reason for rejecting **{user.userFullName}'s** profile verification.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Rejection Reason"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleRejectUser} 
                        color="error" 
                        variant="contained" 
                        disabled={!rejectionReason.trim()}
                    >
                        Confirm Reject
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserDetailPage;