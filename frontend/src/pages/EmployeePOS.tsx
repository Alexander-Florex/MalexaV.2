import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts, useCategories, useCreateSale, useCurrentCashSession, useOpenCashSession, useCloseCashSession, useCreateExpense } from '../api/hooks';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Product, TicketLine, SaleChannel, PriceType, PriceTier, PaymentMethod } from '../types';
import { PAYMENT_METHOD_LABELS } from '../types';

const money = (n: number) => '$' + n.toLocaleString('es-AR');

/** Devuelve todos los tiers disponibles para un producto y tipo de precio */
function getTiersForType(product: Product, priceType: PriceType): PriceTier[] {
  return (product.tiers ?? [])
    .filter(t => t.type === priceType)
    .sort((a, b) => a.quantity - b.quantity);
}

/** Calcula el subtotal aplicando el mejor tier disponible para la cantidad */
function calcSubtotal(product: Product, priceType: PriceType, qty: number): number {
  const tiers = getTiersForType(product, priceType).sort((a, b) => b.quantity - a.quantity);
  const best = tiers.find(t => t.quantity <= qty);
  if (!best) return 0;
  const blocks    = Math.floor(qty / best.quantity);
  const remainder = qty % best.quantity;
  const unit1     = tiers.find(t => t.quantity === 1);
  return blocks * Number(best.price) + remainder * (unit1 ? Number(unit1.price) : 0);
}

