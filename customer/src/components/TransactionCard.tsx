// src/components/TransactionCard.tsx

import React, { useState, useEffect, type JSX } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// ICONS
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GavelIcon from "@mui/icons-material/Gavel";
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
//import StarIcon from "@mui/icons-material/Star";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"; // Icon mới cho tiền cọc

import { type Transaction as OrderTransaction } from "../services/orderService"; 
import { getProductById, type ProductData } from "../services/productService"; 


// --- INTERFACE PROPS GIỮ NGUYÊN ---
interface TransactionCardProps {
  transaction: OrderTransaction;
}
// ----------------------------------


// Định dạng số tiền VND
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
};

// ... (Hàm getStatusChip giữ nguyên)
const getStatusChip = (status: string): JSX.Element => {
    const lower = (status ?? "").toLowerCase();
    let color: "success" | "error" | "warning" | "default" | "info" = "default";
    let Icon:
        | typeof AccessTimeIcon
        | typeof CheckCircleOutlineIcon
        | typeof ErrorOutlineIcon = AccessTimeIcon;

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
    } else if (lower.includes("shipping") || lower.includes("processing")) {
        color = "info";
        Icon = AssignmentIcon;
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

// Cập nhật chip cho loại giao dịch
const getTransactionTypeChip = (type: number): JSX.Element => {
  if (type === 4) { // Giao dịch Cọc Đấu giá
    return <Chip label="Cọc Đấu giá" color="error" size="small" icon={<GavelIcon sx={{ fontSize: 16 }} />} />;
  }
  return <Chip label="Mua cố định" color="primary" size="small" icon={<AssignmentIcon sx={{ fontSize: 16 }} />} />;
};

const formatDateOnly = (iso: string | null | undefined): string => {
  if (!iso) return "--";
  return iso.substring(0, 10);
};


export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Kiểm tra xem có phải là giao dịch cọc đấu giá không
  const isAuctionDeposit = transaction.productType === 4;

  const [productDetails, setProductDetails] = useState<ProductData | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // --- FETCH THÔNG TIN SẢN PHẨM ---
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoadingProduct(true);
      setProductError(null);
      try {
        const data = await getProductById(transaction.productId);
        setProductDetails(data);
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        setProductError("Không tìm thấy thông tin sản phẩm.");
        setProductDetails(null); 
      } finally {
        setLoadingProduct(false);
      }
    };

    void fetchProductDetails();
  }, [transaction.productId]);


  // HÀM XỬ LÝ CHUYỂN HƯỚNG
  const handleNavigateToDetail = () => {
    navigate(`/transactions/${transaction.transactionId}`);
  };
  
  const handleNavigateToSellerProfile = (sellerId: number) => {
    navigate(`/view-user/${sellerId}`); 
  };
  
  const handleNavigateToReviews = (productId: number) => {
    navigate(`/view-rates?productId=${productId}`); 
  };
  
  const handleNavigateToPost = (productId: number) => {
    navigate(`/content/${productId}`); 
  };

  const currentTitle = loadingProduct 
    ? (isAuctionDeposit ? 'Đang tải tên sản phẩm đấu giá...' : 'Đang tải tên sản phẩm...')
    : (productDetails?.title || `Product ID: ${transaction.productId}`);
    
  // Điều chỉnh tiêu đề hiển thị nếu là cọc đấu giá
  const displayTitle = isAuctionDeposit 
    ? `Cọc Đấu Giá cho: ${currentTitle}` 
    : currentTitle;
    
  const imageUrl = productDetails?.imageUrl || "https://via.placeholder.com/150?text=No+Image";


  return (
    <Card
      sx={{
        display: "flex",
        mb: 2,
        boxShadow: 3,
        borderRadius: "8px",
        width: "100%",
        cursor: "pointer",
        "&:hover": {
          boxShadow: 6,
        },
        // Highlight màu nhẹ cho giao dịch cọc
        borderLeft: isAuctionDeposit ? `5px solid ${theme.palette.error.main}` : 'none'
      }}
    >
      {/* Box bọc phần nội dung có thể click (Ảnh và Chi tiết) */}
      <Box
        sx={{ display: "flex", flexGrow: 1 }}
        onClick={handleNavigateToDetail}
      >
        {/* Ảnh sản phẩm (Left) */}
        <Box
            sx={{ width: 150, height: 150, minWidth: 150, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            {loadingProduct ? (
                <CircularProgress size={30} sx={{ m: 5 }} />
            ) : (
                <CardMedia
                    component="img"
                    sx={{ width: '100%', height: '100%', objectFit: "cover" }}
                    image={imageUrl}
                    alt={displayTitle}
                />
            )}
        </Box>

        {/* Nội dung chi tiết (Middle) */}
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <CardContent sx={{ flex: "1 0 auto", pb: 1, pr: 1 }}>
            {/* Header: Tên sản phẩm & Txn ID */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Typography
                component="div"
                variant="h6"
                fontWeight="bold"
                color={isAuctionDeposit ? theme.palette.error.main : theme.palette.primary.main}
                sx={{
                  flexGrow: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  pr: 1,
                }}
              >
                {/* Tên sản phẩm đã được điều chỉnh */}
                {displayTitle}
              </Typography>
              <Chip
                label={`Txn #${transaction.transactionId}`}
                size="small"
                variant="outlined"
                color="info"
              />
            </Box>

            {/* Chi tiết giao dịch */}
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" color="text.secondary">
                <span style={{ fontWeight: "bold" }}>
                    {isAuctionDeposit ? "Giá khởi điểm/Giá cơ sở:" : "Giá cơ sở:"}
                </span>{" "}
                {formatCurrency(transaction.basePrice)}
              </Typography>
              <Typography variant="subtitle1">
                <span style={{ fontWeight: "bold", color: isAuctionDeposit ? theme.palette.error.main : theme.palette.success.main }}>
                    {isAuctionDeposit ? "TIỀN CỌC ĐÃ THANH TOÁN:" : "Tổng thanh toán:"}
                </span>{" "}
                <span style={{ color: isAuctionDeposit ? theme.palette.error.dark : theme.palette.error.main }}>
                  {formatCurrency(transaction.buyerAmount || transaction.basePrice)}
                </span>
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {getTransactionTypeChip(transaction.productType)}
                {/* ID Người bán có thể click */}
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        handleNavigateToSellerProfile(transaction.sellerId);
                    }}
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: 'primary.main' } }}
                >
                  Người bán ID: **{transaction.sellerId}**
                </Typography>
                <Chip 
                    label={`Bài Đăng #${transaction.productId}`} 
                    size="small" 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToPost(transaction.productId);
                    }}
                    sx={{ cursor: 'pointer' }}
                />
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Ngày tạo: {formatDateOnly(transaction.createdAt)}
                </Typography>
                {getStatusChip(transaction.transactionStatus)}
                {productError && <Chip label="Lỗi tải SP" color="error" size="small" />}
              </Stack>
            </Stack>
          </CardContent>
        </Box>
      </Box>

      {/* Hành động (Right) */}
      <Box
        sx={{
          p: 1,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: "center",
          gap: 1,
          width: 140
        }}
      >
    {!isAuctionDeposit && (
        <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AttachMoneyIcon />}
            onClick={() => handleNavigateToReviews(transaction.productId)}
            fullWidth
            disabled={loadingProduct || productError !== null}
            >
            Xem Đánh Giá
            </Button>
        )}
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<AccountCircleIcon />}
          onClick={() => handleNavigateToSellerProfile(transaction.sellerId)}
          fullWidth
        >
          Xem Người bán
        </Button>
      </Box>
    </Card>
  );
};