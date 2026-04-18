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

export type ProductMatrixQuadrant = 'stars' | 'cash_cows' | 'improve' | 'remove';

export type ProductMatrixItem = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: string;
  quadrant: ProductMatrixQuadrant;
};

export type SalesByHourRow = {
  hour: number;
  revenue: string;
  orderCount: number;
};

export type CategoryPerformanceRow = {
  categoryId: string;
  categoryName: string;
  revenue: string;
  quantitySold: number;
};

export type LostRevenueRow = {
  productId: string;
  productName: string;
  kind: 'out_of_stock' | 'cold';
  note: string;
};

export type GrowthSnapshot = {
  revenue: string;
  orders: number;
};

export type GrowthComparison = {
  todayVsYesterday: {
    current: GrowthSnapshot;
    previous: GrowthSnapshot;
    revenueChangePct: number | null;
  };
  rolling7VsPrev7: {
    current: GrowthSnapshot;
    previous: GrowthSnapshot;
    revenueChangePct: number | null;
  };
};

export type AovInsights = {
  avgOrderValue: string;
  avgUnitsPerOrder: string;
  suggestion: string;
};

export type SmartInsight = {
  id: string;
  tone: 'positive' | 'warning' | 'neutral';
  title: string;
  detail: string;
};

export type AnalyticsPayload = {
  revenue: string;
  totalOrders: number;
  avgOrderValue: string;
  salesByDate: AnalyticsSalesByDateRow[];
  topProducts: AnalyticsTopProduct[];
  staffPerformance: AnalyticsStaffRow[];
  paymentBreakdown: AnalyticsPaymentRow[];
  productMatrix: ProductMatrixItem[];
  salesByHour: SalesByHourRow[];
  categoryPerformance: CategoryPerformanceRow[];
  lostRevenue: LostRevenueRow[];
  growth: GrowthComparison;
  aovInsights: AovInsights;
  smartInsights: SmartInsight[];
};
