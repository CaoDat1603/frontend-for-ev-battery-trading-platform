import React, { useState, useEffect, type JSX } from "react";
import {
    Box,
    Typography,
    Paper,
    useTheme,
    Stack,
    Divider,
    Chip,
    Button,
    Alert,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";

// Icons
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import {
    OrderService,
    type Transaction as OrderTransaction,
} from "../services/orderService";

// --- START: Hàm tiện ích (Giữ nguyên) ---

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
    }).format(amount);
};

const getStatusChip = (status: string): JSX.Element => {
    const lower = (status ?? "").toLowerCase();
    let color: "success" | "error" | "warning" | "info" = "info";
    let Icon: typeof AccessTimeIcon | typeof CheckCircleOutlineIcon | typeof ErrorOutlineIcon =
        AccessTimeIcon;

    if (lower.includes("pending") || lower.includes("created")) {
        color = "warning";
        Icon = AccessTimeIcon;
    } else if (
        lower.includes("success") ||
        lower.includes("completed") ||
        lower.includes("paid")
    ) {
        color = "success";
        Icon = CheckCircleOutlineIcon;
    } else if (
        lower.includes("cancel") ||
        lower.includes("fail") ||
        lower.includes("reject")
    ) {
        color = "error";
        Icon = ErrorOutlineIcon;
    }

    return (
        <Chip
            label={status}
            size="medium"
            color={color === "info" ? undefined : color}
            icon={<Icon sx={{ fontSize: 18 }} />}
            variant="outlined"
        />
    );
};

const getProductTypeLabel = (type: number): string => {
    switch (type) {
        case 0:
            return "EV";
        case 1:
            return "Battery";
        case 2:
            return "CarBattery";
        case 3:
            return "ScooterBattery";
        default:
            return `Type ${type}`;
    }
};

const formatDateTime = (iso: string | null | undefined): string => {
    if (!iso) return "--";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
};

// --- END: Hàm tiện ích ---

