// src/pages/MyPurchasesPage.tsx

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  Stack,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  OrderService,
  type Transaction as OrderTransaction,
} from "../services/orderService"; 
import { TransactionCard } from "../components/TransactionCard"; 

// --- HELPERS ---
const getProductTypeLabel = (type: number): string => {
  switch (type) {
    case 1:
      return "Pin xe điện";
    case 2:
      return "Ô tô điện";
    case 3:
      return "Xem máy điện điện";
    case 4:
      return "Giao dịch cọc đấu giá";
    default:
      return `Loại ${type}`;
  }
};

const formatDateOnly = (iso: string | null | undefined): string => {
  if (!iso) return "--";
  return iso.substring(0, 10);
};
// ----------------

const MyPurchasesPage: React.FC = () => {
  const theme = useTheme();

  const [transactions, setTransactions] = useState<OrderTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Loại bỏ state [cancellingId]

  // State filter
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterProductType, setFilterProductType] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  /** Tải danh sách giao dịch */
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await OrderService.getMyPurchases();
      // sort mới nhất lên đầu
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(sorted);
    } catch (err: any) {
      console.error("Failed to load purchases", err);
      setError(
        err?.message || "Không thể tải lịch sử mua hàng từ máy chủ. Vui lòng kiểm tra đăng nhập."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, []);

  /** Lọc danh sách giao dịch */
  const filteredTransactions = transactions.filter((tx) => {
    const status = (tx.transactionStatus ?? "").toLowerCase();
    const statusFilter =
      filterStatus === "All" ||
      status.includes(filterStatus.toLowerCase()); 

    const productTypeFilter =
      filterProductType === "All" ||
      tx.productType === Number(filterProductType);

    const dateFilter =
      !filterDate || formatDateOnly(tx.createdAt) === filterDate;

    const term = searchTerm.trim().toLowerCase();
    const searchFilter =
      !term ||
      tx.transactionId.toString().includes(term) ||
      tx.productId.toString().includes(term);

    return statusFilter && productTypeFilter && dateFilter && searchFilter;
  });

  // --- RENDER TRẠNG THÁI LOADING ---
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải lịch sử mua hàng...
        </Typography>
      </Container>
    );
  }

  // --- RENDER TRẠNG THÁI LỖI (Khi không có dữ liệu để hiển thị) ---
  if (error && transactions.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Đã xảy ra lỗi khi tải danh sách: **{error}**
        </Alert>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button onClick={() => void loadTransactions()} variant="contained">Thử tải lại</Button>
        </Box>
      </Container>
    );
  }

  // --- RENDER TRẠNG THÁI RỖNG ---
  if (transactions.length === 0 && !loading && !error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6, textAlign: "center" }}>
        <ShoppingCartIcon
          sx={{ fontSize: 80, color: theme.palette.grey[400] }}
        />
        <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
          Lịch sử mua hàng của bạn đang trống
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bạn chưa thực hiện giao dịch mua hàng nào trên hệ thống.
        </Typography>
      </Container>
    );
  }

  // --- RENDER DỮ LIỆU ---
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Tiêu đề Trang */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <HistoryIcon color="primary" fontSize="large" />
        <Typography variant="h4" fontWeight="bold">
          Lịch sử Mua hàng ({filteredTransactions.length}{" "}
          {filteredTransactions.length !== transactions.length ? `/${transactions.length}` : ""} giao dịch)
        </Typography>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Thanh công cụ tìm kiếm và lọc */}
      <Paper sx={{ p: 3, borderRadius: "8px", boxShadow: theme.shadows[1], mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 0 }}
          alignItems="center"
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Tìm kiếm Txn ID, Product ID..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: "200px" } }}
          />

          {/* Lọc Status */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={filterStatus}
              label="Trạng thái"
              onChange={(e) => setFilterStatus(e.target.value as string)}
            >
              <MenuItem value="All">Tất cả</MenuItem>
              <MenuItem value="Pending">Chờ xử lý</MenuItem>
              <MenuItem value="Completed">Hoàn thành</MenuItem>
              <MenuItem value="Cancelled">Đã hủy</MenuItem>
              <MenuItem value="Failed">Thất bại</MenuItem>
            </Select>
          </FormControl>

          {/* Lọc Product Type */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Loại SP</InputLabel>
            <Select
              value={filterProductType}
              label="Loại SP"
              onChange={(e) => setFilterProductType(e.target.value as string)}
            >
              <MenuItem value="All">Tất cả</MenuItem>
              <MenuItem value="1">{getProductTypeLabel(1)}</MenuItem>
              <MenuItem value="2">{getProductTypeLabel(2)}</MenuItem>
              <MenuItem value="3">{getProductTypeLabel(3)}</MenuItem>
              <MenuItem value="4">{getProductTypeLabel(4)}</MenuItem>
            </Select>
          </FormControl>

          {/* Lọc theo Ngày tạo */}
          <TextField
            size="small"
            label="Ngày tạo"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Stack>
      </Paper>


      {/* Danh sách các TransactionCard */}
      <Stack spacing={2}>
        {filteredTransactions.map((tx) => (
          <TransactionCard
            key={tx.transactionId}
            transaction={tx}
            // Không truyền các props liên quan đến Hủy nữa
          />
        ))}
        {filteredTransactions.length === 0 && !loading && (
             <Alert severity="info">Không tìm thấy giao dịch nào phù hợp với điều kiện lọc.</Alert>
        )}
      </Stack>
    </Container>
  );
};

export default MyPurchasesPage;