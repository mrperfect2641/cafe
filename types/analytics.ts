/** Client-side mirror of `GET /api/analytics` JSON. */
export type AnalyticsSalesByDateRow = {
  date: string;
  revenue: string;
  orderCount: number;
};

export type AnalyticsTopProduct = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: string;
};

export type AnalyticsStaffRow = {
  userId: string | null;
  userName: string;
  orderCount: number;
  revenue: string;
};

export type AnalyticsPaymentRow = {
  paymentMethod: string;
  orderCount: number;
  total: string;
};

export type AnalyticsPayload = {
  revenue: string;
  totalOrders: number;
  avgOrderValue: string;
  salesByDate: AnalyticsSalesByDateRow[];
  topProducts: AnalyticsTopProduct[];
  staffPerformance: AnalyticsStaffRow[];
  paymentBreakdown: AnalyticsPaymentRow[];
};
