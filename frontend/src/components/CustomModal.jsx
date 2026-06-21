import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * CustomModal - Premium fluid modal popup to replace native alert, confirm, and prompt
 */
export default function CustomModal({ isOpen, type, title, description, placeholder, defaultValue, onConfirm, onClose }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue || '');
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur & fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-950/60 backdrop-blur-md"
          />

          {/* Modal box spring entry */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-surface-900 border border-surface-800/80 rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
          >
            {/* Sleek corner design glows */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                {title.toLowerCase().includes('hapus') || title.toLowerCase().includes('kunci') || title.toLowerCase().includes('gagal') || title.toLowerCase().includes('valid') ? (
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                  <p className="text-sm text-surface-400 mt-1 leading-relaxed">{description}</p>
                </div>
              </div>

              {type === 'prompt' && (
                <div className="mt-2">
                  <input
                    type="number"
                    required
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="input-field text-sm font-semibold"
                    autoFocus
                    min="1"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                {type !== 'alert' && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary text-sm px-5 py-2.5 rounded-xl cursor-pointer hover:bg-surface-800 transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className={`text-sm px-5 py-2.5 rounded-xl cursor-pointer font-semibold transition-all ${
                    title.toLowerCase().includes('hapus') || title.toLowerCase().includes('kunci')
                      ? 'btn-danger'
                      : 'btn-primary'
                  }`}
                >
                  {type === 'alert' ? 'OK' : 'Konfirmasi'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