/* ------------------------------------------------------------------ */
/* Popover de selección de tier al tocar un producto                  */
/* ------------------------------------------------------------------ */
function TierPicker({
  product, priceType, onPick, onClose,
}: {
  product: Product;
  priceType: PriceType;
  onPick: (tier: PriceTier) => void;
  onClose: () => void;
}) {
  const tiers = getTiersForType(product, priceType);
  const otherType: PriceType = priceType === 'minorista' ? 'mayorista' : 'minorista';
  const otherTiers = getTiersForType(product, otherType);

  return (
    <motion.div
      className="tier-picker-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="tier-picker-card"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="tier-picker-head">
          <span className="tier-picker-name">{product.name}</span>
          <button className="tier-picker-close" onClick={onClose}>×</button>
        </div>

        {tiers.length > 0 && (
          <div className="tier-picker-section">
            <div className={`tier-picker-label ${priceType}`}>
              {priceType === 'minorista' ? 'Minorista' : 'Mayorista'}
            </div>
            <div className="tier-picker-options">
              {tiers.map((t, i) => (
                <motion.button
                  key={i}
                  className={`tier-option-btn ${priceType}`}
                  onClick={() => onPick(t)}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className="tier-opt-qty">×{t.quantity}</span>
                  <span className="tier-opt-price">{money(Number(t.price))}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {otherTiers.length > 0 && (
          <div className="tier-picker-section">
            <div className={`tier-picker-label ${otherType}`}>
              {otherType === 'minorista' ? 'Minorista' : 'Mayorista'}
            </div>
            <div className="tier-picker-options">
              {otherTiers.map((t, i) => (
                <motion.button
                  key={i}
                  className={`tier-option-btn ${otherType}`}
                  onClick={() => onPick(t)}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className="tier-opt-qty">×{t.quantity}</span>
                  <span className="tier-opt-price">{money(Number(t.price))}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {tiers.length === 0 && otherTiers.length === 0 && (
          <p className="tier-picker-empty">Este producto no tiene precios cargados.</p>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta de producto en la grilla                                   */
/* ------------------------------------------------------------------ */
function ProductCard({ product, onSelect }: { product: Product; onSelect: (p: Product) => void }) {
  const hasStock   = product.stock > 0;
  const lowestMin  = (product.tiers ?? []).filter(t => t.type === 'minorista').sort((a, b) => a.quantity - b.quantity)[0];
  const stockLow   = product.stock > 0 && product.stock <= 5;

  return (
    <motion.button
      className={`pos-product-card${!hasStock ? ' out-of-stock' : ''}${stockLow ? ' low-stock' : ''}`}
      onClick={() => hasStock && onSelect(product)}
      whileTap={hasStock ? { scale: 0.96 } : {}}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="ppc-name">{product.name}</div>
      <div className="ppc-cat">{product.Category?.name ?? ''}</div>
      <div className="ppc-footer">
        <span className="ppc-price">
          {lowestMin ? money(Number(lowestMin.price)) : <span className="ppc-noprice">Sin precio</span>}
        </span>
        <span className={`ppc-stock${!hasStock ? ' zero' : stockLow ? ' low' : ''}`}>
          {!hasStock ? 'Sin stock' : `Stock: ${product.stock}`}
        </span>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Página principal del POS                                           */
/* ------------------------------------------------------------------ */
export function EmployeePOS() {
  const { user, logout }    = useAuth();
  const { toast }           = useToast();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: cashData }  = useCurrentCashSession();
  const createSale          = useCreateSale();

  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [ticket, setTicket]           = useState<TicketLine[]>([]);
  const [channel, setChannel]         = useState<SaleChannel>('local');
  const [priceType, setPriceType]     = useState<PriceType>('minorista');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [buyerName, setBuyerName]     = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);
  const [loading, setLoading]         = useState(false);
  const [cajaModal, setCajaModal]     = useState(false);
  const [openAmount, setOpenAmount]   = useState('');
  const [closeAmount, setCloseAmount] = useState('');
  const [cajaLoading, setCajaLoading] = useState(false);
  const openCashSession  = useOpenCashSession();
  const closeCashSession = useCloseCashSession();
  const createExpense    = useCreateExpense();

  // Modal de gasto/salida
  const [gastoModal, setGastoModal]         = useState(false);
  const [gastoForm, setGastoForm]           = useState({
    category: 'Retiro de efectivo', description: '', amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
  });
  const [gastoLoading, setGastoLoading]     = useState(false);

  const GASTO_CATS = ['Retiro de efectivo', 'Flete', 'Proveedores', 'Servicios', 'Insumos', 'Otro'];

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!catFilter || p.category_id === Number(catFilter))
  );

  /** Cuando el usuario elige un tier del picker, lo agrega al ticket */
  function pickTier(tier: PriceTier) {
    if (!pickerProduct) return;
    const product   = pickerProduct;
    const lineType  = tier.type;
    setPickerProduct(null);

    setTicket(prev => {
      // busca si ya existe exactamente esa combinación producto+tipo+cantidad_tier
      const key = `${product.id}-${lineType}-${tier.quantity}`;
      const existing = prev.findIndex(l =>
        l.product.id === product.id && l.priceType === lineType && l.tierQty === tier.quantity
      );
      if (existing >= 0) {
        return prev.map((l, i) => {
          if (i !== existing) return l;
          const newQty = l.quantity + tier.quantity;
          return {
            ...l,
            quantity: newQty,
            subtotal: calcSubtotal(product, lineType, newQty),
          };
        });
      }
      return [...prev, {
        product,
        quantity:  tier.quantity,
        priceType: lineType,
        tierQty:   tier.quantity,
        subtotal:  Number(tier.price),
      }];
    });
  }

  function updateQty(idx: number, delta: number) {
    setTicket(prev => {
      const line   = prev[idx];
      const newQty = line.quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      return prev.map((l, i) => i !== idx ? l : {
        ...l,
        quantity: newQty,
        subtotal: calcSubtotal(l.product, l.priceType, newQty),
      });
    });
  }

  function removeLine(idx: number) { setTicket(prev => prev.filter((_, i) => i !== idx)); }

  const total = ticket.reduce((s, l) => s + l.subtotal, 0);

  async function registerSale() {
    if (ticket.length === 0 || loading) return;
    setLoading(true);
    try {
      await createSale.mutateAsync({
        channel,
        paymentMethod,
        buyerName:    channel === 'live' && buyerName.trim() ? buyerName.trim() : undefined,
        buyerContact: channel === 'live' && buyerContact.trim() ? buyerContact.trim() : undefined,
        items: ticket.map(l => ({
          productId: l.product.id,
          quantity:  l.quantity,
          priceType: l.priceType,
          subtotal:  l.subtotal,
        })),
      });
      toast('¡Venta registrada!', 'success');
      setTicket([]);
      setBuyerName('');
      setBuyerContact('');
    } catch (err: any) {
      toast(err.response?.data?.error ?? 'Error al registrar la venta', 'error');
    } finally {
      setLoading(false);
    }
  }

  const cashOpen = cashData?.session?.status === 'abierta';

  return (
    <div className="pos-root">

      {/* ── Topbar del empleado ── */}
      <div className="pos-topbar-bar">
        <div className="pos-topbar-brand">
          <div className="brand-mark-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4a2 2 0 1 1 2 2v1l8 5a2 2 0 0 1-1 3.7H3A2 2 0 0 1 2 12l8-5V6a2 2 0 0 1 2-2Z"/>
            </svg>
          </div>
          <span className="pos-topbar-name">{user?.tenantName}</span>
          <span className="pos-topbar-role pos-topbar-role-sep">·</span>
          <span className="pos-topbar-role pos-topbar-role-name">{user?.name}</span>
        </div>
        <div className="pos-topbar-right">
          <button
            className={`pos-caja-btn ${cashOpen ? 'open' : 'closed'}`}
            onClick={() => setCajaModal(true)}
            title={cashOpen ? 'Caja abierta' : 'Caja cerrada'}
          >
            <span className="pos-caja-led" />
            <span className="pos-btn-label">{cashOpen ? 'Caja abierta' : 'Caja cerrada'}</span>
            <svg className="pos-btn-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <button className="pos-gasto-btn" onClick={() => setGastoModal(true)} title="Registrar salida">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span className="pos-btn-label">Registrar salida</span>
          </button>
          <button className="pos-logout-btn" onClick={logout} title="Salir">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span className="pos-btn-label">Salir</span>
          </button>
        </div>
      </div>

      <div className="pos-body">

        {/* ══════════════ Panel izquierdo: catálogo ══════════════ */}
        <div className="pos-catalog">

          {/* Selectores de canal y tipo de precio */}
          <div className="pos-controls">
            <div className="pos-seg-group">
              <span className="pos-seg-label">Canal</span>
              <div className="pos-seg">
                <button className={`pos-seg-btn${channel === 'local' ? ' active' : ''}`} onClick={() => setChannel('local')}>🏪 Local</button>
                <button className={`pos-seg-btn${channel === 'live'  ? ' active' : ''}`} onClick={() => setChannel('live')}>📱 Live</button>
              </div>
            </div>
            <div className="pos-seg-group">
              <span className="pos-seg-label">Tipo precio</span>
              <div className="pos-seg">
                <button className={`pos-seg-btn min${priceType === 'minorista' ? ' active' : ''}`} onClick={() => setPriceType('minorista')}>Minorista</button>
                <button className={`pos-seg-btn may${priceType === 'mayorista' ? ' active' : ''}`} onClick={() => setPriceType('mayorista')}>Mayorista</button>
              </div>
            </div>
          </div>

          {/* Datos del live (solo cuando aplica) */}
          <AnimatePresence>
            {channel === 'live' && (
              <motion.div className="pos-live-fields"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <input className="input-field compact" placeholder="👤 Nombre del cliente" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
                <input className="input-field compact" placeholder="📲 Instagram / WhatsApp" value={buyerContact} onChange={e => setBuyerContact(e.target.value)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buscador */}
          <div className="pos-search-row">
            <div className="search-wrapper">
              <span className="search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input className="input-field" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="select-input compact" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">Todas</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Grilla de productos */}
          <div className="pos-product-grid">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onSelect={setPickerProduct} />
            ))}
            {filtered.length === 0 && (
              <div className="pos-empty">No se encontraron productos.</div>
            )}
          </div>
        </div>

        {/* ══════════════ Panel derecho: ticket ══════════════ */}
        <div className="pos-ticket-panel">
          <div className="pos-ticket-head">
            <span className="pos-ticket-title">Ticket</span>
            {ticket.length > 0 && (
              <button className="pos-clear-btn" onClick={() => setTicket([])}>Limpiar</button>
            )}
          </div>

          {/* Ítems */}
          <div className="pos-ticket-items">
            <AnimatePresence initial={false}>
              {ticket.length === 0 ? (
                <div className="pos-ticket-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".3">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  <span>Tocá un producto para ver sus precios y agregarlo</span>
                </div>
              ) : (
                ticket.map((line, idx) => (
                  <motion.div
                    key={`${line.product.id}-${line.priceType}-${line.tierQty}`}
                    className="pos-ticket-line"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
                    layout
                  >
                    <div className="ptl-info">
                      <span className="ptl-name">{line.product.name}</span>
                      <span className={`ptl-type ${line.priceType}`}>
                        {line.priceType === 'minorista' ? 'Min.' : 'May.'}
                      </span>
                    </div>
                    <div className="ptl-controls">
                      <button className="ptl-qty-btn" onClick={() => updateQty(idx, -1)}>−</button>
                      <span className="ptl-qty">{line.quantity}</span>
                      <button className="ptl-qty-btn" onClick={() => updateQty(idx, 1)}>+</button>
                      <span className="ptl-subtotal">{money(line.subtotal)}</span>
                      <button className="ptl-remove" onClick={() => removeLine(idx)}>×</button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Método de pago + total + botón */}
          <div className="pos-ticket-foot">
            {ticket.length > 0 && (
              <div className="pos-pay-row">
                <label className="pos-pay-label">Método de pago</label>
                <select className="select-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                  {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pos-total-row">
              <span className="pos-total-label">Total</span>
              <span className="pos-total-amount">{money(total)}</span>
            </div>

            <button
              className={`pos-register-btn${ticket.length === 0 || loading ? ' disabled' : ''} ${channel}`}
              disabled={ticket.length === 0 || loading}
              onClick={registerSale}
            >
              {loading ? (
                <span className="pos-loading-dots">Registrando</span>
              ) : (
                <>
                  {channel === 'live' ? '📱' : '🏪'}
                  Registrar venta {channel === 'live' ? 'Live' : 'Local'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal de salida / gasto ── */}
      <AnimatePresence>
        {gastoModal && (
          <Modal onClose={() => setGastoModal(false)} title="Registrar salida de efectivo" width={420}>
            <div className="modal-body">
              <div className="gasto-info-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                Usá esto para registrar cualquier salida de dinero de la caja: fletes, compras, retiros, etc.
              </div>

              <div className="form-grid" style={{ marginTop: 16 }}>
                <div className="field">
                  <label>Tipo de salida</label>
                  <select
                    className="select-input"
                    value={gastoForm.category}
                    onChange={e => setGastoForm({ ...gastoForm, category: e.target.value })}
                  >
                    {GASTO_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Descripción (opcional)</label>
                  <input
                    placeholder="Ej: Flete proveedor textil"
                    value={gastoForm.description}
                    onChange={e => setGastoForm({ ...gastoForm, description: e.target.value })}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Monto $</label>
                    <input
                      type="number" min={0} placeholder="0"
                      value={gastoForm.amount}
                      onChange={e => setGastoForm({ ...gastoForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Fecha</label>
                    <input
                      type="date"
                      value={gastoForm.expenseDate}
                      onChange={e => setGastoForm({ ...gastoForm, expenseDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setGastoModal(false)}>Cancelar</button>
              <button
                className="btn-danger"
                disabled={!gastoForm.amount || gastoLoading}
                onClick={async () => {
                  setGastoLoading(true);
                  try {
                    await createExpense.mutateAsync({
                      category: gastoForm.category,
                      description: gastoForm.description || undefined,
                      amount: Number(gastoForm.amount),
                      expenseDate: gastoForm.expenseDate,
                      paymentMethod: 'efectivo',
                    });
                    toast('Salida registrada', 'success');
                    setGastoForm({ category: 'Retiro de efectivo', description: '', amount: '', expenseDate: new Date().toISOString().slice(0, 10) });
                    setGastoModal(false);
                  } catch (err: any) {
                    toast(err.response?.data?.error ?? 'Error al registrar', 'error');
                  } finally { setGastoLoading(false); }
                }}
              >
                {gastoLoading ? 'Guardando...' : 'Registrar salida'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Modal de caja (empleados y admins) ── */}
      <AnimatePresence>
        {cajaModal && (
          <Modal onClose={() => setCajaModal(false)} title="Gestión de caja" width={420}>
            <div className="modal-body">
              {cashOpen ? (
                <div className="caja-modal-content">
                  <div className="caja-status-card open">
                    <div className="caja-status-icon">🟢</div>
                    <div>
                      <div className="caja-status-title">Caja abierta</div>
                      <div className="caja-status-sub">
                        Abrió: {cashData?.session?.OpenedBy?.name ?? '—'} · ${Number(cashData?.session?.opening_amount ?? 0).toLocaleString('es-AR')} inicial
                      </div>
                    </div>
                  </div>
                  {cashData?.totals && (
                    <div className="caja-totals-grid">
                      <div className="caja-total-item">
                        <span className="cti-label">Total ventas</span>
                        <span className="cti-value green">{money(cashData.totals.cashSales)}</span>
                      </div>
                      <div className="caja-total-item">
                        <span className="cti-label">Gastos</span>
                        <span className="cti-value red">{money(cashData.totals.cashExpenses)}</span>
                      </div>
                      <div className="caja-total-item span-2">
                        <span className="cti-label">Efectivo esperado en caja</span>
                        <span className="cti-value big">{money(cashData.totals.expectedCash)}</span>
                      </div>
                    </div>
                  )}
                  <div className="caja-close-section">
                    <label className="form-label">Monto físico en caja al cerrar</label>
                    <div className="caja-amount-wrap">
                      <span className="caja-peso-sign">$</span>
                      <input
                        className="input-field"
                        type="number" min={0} placeholder="0"
                        value={closeAmount}
                        onChange={e => setCloseAmount(e.target.value)}
                        style={{ paddingLeft: 28 }}
                      />
                    </div>
                    <button
                      className="btn-danger full-width"
                      disabled={!closeAmount || cajaLoading}
                      onClick={async () => {
                        setCajaLoading(true);
                        try {
                          await closeCashSession.mutateAsync({ closingAmount: Number(closeAmount) });
                          setCloseAmount('');
                          setCajaModal(false);
                          toast('Caja cerrada correctamente', 'success');
                        } catch (err: any) {
                          toast(err.response?.data?.error ?? 'Error al cerrar caja', 'error');
                        } finally { setCajaLoading(false); }
                      }}
                    >
                      {cajaLoading ? 'Cerrando...' : 'Cerrar caja'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="caja-modal-content">
                  <div className="caja-status-card closed">
                    <div className="caja-status-icon">🔴</div>
                    <div>
                      <div className="caja-status-title">Caja cerrada</div>
                      <div className="caja-status-sub">Las ventas se registran igual, sin asociar a una sesión.</div>
                    </div>
                  </div>
                  <div className="caja-open-section">
                    <label className="form-label">Monto inicial de cambio</label>
                    <div className="caja-amount-wrap">
                      <span className="caja-peso-sign">$</span>
                      <input
                        className="input-field"
                        type="number" min={0} placeholder="0"
                        value={openAmount}
                        onChange={e => setOpenAmount(e.target.value)}
                        style={{ paddingLeft: 28 }}
                      />
                    </div>
                    <p className="caja-hint">Ingresá el efectivo que ponés en caja para dar cambio al inicio del turno.</p>
                    <button
                      className="btn-primary big"
                      disabled={!openAmount || cajaLoading}
                      onClick={async () => {
                        setCajaLoading(true);
                        try {
                          await openCashSession.mutateAsync(Number(openAmount));
                          setOpenAmount('');
                          setCajaModal(false);
                          toast('¡Caja abierta!', 'success');
                        } catch (err: any) {
                          toast(err.response?.data?.error ?? 'Error al abrir caja', 'error');
                        } finally { setCajaLoading(false); }
                      }}
                    >
                      {cajaLoading ? 'Abriendo...' : 'Abrir caja'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Picker de tiers */}
      <AnimatePresence>
        {pickerProduct && (
          <TierPicker
            product={pickerProduct}
            priceType={priceType}
            onPick={pickTier}
            onClose={() => setPickerProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}