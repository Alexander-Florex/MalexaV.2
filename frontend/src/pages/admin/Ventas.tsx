import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSales, useSale } from '../../api/hooks';
import { Modal } from '../../components/Modal';
import { Skeleton } from '../../components/Skeleton';
import { PAYMENT_METHOD_LABELS, CHANNEL_LABELS, PRICE_TYPE_LABELS } from '../../types';
import type { Sale, SaleChannel } from '../../types';

const money = (n: number) => '$' + n.toLocaleString('es-AR');

function SaleDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: sale, isLoading } = useSale(id);
  if (isLoading || !sale) return (
    <Modal onClose={onClose} title="Detalle de venta">
      <div className="modal-body"><Skeleton type="table" rows={4} /></div>
    </Modal>
  );
  return (
    <Modal onClose={onClose} title={`Venta #${sale.id}`}>
      <div className="modal-body">
        <div className="detail-meta-grid">
          <div><span className="meta-label">Canal</span><span className={`channel-badge ${sale.channel}`}>{CHANNEL_LABELS[sale.channel]}</span></div>
          <div><span className="meta-label">Fecha</span><span>{new Date(sale.created_at).toLocaleString('es-AR')}</span></div>
          <div><span className="meta-label">Vendedor</span><span>{sale.User?.name ?? '—'}</span></div>
          <div><span className="meta-label">Pago</span><span>{PAYMENT_METHOD_LABELS[sale.payment_method]}</span></div>
          {sale.channel === 'live' && sale.buyer_name && (
            <div className="span-2"><span className="meta-label">Cliente</span>
              <span><strong>{sale.buyer_name}</strong>{sale.buyer_contact && ` · ${sale.buyer_contact}`}</span>
            </div>
          )}
        </div>
        <div className="detail-items">
          {sale.items?.map((it, i) => (
            <div key={i} className="detail-item-row">
              <div className="item-name">
                <strong>{it.Product?.name ?? '—'}</strong>
                <span className="cat-pill">{PRICE_TYPE_LABELS[it.price_type]}</span>
              </div>
              <div className="item-qty-price">
                <span className="muted">x{it.quantity}</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{money(Number(it.subtotal))}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="detail-total-row">
          <span>Total</span>
          <span className="total-big">{money(Number(sale.total))}</span>
        </div>
      </div>
    </Modal>
  );
}

function ChannelTab({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button className={`channel-tab${active ? ' active' : ''}`} onClick={onClick}>
      {label} <span className="tab-count">{count}</span>
    </button>
  );
}

export function Ventas() {
  const [channel, setChannel] = useState<'all' | SaleChannel>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: allSales  = [], isLoading: l0 } = useSales();
  const { data: localSales = [] }                = useSales('local');
  const { data: liveSales  = [] }                = useSales('live');

  const displayed = channel === 'local' ? localSales : channel === 'live' ? liveSales : allSales;
  const isLoading = l0;

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Ventas</h1>
          <p className="topbar-sub">{allSales.length} ventas registradas</p>
        </div>
      </div>

      <div className="channel-tabs-bar">
        <ChannelTab label="Todas" active={channel === 'all'}   count={allSales.length}   onClick={() => setChannel('all')} />
        <ChannelTab label="🏪 Local" active={channel === 'local'} count={localSales.length} onClick={() => setChannel('local')} />
        <ChannelTab label="📱 Live"  active={channel === 'live'}  count={liveSales.length}  onClick={() => setChannel('live')} />
      </div>

      <div className="card">
        {isLoading ? (
          <Skeleton type="table" rows={8} />
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{channel === 'live' ? '📱' : '🏪'}</div>
            <p>No hay ventas {channel === 'live' ? 'de live' : channel === 'local' ? 'de local' : ''} todavía.</p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Canal</th><th>Fecha</th><th>Vendedor</th>
                  <th>Cliente</th><th>Ítems</th><th>Pago</th><th>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((s: Sale, i: number) => (
                  <motion.tr
                    key={s.id} className="row-clickable" onClick={() => setSelectedId(s.id)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  >
                    <td style={{ fontFamily: 'var(--f-mono)', color: 'var(--mauve-soft)' }}>#{s.id}</td>
                    <td data-label="Canal">
                      <span className={`channel-badge ${s.channel}`}>{CHANNEL_LABELS[s.channel]}</span>
                    </td>
                    <td data-label="Fecha">{new Date(s.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td data-label="Vendedor"><span className="cat-pill">{s.User?.name ?? '—'}</span></td>
                    <td data-label="Cliente">
                      {s.buyer_name ? <span className="live-buyer">{s.buyer_name}</span> : <span className="muted">—</span>}
                    </td>
                    <td data-label="Ítems">{s.items?.reduce((sum, it) => sum + it.quantity, 0) ?? '—'}</td>
                    <td data-label="Pago"><span className="payment-pill">{PAYMENT_METHOD_LABELS[s.payment_method]}</span></td>
                    <td data-label="Total" style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{money(Number(s.total))}</td>
                    <td><span className="link-chevron">Ver →</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && <SaleDetailModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
