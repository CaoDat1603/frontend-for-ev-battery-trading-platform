import React, { useState, useEffect, type JSX } from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Stack,
  TextField,
  Button,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import PolicyIcon from "@mui/icons-material/Policy";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SaveIcon from "@mui/icons-material/Save";

import {
  OrderService,
  type FeeSettings as ApiFeeSettings,
  type UpdateFeeSettingsRequest,
} from "../services/orderService";

// --- 1. CONSTANTS & HELPERS ---

const PRODUCT_TYPE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Pin xe điện" },
  { value: 2, label: "Xe ô tô điện" },
  { value: 3, label: "Xe máy điện" },
  { value: 4, label: "Bid" },
];

const getProductTypeLabel = (type: number): string => {
  const found = PRODUCT_TYPE_OPTIONS.find((x) => x.value === type);
  return found ? found.label : `Type ${type}`;
};

const formatPercentage = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "--";
  return `${value.toFixed(2)}%`;
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
};

// --- 2. COMPONENT ---

const FeeCommissionManagementPage: React.FC = () => {
  const theme = useTheme();

  const [selectedProductType, setSelectedProductType] = useState<number>(
    PRODUCT_TYPE_OPTIONS[0]?.value ?? 0
  );

  const [currentSettings, setCurrentSettings] =
    useState<ApiFeeSettings | null>(null);

  const [draftSettings, setDraftSettings] = useState<UpdateFeeSettingsRequest>({
    type: PRODUCT_TYPE_OPTIONS[0]?.value ?? 0,
    feePercent: 0,
    commissionPercent: 0,
  });

  const [history, setHistory] = useState<ApiFeeSettings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- 3. DATA LOADING ---

  const loadData = async (productType: number) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [activeSettings, historyList] = await Promise.all([
        OrderService.getActiveFeeSettings(productType),
        OrderService.getFeeSettingsHistory(),
      ]);

      setCurrentSettings(activeSettings);
      setDraftSettings({
        type: activeSettings.type,
        feePercent: activeSettings.feePercent,
        commissionPercent: activeSettings.commissionPercent,
      });

      setHistory(historyList);
    } catch (error: any) {
      console.error("Failed to load fee settings:", error);
      setErrorMessage(
        error?.message || "Không thể tải dữ liệu cấu hình phí từ máy chủ."
      );
      setCurrentSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData(selectedProductType);
  }, [selectedProductType]);

  // --- 4. HANDLERS ---

  const handleProductTypeChange = (event: SelectChangeEvent<string>) => {
    const value = Number(event.target.value);
    setSelectedProductType(value);
    setDraftSettings((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let numeric = parseFloat(value);
    if (Number.isNaN(numeric) || numeric < 0) {
      numeric = 0;
    }

    setDraftSettings((prev) => ({
      ...prev,
      [name]: numeric,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setAlertMessage(null);
    setErrorMessage(null);

    try {
      await OrderService.updateFeeSettings(draftSettings);
      setAlertMessage("Cập nhật cấu hình phí thành công.");
      await loadData(draftSettings.type);
    } catch (error: any) {
      console.error("Failed to update fee settings:", error);
      setErrorMessage(
        error?.message || "Không thể cập nhật cấu hình phí. Vui lòng thử lại."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const totalPlatformFee = (
    settings: Pick<UpdateFeeSettingsRequest, "feePercent" | "commissionPercent"> | null
  ): number => {
    if (!settings) return 0;
    return (settings.feePercent ?? 0) + (settings.commissionPercent ?? 0);
  };

  const effectiveHistory = [...history].sort(
    (a, b) =>
      new Date(b.effectiveDate).getTime() -
      new Date(a.effectiveDate).getTime()
  );

  // --- 5. RENDER ---

  return (
    <Box>
      {/* Header + chọn loại sản phẩm */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <PolicyIcon color="action" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            Fee &amp; Commission Management
          </Typography>
        </Stack>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="product-type-label">Loại sản phẩm</InputLabel>
          <Select
            labelId="product-type-label"
            label="Loại sản phẩm"
            value={String(selectedProductType)}
            onChange={handleProductTypeChange}
          >
            {PRODUCT_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={String(opt.value)}>
                {opt.label} (Type {opt.value})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Alert */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {alertMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      )}

      {/* Main content */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* A. Current Settings */}
        <Box sx={{ flexGrow: 1, minWidth: 300, maxWidth: { md: "40%" } }}>
          <Paper
            sx={{ p: 3, borderRadius: "8px", boxShadow: theme.shadows[1] }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <MonetizationOnIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Current Settings
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {isLoading ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ py: 4 }}
              >
                <CircularProgress size={28} />
              </Stack>
            ) : !currentSettings ? (
              <Typography color="text.secondary">
                Chưa có cấu hình phí cho loại sản phẩm này.
              </Typography>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Product Type
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    {getProductTypeLabel(currentSettings.type)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Service Fee (%)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {formatPercentage(currentSettings.feePercent)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Seller Commission Rate (%)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {formatPercentage(currentSettings.commissionPercent)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Platform Fee (%)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {formatPercentage(totalPlatformFee(currentSettings))}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Box>

        {/* B. Update Settings */}
        <Box sx={{ flexGrow: 2, minWidth: 350, maxWidth: { md: "58%" } }}>
          <Paper
            sx={{ p: 3, borderRadius: "8px", boxShadow: theme.shadows[1] }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Update Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Service Fee (%)"
                  name="feePercent"
                  type="number"
                  value={draftSettings.feePercent}
                  onChange={handleInputChange}
                  inputProps={{ step: 0.1, min: 0 }}
                  helperText="Phí dịch vụ tính trên giá trị giao dịch (ví dụ: 2.5 = 2.5%)."
                />
                <TextField
                  fullWidth
                  label="Seller Commission Rate (%)"
                  name="commissionPercent"
                  type="number"
                  value={draftSettings.commissionPercent}
                  onChange={handleInputChange}
                  inputProps={{ step: 0.1, min: 0 }}
                  helperText="Tỷ lệ hoa hồng nền tảng thu từ người bán."
                />
              </Stack>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Total Platform Fee (tạm tính)
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatPercentage(totalPlatformFee(draftSettings))}
                </Typography>
              </Box>

              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={isSaving}
                  sx={{ mt: 1 }}
                >
                  {isSaving ? "Saving..." : "Save All Changes"}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>

      {/* C. History */}
      <Box sx={{ mt: 3 }}>
        <Paper
          sx={{ p: 3, borderRadius: "8px", boxShadow: theme.shadows[1] }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Revision History
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Effective From</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Product Type</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {effectiveHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary">
                        Chưa có lịch sử cấu hình phí.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  effectiveHistory.map((entry) => (
                    <TableRow key={entry.feeId}>
                      <TableCell>{formatDate(entry.effectiveDate)}</TableCell>
                      <TableCell>{getProductTypeLabel(entry.type)}</TableCell>
                      <TableCell>
                        Service Fee: {formatPercentage(entry.feePercent)} - Commission:{" "}
                        {formatPercentage(entry.commissionPercent)}
                        {entry.endedDate && (
                          <> (đến {formatDate(entry.endedDate)})</>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.isActive ? "Active" : "Inactive"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default FeeCommissionManagementPage;
