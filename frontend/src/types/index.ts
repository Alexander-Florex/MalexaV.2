export type UserRole    = 'admin' | 'employee';
export type PaymentMethod = 'efectivo'|'debito'|'credito'|'transferencia'|'mercadopago'|'otro';
export type SaleChannel = 'local' | 'live';
export type PriceType   = 'minorista' | 'mayorista';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo:'Efectivo', debito:'Débito', credito:'Crédito',
  transferencia:'Transferencia', mercadopago:'Mercado Pago', otro:'Otro',
};
export const CHANNEL_LABELS: Record<SaleChannel, string> = {
  local: '🏪 Local', live: '📱 Live',
};
export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  minorista: 'Minorista', mayorista: 'Mayorista',
};

export interface AuthUser {
  id: number; name: string; email: string;
  role: UserRole; tenantId: number; tenantName: string;
}
export interface Category { id: number; name: string; }

export interface PriceTier {
  id?: number; type: PriceType; quantity: number; price: number;
}

export interface Product {
  id: number; name: string; stock: number; active: boolean;
  category_id?: number | null;
  Category?: { id: number; name: string } | null;
  tiers?: PriceTier[];
}

export interface ActivityEvent { message: string; at: string; }

export interface DashboardSummary {
  ventasHoy: number; gastosMes: number; stockBajo: number; productosActivos: number;
  ventasUltimos7Dias: { day: string; total: string }[];
  actividadReciente: ActivityEvent[];
}

export interface TicketLine {
  product: Product;
  quantity: number;
  priceType: PriceType;
  tierQty: number;   // cantidad del tier elegido (1, 2 o 3)
  subtotal: number;  // total del tier (no quantity * unit_price)
}

export interface SaleItem {
  id: number; quantity: number; price_type: PriceType;
  unit_price: string|number; subtotal: string|number;
  Product?: { id: number; name: string };
}

export interface Sale {
  id: number; total: string|number;
  channel: SaleChannel; payment_method: PaymentMethod;
  buyer_name: string|null; buyer_contact: string|null;
  created_at: string;
  User?: { id: number; name: string };
  items?: SaleItem[];
}

export interface Expense {
  id: number; category: string; description: string|null;
  amount: string|number; payment_method: PaymentMethod;
  expense_date: string; created_at: string;
}

export interface Employee {
  id: number; name: string; email: string; role: UserRole; active: boolean;
}

export interface ReportsData {
  ventasPorCategoria: { categoria: string; total: string }[];
  topProductos:       { id: number; name: string; cantidad: string; total: string }[];
  gastosPorCategoria: { categoria: string; total: string }[];
  ventasPorEmpleado:  { empleado: string; total: string; cantidad: string }[];
  ingresosVsGastos:   { month: string; ingresos: number; gastos: number }[];
}

export interface CashSession {
  id: number; opening_amount: string|number; opened_at: string;
  closing_amount: string|number|null; expected_amount: string|number|null;
  difference_amount: string|number|null; closed_at: string|null;
  status: 'abierta'|'cerrada'; notes: string|null;
  OpenedBy?: { id: number; name: string };
  ClosedBy?:  { id: number; name: string }|null;
}
export interface CashSessionTotals {
  cashSales: number; otherSales: number; cashExpenses: number; expectedCash: number;
}

export interface Supplier {
  id: number; name: string; contact_name: string|null;
  phone: string|null; email: string|null; notes: string|null;
}
export interface PurchaseOrderItem {
  id: number; quantity: number; unit_cost: string|number; subtotal: string|number;
  Product?: { name: string };
}
export interface PurchaseOrder {
  id: number; status: 'pendiente'|'recibida'|'cancelada';
  total: string|number; created_at: string; received_at: string|null;
  Supplier?: { id: number; name: string };
  items?: PurchaseOrderItem[];
}
