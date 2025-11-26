// src/pages/InvoiceDetailPage.tsx

import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Button,
  Alert,
  useTheme,
  CircularProgress,
} from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  OrderService,
  type FeeSettings as ApiFeeSettings,
} from "../services/orderService";
import { PaymentService } from "../services/paymentService";
import { UserService } from '../services/userService';

interface InvoiceLocationState {
  productId: number;
  title: string;
  productName: string;
  price: number;
  sellerId: number;
  productType: number;
  returnUrl?: string;
  isCompleted?: boolean;
}

// Lấy userId: ưu tiên localStorage('userId'), fallback decode từ accessToken (JWT)
const getCurrentUserId = (): number => {
  const stored = localStorage.getItem("userId");
  const parsed = stored ? parseInt(stored, 10) : NaN;
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;

  const token = localStorage.getItem("accessToken");
  if (!token) return 0;

  try {
    const [, payloadBase64] = token.split(".");
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    const payload = JSON.parse(json);

    const rawId =
      payload["nameid"] ||
      payload["sub"] ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    const id = rawId ? parseInt(rawId, 10) : NaN;
    return !Number.isNaN(id) && id > 0 ? id : 0;
  } catch (e) {
    console.error("Cannot parse JWT to get user id", e);
    return 0;
  }
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);

const InvoiceDetailPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const location = useLocation();
  
  // Ép kiểu state nhận được từ navigate
  const state = location.state as InvoiceLocationState | undefined;

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fee settings từ backend
  const [feeSettings, setFeeSettings] = useState<ApiFeeSettings | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  const [sellerName, setSellerName] = useState<string>('Đang tải...'); 
  const [sellerLoading, setSellerLoading] = useState<boolean>(false);

  const product = useMemo(() => {
    if (state) return state;
    if (!postId) return null;
    // TODO: fallback fetch product by id nếu cần
    return null;
  }, [state, postId]);

  // Lấy cấu hình phí active cho loại sản phẩm
  useEffect(() => {
    const fetchFeeSettings = async () => {
      if (!product) return;
      try {
        setFeeLoading(true);
        setFeeError(null);
        const settings = await OrderService.getActiveFeeSettings(
          product.productType + 1
        );
        setFeeSettings(settings);
      } catch (err) {
        console.error("Failed to load fee settings:", err);
        setFeeError(
          err instanceof Error
            ? err.message
            : "Không thể tải cấu hình phí cho loại sản phẩm này."
        );
      } finally {
        setFeeLoading(false);
      }
    };

    void fetchFeeSettings();
  }, [product]);

  useEffect(() => {
    // Chỉ chạy khi product đã được xác định và có sellerId hợp lệ
    if (product && product.sellerId) {
        setSellerLoading(true);
        const fetchSellerName = async (sellerId: number) => {
            try {
                // Giả định UserService.getUserById trả về đối tượng có trường 'fullname'
                const userData = await UserService.getUserById(sellerId);
                const name = `${userData.fullname || ''}`.trim();
                
                // Nếu tên trống, hiển thị ID
                setSellerName(name || `ID Người bán: ${sellerId}`); 
            } catch (error) {
                console.error(`Lỗi khi lấy tên người bán (ID: ${sellerId}):`, error);
                setSellerName(`ID Người bán: ${sellerId} (Lỗi tải tên)`); // Hiển thị ID và thông báo lỗi nhỏ
            } finally {
                setSellerLoading(false);
            }
        };
        
        void fetchSellerName(product.sellerId);
    } else if (product) {
         // Trường hợp product đã load nhưng không có sellerId (ID = 0 hoặc null)
         setSellerName('Người bán không xác định'); 
         setSellerLoading(false);
    }
  }, [product?.sellerId]);

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Không tìm thấy thông tin hóa đơn. Vui lòng quay lại trang sản phẩm và
          thử lại.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  const basePrice = product.price;

  // Tính toán phí giống backend TransactionService
  const feePercent = feeSettings?.feePercent ?? 0;
  const commissionPercent = feeSettings?.commissionPercent ?? 0;

  const serviceFeeAmount = (basePrice * feePercent) / 100;
  const commissionFeeAmount = (basePrice * commissionPercent) / 100;
  const platformFeeAmount = serviceFeeAmount + commissionFeeAmount;
  const buyerAmount = basePrice + serviceFeeAmount;
  const sellerAmount = basePrice - commissionFeeAmount;

  const handleCreatePayment = async () => {
    setError(null);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Bạn cần đăng nhập trước khi tiếp tục thanh toán.");
      return;
    }

    const buyerId = getCurrentUserId();

    try {
      setCreating(true);

      // 1. Tạo giao dịch (OrderService)
      const transactionId = await OrderService.createTransaction(
        product.productId,
        product.sellerId,
        buyerId,
        product.productType + 1,
        product.price
      );
      console.log(`Đã tạo giao dịch thành công. ID: ${transactionId}`);

      // 2. Tạo URL thanh toán VNPay (PaymentService)
      const paymentUrl = await PaymentService.createPaymentUrl(transactionId);

      // ==================================================================
      // 3. [MỚI] LƯU NGỮ CẢNH TRƯỚC KHI CHUYỂN HƯỚNG (Cho ProductType 4)
      // ==================================================================
      
      // Giả sử ProductType 3 là Đấu giá (Deposit hoặc Fee)
      if (product.productType === 3 || state?.isCompleted) {
        let returnUrl = "/";
        
        // Logic bạn yêu cầu:
        if (state?.returnUrl) {
             returnUrl = state.returnUrl;
        } else {
             // Fallback: Cố gắng lấy từ location.state cũ hoặc về trang chủ
             returnUrl = (location.state as any)?.from || "/";
        }

        const paymentContext = {
            returnUrl: returnUrl,
            actionType: "AUCTION_PAYMENT", // Đánh dấu để PaymentResultPage biết
            transactionId: transactionId
        };

        // Lưu vào Session Storage
        sessionStorage.setItem("payment_context", JSON.stringify(paymentContext));
      } 
      
      // ==================================================================

      // 4. Chuyển hướng sang cổng thanh toán
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Error while creating payment transaction:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tạo thanh toán. Vui lòng thử lại sau.";
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <ShoppingCartIcon color="primary" sx={{ fontSize: "2rem" }} />
        <Typography variant="h5" fontWeight="bold">
          Chi tiết hóa đơn
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {feeError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {feeError} – hệ thống sẽ vẫn dùng cấu hình phí hiện hành khi tạo
          giao dịch.
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* A. Thông tin sản phẩm & người bán */}
        <Paper
          sx={{
            flex: 2,
            p: 3,
            borderRadius: 2,
            boxShadow: theme.shadows[1],
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Thông tin sản phẩm
          </Typography>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            {product.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {product.productName}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <PersonIcon color="primary" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Người bán
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {/* SỬ DỤNG sellerName ĐÃ FETCH */}
                    {sellerName} 
                  </Typography>
                  {/* HIỂN THỊ ICON LOADING NHỎ NẾU CẦN */}
                  {sellerLoading && <CircularProgress size={12} color="inherit" />}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <MonetizationOnIcon color="secondary" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Giá gốc
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {formatCurrency(basePrice)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* B. Tóm tắt thanh toán */}
        <Paper
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 2,
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Tóm tắt thanh toán
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {feeLoading && (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{ mb: 2 }}
              spacing={1}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Đang tải cấu hình phí...
              </Typography>
            </Stack>
          )}

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Số tiền gốc
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(basePrice)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Phí dịch vụ ({feePercent.toFixed(2)}%)
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(serviceFeeAmount)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Phí hoa hồng ({commissionPercent.toFixed(2)}%)
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(commissionFeeAmount)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Phí nền tảng (tổng)
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(platformFeeAmount)}
              </Typography>
            </Stack>

            <Divider />

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Người mua trả
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {formatCurrency(buyerAmount)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Người bán nhận
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                {formatCurrency(sellerAmount)}
              </Typography>
            </Stack>
          </Stack>

          <Alert severity="info" sx={{ mb: 2 }}>
            Các khoản phí trên được tính theo cấu hình phí hiện hành cho loại
            sản phẩm này.
          </Alert>

          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            onClick={handleCreatePayment}
            disabled={creating}
          >
            {creating
              ? "Đang tạo thanh toán..."
              : "Tạo thanh toán và chuyển tới VNPay"}
          </Button>

          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Quay lại trang sản phẩm
          </Button>
        </Paper>
      </Stack>
    </Box>
  );
};

export default InvoiceDetailPage;