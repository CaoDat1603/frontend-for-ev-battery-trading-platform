import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "../context/UserContext";
import type { UserProfile } from "../context/UserContext";
import {
    Box,
    Button,
    TextField,
    Typography,
    Avatar,
    Card,
    CardContent,
    CircularProgress,
    Chip,
    // Thêm components cho Dialog/Select
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LocationOnIcon from "@mui/icons-material/LocationOn"; // Icon Location
import { UserService } from "../services/userService";

// ⚠️ IMPORT DỮ LIỆU TỈNH/THÀNH PHỐ
import { VIETNAM_PROVINCES, type Province, type District } from '../data/vietnamLocations'; 
// Đảm bảo đường dẫn này đúng

const BASE_URL = "http://localhost:8000";

// Cập nhật giao diện địa chỉ chi tiết
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
    // Phần còn lại là chi tiết đường/phường xã
    let streetDetail = parts.reverse().slice(2).reverse().join(', ') || address; 

    // Cố gắng tìm ID từ tên (chỉ tìm trong 3 tỉnh mẫu)
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
        address.provinceName,
        address.districtName,
        address.streetDetail,
    ].filter(p => p.trim() !== '');
    return parts.join(", ");
};


const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useUser();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
    const [editMode, setEditMode] = useState(false);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [cicFile, setCicFile] = useState<File | null>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cicPreview, setCicPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // --- STATE CHO LOCATION POPUP ---
    const [openLocationDialog, setOpenLocationDialog] = useState(false);
    const [currentDetailedAddress, setCurrentDetailedAddress] = useState<DetailedAddress>(() => ({
        provinceId: null,
        provinceName: "",
        districtId: null,
        districtName: "",
        streetDetail: "",
    }));

    // Normalize dữ liệu backend
    const normalizeProfile = (data: any): UserProfile => {
        const avatarUrl = (data.avatar ?? "").startsWith("http")
            ? data.avatar
            : `${BASE_URL}/identity${data.avatar ?? ""}`;
        const citizenIdCardUrl = (data.citizenIdCard ?? "").startsWith("http")
            ? data.citizenIdCard
            : `${BASE_URL}/identity${data.citizenIdCard ?? ""}`;

        return {
            userId: data.userId,
            userFullName: data.userFullName ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
            userAddress: data.userAddress ?? "",
            userBirthday: data.userBirthday?.split("T")[0] ?? "",
            contactPhone: data.contactPhone ?? "",
            avatar: data.avatar ?? "",
            avatarUrl,
            citizenIdCard: data.citizenIdCard ?? "",
            citizenIdCardUrl,
            userStatus: data.userStatus ?? "",
            profileStatus: data.profileStatus ?? "Unverified",
            rejectionReason: data.rejectionReason ?? null,
        };
    };

    // Load profile lần đầu
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await UserService.getProfile();
                const normalized = normalizeProfile(data);
                setProfile(normalized);
                setAvatarPreview(normalized.avatarUrl ?? null);
                setCicPreview(normalized.citizenIdCardUrl ?? null);
                // Khởi tạo địa chỉ chi tiết từ chuỗi địa chỉ
                setCurrentDetailedAddress(parseAddressString(normalized.userAddress ?? ""));
            } catch (err) {
                console.error("Lỗi load profile:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);
    
    // Đồng bộ khi editMode được bật
    useEffect(() => {
        if (editMode && profile) {
            // Khi vào chế độ chỉnh sửa, đồng bộ chuỗi địa chỉ hiện tại vào detailed address
            setCurrentDetailedAddress(parseAddressString(profile.userAddress));
        }
    }, [editMode, profile]);

    // Handle file change
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "avatar" | "cic"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        if (type === "avatar") {
            setAvatarFile(file);
            setAvatarPreview(preview);
        } else {
            setCicFile(file);
            setCicPreview(preview);
        }
    };

    // --- XỬ LÝ LOCATION DIALOG ---
    const handleOpenLocationDialog = () => {
        // Tải địa chỉ hiện tại vào dialog
        if (profile) {
            setCurrentDetailedAddress(parseAddressString(profile.userAddress));
        }
        setOpenLocationDialog(true);
    };

    const handleCloseLocationDialog = () => {
        setOpenLocationDialog(false);
    };

    const handleSaveLocation = () => {
        // Định dạng địa chỉ chi tiết thành chuỗi
        const newAddressString = formatAddressToString(currentDetailedAddress);
        
        if (profile) {
            // Cập nhật trường userAddress của profile
            setProfile({ ...profile, userAddress: newAddressString });
        }
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
                // RESET QUẬN/HUYỆN khi tỉnh thay đổi
                districtId: null,
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

    // --- KẾT THÚC XỬ LÝ LOCATION DIALOG ---

    // Handle edit/cancel/save
    const handleEdit = () => {
        setTempProfile(profile ? { ...profile } : null);
        setEditMode(true);
    };

    const handleCancel = () => {
        if (tempProfile) {
            setProfile(tempProfile);
            setAvatarPreview(tempProfile.avatarUrl ?? null);
            setCicPreview(tempProfile.citizenIdCardUrl ?? null);
            setCurrentDetailedAddress(parseAddressString(tempProfile.userAddress));
        }
        setAvatarFile(null);
        setCicFile(null);
        setEditMode(false);
    };

    const handleSave = async () => {
        if (!profile) return;
        const form = new FormData();

        form.append("UserFullName", profile.userFullName);
        form.append("UserAddress", profile.userAddress); // Sử dụng userAddress đã được cập nhật từ Location Dialog
        form.append("ContactPhone", profile.contactPhone ?? "");
        if (profile.userBirthday?.trim()) {
            const dateObj = new Date(profile.userBirthday);
            if (!isNaN(dateObj.getTime())) {
                form.append("UserBirthday", dateObj.toISOString());
            }
        }

        if (avatarFile) form.append("Avatar", avatarFile);
        if (cicFile) form.append("CitizenIdCard", cicFile);

        try {
            setSaving(true);
            await UserService.updateProfile(form);

            await refreshUser(); // đồng bộ UserContext

            const refreshed = await UserService.getProfile();
            const normalized = normalizeProfile(refreshed);
            setProfile(normalized);
            setAvatarPreview(normalized.avatarUrl ?? null);
            setCicPreview(normalized.citizenIdCardUrl ?? null);
            setTempProfile(null);
            setEditMode(false);
            
            // Cập nhật lại detailed address sau khi lưu thành công
            setCurrentDetailedAddress(parseAddressString(normalized.userAddress));

            alert("Cập nhật thành công!");
        } catch (err: any) {
            if (err.response?.status === 429) {
                alert("Bạn thao tác quá nhanh, vui lòng thử lại sau vài giây.");
            } else {
                alert("Cập nhật thất bại");
            }
        } finally {
            setSaving(false);
        }
    };

    // UI
    if (loading)
        return <CircularProgress sx={{ display: "block", m: "120px auto" }} size={48} />;

    if (!profile)
        return <Typography textAlign="center">Không tìm thấy hồ sơ.</Typography>;

    return (
        <Box sx={{ width: "100%", p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="h4" fontWeight="700">
                    Thông tin cá nhân
                </Typography>
                <Chip
                    label={profile.profileStatus}
                    color={
                        profile.profileStatus === "Verified"
                            ? "success"
                            : profile.profileStatus === "Pending"
                                ? "info"
                                : profile.profileStatus === "Rejected"
                                    ? "error"
                                    : "warning"
                    }
                />
            </Box>

            <Card sx={{ maxWidth: 1100, mx: "auto" }}>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            gap: 4,
                        }}
                    >
                        {/* LEFT (Avatar và CCCD) */}
                        <Box sx={{ width: { xs: "100%", md: 300 }, textAlign: "center" }}>
                            <Avatar
                                src={avatarPreview ?? undefined}
                                sx={{ width: 160, height: 160, mx: "auto", mb: 2 }}
                            />
                            {editMode && (
                                <Button
                                    component="label"
                                    variant="contained"
                                    fullWidth
                                    startIcon={<PhotoCameraIcon />}
                                >
                                    Đổi ảnh đại diện
                                    <input
                                        hidden
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, "avatar")}
                                    />
                                </Button>
                            )}
                            {cicPreview && (
                                <Box sx={{ mt: 2 }}>
                                    <img
                                        src={cicPreview}
                                        alt="CCCD"
                                        style={{ width: "100%", borderRadius: 8 }}
                                    />
                                </Box>
                            )}
                            {editMode && (
                                <Button
                                    component="label"
                                    variant="outlined"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    startIcon={<UploadFileIcon />}
                                >
                                    Tải CCCD
                                    <input
                                        hidden
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, "cic")}
                                    />
                                </Button>
                            )}
                        </Box>

                        {/* RIGHT (Các trường thông tin) */}
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField
                                label="Họ và tên"
                                value={profile.userFullName || ""}
                                disabled={!editMode}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) =>
                                    setProfile({ ...profile, userFullName: e.target.value })
                                }
                            />
                            <TextField
                                label="Email"
                                value={profile.email}
                                disabled
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Số điện thoại"
                                value={profile.phone}
                                disabled
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Số liên hệ khác"
                                value={profile.contactPhone ?? ""}
                                disabled={!editMode}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) =>
                                    setProfile({ ...profile, contactPhone: e.target.value })
                                }
                            />
                            
                            {/* 🔥 TRƯỜNG ĐỊA CHỈ: Dùng TextField chỉ để hiển thị, click để mở Dialog */}
                            <TextField
                                label="Địa chỉ"
                                value={profile.userAddress}
                                disabled={!editMode}
                                InputLabelProps={{ shrink: true }}
                                onClick={editMode ? handleOpenLocationDialog : undefined}
                                InputProps={{
                                    readOnly: true, // Chỉ cho phép mở dialog, không gõ trực tiếp
                                    endAdornment: editMode && (
                                        <LocationOnIcon 
                                            sx={{ cursor: 'pointer' }} 
                                            onClick={handleOpenLocationDialog}
                                        />
                                    ),
                                }}
                            />
                            
                            <TextField
                                type="date"
                                label="Ngày sinh"
                                value={profile.userBirthday ?? ""}
                                disabled={!editMode}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ max: new Date().toISOString().split("T")[0] }}
                                onChange={(e) =>
                                    setProfile({ ...profile, userBirthday: e.target.value })
                                }
                            />
                        </Box>
                    </Box>

                    {/* Button actions */}
                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        {!editMode ? (
                            <Button variant="contained" onClick={handleEdit}>
                                Chỉnh sửa
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleSave}
                                    disabled={saving}
                                    sx={{ mr: 2 }}
                                >
                                    {saving ? "Đang lưu..." : "Lưu"}
                                </Button>
                                <Button variant="outlined" onClick={handleCancel}>
                                    Hủy
                                </Button>
                            </>
                        )}
                    </Box>
                </CardContent>
            </Card>
            
            {/* 📍 LOCATION DIALOG */}
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
        </Box>
    );
};

export default ProfilePage;