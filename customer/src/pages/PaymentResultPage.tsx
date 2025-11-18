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
import {
  PaymentService,
  type Payment,
} from "../services/paymentService";

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

  // VNPay raw status (nếu có)
  const [vnpResponseCode, setVnpResponseCode] = useState<string | null>(null);
  const [vnpTransactionStatus, setVnpTransactionStatus] =
    useState<string | null>(null);

  // 1. Parse query string lấy transactionId + mã phản hồi VNPAY
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    let txIdStr = searchParams.get("transactionId");

    // Fallback: nếu bạn encode transactionId vào vnp_OrderInfo dạng "...#123"
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
      setError(
        "Không tìm thấy mã giao dịch (transactionId) trong URL. Vui lòng kiểm tra cấu hình vnp_ReturnUrl."
      );
      setLoading(false);
      setPaymentLoading(false);
      return;
    }

    const parsedId = Number(txIdStr);
    if (!parsedId || Number.isNaN(parsedId)) {
      setError(
        `Mã giao dịch không hợp lệ: ${txIdStr}.`
      );
      setLoading(false);
      setPaymentLoading(false);
      return;
    }

    setTransactionId(parsedId);
    setVnpResponseCode(searchParams.get("vnp_ResponseCode"));
    setVnpTransactionStatus(searchParams.get("vnp_TransactionStatus"));
  }, [location.search]);

  // 2. Gọi OrderService lấy chi tiết transaction
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
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải chi tiết giao dịch từ máy chủ.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    void loadTransaction();
  }, [transactionId]);

  // 3. Gọi PaymentService để lấy lịch sử thanh toán cho giao dịch
  useEffect(() => {
    const loadPayments = async () => {
      if (!transactionId) return;

      try {
        setPaymentLoading(true);
        const list = await PaymentService.getPaymentsByTransaction(transactionId);
        setPayments(list);
      } catch (err) {
        console.error("Failed to load payments:", err);
        // Không cần setError chung – chỉ show trong phần lịch sử thanh toán
      } finally {
        setPaymentLoading(false);
      }
    };

    void loadPayments();
  }, [transactionId]);

  // 4. Tính trạng thái hiển thị tổng quan
  const isVnpSuccess =
    vnpResponseCode === "00" &&
    (!vnpTransactionStatus || vnpTransactionStatus === "00");

  const transactionStatusLabel = transaction?.transactionStatus ?? "Unknown";

  const overallSuccess =
    isVnpSuccess ||
    (transactionStatusLabel.toLowerCase() === "processing" ||
      transactionStatusLabel.toLowerCase() === "completed");

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
            <Box
              sx={{
                py: 3,
                display: "flex",
                justifyContent: "center",
              }}
            >
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
                  Seller #{transaction.sellerId} / Buyer #{transaction.buyerId}
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

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Phí nền tảng (commission + service)
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(transaction.platformAmount)}
                </Typography>
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Thời gian tạo
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatDateTime(transaction.createdAt)}
                </Typography>
              </Stack>

              {transaction.updatedAt && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật cuối
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDateTime(transaction.updatedAt)}
                  </Typography>
                </Stack>
              )}
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
            <Box
              sx={{
                py: 3,
                display: "flex",
                justifyContent: "center",
              }}
            >
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
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
        >
          Về trang chủ
        </Button>
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
