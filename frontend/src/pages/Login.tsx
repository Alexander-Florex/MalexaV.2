import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [leaving, setLeaving]   = useState(false);
  const [destination, setDestination] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      setDestination(user.role === 'admin' ? '/admin' : '/pos');
      setLeaving(true); // dispara la animación de salida; navegamos al completarse
    } catch {
      setError('Email o contraseña incorrectos. Verificá tus datos.');
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <AnimatePresence mode="wait" onExitComplete={() => destination && navigate(destination)}>
        {!leaving && (
          <motion.div
            key="login-shell-wrap"
            className="login-shell-wrap"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div className="login-shell-halo" aria-hidden="true" />
            <div className="login-shell">
              {/* Panel izquierdo */}
              <div className="login-brand-panel">
                <motion.div className="login-logo-wrap"
                  initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 18 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4a2 2 0 1 1 2 2v1l8 5a2 2 0 0 1-1 3.7H3A2 2 0 0 1 2 12l8-5V6a2 2 0 0 1 2-2Z"/>
                  </svg>
                </motion.div>
                <motion.h1 className="login-brand-name"
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}>
                  Malexa
                </motion.h1>
                <motion.p className="login-brand-tagline"
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}>
                  El sistema de gestión para tu tienda de indumentaria
                </motion.p>

                <div className="login-features">
                  {[
                    { icon: '📦', label: 'Control de stock en tiempo real' },
                    { icon: '💰', label: 'Ventas local y por live' },
                    { icon: '📊', label: 'Reportes y métricas' },
                    { icon: '👥', label: 'Multi-empleado con roles' },
                  ].map((f, i) => (
                    <motion.div key={i} className="login-feature-item"
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.22 + i * 0.08 }}>
                      <span className="lfi-icon">{f.icon}</span>
                      <span>{f.label}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div className="login-brand-footer"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}>
                  <span className="login-version">v3.0</span>
                </motion.div>
              </div>

              {/* Panel derecho */}
              <div className="login-form-panel">
                <div className="login-form-inner">
                  <motion.div className="login-form-header"
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}>
                    <h2 className="login-form-title">Bienvenida de nuevo</h2>
                    <p className="login-form-sub">Ingresá con tu cuenta para continuar</p>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div className="login-error"
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.2 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="login-form">
                    {/* Email */}
                    <motion.div className="lf-field"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}>
                      <label className="lf-label" htmlFor="lf-email">Email</label>
                      <div className="lf-input-wrap">
                        <svg className="lf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/>
                        </svg>
                        <input
                          id="lf-email"
                          className="lf-input"
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </motion.div>

                    {/* Contraseña */}
                    <motion.div className="lf-field"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.27 }}>
                      <label className="lf-label" htmlFor="lf-password">Contraseña</label>
                      <div className="lf-input-wrap">
                        <svg className="lf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <input
                          id="lf-password"
                          className="lf-input"
                          type={showPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                        <button type="button" className="lf-eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                          {showPass ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </motion.div>

                    <motion.button
                      type="submit"
                      className={`lf-submit${loading ? ' loading' : ''}`}
                      disabled={loading}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.34 }}
                      whileHover={!loading ? { scale: 1.015 } : undefined}
                      whileTap={!loading ? { scale: 0.985 } : undefined}
                    >
                      {loading ? <span className="lf-spinner" /> : <>Ingresar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                    </motion.button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}