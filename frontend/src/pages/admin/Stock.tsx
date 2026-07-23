import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useProducts, useCategories, useCreateProduct, useUpdateProduct,
  useDeleteProduct, useAdjustStock, useCreateCategory,
} from '../../api/hooks';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';
import { SkeletonTable } from '../../components/Skeleton';
import type { Product, PriceTier, PriceType } from '../../types';

const money = (n: number) => '$' + n.toLocaleString('es-AR');

/* ------------------------------------------------------------------ */
/* Fila de un tier de precio                                           */
/* ------------------------------------------------------------------ */
function TierRow({
  tier, idx, onChange, onRemove,
}: { tier: PriceTier; idx: number; onChange: (t: PriceTier) => void; onRemove: () => void }) {
  return (
    <div className="tier-row-v2">
      <div className="tier-type-col">
        <select
          className={`tier-type-select ${tier.type}`}
          value={tier.type}
          onChange={e => onChange({ ...tier, type: e.target.value as PriceType })}
        >
          <option value="minorista">Minorista</option>
          <option value="mayorista">Mayorista</option>
        </select>
      </div>
      <div className="tier-qty-col">
        <span className="tier-field-label">Cant.</span>
        <input
          type="number" min={1} className="tier-input"
          value={tier.quantity}
          onChange={e => onChange({ ...tier, quantity: Math.max(1, Number(e.target.value)) })}
        />
      </div>
      <div className="tier-price-col">
        <span className="tier-field-label">Precio total</span>
        <div className="tier-price-wrap">
          <span className="tier-peso">$</span>
          <input
            type="number" min={0} className="tier-input"
            value={tier.price || ''}
            placeholder="0"
            onChange={e => onChange({ ...tier, price: Number(e.target.value) })}
          />
        </div>
      </div>
      <button className="tier-remove-btn" onClick={onRemove} title="Quitar tier">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal de creación / edición de producto                             */
/* ------------------------------------------------------------------ */
function ProductForm({
  initial, onSave, onClose,
}: {
  initial?: Product | null;
  onSave: (data: { name: string; categoryId: number | null; stock: number; tiers: PriceTier[] }) => void;
  onClose: () => void;
}) {
  const { data: categories = [] } = useCategories();
  const createCat = useCreateCategory();

  const [name, setName]         = useState(initial?.name ?? '');
  const [catId, setCatId]       = useState<number | null>(initial?.category_id ?? null);
  const [stock, setStock]       = useState(initial?.stock ?? 0);
  const [tiers, setTiers]       = useState<PriceTier[]>(
    initial?.tiers?.length ? initial.tiers : [{ type: 'minorista', quantity: 1, price: 0 }]
  );
  const [newCat, setNewCat]     = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [savingCat, setSavingCat] = useState(false);

  const updateTier = (i: number, t: PriceTier) => setTiers(prev => prev.map((x, idx) => idx === i ? t : x));
  const removeTier = (i: number) => setTiers(prev => prev.filter((_, idx) => idx !== i));
  const addTier    = () => setTiers(prev => [...prev, { type: 'minorista', quantity: prev.length + 1, price: 0 }]);

  async function saveCat() {
    if (!newCat.trim()) return;
    setSavingCat(true);
    const cat = await createCat.mutateAsync(newCat.trim());
    setCatId(cat.id);
    setNewCat('');
    setAddingCat(false);
    setSavingCat(false);
  }

  return (
    <Modal onClose={onClose} title={initial ? 'Editar producto' : 'Nuevo producto'} width={520}>
      <div className="modal-body modal-body-scroll">

        {/* Nombre */}
        <div className="form-field">
          <label className="form-label">Nombre del producto</label>
          <input
            className="input-field"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Pantalón palazzo"
            autoFocus
          />
        </div>

        {/* Categoría */}
        <div className="form-field">
          <label className="form-label">Categoría</label>
          {addingCat ? (
            <div className="cat-new-row">
              <input
                className="input-field"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                placeholder="Nombre de la nueva categoría"
                onKeyDown={e => e.key === 'Enter' && saveCat()}
                autoFocus
              />
              <button className="btn-primary compact" onClick={saveCat} disabled={savingCat}>
                {savingCat ? '...' : 'Guardar'}
              </button>
              <button className="btn-ghost compact" onClick={() => setAddingCat(false)}>Cancelar</button>
            </div>
          ) : (
            <div className="cat-select-row">
              <select
                className="select-input flex-1"
                value={catId ?? ''}
                onChange={e => setCatId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn-ghost compact" onClick={() => setAddingCat(true)}>
                + Crear
              </button>
            </div>
          )}
        </div>

        {/* Stock inicial (solo en crear) */}
        {!initial && (
          <div className="form-field">
            <label className="form-label">Stock inicial</label>
            <input
              type="number" min={0} className="input-field"
              value={stock}
              onChange={e => setStock(Number(e.target.value))}
            />
          </div>
        )}

        {/* Precios por tier */}
        <div className="form-field">
          <div className="tiers-header">
            <label className="form-label">Precios por cantidad</label>
            <span className="tiers-hint">Cada fila: tipo · cuántas unidades · precio TOTAL de ese combo</span>
          </div>

          <div className="tiers-list-v2">
            {tiers.map((tier, i) => (
              <TierRow key={i} tier={tier} idx={i} onChange={t => updateTier(i, t)} onRemove={() => removeTier(i)} />
            ))}
          </div>

          <button className="tier-add-btn" onClick={addTier}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Agregar precio
          </button>

          <div className="tier-example-box">
            <strong>Ejemplo:</strong> Minorista · 1 ud · $15.000 | Minorista · 2 uds · $20.000 | Mayorista · 6 uds · $70.000
          </div>
        </div>

      </div>
      <div className="modal-footer">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), categoryId: catId, stock, tiers })}
        >
          {initial ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Página principal de Stock                                           */
/* ------------------------------------------------------------------ */
export function Stock() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] }          = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const adjustStock   = useAdjustStock();
  const { toast }     = useToast();

  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing]     = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!catFilter || p.category_id === Number(catFilter))
  );

  function openNew()        { setEditing(null); setModalOpen(true); }
  function openEdit(p: Product) { setEditing(p);   setModalOpen(true); }

  async function handleSave(data: { name: string; categoryId: number | null; stock: number; tiers: PriceTier[] }) {
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, data });
        toast('Producto actualizado', 'success');
      } else {
        await createProduct.mutateAsync(data);
        toast('Producto creado', 'success');
      }
      setModalOpen(false);
    } catch { toast('Error al guardar', 'error'); }
  }

  async function quickAdjust(p: Product, delta: number) {
    try {
      await adjustStock.mutateAsync({ id: p.id, quantity: delta, type: delta > 0 ? 'entrada' : 'salida' });
    } catch (err: any) { toast(err.response?.data?.error ?? 'Error al ajustar stock', 'error'); }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`¿Dar de baja "${p.name}"?`)) return;
    await deleteProduct.mutateAsync(p.id);
    toast(`${p.name} dado de baja`, 'success');
  }

  const stockStatus = (p: Product) =>
    p.stock === 0 ? { label: 'Sin stock', cls: 'status-out' }
    : p.stock <= 5 ? { label: 'Stock bajo', cls: 'status-low' }
    : { label: 'En stock',  cls: 'status-instock' };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Stock</h1>
          <p className="topbar-sub">{products.length} productos activos</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo producto</button>
      </div>

      <div className="card">
        <div className="filter-row">
          <div className="search-wrapper">
            <span className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="input-field"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select-input" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No se encontraron productos.</p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precios minorista</th>
                  <th>Precios mayorista</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const st      = stockStatus(p);
                  const pct     = Math.min(100, (p.stock / 30) * 100);
                  const minT    = (p.tiers ?? []).filter(t => t.type === 'minorista').sort((a, b) => a.quantity - b.quantity);
                  const mayT    = (p.tiers ?? []).filter(t => t.type === 'mayorista').sort((a, b) => a.quantity - b.quantity);
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    >
                      <td className="prod-cell"><strong>{p.name}</strong></td>
                      <td data-label="Categoría">
                        <span className="cat-pill">{p.Category?.name ?? '—'}</span>
                      </td>
                      <td data-label="Stock">
                        <div className="stock-adjust-row">
                          <button className="stock-btn" onClick={() => quickAdjust(p, -1)} disabled={p.stock === 0}>−</button>
                          <div className="stock-bar-wrap">
                            <div className="stock-bar-track">
                              <div className="stock-bar-fill" style={{
                                width: `${pct}%`,
                                background: st.cls === 'status-out' ? 'var(--coral)' : st.cls === 'status-low' ? 'var(--peach)' : 'var(--mint)',
                              }} />
                            </div>
                            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>{p.stock}</span>
                          </div>
                          <button className="stock-btn" onClick={() => quickAdjust(p, 1)}>+</button>
                        </div>
                      </td>
                      <td data-label="Minorista">
                        {minT.length === 0
                          ? <span className="tier-empty">—</span>
                          : <div className="tiers-compact">
                              {minT.map((t, idx) => (
                                <span key={idx} className="tier-badge min">
                                  x{t.quantity} <strong>{money(Number(t.price))}</strong>
                                </span>
                              ))}
                            </div>}
                      </td>
                      <td data-label="Mayorista">
                        {mayT.length === 0
                          ? <span className="tier-empty">—</span>
                          : <div className="tiers-compact">
                              {mayT.map((t, idx) => (
                                <span key={idx} className="tier-badge may">
                                  x{t.quantity} <strong>{money(Number(t.price))}</strong>
                                </span>
                              ))}
                            </div>}
                      </td>
                      <td data-label="Estado">
                        <span className={`status-pill tag-shape ${st.cls}`}>{st.label}</span>
                      </td>
                      <td data-label="Acciones">
                        <div className="row-actions">
                          <button className="icon-btn" onClick={() => openEdit(p)} title="Editar">✎</button>
                          <button className="icon-btn danger" onClick={() => handleDelete(p)} title="Dar de baja">🗑</button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProductForm
          initial={editing}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
