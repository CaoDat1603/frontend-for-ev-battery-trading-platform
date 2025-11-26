// src/services/paymentService.ts

const API_PAYMENT_URL = "http://localhost:8000/api/payment";

export interface Payment {
  paymentId: number;
  transactionId: number;
  method: string;
  amount: number;
  status: string;
  referenceCode: string;
  createdAt: string;
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

// Chuẩn hoá key PascalCase / camelCase
const normalizePayment = (raw: any): Payment => ({
  paymentId: raw.paymentId ?? raw.PaymentId,
  transactionId: raw.transactionId ?? raw.TransactionId,
  method: raw.method ?? raw.Method ?? "",
  amount: raw.amount ?? raw.Amount ?? 0,
  status: raw.status ?? raw.Status ?? "",
  referenceCode: raw.referenceCode ?? raw.ReferenceCode ?? "",
  createdAt: raw.createdAt ?? raw.CreatedAt ?? "",
});

export const PaymentService = {
  /** Tạo URL thanh toán qua cổng VNPay cho giao dịch */
  createPaymentUrl: async (transactionId: number): Promise<string> => {
    try {
      const token = getTokenOrThrow("Bạn cần đăng nhập để thanh toán.");

      const response = await fetch(`${API_PAYMENT_URL}/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ transactionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(errorText || response.status);
        throw new Error(
          `Không thể khởi tạo thanh toán.`
        );
      }

      const result = await response.json();
      // API trả về { PaymentUrl: "..." } hoặc { paymentUrl: "..." }
      return result.paymentUrl ?? result.PaymentUrl;
    } catch (err: any) {
      const msg = "Không thể tạo URL thanh toán";
      console.error(err.message);
      throw new Error(msg);
    }
  },

  /** Lấy danh sách Payment của 1 Transaction (Member/Admin) */
  getPaymentsByTransaction: async (
    transactionId: number
  ): Promise<Payment[]> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập để xem lịch sử thanh toán."
      );

      const response = await fetch(
        `${API_PAYMENT_URL}/by-transaction/${transactionId}`,
        {
          method: "GET",
          headers: authHeaders(token),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(errorText || response.status);
        throw new Error(
          `Không thể tải lịch sử thanh toán`
        );
      }

      const data = (await response.json()) as any[];
      return data.map(normalizePayment);
    } catch (err: any) {
      console.error(err.message)
      const msg =
        "Không thể tải lịch sử thanh toán";
      throw new Error(msg);
    }
  },

  /** (Admin) Lấy toàn bộ payment trên hệ thống */
  getAllPayments: async (): Promise<Payment[]> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập (Admin) để xem tất cả thanh toán."
      );

      const response = await fetch(`${API_PAYMENT_URL}`, {
        method: "GET",
        headers: authHeaders(token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(errorText || response.status);
        throw new Error(
          `Không thể tải danh sách thanh toán.`
        );
      }

      const data = (await response.json()) as any[];
      return data.map(normalizePayment);
    } catch (err: any) {
      console.error(err.message);
      const msg =
        "Không thể tải danh sách thanh toán";
      throw new Error(msg);
    }
  },

  /** (Nội bộ/Admin) Gửi yêu cầu hoàn tiền cho 1 transaction
   *  Lưu ý: endpoint này trong backend được thiết kế cho internal call,
   *  nếu phía gateway giới hạn rồi thì có thể không dùng trực tiếp từ browser.
   */
  requestRefund: async (transactionId: number): Promise<void> => {
    try {
      const token = getTokenOrThrow(
        "Bạn cần đăng nhập để yêu cầu hoàn tiền."
      );

      const response = await fetch(
        `${API_PAYMENT_URL}/refund/${transactionId}`,
        {
          method: "POST",
          headers: authHeaders(token),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(errorText || response.status);
        throw new Error(
          `Không thể yêu cầu hoàn tiền.`
        );
      }
    } catch (err: any) {
      console.error(err.message );
      const msg =
        "Không thể yêu cầu hoàn tiền";
      throw new Error(msg);
    }
  },
};
