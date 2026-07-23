import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useCreateExpense, useDeleteExpense, useExpenses } from '../../api/hooks';
import { Modal } from '../../components/Modal';
import { SkeletonTable } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

function money(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

const CATEGORIES = ['Alquiler', 'Proveedores', 'Servicios', 'Sueldos', 'Marketing', 'Flete', 'Otro'];
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { category: CATEGORIES[0], description: '', amount: '', expenseDate: today(), paymentMethod: 'efectivo' };

export function Gastos() {
  const { data: expenses = [], isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const { show } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const totalMes = expenses
    .filter((e) => new Date(e.expense_date).getMonth() === new Date().getMonth())
    .reduce((s, e) => s + Number(e.amount), 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await createExpense.mutateAsync({
        category: form.category,
        description: form.description || undefined,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        paymentMethod: (form.paymentMethod || 'efectivo') as any,
      });
      show('Gasto cargado correctamente');
      setForm(emptyForm);
      setModalOpen(false);
    } catch {
      show('No se pudo cargar el gasto', 'error');
    }
  }

  async function handleDelete(id: number, category: string) {
    if (!confirm(`¿Eliminar el gasto de "${category}"?`)) return;
    try {
      await deleteExpense.mutateAsync(id);
      show('Gasto eliminado');
    } catch {
      show('No se pudo eliminar el gasto', 'error');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Gastos</h1>
          <p>{money(totalMes)} gastados este mes</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Nuevo gasto</button>
      </header>

      {isLoading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : expenses.length === 0 ? (
        <div className="card empty-state">
          <p className="empty-emoji">🧾</p>
          <h3>Todavia no cargaste gastos</h3>
          <p>Registra alquiler, proveedores, sueldos o cualquier gasto del comercio para verlo reflejado en Reportes.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table>
            <thead><tr><th>Fecha</th><th>Categoria</th><th>Descripcion</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {expenses.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                  <td>{new Date(e.expense_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td data-label="Categoria"><span className="cat-pill">{e.category}</span></td>
                  <td data-label="Descripcion" style={{ color: 'var(--mauve-soft)' }}>{e.description || '—'}</td>
                  <td data-label="Monto" style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, color: 'var(--coral-deep)' }}>−{money(Number(e.amount))}</td>
                  <td data-label="Acciones"><button className="icon-btn danger" onClick={() => handleDelete(e.id, e.category)} title="Eliminar">🗑</button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo gasto">
        <div className="modal-body">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Categoria</label>
            <select className="select-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field"><label>Descripcion (opcional)</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Flete proveedor textil" /></div>
          <div className="field-row">
            <div className="field"><label>Monto</label><input type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="field"><label>Fecha</label><input type="date" required value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></div>
          </div>
          <button className="btn-primary big" type="submit" disabled={createExpense.isPending}>Cargar gasto</button>
        </form>
        </div>
      </Modal>
    </>
  );
}
