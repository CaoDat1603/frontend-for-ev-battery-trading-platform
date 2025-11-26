// src/pages/PaymentResultPage.tsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Button,
  Alert,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { OrderService, type Transaction } from "../services/orderService";
import { PaymentService, type Payment } from "../services/paymentService";

// --- IMPORT TỪ SERVICE FILE (Product Service) ---
import { verifiedTransactionApi } from "../services/productService";
// --- THÊM IMPORT USER SERVICE ---
import { UserService } from "../services/userService"; // Giả định service này tồn tại

interface PaymentContext {
  returnUrl: string;
  actionType: "AUCTION_PAYMENT" | string; // Các loại thanh toán tùy chỉnh
  transactionId: number;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleString("vi-VN");
};

const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // VNPay raw status
  const [vnpResponseCode, setVnpResponseCode] = useState<string | null>(null);
  const [vnpTransactionStatus, setVnpTransactionStatus] =
    useState<string | null>(null);

  // State để tránh gọi API verify/context nhiều lần
  const [hasVerified, setHasVerified] = useState(false);
  const [customReturnUrl, setCustomReturnUrl] = useState<string | null>(null);

  // ✅ THÊM STATE CHO TÊN NGƯỜI DÙNG
  const [sellerName, setSellerName] = useState<string>('Đang tải...');
  const [buyerName, setBuyerName] = useState<string>('Đang tải...');
  const [userLoading, setUserLoading] = useState<boolean>(false);


  // 1. Parse query string lấy transactionId + mã phản hồi VNPAY
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let txIdStr = searchParams.get("transactionId");

    // Fallback logic
    if (!txIdStr) {
      const orderInfo = searchParams.get("vnp_OrderInfo");
      if (orderInfo) {
        const digits = orderInfo.match(/(\d+)/g);
        if (digits && digits.length > 0) {
          txIdStr = digits[digits.length - 1];
        }
      }
    }

    if (!txIdStr) {
      setError("Không tìm thấy mã giao dịch (transactionId) trong URL.");
      setLoading(false);
      setPaymentLoading(false);
      return;
    }

    const parsedId = Number(txIdStr);
    if (!parsedId || Number.isNaN(parsedId)) {
      setError(`Mã giao dịch không hợp lệ: ${txIdStr}.`);
      setLoading(false);
      setPaymentLoading(false);
      return;
    }

    setTransactionId(parsedId);
    setVnpResponseCode(searchParams.get("vnp_ResponseCode"));
    setVnpTransactionStatus(searchParams.get("vnp_TransactionStatus"));
  }, [location.search]);

  // 2. Gọi OrderService lấy chi tiết transaction (Để có productId)
  useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionId) return;
      try {
        setLoading(true);
        setError(null);
        const tx = await OrderService.getTransactionById(transactionId);
        setTransaction(tx);
      } catch (err) {
        console.error("Failed to load transaction detail:", err);
        setError(err instanceof Error ? err.message : "Lỗi tải giao dịch.");
      } finally {
        setLoading(false);
      }
    };
    void loadTransaction();
  }, [transactionId]);

  // ✅ 3. LẤY TÊN NGƯỜI DÙNG DỰA TRÊN transaction (MỚI)
  useEffect(() => {
    if (!transaction) return;

    const fetchUserNames = async () => {
      setUserLoading(true);
      const { sellerId, buyerId } = transaction;

      const fetchName = async (userId: number, isSeller: boolean) => {
        // Nếu ID không hợp lệ, trả về ID mặc định
        if (!userId) {
          return isSeller ? `Seller ID: ${sellerId}` : `Buyer ID: ${buyerId}`;
        }

        try {
          // Giả định UserService.getUserById trả về đối tượng có trường 'fullname'
          const userData = await UserService.getUserById(userId);
          return `${userData.fullname || `ID: ${userId}`}`;
        } catch (error) {
          console.error(`Lỗi khi lấy tên người dùng (ID: ${userId}):`, error);
          return `ID: ${userId} (Lỗi tải tên)`;
        }
      };

      const [seller, buyer] = await Promise.all([
        fetchName(sellerId, true),
        fetchName(buyerId, false),
      ]);

      setSellerName(seller);
      setBuyerName(buyer);
      setUserLoading(false);
    };

    void fetchUserNames();
  }, [transaction]);

  // 4. Gọi PaymentService để lấy lịch sử thanh toán
  useEffect(() => {
    const loadPayments = async () => {
      if (!transactionId) return;
      try {
        setPaymentLoading(true);
        const list = await PaymentService.getPaymentsByTransaction(
          transactionId
        );
        setPayments(list);
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setPaymentLoading(false);
      }
    };
    void loadPayments();
  }, [transactionId]);

  // 5. Tính trạng thái hiển thị tổng quan
  const isVnpSuccess =
    vnpResponseCode === "00" &&
    (!vnpTransactionStatus || vnpTransactionStatus === "00");

  const transactionStatusLabel = transaction?.transactionStatus ?? "Unknown";

  const overallSuccess =
    isVnpSuccess ||
    (transactionStatusLabel.toLowerCase() === "processing" ||
      transactionStatusLabel.toLowerCase() === "completed");

  // 6. Gọi verifiedTransactionApi để cập nhật trạng thái Product
  useEffect(() => {
    const verifyProductTransaction = async () => {
      // Chỉ gọi khi: Thành công VNPAY và chưa gọi lần nào
      if (
        transaction &&
        transactionId &&
        vnpResponseCode === "00" &&
        !hasVerified
      ) {
        try {
          setHasVerified(true); // Đánh dấu là đang/đã xử lý
          console.log(
            `Verifying product #${transaction.productId} for transaction #${transactionId}...`
          );

          await verifiedTransactionApi(transaction.productId, transactionId);

          console.log("Product verify transaction successfully.");
        } catch (err) {
          console.error("Failed to verify product transaction:", err);
        }
      }
    };

    verifyProductTransaction();
  }, [transaction, transactionId, vnpResponseCode, hasVerified]);

  // 7. Xử lý Context Quay lại cho đấu giá
  useEffect(() => {
    // Chỉ xử lý khi giao dịch được coi là thành công và đã có ID
    if (overallSuccess && transactionId) {
      const contextStr = sessionStorage.getItem("payment_context");

      if (contextStr) {
        try {
          const context: PaymentContext = JSON.parse(contextStr);

          // 1. Kiểm tra phải là loại AUCTION_PAYMENT VÀ transactionId phải khớp
          if (
            context.actionType === "AUCTION_PAYMENT" &&
            context.transactionId === transactionId
          ) {
            let finalUrl = context.returnUrl;

            // 2. Thêm transactionId vào query string (để trang đích biết mà xử lý)
            if (!finalUrl.includes("transactionId")) {
              const separator = finalUrl.includes("?") ? "&" : "?";
              finalUrl += `${separator}transactionId=${transactionId}`;
            }

            setCustomReturnUrl(finalUrl);

            // 3. Xóa context sau khi sử dụng thành công
            sessionStorage.removeItem("payment_context");
            console.log(
              "Custom payment context for AUCTION_PAYMENT loaded and removed."
            );
          }
        } catch (e) {
          console.error("Error parsing payment context:", e);
          sessionStorage.removeItem("payment_context"); // Xóa context lỗi
        }
      }
    }
  }, [overallSuccess, transactionId]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <ReceiptLongIcon color="primary" sx={{ fontSize: "2rem" }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Kết quả thanh toán
          </Typography>
          {transactionId && (
            <Typography variant="body2" color="text.secondary">
              Mã giao dịch: #{transactionId}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Thông điệp chính: thành công / thất bại */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {overallSuccess ? (
            <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
          ) : (
            <ErrorIcon color="error" sx={{ fontSize: 32 }} />
          )}

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {overallSuccess
                ? "Thanh toán đã được ghi nhận."
                : "Thanh toán không thành công hoặc đang chờ xử lý."}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {vnpResponseCode && (
                <>
                  Mã phản hồi VNPay: <b>{vnpResponseCode}</b>
                  {vnpTransactionStatus && (
                    <> – Trạng thái: <b>{vnpTransactionStatus}</b></>
                  )}
                </>
              )}
              {!vnpResponseCode &&
                "Hệ thống đang kiểm tra trạng thái thanh toán từ VNPay."}
            </Typography>
        </Box>
        </Stack>

        <Chip
          label={transactionStatusLabel}
          color={
            transactionStatusLabel.toLowerCase() === "completed"
              ? "success"
              : transactionStatusLabel.toLowerCase() === "pending"
              ? "warning"
              : transactionStatusLabel.toLowerCase() === "processing"
              ? "info"
              : "default"
          }
          variant="outlined"
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems="flex-start"
      >
        {/* --- Chi tiết giao dịch --- */}
        <Paper sx={{ flex: 2, p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Chi tiết giao dịch
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : transaction ? (
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Transaction ID
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  #{transaction.transactionId}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Sản phẩm
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  #{transaction.productId} (Type: {transaction.productType})
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Người bán / Người mua
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {userLoading ? 'Đang tải tên...' : `${sellerName} / ${buyerName}`}
                </Typography>
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Giá gốc
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(transaction.basePrice)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Người mua trả
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(transaction.buyerAmount)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Người bán nhận
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(transaction.sellerAmount)}
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2">
              Không tìm thấy thông tin giao dịch.
            </Typography>
          )}
        </Paper>

        {/* --- Lịch sử thanh toán --- */}
        <Paper sx={{ flex: 1.4, p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Lịch sử thanh toán
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {paymentLoading ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : payments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Chưa có bản ghi thanh toán nào cho giao dịch này.
            </Typography>
          ) : (
            <List dense disablePadding>
              {payments.map((p) => (
                <ListItem
                  key={p.paymentId}
                  sx={{ px: 0, py: 1.25 }}
                  divider
                >
                  <ListItemText
                    primary={
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2" fontWeight="bold">
                          Payment #{p.paymentId}
                        </Typography>
                        <Chip
                          size="small"
                          label={p.status}
                          color={
                            p.status.toLowerCase() === "success"
                              ? "success"
                              : p.status.toLowerCase() === "pending"
                              ? "warning"
                              : "default"
                          }
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">
                          Số tiền: {formatCurrency(p.amount)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Ref: {p.referenceCode || "-"} –{" "}
                          {formatDateTime(p.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Stack>

      {/* Nút điều hướng dưới cùng */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mt: 3 }}
      >
        {/* Nút ưu tiên: Nút quay về theo ngữ cảnh (Đấu giá) */}
        {customReturnUrl ? (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(customReturnUrl)}
          >
            Quay lại trang Đấu giá (Mã: #{transactionId})
          </Button>
        ) : (
          /* Nút mặc định: Về trang chủ */
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        )}

        <Button
          variant="contained"
          onClick={() => navigate("/profile/purchases")}
        >
          Xem danh sách giao dịch đã mua
        </Button>
      </Stack>
    </Box>
  );
};

export default PaymentResultPage;