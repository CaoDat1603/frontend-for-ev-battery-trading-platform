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
    Alert
} from "@mui/material";
import { UserStatusLabel } from "../utils/userStatus";
import { useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import MapIcon from "@mui/icons-material/Map";
import LockIcon from "@mui/icons-material/Lock";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAdmin } from "../context/AdminContext";
import { UserService } from "../services/userService";

const BASE_URL = "http://localhost:8000";

const ProfilePage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { me: contextUser, setMe, loadingMe } = useAdmin();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" } | null>(null);

    // Load profile từ context
    useEffect(() => {
        if (!contextUser) return;
        setProfile({ ...contextUser });
        setLoading(false);
    }, [contextUser]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        navigate("/login");
    };

    const getStatusChip = (status?: string) => {
        if (!status) return null;

        const text = UserStatusLabel[status] || "Unknown";
        const color: "success" | "error" | "default" =
            status === "Active" ? "success" :
                status === "Banned" ? "error" : "default";

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

            // --- Tạo form data gửi lên backend ---
            const formData = new FormData();
            formData.append("UserFullName", profile.fullName || "");
            formData.append("UserAddress", profile.address || "");
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
                address: refreshed.userAddress ?? "",
                userBirthday: refreshed.userBirthday?.split("T")[0] ?? "",
                role: refreshed.role ?? "Admin",
                avatarUrl: refreshed.avatar
                    ? `${BASE_URL}/identity${refreshed.avatar}`
                    : profile.avatarUrl, // giữ preview nếu backend chưa trả avatar mới
            };

            // --- Cập nhật state profile ---
            setProfile(normalized);

            // --- Cập nhật context Header ---
            setMe?.(normalized);

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
                            {/* Email */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <EmailIcon />
                                <Typography color="text.secondary">Email</Typography>
                                <Typography fontWeight="medium">{profile.email}</Typography>
                            </Stack>

                            {/* Phone */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <PhoneIcon />
                                <Typography color="text.secondary">Phone</Typography>
                                <Typography fontWeight="medium">{profile.phone || "—"}</Typography>
                            </Stack>

                            {/* Address */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <MapIcon />
                                <Typography color="text.secondary">Address</Typography>
                                {editMode ? (
                                    <TextField
                                        size="small"
                                        value={profile.address || ""}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    />
                                ) : (
                                    <Typography fontWeight="medium">{profile.address || "—"}</Typography>
                                )}
                            </Stack>

                            {/* Birthday */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <span>🎂</span>
                                <Typography color="text.secondary">Birthday</Typography>
                                {editMode ? (
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
                                ) : (
                                    <Typography fontWeight="medium">{profile.userBirthday ? new Date(profile.userBirthday).toLocaleDateString("vi-VN") : "—"}</Typography>
                                )}
                            </Stack>

                            {/* Contact Phone */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <PhoneIcon />
                                <Typography color="text.secondary">Contact Phone</Typography>
                                {editMode ? (
                                    <TextField
                                        size="small"
                                        value={profile.contect || ""}
                                        onChange={(e) => setProfile({ ...profile, contect: e.target.value })}
                                    />
                                ) : (
                                    <Typography fontWeight="medium">{profile.contect || "—"}</Typography>
                                )}
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
                                onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
                                disabled={updating}
                            >
                                {editMode ? (updating ? "Saving..." : "Save Changes") : "Edit Personal Info"}
                            </Button>

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
