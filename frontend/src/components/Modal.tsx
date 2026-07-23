import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export function Modal({ open = true, onClose, title, children, width = 480 }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-card"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>{title}</h3>
              <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
            </div>
            {/* children deben incluir .modal-body y opcionalmente .modal-footer */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
