import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, TextField, Typography, Avatar, Card, CardContent, CircularProgress, Chip, } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { UserService } from "../services/userService";

type ProfileStatus = "Unverified" | "Pending" | "Verified" | "Rejected";

interface UserProfile {
    userId: number;
    userFullName: string;
    email: string;
    phone: string;
    userAddress: string;
    userBirthday: string;
    contactPhone: string;
    avatar: string;
    citizenIdCard: string;
    userStatus: string;
    profileStatus: ProfileStatus;
    rejectionReason: string | null;
}

const ProfilePage: React.FC = () => {
    const BASE_URL = "http://localhost:8000";
    const getFullUrl = (path: string | null) => {
        if (!path) return "";
        return path.startsWith("http") ? path : `${BASE_URL}${path}`;
    };
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editMode, setEditMode] = useState(false);

    const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [cicFile, setCicFile] = useState<File | null>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cicPreview, setCicPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const normalizeProfile = (data: any): UserProfile => ({
        ...data,
        userFullName: data.userFullName ?? "",
        userAddress: data.userAddress ?? "",
        contactPhone: data.contactPhone ?? "",
        userBirthday: data.userBirthday?.split("T")[0] ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        avatar: data.avatar ?? "",
        citizenIdCard: data.citizenIdCard ?? "",
        userStatus: data.userStatus ?? "",
        profileStatus: data.profileStatus ?? "Unverified",
        rejectionReason: data.rejectionReason ?? null,
    });

    // =================== LOAD PROFILE ===================
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await UserService.getProfile();
                const normalized = normalizeProfile(data);
                setProfile(normalized);
                setAvatarPreview(getFullUrl("/identity" + normalized.avatar));
                setCicPreview(getFullUrl("/identity"+normalized.citizenIdCard));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    // =================== FILE CHANGE ===================
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

    // =================== HANDLE EDIT ===================
    const handleEdit = () => {
        setTempProfile(profile ? { ...profile } : null);
        setEditMode(true);
    };

    const handleCancel = () => {
        if (tempProfile) {
            setProfile(tempProfile);
            setAvatarPreview(getFullUrl(tempProfile.avatar));
            setCicPreview(getFullUrl(tempProfile.citizenIdCard));

        }

        setAvatarFile(null);
        setCicFile(null);
        setEditMode(false);
    };

    // =================== SAVE ===================
    const handleSave = async () => {
        if (!profile) return;
        const form = new FormData();

        form.append("UserFullName", profile.userFullName);
        form.append("UserAddress", profile.userAddress);
        form.append("ContactPhone", profile.contactPhone ?? "");
        form.append("UserBirthday", profile.userBirthday);

        if (avatarFile) form.append("Avatar", avatarFile);
        if (cicFile) form.append("CitizenIdCard", cicFile);

        try {
            setSaving(true);
            await UserService.updateProfile(form);
            const refreshed = await UserService.getProfile();
            const normalized = normalizeProfile(refreshed);
            setProfile(normalized);
            setAvatarPreview(getFullUrl(normalized.avatar));
            setCicPreview(getFullUrl(normalized.citizenIdCard));
            setTempProfile(null);
            alert("Cập nhật thành công!");
            setEditMode(false);
        } catch (err: any) {
            console.log("Lỗi BE:", err.response?.data);
            alert("Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    // =================== UI ===================
    if (loading)
        return (
            <CircularProgress sx={{ display: "block", m: "120px auto" }} size={48} />
        );

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
                        {/* LEFT SECTION */}
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

                        {/* RIGHT SECTION */}
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


                            <TextField label="Email" value={profile.email} disabled InputLabelProps={{ shrink: true }} />
                            <TextField label="Số điện thoại" value={profile.phone} disabled InputLabelProps={{ shrink: true }} />

                            <TextField
                                label="Số liên hệ khác"
                                value={profile.contactPhone ?? ""}
                                disabled={!editMode}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) =>
                                    setProfile({ ...profile, contactPhone: e.target.value })
                                }
                            />

                            <TextField
                                label="Địa chỉ"
                                value={profile.userAddress}
                                disabled={!editMode}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) =>
                                    setProfile({ ...profile, userAddress: e.target.value })
                                }
                            />

                            <TextField
                                type="date"
                                label="Ngày sinh"
                                value={profile.userBirthday?.split("T")[0] || ""}
                                disabled={!editMode}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) =>
                                    setProfile({ ...profile, userBirthday: e.target.value })
                                }
                            />
                        </Box>
                    </Box>

                    {/* BUTTONS */}
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
        </Box>
    );
};

export default ProfilePage;
