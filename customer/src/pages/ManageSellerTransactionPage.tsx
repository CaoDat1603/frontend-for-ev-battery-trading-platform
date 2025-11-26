import React, { useState, useEffect, type JSX } from "react";
import {
    Box,
    Typography,
    Paper,
    useTheme,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Button,
    Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// Giả định import từ file service chung
import {
    OrderService,
    type Transaction as OrderTransaction,
} from "../services/orderService";

// --- START: Các hàm tiện ích (Giữ nguyên) ---

// Định dạng số tiền VND
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
    }).format(amount);
};

const getStatusChip = (status: string): JSX.Element => {
    const lower = (status ?? "").toLowerCase();
    let color: "success" | "error" | "warning" | "default" = "default";
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
            size="small"
            color={color === "default" ? undefined : color}
            icon={<Icon sx={{ fontSize: 16 }} />}
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
        case 4:
            return "Bid";
        default:
            return `Type ${type}`;
    }
};

const formatDateOnly = (iso: string | null | undefined): string => {
    if (!iso) return "--";
    // backend thường trả ISO, lấy 10 ký tự đầu yyyy-MM-dd
    return iso.substring(0, 10);
};

// Hàm isCancelable không còn cần thiết vì đã bỏ nút Cancel
/*
const isCancelable = (tx: OrderTransaction): boolean => {
    const lower = (tx.transactionStatus ?? "").toLowerCase();
    // Giả định: Chỉ cho phép người bán hủy khi giao dịch ở trạng thái Pending/Created
    return lower.includes("pending") || lower.includes("created");
};
*/

// --- END: Các hàm tiện ích ---

const ManageSellerTransactionPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState<OrderTransaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // const [cancellingId, setCancellingId] = useState<number | null>(null); // Bỏ state này

    // State filter
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [filterProductType, setFilterProductType] = useState<string>("All");
    const [filterDate, setFilterDate] = useState<string>("");
    // Thay đổi placeholder tìm kiếm phù hợp hơn với vai trò Seller (tìm theo Buyer ID)
    const [searchTerm, setSearchTerm] = useState<string>("");

    /**
     * Tải danh sách giao dịch đã bán của người dùng hiện tại
     */
    const loadTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            // *** ĐIỀU CHỈNH CHỦ YẾU: Sử dụng OrderService.getMySales() ***
            const data = await OrderService.getMySales();
            // sort mới nhất lên đầu
            const sorted = [...data].sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTransactions(sorted);
        } catch (err: any) {
            console.error("Failed to load seller transactions", err);
            setError(
                err?.message || "Không thể tải danh sách giao dịch đã bán từ máy chủ."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTransactions();
    }, []);

    const handleRowClick = (transactionId: number) => {
        // Giả định đường dẫn chi tiết giao dịch cho người bán
        navigate(`/seller-transactions/${transactionId}`);
    };

    /**
     * Bỏ hàm xử lý hủy giao dịch (handleCancelTransaction)
     */
    /*
    const handleCancelTransaction = async (
        e: React.MouseEvent<HTMLButtonElement>,
        id: number
    ) => {
        e.stopPropagation();
        if (!window.confirm(`Xác nhận hủy giao dịch bán hàng #${id}?`)) return;

        setCancellingId(id);
        setError(null);
        try {
            await OrderService.cancelTransaction(id); 
            await loadTransactions();
        } catch (err: any) {
            console.error("Failed to cancel seller transaction", err);
            setError(
                err?.message || `Không thể hủy giao dịch #${id}. Vui lòng thử lại.`
            );
        } finally {
            setCancellingId(null);
        }
    };
    */

    const filteredTransactions = transactions.filter((tx) => {
        const status = (tx.transactionStatus ?? "").toLowerCase();
        const statusFilter =
            filterStatus === "All" ||
            status.includes(filterStatus.toLowerCase()); // "Pending", "Completed", "Cancelled", "Failed"

        const productTypeFilter =
            filterProductType === "All" ||
            tx.productType === Number(filterProductType);

        const dateFilter =
            !filterDate || formatDateOnly(tx.createdAt) === filterDate;

        const term = searchTerm.trim().toLowerCase();
        const searchFilter =
            !term ||
            tx.transactionId.toString().includes(term) ||
            tx.productId.toString().includes(term) ||
            tx.buyerId.toString().includes(term); // Seller ID luôn là User hiện tại nên không cần tìm

        return statusFilter && productTypeFilter && dateFilter && searchFilter;
    });

    return (
        // Áp dụng giới hạn chiều rộng và padding cho bố cục tổng thể
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 'lg', margin: '0 auto' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <MonetizationOnIcon color="primary" fontSize="large" />
                <Typography variant="h5" fontWeight="bold">
                    Seller Transaction Management (Giao dịch đã bán)
                </Typography>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3, borderRadius: "8px", boxShadow: theme.shadows[1] }}>
                {/* Thanh công cụ tìm kiếm và lọc */}
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ mb: 3 }}
                    alignItems="center"
                    flexWrap="wrap"
                >
                    <TextField
                        size="small"
                        placeholder="Search by Txn ID, Product ID, Buyer ID..."
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: "100%", sm: "300px" } }}
                    />

                    {/* Lọc Status (Giữ nguyên) */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value as string)}
                        >
                            <MenuItem value="All">All Statuses</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                            <MenuItem value="Failed">Failed</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Lọc Product Type (Giữ nguyên) */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Product Type</InputLabel>
                        <Select
                            value={filterProductType}
                            label="Product Type"
                            onChange={(e) => setFilterProductType(e.target.value as string)}
                        >
                            <MenuItem value="All">All Types</MenuItem>
                            <MenuItem value="1">Battery</MenuItem>
                            <MenuItem value="2">CarBattery</MenuItem>
                            <MenuItem value="3">ScooterBattery</MenuItem>
                            <MenuItem value="4">Bids</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Lọc theo Ngày tạo (Giữ nguyên) */}
                    <TextField
                        size="small"
                        label="Created Date"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 150 }}
                    />
                </Stack>

                {/* Bảng danh sách giao dịch */}
                {loading ? (
                    <Typography>Đang tải danh sách giao dịch đã bán...</Typography>
                ) : (
                    <TableContainer>
                        <Table size="medium">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Txn ID</TableCell>
                                    <TableCell>Product</TableCell>
                                    <TableCell>Buyer ID</TableCell>
                                    <TableCell>Seller ID</TableCell>
                                    <TableCell align="right">Total (Buyer)</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    {/* <TableCell align="center">Actions</TableCell> <-- Đã loại bỏ */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTransactions.map((tx) => (
                                    <TableRow
                                        key={tx.transactionId}
                                        hover
                                        onClick={() => {
                                            handleRowClick(tx.transactionId);
                                        }}
                                        sx={{ cursor: "pointer" }}
                                    >
                                        <TableCell>{tx.transactionId}</TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {getProductTypeLabel(tx.productType)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Product #{tx.productId}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>{tx.buyerId}</TableCell>
                                        {/* Hiển thị Seller ID (dù luôn là ID của người dùng hiện tại) */}
                                        <TableCell>{tx.sellerId}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                            {formatCurrency(tx.buyerAmount || tx.basePrice)}
                                        </TableCell>
                                        <TableCell>{formatDateOnly(tx.createdAt)}</TableCell>
                                        <TableCell align="center">
                                            {getStatusChip(tx.transactionStatus)}
                                        </TableCell>
                                        {/* Đã loại bỏ cell Actions */}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};

export default ManageSellerTransactionPage;