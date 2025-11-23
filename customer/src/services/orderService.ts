// src/services/orderService.ts

const API_ORDER_URL = "http://localhost:8000/api/transaction";
const API_FEES_ADMIN_URL = "http://localhost:8000/api/feesettings/admin";

export interface Transaction {
  transactionId: number;
  productId: number;
  sellerId: number;
  buyerId: number;
  productType: number;
  transactionStatus: string;
  basePrice: number;
  buyerAmount: number;
  sellerAmount: number;
  platformAmount: number;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface FeeSettings {
  feeId: number;
  type: number;
  feePercent: number;
  commissionPercent: number;
  effectiveDate: string;
  endedDate?: string | null;
  isActive: boolean;
}

export interface UpdateFeeSettingsRequest {
  type: number;
  feePercent: number;
  commissionPercent: number;
}

const getTokenOrThrow = (message: string): string => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error(message);
  }
  return token;
};

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// Chuẩn hoá key PascalCase / camelCase từ backend
const normalizeTransaction = (raw: any): Transaction => ({
  transactionId: raw.transactionId ?? raw.TransactionId,
  productId: raw.productId ?? raw.ProductId,
  sellerId: raw.sellerId ?? raw.SellerId,
  buyerId: raw.buyerId ?? raw.BuyerId,
  productType: raw.productType ?? raw.ProductType,
  transactionStatus: raw.transactionStatus ?? raw.TransactionStatus ?? "",
  basePrice: raw.basePrice ?? raw.BasePrice ?? 0,
  buyerAmount: raw.buyerAmount ?? raw.BuyerAmount ?? 0,
  sellerAmount: raw.sellerAmount ?? raw.SellerAmount ?? 0,
  platformAmount: raw.platformAmount ?? raw.PlatformAmount ?? 0,
  createdAt: raw.createdAt ?? raw.CreatedAt ?? "",
  updatedAt: raw.updatedAt ?? raw.UpdatedAt ?? null,
  deletedAt: raw.deletedAt ?? raw.DeletedAt ?? null,
});

const normalizeFeeSettings = (raw: any): FeeSettings => ({
  feeId: raw.feeId ?? raw.FeeId,
  type: raw.type ?? raw.Type,
  feePercent: raw.feePercent ?? raw.FeePercent ?? 0,
  commissionPercent:
    raw.commissionPercent ?? raw.CommissionPercent ?? 0,
  effectiveDate: raw.effectiveDate ?? raw.EffectiveDate ?? "",
  endedDate: raw.endedDate ?? raw.EndedDate ?? null,
  isActive: raw.isActive ?? raw.IsActive ?? false,
});

export const OrderService = {
  /** Tạo giao dịch mới (Order transaction) */
  createTransaction: async (
    productId: number,
    sellerId: number,
    buyerId: number,
    productType: number,
    basePrice: number
  ): Promise<number> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập để thực hiện giao dịch."
      );

      // payload theo CreateTransactionRequest
      const payload = { productId, sellerId, buyerId, productType, basePrice };

      const response = await fetch(`${API_ORDER_URL}/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tạo giao dịch. Lỗi: ${errorText || response.status}`
        );
      }

      const result = await response.json();
      // API trả về { TransactionId: ... } hoặc { transactionId: ... }
      return result.transactionId ?? result.TransactionId;
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : "Không thể tạo giao dịch";
      throw new Error(msg);
    }
  },

  /** Lấy danh sách giao dịch mà user hiện tại là người mua */
  getMyPurchases: async (): Promise<Transaction[]> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập để xem giao dịch đã mua."
      );

      const response = await fetch(`${API_ORDER_URL}/my-purchases`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tải danh sách giao dịch đã mua. Lỗi: ${
            errorText || response.status
          }`
        );
      }

      const data = (await response.json()) as any[];
      return data.map(normalizeTransaction);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách giao dịch đã mua";
      throw new Error(msg);
    }
  },

  /** Lấy danh sách giao dịch mà user hiện tại là người bán */
  getMySales: async (): Promise<Transaction[]> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập để xem giao dịch đã bán."
      );

      const response = await fetch(`${API_ORDER_URL}/my-sales`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tải danh sách giao dịch đã bán. Lỗi: ${
            errorText || response.status
          }`
        );
      }

      const data = (await response.json()) as any[];
      return data.map(normalizeTransaction);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách giao dịch đã bán";
      throw new Error(msg);
    }
  },

  /** Lấy chi tiết 1 giao dịch (chỉ buyer/seller mới xem được) */
  getTransactionById: async (id: number): Promise<Transaction> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập để xem chi tiết giao dịch."
      );

      const response = await fetch(`${API_ORDER_URL}/${id}`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tải giao dịch #${id}. Lỗi: ${
            errorText || response.status
          }`
        );
      }

      const data = await response.json();
      return normalizeTransaction(data);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải chi tiết giao dịch";
      throw new Error(msg);
    }
  },

  /** Hủy giao dịch (Order Service sẽ tự call sang Payment để hoàn tiền nếu cần) */
  cancelTransaction: async (id: number): Promise<void> => {
    try {
      const token = getTokenOrThrow("Bạn cần đăng nhập để hủy giao dịch.");

      const response = await fetch(`${API_ORDER_URL}/${id}/cancel`, {
        method: "POST",
        headers: authHeaders(token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể hủy giao dịch #${id}. Lỗi: ${
            errorText || response.status
          }`
        );
      }
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : "Không thể hủy giao dịch";
      throw new Error(msg);
    }
  },

  /** (Admin) Lấy toàn bộ giao dịch trên hệ thống */
  getAllTransactions: async (): Promise<Transaction[]> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập (Admin) để xem tất cả giao dịch."
      );

      const response = await fetch(`${API_ORDER_URL}`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tải danh sách giao dịch. Lỗi: ${
            errorText || response.status
          }`
        );
      }

      const data = (await response.json()) as any[];
      return data.map(normalizeTransaction);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách giao dịch";
      throw new Error(msg);
    }
  },

  /** (Admin) Lấy cấu hình phí đang active theo loại sản phẩm */
  getActiveFeeSettings: async (productType: number): Promise<FeeSettings> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập (Admin) để xem cấu hình phí."
      );

      const response = await fetch(
        `${API_FEES_ADMIN_URL}/member/${productType}`,
        {
          method: "GET",
          headers: authHeaders(token),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tải cấu hình phí. Lỗi: ${
            errorText || response.status
          }`
        );
      }

      const data = await response.json();
      return normalizeFeeSettings(data);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải cấu hình phí";
      throw new Error(msg);
    }
  },

  /** (Admin) Lấy lịch sử thay đổi cấu hình phí */
  getFeeSettingsHistory: async (): Promise<FeeSettings[]> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập (Admin) để xem lịch sử cấu hình phí."
      );

      const response = await fetch(`${API_FEES_ADMIN_URL}/history`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tải lịch sử cấu hình phí. Lỗi: ${
            errorText || response.status
          }`
        );
      }

      const data = (await response.json()) as any[];
      return data.map(normalizeFeeSettings);
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải lịch sử cấu hình phí";
      throw new Error(msg);
    }
  },

  /** (Admin) Cập nhật cấu hình phí mới */
  updateFeeSettings: async (
    request: UpdateFeeSettingsRequest
  ): Promise<void> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập (Admin) để cập nhật cấu hình phí."
      );

      const response = await fetch(`${API_FEES_ADMIN_URL}/update`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể cập nhật cấu hình phí. Lỗi: ${
            errorText || response.status
          }`
        );
      }
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể cập nhật cấu hình phí";
      throw new Error(msg);
    }
  },
};
