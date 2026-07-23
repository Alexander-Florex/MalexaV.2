import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useCreateEmployee, useEmployees, useUpdateEmployee } from '../../api/hooks';
import { Modal } from '../../components/Modal';
import { SkeletonTable } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const emptyForm = { name: '', email: '', password: '', role: 'employee' as 'admin' | 'employee' };

export function Empleados() {
  const { user } = useAuth();
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const { show } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createEmployee.mutateAsync(form);
      show(`"${form.name}" se agrego al equipo`);
      setForm(emptyForm);
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo crear el usuario');
    }
  }

  async function toggleActive(id: number, active: boolean, name: string) {
    if (id === user?.id) return;
    try {
      await updateEmployee.mutateAsync({ id, data: { active: !active } });
      show(active ? `${name} fue desactivado` : `${name} fue reactivado`);
    } catch {
      show('No se pudo actualizar el usuario', 'error');
    }
  }

  async function changeRole(id: number, role: 'admin' | 'employee') {
    try {
      await updateEmployee.mutateAsync({ id, data: { role } });
      show('Rol actualizado');
    } catch {
      show('No se pudo cambiar el rol', 'error');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Empleados</h1>
          <p>{employees.length} usuarios con acceso a Percha</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setError(null); setModalOpen(true); }}>+ Nuevo empleado</button>
      </header>

      {isLoading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : (
        <div className="card table-card">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {employees.map((emp, i) => (
                <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                  <td>
                    <div className="prod-cell">
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{emp.name[0]}</div>
                      <div><p>{emp.name}{emp.id === user?.id && <span style={{ color: 'var(--mauve-soft)', fontWeight: 500 }}> (vos)</span>}</p></div>
                    </div>
                  </td>
                  <td data-label="Email" style={{ color: 'var(--mauve-soft)' }}>{emp.email}</td>
                  <td data-label="Rol">
                    <select className="select-input compact" value={emp.role} onChange={(e) => changeRole(emp.id, e.target.value as 'admin' | 'employee')} disabled={emp.id === user?.id}>
                      <option value="admin">Administrador</option>
                      <option value="employee">Empleado</option>
                    </select>
                  </td>
                  <td data-label="Estado">
                    <span className={`status-pill tag-shape ${emp.active ? 'status-instock' : 'status-out'}`}>{emp.active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td data-label="Acciones">
                    <button className="icon-btn" disabled={emp.id === user?.id} onClick={() => toggleActive(emp.id, emp.active, emp.name)} title={emp.active ? 'Desactivar' : 'Reactivar'}>
                      {emp.active ? '⏸' : '▶'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo empleado">
        <div className="modal-body">
          <form className="form-grid" onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            <div className="field"><label>Nombre</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Contraseña</label><input type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="field">
              <label>Rol</label>
              <select className="select-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'employee' })}>
                <option value="employee">Empleado (vista de ventas)</option>
                <option value="admin">Administrador (acceso total)</option>
              </select>
            </div>
            <button className="btn-primary big" type="submit" disabled={createEmployee.isPending}>Crear usuario</button>
          </form>
        </div>
      </Modal>
    </>
  );
}