const SellerTransactionDetailPage: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();

    const [transaction, setTransaction] = useState<OrderTransaction | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const idNum = Number(transactionId);
        if (Number.isNaN(idNum)) {
            setError("Transaction ID không hợp lệ.");
            setLoading(false);
            return;
        }

        const loadDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await OrderService.getTransactionById(idNum);
                setTransaction(data);
            } catch (err: any) {
                console.error("Failed to load seller transaction detail", err);
                setError(
                    err?.message ||
                    `Không thể tải chi tiết giao dịch bán hàng #${idNum} từ máy chủ.`
                );
            } finally {
                setLoading(false);
            }
        };

        void loadDetail();
    }, [transactionId]);

    const handleGoBack = () => {
        navigate("/my-transactions");
    };

    if (loading) {
        // Đảm bảo loading/error cũng được căn giữa và có padding
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 'lg', margin: '0 auto' }}>
                <Typography>Đang tải chi tiết giao dịch bán hàng...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 'lg', margin: '0 auto' }}>
                <Alert severity="error">
                    <Typography sx={{ mb: 1 }}>{error}</Typography>
                    <Button 
                        variant="contained" 
                        onClick={handleGoBack} 
                        startIcon={<ArrowBackIcon />}
                    >
                        Quay lại Danh sách Giao dịch đã bán
                    </Button>
                </Alert>
            </Box>
        );
    }

    if (!transaction) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 'lg', margin: '0 auto' }}>
                <Alert severity="error">
                    <Typography>
                        Không tìm thấy Transaction ID: <strong>{transactionId}</strong>.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleGoBack}
                        sx={{ mt: 2 }}
                        startIcon={<ArrowBackIcon />}
                    >
                        Quay lại Danh sách Giao dịch đã bán
                    </Button>
                </Alert>
            </Box>
        );
    }

    const totalPlatform = transaction.platformAmount;
    const totalBuyer = transaction.buyerAmount || transaction.basePrice;
    const totalSeller = transaction.sellerAmount || transaction.basePrice;

    return (
        // Bọc toàn bộ nội dung trong Box có giới hạn chiều rộng và căn giữa
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 'lg', margin: '0 auto' }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                sx={{ mb: 3 }}
                variant="outlined"
            >
                Quay lại Danh sách Giao dịch đã bán
            </Button>

            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <MonetizationOnIcon color="primary" fontSize="large" />
                <Typography variant="h5" fontWeight="bold">
                    Chi Tiết Giao Dịch Đã Bán: #{transaction.transactionId}
                </Typography>
            </Stack>

            <Stack direction="column" spacing={3}>
                <Card sx={{ width: "100%" }}>
                    <CardContent>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 2 }}
                        >
                            <Typography variant="h6" fontWeight="bold" color="text.secondary">
                                Thông Tin Cơ Bản
                            </Typography>
                            {getStatusChip(transaction.transactionStatus)}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {/* Tổng quan số tiền */}
                        <Stack direction="row" spacing={3} sx={{ mb: 3 }} flexWrap="wrap">
                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: theme.palette.primary.light + "20",
                                    flexGrow: 1,
                                    minWidth: 200,
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    Buyer Pays (Total)
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color="primary">
                                    {formatCurrency(totalBuyer)}
                                </Typography>
                            </Paper>

                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: theme.palette.success.light + "20",
                                    flexGrow: 1,
                                    minWidth: 200,
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    Seller Receives (Your Amount)
                                </Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                    {formatCurrency(totalSeller)}
                                </Typography>
                            </Paper>

                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: theme.palette.grey[100],
                                    flexGrow: 1,
                                    minWidth: 200,
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    Platform Revenue
                                </Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    {formatCurrency(totalPlatform)}
                                </Typography>
                            </Paper>
                        </Stack>

                        {/* Info list */}
                        <List disablePadding dense>
                            <Divider component="li" sx={{ my: 1 }} />

                            <ListItem disableGutters>
                                <ListItemIcon>
                                    <AssignmentIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Product"
                                    secondary={
                                        <>
                                            <Typography
                                                component="span"
                                                sx={{ fontWeight: "bold", mr: 1 }}
                                            >
                                                {getProductTypeLabel(transaction.productType)}
                                            </Typography>
                                            <Button
                                                size="small"
                                                onClick={() =>
                                                    navigate(`/detail-post-manage/${transaction.productId}`)
                                                }
                                            >
                                                View Product #{transaction.productId}
                                            </Button>
                                        </>
                                    }
                                />
                            </ListItem>

                            <ListItem disableGutters>
                                <ListItemIcon>
                                    <PersonIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Buyer ID"
                                    secondary={
                                        <Typography
                                            component="span"
                                            sx={{
                                                fontWeight: "bold",
                                                cursor: "pointer",
                                                color: theme.palette.info.main,
                                            }}
                                            onClick={() => navigate(`/view-user/${transaction.buyerId}`)}
                                        >
                                            {transaction.buyerId}
                                        </Typography>
                                    }
                                />
                            </ListItem>

                            <ListItem disableGutters>
                                <ListItemIcon>
                                    <PersonIcon color="secondary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Seller ID (You)"
                                    secondary={
                                        <Typography
                                            component="span"
                                            sx={{
                                                fontWeight: "bold",
                                                cursor: "pointer",
                                                color: theme.palette.info.main,
                                            }}
                                            onClick={() => navigate(`/account/profile`)}
                                        >
                                            {transaction.sellerId}
                                        </Typography>
                                    }
                                />
                            </ListItem>

                            <Divider component="li" sx={{ my: 1 }} />

                            <ListItem disableGutters>
                                <ListItemIcon>
                                    <AccountBalanceWalletIcon color="action" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Base Price"
                                    secondary={formatCurrency(transaction.basePrice)}
                                />
                                <ListItemText
                                    primary="Created At"
                                    secondary={formatDateTime(transaction.createdAt)}
                                />
                            </ListItem>

                            <ListItem disableGutters>
                                <ListItemText
                                    primary="Updated At"
                                    secondary={formatDateTime(transaction.updatedAt)}
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
};

export default SellerTransactionDetailPage;