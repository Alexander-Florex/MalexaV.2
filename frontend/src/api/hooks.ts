import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { STALE } from './queryClient';
import type {
  Product, PriceTier, Category, Sale, Expense, Employee,
  DashboardSummary, ReportsData, CashSession, CashSessionTotals,
  PaymentMethod, SaleChannel, PriceType, Supplier, PurchaseOrder,
} from '../types';

/* ---- Dashboard ---- */
export const useDashboardSummary = () =>
  useQuery({ queryKey:['dashboard-summary'], staleTime: STALE.dashboard,
    queryFn: async ()=>(await api.get<DashboardSummary>('/dashboard/summary')).data });
export const useReports = () =>
  useQuery({ queryKey:['reports'], staleTime: STALE.sales,
    queryFn: async ()=>(await api.get<ReportsData>('/dashboard/reports')).data });

/* ---- Products ---- */
export const useProducts = () =>
  useQuery({ queryKey:['products'], staleTime: STALE.products,
    queryFn: async ()=>(await api.get<Product[]>('/products')).data });
export const useCategories = () =>
  useQuery({ queryKey:['categories'], staleTime: STALE.static,
    queryFn: async ()=>(await api.get<Category[]>('/products/categories')).data });
export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name:string) => (await api.post<Category>('/products/categories',{name})).data,
    onSuccess: (cat) => {
      // Actualización optimista del cache de categorías
      qc.setQueryData<Category[]>(['categories'], old => [...(old ?? []), cat].sort((a,b)=>a.name.localeCompare(b.name)));
    },
  });
};

interface ProductInput { name:string; categoryId:number|null; stock:number; tiers:PriceTier[]; }
export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data:ProductInput) => (await api.post<Product>('/products',data)).data,
    onSuccess: () => { qc.invalidateQueries({queryKey:['products']}); qc.invalidateQueries({queryKey:['dashboard-summary']}); },
  });
};
export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id,data}:{id:number;data:Partial<ProductInput>}) =>
      (await api.patch<Product>(`/products/${id}`,data)).data,
    onSuccess: (updated) => {
      qc.setQueryData<Product[]>(['products'], old => old?.map(p => p.id === updated.id ? updated : p));
    },
  });
};
export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id:number) => api.delete(`/products/${id}`),
    onMutate: async (id:number) => {
      await qc.cancelQueries({queryKey:['products']});
      const prev = qc.getQueryData<Product[]>(['products']);
      qc.setQueryData<Product[]>(['products'], old=>old?.filter(p=>p.id!==id));
      return {prev};
    },
    onError: (_e,_id,ctx) => ctx?.prev && qc.setQueryData(['products'],ctx.prev),
    onSettled: () => { qc.invalidateQueries({queryKey:['products']}); qc.invalidateQueries({queryKey:['dashboard-summary']}); },
  });
};
export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id,quantity,type}:{id:number;quantity:number;type:'entrada'|'salida'|'ajuste'}) =>
      (await api.post<Product>(`/products/${id}/stock`,{quantity,type})).data,
    onMutate: async ({id,quantity}) => {
      await qc.cancelQueries({queryKey:['products']});
      const prev = qc.getQueryData<Product[]>(['products']);
      qc.setQueryData<Product[]>(['products'], old=>old?.map(p=>p.id===id?{...p,stock:p.stock+quantity}:p));
      return {prev};
    },
    onError: (_e,_v,ctx) => ctx?.prev && qc.setQueryData(['products'],ctx.prev),
    onSettled: () => { qc.invalidateQueries({queryKey:['products']}); qc.invalidateQueries({queryKey:['dashboard-summary']}); },
  });
};

/* ---- Sales ---- */
export const useSales = (channel?:SaleChannel) =>
  useQuery({
    queryKey: ['sales', channel ?? 'all'], staleTime: STALE.sales,
    queryFn: async () => (await api.get<Sale[]>('/sales', { params: channel ? {channel} : {} })).data,
  });
export const useSale = (id:number|null) =>
  useQuery({ queryKey:['sale',id], staleTime: STALE.static,
    queryFn: async ()=>(await api.get<Sale>(`/sales/${id}`)).data, enabled:id!==null });
interface SaleItemInput { productId:number; quantity:number; priceType:PriceType; subtotal:number; }
export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data:{channel:SaleChannel;paymentMethod:PaymentMethod;buyerName?:string;buyerContact?:string;items:SaleItemInput[]}) =>
      (await api.post('/sales',data)).data,
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['sales','all']});
      qc.invalidateQueries({queryKey:['sales','local']});
      qc.invalidateQueries({queryKey:['sales','live']});
      qc.invalidateQueries({queryKey:['products']});
      qc.invalidateQueries({queryKey:['dashboard-summary']});
      qc.invalidateQueries({queryKey:['cash-session-current']});
    },
  });
};

