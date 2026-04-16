export type AdminSettings = {
  business_name: string;
  business_address: string;
  business_phone: string;
  gst_number: string;
  tax_percentage: number;
  service_charge: number;
  enable_discounts: boolean;
  payment_methods: string[];
  notify_low_sales: boolean;
  notify_inactivity: boolean;
  opening_time: string;
  closing_time: string;
  dark_mode_default: boolean;
  time_format: '12h' | '24h';
  session_timeout: number;
};

export const DEFAULT_SETTINGS: AdminSettings = {
  business_name: '',
  business_address: '',
  business_phone: '',
  gst_number: '',
  tax_percentage: 0,
  service_charge: 0,
  enable_discounts: true,
  payment_methods: ['cash', 'upi', 'card'],
  notify_low_sales: false,
  notify_inactivity: false,
  opening_time: '09:00',
  closing_time: '22:00',
  dark_mode_default: false,
  time_format: '12h',
  session_timeout: 60,
};

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asPaymentMethods(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const allowed = new Set(['cash', 'upi', 'card']);
  const normalized = value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.toLowerCase())
    .filter((v) => allowed.has(v));

  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
}

export function normalizeAdminSettings(input: Record<string, unknown>): AdminSettings {
  return {
    business_name: asString(input.business_name, DEFAULT_SETTINGS.business_name),
    business_address: asString(input.business_address, DEFAULT_SETTINGS.business_address),
    business_phone: asString(input.business_phone, DEFAULT_SETTINGS.business_phone),
    gst_number: asString(input.gst_number, DEFAULT_SETTINGS.gst_number),
    tax_percentage: asNumber(input.tax_percentage, DEFAULT_SETTINGS.tax_percentage),
    service_charge: asNumber(input.service_charge, DEFAULT_SETTINGS.service_charge),
    enable_discounts: asBoolean(input.enable_discounts, DEFAULT_SETTINGS.enable_discounts),
    payment_methods: asPaymentMethods(input.payment_methods, DEFAULT_SETTINGS.payment_methods),
    notify_low_sales: asBoolean(input.notify_low_sales, DEFAULT_SETTINGS.notify_low_sales),
    notify_inactivity: asBoolean(input.notify_inactivity, DEFAULT_SETTINGS.notify_inactivity),
    opening_time: asString(input.opening_time, DEFAULT_SETTINGS.opening_time),
    closing_time: asString(input.closing_time, DEFAULT_SETTINGS.closing_time),
    dark_mode_default: asBoolean(input.dark_mode_default, DEFAULT_SETTINGS.dark_mode_default),
    time_format:
      input.time_format === '24h' || input.time_format === '12h'
        ? input.time_format
        : DEFAULT_SETTINGS.time_format,
    session_timeout: asNumber(input.session_timeout, DEFAULT_SETTINGS.session_timeout),
  };
}
