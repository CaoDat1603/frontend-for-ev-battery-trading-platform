import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Stack,
    Divider,
    Chip,
    Button,
    CircularProgress,
    Avatar,
    TextField,
    useTheme,
    Snackbar,
    Alert,
    // ⚠️ Thêm imports cho Dialog/Select/FormControl
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { UserStatusLabel } from "../utils/userStatus";
import { useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import MapIcon from "@mui/icons-material/Map";
// import LockIcon from "@mui/icons-material/Lock"; // Giữ nguyên nếu cần
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
// ⚠️ Thêm Location Icon
import LocationOnIcon from "@mui/icons-material/LocationOn"; 
import { useAdmin } from "../context/AdminContext";
import { UserService } from "../services/userService";

// ⚠️ IMPORT DỮ LIỆU TỈNH/THÀNH PHỐ
// Giả định bạn đã tạo file này
import { VIETNAM_PROVINCES, type Province, type District } from '../data/vietnamLocations'; 


const BASE_URL = "http://localhost:8000";

// --- Giao diện và Hàm xử lý Địa chỉ ---
interface DetailedAddress {
    provinceId: number | null;
    provinceName: string;
    districtId: number | null;
    districtName: string;
    streetDetail: string; // Gộp Phường/Xã và Số nhà/Tên đường
}

// Hàm giả định phân tích chuỗi địa chỉ thành cấu trúc chi tiết
const parseAddressString = (address: string): DetailedAddress => {
    if (!address) {
         return { provinceId: null, provinceName: "", districtId: null, districtName: "", streetDetail: "" };
    }
    // Tạm thời, ta cố gắng phân tách 3 cấp cuối cùng: [Phường/Đường], [Quận/Huyện], [Tỉnh/Thành phố]
    const parts = address.split(', ').map(p => p.trim()).reverse();
    
    let provinceName = parts[0] || "";
    let districtName = parts[1] || "";
    // Phần còn lại là chi tiết đường/phường xã (lấy các phần tử còn lại, sau đó đảo ngược lại)
    let streetDetail = parts.reverse().slice(2).reverse().join(', ') || address; 

    // Cố gắng tìm ID từ tên
    const province = VIETNAM_PROVINCES.find(p => p.name === provinceName);
    const district = province?.districts.find(d => d.name === districtName);
    
    return {
        provinceId: province?.id ?? null,
        provinceName: province?.name ?? provinceName,
        districtId: district?.id ?? null,
        districtName: district?.name ?? districtName,
        streetDetail: streetDetail,
    };
};

// Hàm định dạng địa chỉ chi tiết thành chuỗi
const formatAddressToString = (address: DetailedAddress): string => {
    const parts = [
        address.streetDetail,
        address.districtName,
        address.provinceName,
    ].filter(p => p.trim() !== '');
    return parts.join(", ");
};
// --- Hết Giao diện và Hàm xử lý Địa chỉ ---


const ProfilePage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { me: contextUser, setMe, loadingMe } = useAdmin();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" } | null>(null);

    // --- STATE CHO LOCATION POPUP ---
    const [openLocationDialog, setOpenLocationDialog] = useState(false);
    const [currentDetailedAddress, setCurrentDetailedAddress] = useState<DetailedAddress>(() => ({
        provinceId: null,
        provinceName: "",
        districtId: null,
        districtName: "",
        streetDetail: "",
    }));
    // --- KẾT THÚC STATE LOCATION ---

    // Load profile từ context
    useEffect(() => {
        if (!contextUser) return;
        const normalizedProfile = { ...contextUser };
        setProfile(normalizedProfile);
        // Khởi tạo địa chỉ chi tiết từ chuỗi địa chỉ
        setCurrentDetailedAddress(parseAddressString(normalizedProfile.address ?? ""));
        setLoading(false);
    }, [contextUser]);
    
    // Đồng bộ địa chỉ khi vào Edit Mode
    const handleEdit = () => {
        // Tải địa chỉ hiện tại vào detailed address khi bắt đầu chỉnh sửa
        if (profile) {
            setCurrentDetailedAddress(parseAddressString(profile.address));
        }
        setEditMode(true);
    };
    
    // Hủy bỏ chỉnh sửa
    const handleCancelEdit = () => {
        if (contextUser) {
            setProfile({ ...contextUser }); // Quay lại dữ liệu gốc từ context
        }
        // Đóng edit mode
        setEditMode(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        // Có thể gọi thêm API logout nếu cần
        navigate("/login");
    };

const getStatusChip = (status?: number) => {
    // 1. Lấy tên trạng thái (string) từ giá trị số (number)
    // Nếu status là 1, UserStatus[1] trả về "Active"
    // Nếu status không khớp, nó trả về undefined.
    const statusName = status !== undefined 
        ? UserStatusLabel[status] 
        : undefined;

    // 2. Xác định statusKey: dùng tên trạng thái hoặc "Unknown"
    // Nếu statusName là "Active", ta dùng nó. Nếu không, ta dùng "Unknown".
    // Ta cũng dùng "Unknown" nếu statusName là chuỗi số (chỉ xảy ra nếu bạn dùng Object.keys, nhưng cách này tránh được điều đó)
    const statusKey = statusName && isNaN(Number(statusName)) 
        ? statusName 
        : "Unknown";

    // 3. Lấy text hiển thị (có thể cần một mapping riêng nếu text hiển thị khác với key)
    const text = statusKey; // Ví dụ: "Active"
    
    // 4. Xác định màu
    const color: "success" | "error" | "default" =
        statusKey === "Active" ? "success" :
        statusKey === "Banned" ? "error" : "default";

    return <Chip label={text} color={color} size="small" variant="outlined" />;
};

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setProfile({
            ...profile,
            avatarFile: file,
            avatarUrl: URL.createObjectURL(file), // preview tạm thời
        });
    };

    const handleSaveProfile = async () => {
        if (!profile) return;
        try {
            setUpdating(true);

            // ⚠️ Cập nhật trường address trong profile trước khi gửi
            const finalAddressString = formatAddressToString(currentDetailedAddress);

            // --- Tạo form data gửi lên backend ---
            const formData = new FormData();
            formData.append("UserFullName", profile.fullName || "");
            formData.append("UserAddress", finalAddressString || ""); // GỬI ĐỊA CHỈ ĐÃ FORMAT
            formData.append("ContactPhone", profile.contect || "");
            if (profile.userBirthday?.trim()) {
                const dateObj = new Date(profile.userBirthday);
                if (!isNaN(dateObj.getTime())) {
                    formData.append("UserBirthday", dateObj.toISOString());
                }
            }
            if (profile.avatarFile) formData.append("Avatar", profile.avatarFile);

            // --- Gửi lên backend ---
            await UserService.updateProfile(formData);

            // --- Lấy lại profile đầy đủ từ backend ---
            const refreshed = await UserService.getProfile();
            const normalized = {
                id: refreshed.id,
                userStatus: refreshed.UserStatus ?? 0,
                fullName: refreshed.userFullName ?? "",
                email: refreshed.email ?? "",
                phone: refreshed.phone ?? "",
                contect: refreshed.contactPhone ?? "",
                address: refreshed.userAddress ?? "", // Lấy address mới
                userBirthday: refreshed.userBirthday?.split("T")[0] ?? "",
                role: refreshed.role ?? "Admin",
                avatarUrl: refreshed.avatar
                    ? `${BASE_URL}/identity${refreshed.avatar}`
                    : profile.avatarUrl,
            };

            // --- Cập nhật state profile ---
            setProfile(normalized);

            // --- Cập nhật context Header ---
            setMe?.(normalized);
            
            // --- Cập nhật lại Detailed Address sau khi lưu (từ chuỗi mới) ---
            setCurrentDetailedAddress(parseAddressString(normalized.address));

            // --- Tắt chế độ edit và thông báo thành công ---
            setEditMode(false);
            setSnackbar({ message: "Cập nhật thành công", severity: "success" });
        } catch (err: any) {
            console.error(err);
            setSnackbar({ message: err.message || "Cập nhật thất bại", severity: "error" });
        } finally {
            setUpdating(false);
        }
    };
    
    // --- LOGIC XỬ LÝ LOCATION DIALOG ---
    const handleOpenLocationDialog = () => {
        setOpenLocationDialog(true);
    };

    const handleCloseLocationDialog = () => {
        setOpenLocationDialog(false);
    };

    const handleSaveLocation = () => {
        // Cập nhật trường address trong state profile ngay lập tức để hiển thị trong TextField
        const newAddressString = formatAddressToString(currentDetailedAddress);
        setProfile({ ...profile, address: newAddressString });
        setOpenLocationDialog(false);
    };
    
    // Xử lý thay đổi trường Tỉnh/Thành phố
    const handleProvinceChange = (provinceId: number) => {
        const selectedProvince = VIETNAM_PROVINCES.find(p => p.id === provinceId);
        if (selectedProvince) {
            setCurrentDetailedAddress({
                ...currentDetailedAddress,
                provinceId: selectedProvince.id,
                provinceName: selectedProvince.name,
                districtId: null, // RESET QUẬN/HUYỆN
                districtName: "",
            });
        } else {
            // Nếu chọn "Không chọn Tỉnh/TP"
            setCurrentDetailedAddress({
                ...currentDetailedAddress,
                provinceId: null,
                provinceName: "",
                districtId: null,
                districtName: "",
            });
        }
    };

    // Xử lý thay đổi trường Quận/Huyện
    const handleDistrictChange = (districtId: number) => {
        const currentProvince = VIETNAM_PROVINCES.find(p => p.id === currentDetailedAddress.provinceId);
        const selectedDistrict = currentProvince?.districts.find(d => d.id === districtId);
        if (selectedDistrict) {
            setCurrentDetailedAddress({
                ...currentDetailedAddress,
                districtId: selectedDistrict.id,
                districtName: selectedDistrict.name,
            });
        }
    };

    // Xử lý thay đổi trường chi tiết (Phường/Đường)
    const handleStreetDetailChange = (value: string) => {
        setCurrentDetailedAddress({
            ...currentDetailedAddress,
            streetDetail: value,
        });
    };
    // --- KẾT THÚC LOGIC XỬ LÝ LOCATION DIALOG ---

    if (loading || loadingMe)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
                <CircularProgress />
            </Box>
        );

    if (!profile)
        return (
            <Box textAlign="center" mt={5}>
                <Typography>Không có dữ liệu người dùng.</Typography>
            </Box>
        );

    return (
        <Box sx={{ px: { xs: 2, md: 6 }, py: 4 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 4, pb: 2, borderBottom: `2px solid ${theme.palette.divider}` }}>
                <Box sx={{ position: "relative" }}>
                    <Avatar
                        src={profile.avatarUrl}
                        alt={profile.fullName || profile.name}
                        sx={{ width: 80, height: 80, border: `2px solid ${theme.palette.primary.main}` }}
                    />
                    {editMode && (
                        <input
                            type="file"
                            accept="image/*"
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                top: 0,
                                left: 0,
                                opacity: 0,
                                cursor: "pointer",
                            }}
                            onChange={handleAvatarChange}
                        />
                    )}
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight="bold">{profile.fullName || "My Profile"}</Typography>
                    <Typography color="text.secondary">{profile.role || "Administrator"}</Typography>
                </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
                {/* Thông tin cá nhân */}
                <Box sx={{ width: { xs: "100%", md: "66%" } }}>
                    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "0.3s", "&:hover": { boxShadow: "0 6px 25px rgba(0,0,0,0.12)" } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h5" fontWeight="bold">Thông tin cá nhân</Typography>
                            {getStatusChip(profile.userStatus)}
                        </Stack>

                        <Divider sx={{ mb: 3 }} />

                        <Stack spacing={2}>
                            {/* Email (Readonly) */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <EmailIcon />
                                <Typography color="text.secondary">Email</Typography>
                                <Typography fontWeight="medium">{profile.email}</Typography>
                            </Stack>

                            {/* Phone (Readonly) */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <PhoneIcon />
                                <Typography color="text.secondary">Phone</Typography>
                                <Typography fontWeight="medium">{profile.phone || "—"}</Typography>
                            </Stack>

                            {/* Address - SỬ DỤNG TEXTFIELD CÓ ICON/ONCLICK */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <MapIcon />
                                <Typography color="text.secondary">Address</Typography>
                                <TextField
                                    size="small"
                                    value={profile.address || ""}
                                    disabled={!editMode}
                                    InputLabelProps={{ shrink: true }}
                                    onClick={editMode ? handleOpenLocationDialog : undefined}
                                    InputProps={{
                                        readOnly: true, // Chỉ cho phép mở dialog, không gõ trực tiếp
                                        endAdornment: editMode && (
                                            <LocationOnIcon 
                                                sx={{ cursor: 'pointer', color: theme.palette.primary.main }} 
                                                onClick={handleOpenLocationDialog}
                                            />
                                        ),
                                    }}
                                />
                            </Stack>

                            {/* Birthday */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <span>🎂</span>
                                <Typography color="text.secondary">Birthday</Typography>
                                <TextField
                                    type="date"
                                    size="small"
                                    label="Ngày sinh"
                                    value={profile.userBirthday ?? ""}
                                    disabled={!editMode}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ max: new Date().toISOString().split("T")[0] }}
                                    onChange={(e) =>
                                        setProfile({ ...profile, userBirthday: e.target.value })
                                    }
                                />
                            </Stack>

                            {/* Contact Phone */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <PhoneIcon />
                                <Typography color="text.secondary">Contact Phone</Typography>
                                <TextField
                                    size="small"
                                    value={profile.contect || ""}
                                    disabled={!editMode}
                                    InputLabelProps={{ shrink: true }}
                                    onChange={(e) => setProfile({ ...profile, contect: e.target.value })}
                                />
                            </Stack>
                        </Stack>
                    </Paper>
                </Box>

                {/* Actions */}
                <Box sx={{ width: { xs: "100%", md: "33.33%" } }}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: theme.shadows[1] }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Profile Actions</Typography>

                        <Stack spacing={1.5}>
                            <Button
                                startIcon={<EditIcon />}
                                variant={editMode ? "contained" : "outlined"}
                                fullWidth
                                onClick={editMode ? handleSaveProfile : handleEdit}
                                disabled={updating}
                            >
                                {editMode ? (updating ? "Saving..." : "Save Changes") : "Edit Personal Info"}
                            </Button>
                            
                            {editMode && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    onClick={handleCancelEdit}
                                    disabled={updating}
                                >
                                    Cancel
                                </Button>
                            )}

                            <Divider sx={{ my: 1 }} />

                            <Button
                                startIcon={<LogoutIcon />}
                                variant="contained"
                                color="error"
                                fullWidth
                                onClick={handleLogout}
                            >
                                Log Out
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Stack>
            
            {/* 📍 LOCATION DIALOG - ĐÃ TÍCH HỢP */}
            <Dialog open={openLocationDialog} onClose={handleCloseLocationDialog} fullWidth maxWidth="sm">
                <DialogTitle>Chọn Địa chỉ Chi tiết</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        
                        {/* 1. TỈNH/THÀNH PHỐ - SELECT */}
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="province-select-label" shrink>Tỉnh/Thành phố</InputLabel>
                            <Select
                                labelId="province-select-label"
                                value={currentDetailedAddress.provinceId ?? ""}
                                onChange={(e) => handleProvinceChange(e.target.value as number)}
                                label="Tỉnh/Thành phố"
                                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                                displayEmpty
                            >
                                <MenuItem value={""}>
                                    <em>Chọn Tỉnh/Thành phố</em>
                                </MenuItem>
                                {VIETNAM_PROVINCES.map((province) => (
                                    <MenuItem key={province.id} value={province.id}>
                                        {province.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        {/* 2. QUẬN/HUYỆN - SELECT (phụ thuộc vào Tỉnh) */}
                        <FormControl fullWidth variant="outlined" disabled={currentDetailedAddress.provinceId === null}>
                            <InputLabel id="district-select-label" shrink>Quận/Huyện</InputLabel>
                            <Select
                                labelId="district-select-label"
                                value={currentDetailedAddress.districtId ?? ""}
                                onChange={(e) => handleDistrictChange(e.target.value as number)}
                                label="Quận/Huyện"
                                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                                displayEmpty
                            >
                                <MenuItem value={""}>
                                    <em>Chọn Quận/Huyện</em>
                                </MenuItem>
                                {VIETNAM_PROVINCES.find(p => p.id === currentDetailedAddress.provinceId)
                                    ?.districts.map((district) => (
                                        <MenuItem key={district.id} value={district.id}>
                                            {district.name}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                        
                        {/* 3. PHƯỜNG/XÃ VÀ SỐ NHÀ/TÊN ĐƯỜNG - TEXTFIELD */}
                        <TextField
                            label="Phường/Xã, Số nhà/Tên đường (Chi tiết)"
                            value={currentDetailedAddress.streetDetail}
                            onChange={(e) => handleStreetDetailChange(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Ví dụ: Phường Bến Nghé, 123 Đường Nguyễn Huệ"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseLocationDialog} color="inherit">
                        Hủy
                    </Button>
                    <Button onClick={handleSaveLocation} variant="contained" color="success">
                        Lưu Địa chỉ
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar thông báo */}
            {snackbar && (
                <Snackbar
                    open
                    autoHideDuration={3000}
                    onClose={() => setSnackbar(null)}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                    <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
                </Snackbar>
            )}
        </Box>
    );
};

export default ProfilePage;