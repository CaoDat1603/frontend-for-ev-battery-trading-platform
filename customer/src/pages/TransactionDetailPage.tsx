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
  CircularProgress,
  CardMedia,
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
import ReportIcon from "@mui/icons-material/Report";
import GavelIcon from "@mui/icons-material/Gavel";

import {
  OrderService,
  type Transaction as OrderTransaction,
} from "../services/orderService";

// 🚨 IMPORT TỪ PRODUCT SERVICE (Giả định như các lần trước)
import { getProductById, type ProductData } from "../services/productService"; 

// --- HELPER FUNCTIONS ---

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

  if (lower.includes("pending") || lower.includes("created") || lower.includes("processing")) {
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

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
};

// 🚨 ĐÃ LOẠI BỎ: isCancelable và handleCancel (vì yêu cầu chuyển sang nút Phàn nàn)

// --- COMPONENT CHÍNH ---

const TransactionDetailPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [transaction, setTransaction] = useState<OrderTransaction | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null); // State mới cho Product
  const [loading, setLoading] = useState<boolean>(true);
  const [productLoading, setProductLoading] = useState<boolean>(true); // Loading cho Product
  const [error, setError] = useState<string | null>(null);
  // 🚨 ĐÃ LOẠI BỎ: state 'cancelling'

  // Load chi tiết giao dịch
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
        console.error("Failed to load transaction detail", err);
        setError(
          err?.message ||
            `Không thể tải chi tiết giao dịch #${idNum} từ máy chủ.`
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDetail();
  }, [transactionId]);
  
  // Load chi tiết sản phẩm sau khi có chi tiết giao dịch
  useEffect(() => {
    if (transaction?.productId) {
      const loadProductDetail = async () => {
        setProductLoading(true);
        try {
          const productData = await getProductById(transaction.productId);
          setProduct(productData);
        } catch (err) {
          console.error("Failed to load product detail", err);
          // Không set error toàn cục, chỉ ảnh hưởng đến Product Card
        } finally {
          setProductLoading(false);
        }
      };
      void loadProductDetail();
    }
  }, [transaction]);

  const handleGoBack = () => {
    navigate("/my-purchases");
  };
  
  const handleViewUserProfile = (userId: number) => {
    // Chuyển sang trang sơ lược người dùng
    navigate(`/view-user/${userId}`); 
  };
  
  const handleViewProductDetail = (productId: number) => {
    // Chuyển sang trang chi tiết sản phẩm/tin đăng
    navigate(`/content/${productId}`);
  };
  
  const handleComplaint = () => {
    if (!transaction) return;
    // Chuyển sang trang gửi phàn nàn (Giả định route)
    navigate(`/create-complaint?againstuserid=${transaction.sellerId}&transactionId=${transaction.transactionId}`);
  };


  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải chi tiết giao dịch...</Typography>
      </Box>
    );
  }

  if (error || !transaction) {
    return (
      <Alert severity="error" sx={{ p: 3, m: 3 }}>
        <Typography sx={{ mb: 1 }}>{error || `Không tìm thấy Transaction ID: ${transactionId}`}</Typography>
        <Button variant="contained" onClick={handleGoBack} startIcon={<ArrowBackIcon />}>
          Quay lại Danh sách Giao dịch
        </Button>
      </Alert>
    );
  }

  const totalPlatform = transaction.platformAmount;
  const totalBuyer = transaction.buyerAmount || transaction.basePrice;
  const totalSeller = transaction.sellerAmount || transaction.basePrice;
  
  // Lấy tên sản phẩm và ảnh
  const productName = productLoading 
    ? "Đang tải tên sản phẩm..." 
    : (product?.title || `Sản phẩm #${transaction.productId}`);
    
  const productImageUrl = productLoading 
    ? "https://via.placeholder.com/150?text=Loading" 
    : (product?.imageUrl || "https://via.placeholder.com/150?text=No+Image");


  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        sx={{ mb: 3 }}
        variant="outlined"
      >
        Quay lại Danh sách Giao dịch
      </Button>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <MonetizationOnIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight="bold">
          Chi Tiết Hóa Đơn: #{transaction.transactionId}
        </Typography>
        {getStatusChip(transaction.transactionStatus)}
      </Stack>
      
      {/* 🚨 PHẦN MỚI: CARD THÔNG TIN SẢN PHẨM */}
      <Card sx={{ mb: 3, boxShadow: 6 }}>
        <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Box sx={{ width: 100, height: 100, flexShrink: 0 }}>
                    {productLoading ? (
                        <CircularProgress size={30} sx={{ m: 3 }} />
                    ) : (
                        <CardMedia
                            component="img"
                            sx={{ width: '100%', height: '100%', objectFit: "cover", borderRadius: '4px' }}
                            image={productImageUrl}
                            alt={productName}
                        />
                    )}
                </Box>
                <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {productName}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Chip label={getProductTypeLabel(transaction.productType)} size="small" icon={<GavelIcon fontSize="small" />} color="info" />
                        <Typography variant="body2" color="text.secondary">
                            Mã SP: **{transaction.productId}**
                        </Typography>
                    </Stack>
                    <Button
                        size="small"
                        variant="text"
                        onClick={() => handleViewProductDetail(transaction.productId)}
                        sx={{ mt: 1 }}
                        disabled={productLoading}
                    >
                        Xem chi tiết sản phẩm
                    </Button>
                </Box>
            </Stack>
        </CardContent>
      </Card>
      {/* ---------------------------------- */}


      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* A. Thông tin giao dịch & Người dùng */}
        <Card sx={{ width: { xs: "100%", md: "65%" } }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" color="text.secondary" sx={{ mb: 2 }}>
                Thông Tin Chi Tiết Giao Dịch
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Tổng quan số tiền */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
              <Paper
                sx={{
                  p: 2,
                  bgcolor: theme.palette.primary.light + "20",
                  flexGrow: 1,
                  minWidth: 150,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Người Mua Thanh Toán
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {formatCurrency(totalBuyer)}
                </Typography>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: theme.palette.success.light + "20",
                  flexGrow: 1,
                  minWidth: 150,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Người Bán Nhận
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
                  minWidth: 150,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Phí Sàn (Platform)
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
                  primary="Loại Sản phẩm"
                  secondary={getProductTypeLabel(transaction.productType)}
                />
                <ListItemText
                  primary="Giá cơ sở"
                  secondary={formatCurrency(transaction.basePrice)}
                />
              </ListItem>

              <Divider component="li" sx={{ my: 1 }} />

              <ListItem disableGutters>

                {/* Người bán */}
                <ListItemIcon>
                  <PersonIcon color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Người Bán (Seller ID)"
                  secondary={
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: theme.palette.info.main,
                      }}
                      onClick={() => handleViewUserProfile(transaction.sellerId)}
                    >
                      {transaction.sellerId} (Click để xem sơ lược)
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
                  primary="Ngày Tạo Giao Dịch"
                  secondary={formatDateTime(transaction.createdAt)}
                />
                <ListItemText
                  primary="Cập Nhật Lần Cuối"
                  secondary={formatDateTime(transaction.updatedAt)}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* B. Action: Phàn nàn về hóa đơn */}
        <Stack spacing={3} sx={{ width: { xs: "100%", md: "35%" } }}>
          <Paper sx={{ p: 3, boxShadow: theme.shadows[3] }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Hành Động & Hỗ Trợ
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="contained"
                color="error"
                startIcon={<ReportIcon />}
                onClick={handleComplaint}
                fullWidth
              >
                Gửi Phàn Nàn về Hóa Đơn
              </Button>
              
              <Divider />
              
              <Button variant="outlined" onClick={handleGoBack} fullWidth>
                Quay lại Danh sách Giao dịch
              </Button>

              <Typography variant="body2" color="text.secondary">
                Nếu bạn phát hiện sai sót hoặc có vấn đề với giao dịch này, vui lòng sử dụng chức năng "Gửi Phàn Nàn" để được hỗ trợ.
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TransactionDetailPage;