/* ---- Expenses ---- */
export const useExpenses = () =>
  useQuery({ queryKey:['expenses'], staleTime: STALE.sales,
    queryFn: async ()=>(await api.get<Expense[]>('/expenses')).data });
export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data:{category:string;description?:string;amount:number;expenseDate:string;paymentMethod:PaymentMethod}) =>
      (await api.post<Expense>('/expenses',data)).data,
    onSuccess: () => { qc.invalidateQueries({queryKey:['expenses']}); qc.invalidateQueries({queryKey:['dashboard-summary']}); qc.invalidateQueries({queryKey:['cash-session-current']}); },
  });
};
export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id:number) => api.delete(`/expenses/${id}`),
    onMutate: async (id:number) => {
      await qc.cancelQueries({queryKey:['expenses']});
      const prev = qc.getQueryData<Expense[]>(['expenses']);
      qc.setQueryData<Expense[]>(['expenses'], old=>old?.filter(e=>e.id!==id));
      return {prev};
    },
    onError: (_e,_id,ctx) => ctx?.prev && qc.setQueryData(['expenses'],ctx.prev),
    onSettled: () => qc.invalidateQueries({queryKey:['expenses']}),
  });
};

/* ---- Employees ---- */
export const useEmployees = () =>
  useQuery({ queryKey:['employees'], staleTime: STALE.static,
    queryFn: async ()=>(await api.get<Employee[]>('/employees')).data });
export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data:{name:string;email:string;password:string;role:'admin'|'employee'}) =>
      (await api.post<Employee>('/employees',data)).data,
    onSuccess: () => qc.invalidateQueries({queryKey:['employees']}),
  });
};
export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id,data}:{id:number;data:Partial<Pick<Employee,'name'|'role'|'active'>>}) =>
      (await api.patch<Employee>(`/employees/${id}`,data)).data,
    onMutate: async ({id,data}) => {
      await qc.cancelQueries({queryKey:['employees']});
      const prev = qc.getQueryData<Employee[]>(['employees']);
      qc.setQueryData<Employee[]>(['employees'], old=>old?.map(e=>e.id===id?{...e,...data}:e));
      return {prev};
    },
    onError: (_e,_v,ctx) => ctx?.prev && qc.setQueryData(['employees'],ctx.prev),
    onSettled: () => qc.invalidateQueries({queryKey:['employees']}),
  });
};

/* ---- Cash sessions ---- */
export const useCurrentCashSession = () =>
  useQuery({
    queryKey:['cash-session-current'], staleTime: STALE.cashSession,
    queryFn: async ()=>(await api.get<{session:CashSession|null;totals?:CashSessionTotals}>('/cash-sessions/current')).data,
    refetchInterval: STALE.cashSession,
  });
export const useCashSessions = () =>
  useQuery({ queryKey:['cash-sessions'], staleTime: STALE.sales,
    queryFn: async ()=>(await api.get<CashSession[]>('/cash-sessions')).data });
export const useOpenCashSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (openingAmount:number) => (await api.post('/cash-sessions/open',{openingAmount})).data,
    onSuccess: () => { qc.invalidateQueries({queryKey:['cash-session-current']}); qc.invalidateQueries({queryKey:['cash-sessions']}); },
  });
};
export const useCloseCashSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data:{closingAmount:number;notes?:string}) => (await api.post('/cash-sessions/close',data)).data,
    onSuccess: () => { qc.invalidateQueries({queryKey:['cash-session-current']}); qc.invalidateQueries({queryKey:['cash-sessions']}); },
  });
};

/* ---- Suppliers ---- */
export const useSuppliers = () =>
  useQuery({ queryKey:['suppliers'], staleTime: STALE.static,
    queryFn: async ()=>(await api.get<Supplier[]>('/suppliers')).data });
export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data:{name:string;contactName?:string;phone?:string;email?:string;notes?:string}) =>
      (await api.post<Supplier>('/suppliers',data)).data,
    onSuccess: () => qc.invalidateQueries({queryKey:['suppliers']}),
  });
};
export const useDeleteSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id:number) => api.delete(`/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({queryKey:['suppliers']}),
  });
};

/* ---- Purchase orders ---- */
export const usePurchaseOrders = () =>
  useQuery({ queryKey:['purchase-orders'], staleTime: STALE.sales,
    queryFn: async ()=>(await api.get<PurchaseOrder[]>('/purchase-orders')).data });
export const useCreatePurchaseOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data:{supplierId:number;items:{productId:number;quantity:number;unitCost:number}[]}) =>
      (await api.post<PurchaseOrder>('/purchase-orders',data)).data,
    onSuccess: () => qc.invalidateQueries({queryKey:['purchase-orders']}),
  });
};
export const useReceivePurchaseOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id:number) => (await api.post(`/purchase-orders/${id}/receive`)).data,
    onSuccess: () => { qc.invalidateQueries({queryKey:['purchase-orders']}); qc.invalidateQueries({queryKey:['products']}); qc.invalidateQueries({queryKey:['dashboard-summary']}); },
  });
};
