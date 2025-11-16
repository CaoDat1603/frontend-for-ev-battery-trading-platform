import React, { useState, useEffect, type JSX, useCallback, useMemo } from 'react';
import { 
    Box, Typography, Paper, useTheme, Stack, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Button, Chip, IconButton, Tooltip, TextField,
    Select, MenuItem, InputLabel, FormControl, CircularProgress,
    Pagination // Thêm Pagination
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Import Service và Types (Giả định AdminService đã được cập nhật với searchUsers và countUsers)
import { AdminService } from '../services/adminService'; 

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import GroupIcon from '@mui/icons-material/Group';
import CachedIcon from '@mui/icons-material/Cached';
import ClearAllIcon from '@mui/icons-material/ClearAll'; // Icon cho nút Reset
import { useSnackbar } from 'notistack'; 

// --- CẤU TRÚC DỮ LIỆU USER ---
interface UserData {
    userId: number; 
    userFullName: string;
    email: string;
    phone: string | null; 
    role: 'Guest' | 'Member' | 'Admin';
    userStatus: 'Active' | 'Banned'; 
    profileStatus: 'Pending' | 'Verified' | 'Rejected'; 
    createdAt: string; 
    rejectionReason: string | null;
    violations?: number; 
}
// -----------------------------

// --- CONSTANTS ---
const ITEMS_PER_PAGE = 10; // Số lượng mục trên mỗi trang
const ALL_FILTER_VALUE = 'All';

// Giá trị lọc mặc định
const DEFAULT_FILTERS = {
    term: '',
    status: ALL_FILTER_VALUE,
    verification: ALL_FILTER_VALUE,
    role: ALL_FILTER_VALUE,
    createdAt: ALL_FILTER_VALUE,
};


// --- HÀM HELPER ĐỂ HIỂN THỊ CHIP (Giữ nguyên) ---

const getStatusChip = (status: UserData['userStatus']): JSX.Element => {
    let color: 'default' | 'primary' | 'error' | 'warning' | 'success' = 'default';
    if (status === 'Active') color = 'success';
    else if (status === 'Banned') color = 'error'; 

    return (
        <Chip 
            label={status} 
            size="small"
            color={color} 
            variant="outlined"
        />
    );
};

const getProfileStatusChip = (pStatus: UserData['profileStatus']): JSX.Element => {
    let color: 'default' | 'primary' | 'warning' | 'success' | 'error' = 'default';
    let label = pStatus;
    if (pStatus === 'Verified') color = 'success';
    else if (pStatus === 'Pending') color = 'warning';
    else if (pStatus === 'Rejected') {
        color = 'error'; 
        label = 'Rejected';
    }

    return (
        <Chip 
            label={label} 
            size="small"
            color={color}
            icon={pStatus === 'Verified' ? <VerifiedUserIcon sx={{ fontSize: 16 }} /> : undefined}
        />
    );
};

const getRoleChip = (role: UserData['role']): JSX.Element => {
    let color: 'default' | 'primary' | 'error' | 'warning' | 'success' = 'default';
    if (role === 'Admin') color = 'primary';
    else if (role === 'Guest') color = 'warning';
    else if (role === 'Member') color = 'default';

    return (
        <Chip 
            label={role} 
            size="small"
            color={color} 
        />
    );
};
// ---------------------------------------------


const UserManagementPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar(); 

    // --- STATE DỮ LIỆU & TRẠNG THÁI ---
    const [users, setUsers] = useState<UserData[]>([]); 
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // --- STATE CHO PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalUsers, setTotalUsers] = useState<number>(0);

    // --- STATE CHO CÁC GIÁ TRỊ LỌC HIỆN TẠI (KÍCH HOẠT API) ---
    const [searchTerm, setSearchTerm] = useState<string>(DEFAULT_FILTERS.term); 
    const [filterStatus, setFilterStatus] = useState<string>(DEFAULT_FILTERS.status); 
    const [filterVerification, setFilterVerification] = useState<string>(DEFAULT_FILTERS.verification); 
    const [filterRole, setFilterRole] = useState<string>(DEFAULT_FILTERS.role); 
    const [filterCreatedAt, setFilterCreatedAt] = useState<string>(DEFAULT_FILTERS.createdAt); 

    // --- STATE CHO CÁC GIÁ TRỊ TẠM THỜI TRÊN INPUT/SELECT (CHƯA KÍCH HOẠT API) ---
    const [searchTempTerm, setSearchTempTerm] = useState<string>(DEFAULT_FILTERS.term); 
    const [tempFilterStatus, setTempFilterStatus] = useState<string>(DEFAULT_FILTERS.status); 
    const [tempFilterVerification, setTempFilterVerification] = useState<string>(DEFAULT_FILTERS.verification); 
    const [tempFilterRole, setTempFilterRole] = useState<string>(DEFAULT_FILTERS.role); 
    const [tempFilterCreatedAt, setTempFilterCreatedAt] = useState<string>(DEFAULT_FILTERS.createdAt); 

    // Hàm chuẩn hóa giá trị lọc cho API (thay 'All' thành chuỗi rỗng)
    const normalizeFilter = (value: string): string => value === ALL_FILTER_VALUE ? '' : value;

    const getErrorMessage = (error: unknown): string => {
        if (axios.isAxiosError(error) && error.response) {
            // Lỗi từ server (status code 4xx, 5xx)
            // Giả định backend trả về { message: '...' }
            return error.response.data?.message || `Server Error (Status: ${error.response.status})`;
        }
        // Lỗi mạng hoặc lỗi không phải từ axios
        return "Network Error or connection failed. Please check the server status.";
    };

    // --- LOGIC GỌI API ĐẾM USER ---
    const fetchUserCount = useCallback(async () => {
        try {
            // Chuẩn bị tham số cho countUsers
            const count: number = await AdminService.countUsers(
                searchTerm.trim(),
                normalizeFilter(filterStatus),
                normalizeFilter(filterVerification),
                normalizeFilter(filterRole),
                normalizeFilter(filterCreatedAt)
            );
            
            setTotalUsers(count);
            
            // Điều chỉnh trang hiện tại nếu vượt quá giới hạn sau khi lọc
            const maxPage = Math.ceil(count / ITEMS_PER_PAGE);
            if (currentPage > maxPage && maxPage > 0) {
                setCurrentPage(1);
            } else if (count === 0 && currentPage !== 1) { // Nếu không có kết quả, vẫn giữ trang 1 hoặc set về 1
                 setCurrentPage(1);
            }

        } catch (error) {
            // HIỂN THỊ THÔNG BÁO LỖI CỤ THỂ TỪ API
            const message = getErrorMessage(error);
            console.error("Failed to fetch user count:", message, error);
            enqueueSnackbar(`Error loading user count: ${message}`, { variant: "error", autoHideDuration: 5000 });
            setTotalUsers(0);
        }
    }, [searchTerm, filterStatus, filterVerification, filterRole, filterCreatedAt, enqueueSnackbar, currentPage]);

    // --- LOGIC GỌI API LẤY DỮ LIỆU CỦA 1 TRANG ---
    const fetchUsersPage = useCallback(async (page: number) => {
        
        // Chỉ hiện loading xoay nếu không phải load lần đầu (isLoading === false)
        if (users.length >= 0 || totalUsers >= 0) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        
        try {
            // Chuẩn bị tham số cho searchUsers
            const searchResults: UserData[] = await AdminService.searchUsers(
                searchTerm.trim(),
                normalizeFilter(filterStatus),
                normalizeFilter(filterVerification),
                normalizeFilter(filterRole),
                normalizeFilter(filterCreatedAt),
                ITEMS_PER_PAGE,
                page
            );
            
            setUsers(searchResults);
        } catch (error) {
            // HIỂN THỊ THÔNG BÁO LỖI CỤ THỂ TỪ API
            const message = getErrorMessage(error);
            console.error("Failed to fetch users:", message, error);
            enqueueSnackbar(`Error loading user data: ${message}`, { variant: "error", autoHideDuration: 5000 });
            setUsers([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [searchTerm, filterStatus, filterVerification, filterRole, filterCreatedAt, enqueueSnackbar, users.length, totalUsers]);


    // --- HÀM TÌM KIẾM (Được gọi khi nhấn nút TÌM KIẾM hoặc Enter) ---
    const handleSearch = () => {
        // 1. Cập nhật các state chính từ các state tạm thời
        setSearchTerm(searchTempTerm);
        setFilterStatus(tempFilterStatus);
        setFilterVerification(tempFilterVerification);
        setFilterRole(tempFilterRole);
        setFilterCreatedAt(tempFilterCreatedAt);
        
        // 2. Reset trang về 1 (Việc này sẽ kích hoạt useEffect bên dưới)
        setCurrentPage(1);
        
        // 3. fetchUserCount sẽ được gọi qua useEffect (vì searchTerm, filterStatus, v.v. đã thay đổi)
        // và sau đó fetchUsersPage sẽ được gọi.
    };
    
    // --- HÀM ĐẶT LẠI CÁC TRƯỜNG LỌC/TÌM KIẾM ---
    const handleReset = () => {
        // 1. Reset tất cả các state tạm thời về mặc định
        setSearchTempTerm(DEFAULT_FILTERS.term);
        setTempFilterStatus(DEFAULT_FILTERS.status);
        setTempFilterVerification(DEFAULT_FILTERS.verification);
        setTempFilterRole(DEFAULT_FILTERS.role);
        setTempFilterCreatedAt(DEFAULT_FILTERS.createdAt);

        // 2. Reset các state kích hoạt API về mặc định (giống như nhấn nút TÌM KIẾM với giá trị rỗng)
        setSearchTerm(DEFAULT_FILTERS.term);
        setFilterStatus(DEFAULT_FILTERS.status);
        setFilterVerification(DEFAULT_FILTERS.verification);
        setFilterRole(DEFAULT_FILTERS.role);
        setFilterCreatedAt(DEFAULT_FILTERS.createdAt);
        
        // 3. Reset trang về 1 và kích hoạt tìm kiếm lại
        setCurrentPage(1); 
        // Các useEffect sẽ tự động chạy để tải lại dữ liệu.
    };

    // --- HÀM REFRESH ---
    const handleRefresh = () => {
        // Tải lại dữ liệu trang hiện tại và đếm lại
        fetchUserCount(); // Đếm lại để phòng trường hợp có user mới được tạo
        // fetchUsersPage(currentPage) sẽ được gọi thông qua useEffect (sau khi fetchUserCount hoàn tất
        // hoặc nếu currentPage không đổi, nó vẫn được gọi khi có sự thay đổi logic bên trong)
        // hoặc có thể gọi trực tiếp để đảm bảo load lại dữ liệu trang hiện tại
        fetchUsersPage(currentPage);
    };

    // --- EFFECT: Lấy tổng số lượng khi bộ lọc THẬT thay đổi ---
    useEffect(() => {
        // Luôn chạy count khi component mount hoặc khi các bộ lọc/tìm kiếm THẬT thay đổi
        fetchUserCount();
    }, [fetchUserCount]);

    // --- EFFECT: Lấy dữ liệu trang khi currentPage hoặc totalUsers thay đổi ---
    useEffect(() => {
        // Chỉ fetch page nếu có dữ liệu hoặc đang cố gắng tải trang 1
        if (totalUsers > 0 || currentPage === 1) { 
            fetchUsersPage(currentPage);
        } else if (totalUsers === 0 && !isLoading) {
             setUsers([]);
        }
    }, [currentPage, totalUsers, fetchUsersPage, isLoading]);

    // --- ACTIONS DÙNG AdminService (Giữ nguyên) ---
    const handleRowClick = (userId: number) => {
        navigate(`/users/${userId}`); 
    };

    const handleApprove = async (id: number) => {
        try {
            await AdminService.verifyUser(id);
            enqueueSnackbar(`User ${id} successfully verified.`, { variant: 'success' });
            // Cập nhật state local
            setUsers(prevUsers => prevUsers.map(user => 
                user.userId === id ? { ...user, profileStatus: 'Verified' } : user
            ));
        } catch (error) {
            const message = getErrorMessage(error);
            enqueueSnackbar(`Failed to verify user ${id}: ${message}`, { variant: 'error', autoHideDuration: 5000 });
            console.error("Verification error:", error);
        }
    };

    const handleLock = async (id: number) => {
        try {
            await AdminService.disableUser(id); 
            enqueueSnackbar(`User ${id} successfully banned.`, { variant: 'warning' });
            // Cập nhật state local
            setUsers(prevUsers => prevUsers.map(user => 
                user.userId === id ? { ...user, userStatus: 'Banned' } : user
            ));
        } catch (error) {
            const message = getErrorMessage(error);
            enqueueSnackbar(`Failed to ban user ${id}: ${message}`, { variant: 'error', autoHideDuration: 5000 });
            console.error("Lock error:", error);
        }
    };

    const handleUnlock = async (id: number) => {
        try {
            await AdminService.enableUser(id);
            enqueueSnackbar(`User ${id} successfully unlocked/enabled.`, { variant: 'success' });
            // Cập nhật state local
            setUsers(prevUsers => prevUsers.map(user => 
                user.userId === id ? { ...user, userStatus: 'Active' } : user
            ));
        } catch (error) {
            const message = getErrorMessage(error);
            enqueueSnackbar(`Failed to unlock user ${id}: ${message}`, { variant: 'error', autoHideDuration: 5000 });
            console.error("Unlock error:", error);
        }
    };

    const totalPages = useMemo(() => Math.ceil(totalUsers / ITEMS_PER_PAGE), [totalUsers]);

    // -------------------------------------------------------------
    
    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <GroupIcon color="action" fontSize="large" /> 
                <Typography variant="h5" fontWeight="bold">
                    User Management
                </Typography>
            </Stack>

            <Paper sx={{ p: 3, borderRadius: '8px', boxShadow: theme.shadows[1] }}>
                
                {/* Thanh Công cụ Tìm kiếm và Lọc */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center" flexWrap="wrap">
                    
                    {/* Tìm kiếm (q) - Dùng state TẠM THỜI */}
                    <TextField
                        size="small"
                        placeholder="Name, Email, or Phone..." 
                        variant="outlined"
                        value={searchTempTerm} 
                        onChange={(e) => setSearchTempTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                        }}
                        sx={{ width: { xs: '100%', sm: '300px' } }}
                        // Kích hoạt tìm kiếm khi nhấn Enter
                        onKeyDown={(e) => { 
                            if (e.key === 'Enter') handleSearch(); 
                        }}
                    />
                    
                    {/* Lọc theo Role - Dùng state TẠM THỜI */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={tempFilterRole}
                            label="Role"
                            onChange={(e) => setTempFilterRole(e.target.value)}
                        >
                            <MenuItem value={ALL_FILTER_VALUE}>All Roles</MenuItem>
                            <MenuItem value="Admin">Admin</MenuItem>
                            <MenuItem value="Member">Member</MenuItem> 
                            <MenuItem value="Guest">Guest</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Lọc theo Account Status (userStatus) - Dùng state TẠM THỜI */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Account Status</InputLabel>
                        <Select
                            value={tempFilterStatus}
                            label="Account Status"
                            onChange={(e) => setTempFilterStatus(e.target.value)}
                        >
                            <MenuItem value={ALL_FILTER_VALUE}>All Statuses</MenuItem>
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Banned">Banned</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Lọc theo Verification Status (profileStatus) - Dùng state TẠM THỜI */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Verification</InputLabel>
                        <Select
                            value={tempFilterVerification}
                            label="Verification"
                            onChange={(e) => setTempFilterVerification(e.target.value)}
                        >
                            <MenuItem value={ALL_FILTER_VALUE}>All Verification</MenuItem>
                            <MenuItem value="Verified">Verified</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                    
                    {/* Lọc theo Created At (createdAt) - Dùng state TẠM THỜI */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Created Date</InputLabel>
                        <Select
                            value={tempFilterCreatedAt}
                            label="Created Date"
                            onChange={(e) => setTempFilterCreatedAt(e.target.value)}
                        >
                            <MenuItem value={ALL_FILTER_VALUE}>All Time</MenuItem>
                            <MenuItem value="Past 7 Days">Past 7 Days</MenuItem>
                            <MenuItem value="Past 30 Days">Past 30 Days</MenuItem>
                            <MenuItem value="Past 90 Days">Past 90 Days</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Nút Tìm Kiếm (Kích hoạt API) */}
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<SearchIcon />}
                        onClick={handleSearch}
                        disabled={isLoading || isRefreshing}
                    >
                        TÌM KIẾM
                    </Button>
                    
                    {/* Nút ĐẶT LẠI */}
                    <Tooltip title="Reset all search and filter fields">
                        <Button 
                            variant="outlined" 
                            color="secondary"
                            startIcon={<ClearAllIcon />}
                            onClick={handleReset}
                            disabled={isLoading || isRefreshing}
                        >
                            ĐẶT LẠI
                        </Button>
                    </Tooltip>

                    <Box sx={{ flexGrow: 1 }} />
                    
                    {/* Nút Refresh */}
                    <Tooltip title="Refresh Data (Tải lại trang hiện tại)">
                        <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                            <CachedIcon sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                        </IconButton>
                    </Tooltip>

                </Stack>

                {/* Hiển thị số lượng tìm thấy */}
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Total Users Found: <Chip label={totalUsers} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
                </Typography>
                
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Loading user data...</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="medium">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Phone</TableCell> 
                                        <TableCell align="center">Role</TableCell> 
                                        <TableCell>Created At (UTC)</TableCell> 
                                        <TableCell align="center">Status</TableCell>
                                        <TableCell align="center">Verification</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.length === 0 && totalUsers === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center"> 
                                                No users found matching the current criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => ( 
                                            <TableRow 
                                                key={user.userId} 
                                                hover
                                                onClick={(e) => {
                                                    // Ngăn chặn sự kiện click lan truyền khi click vào button/chip/link
                                                    if (e.target instanceof HTMLElement && e.target.closest('button, a, .MuiChip-root')) {
                                                        return; 
                                                    }
                                                    handleRowClick(user.userId);
                                                }}
                                                sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                                <TableCell component="th" scope="row">{user.userId}</TableCell>
                                                <TableCell>{user.userFullName}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.phone || 'N/A'}</TableCell> 
                                                <TableCell align="center">{getRoleChip(user.role)}</TableCell> 
                                                <TableCell>
                                                    {new Date(user.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })} 
                                                    {' '} 
                                                    {new Date(user.createdAt).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })}
                                                </TableCell> 
                                                <TableCell align="center">{getStatusChip(user.userStatus)}</TableCell>
                                                <TableCell align="center">{getProfileStatusChip(user.profileStatus)}</TableCell>
                                                
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        
                                                        {/* Nút Phê duyệt/Từ chối (chỉ hiện khi Pending) */}
                                                        {user.profileStatus === 'Pending' && (
                                                            <Button 
                                                                variant="contained" 
                                                                color="success" 
                                                                size="small"
                                                                startIcon={<CheckCircleIcon />}
                                                                onClick={(e) => {e.stopPropagation(); handleApprove(user.userId);}} 
                                                                sx={{ minWidth: 100 }}
                                                            > Approve </Button>
                                                        )}

                                                        {/* Nút Khóa / Mở khóa */}
                                                        {user.userStatus === 'Active' ? (
                                                            <Button 
                                                                variant="outlined"
                                                                color="error" 
                                                                size="small"
                                                                startIcon={<BlockIcon />}
                                                                onClick={(e) => {e.stopPropagation(); handleLock(user.userId);}} 
                                                                sx={{ minWidth: 100 }}
                                                            > Ban </Button> 
                                                        ) : (
                                                            <Button 
                                                                variant="contained"
                                                                color="warning"
                                                                size="small"
                                                                startIcon={<LockOpenIcon />}
                                                                onClick={(e) => {e.stopPropagation(); handleUnlock(user.userId);}} 
                                                                sx={{ minWidth: 100 }}
                                                            > Unban </Button> 
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        {/* PHÂN TRANG */}
                        <Stack spacing={2} direction="row" justifyContent="center" sx={{ mt: 3 }}>
                            {totalPages > 1 && (
                                <Pagination 
                                    count={totalPages} 
                                    page={currentPage} 
                                    onChange={(_event, value) => setCurrentPage(value)}
                                    color="primary"
                                    showFirstButton
                                    showLastButton
                                    disabled={isRefreshing}
                                />
                            )}
                        </Stack>
                    </>
                )}

            </Paper>
        </Box>
    );
};

export default UserManagementPage;