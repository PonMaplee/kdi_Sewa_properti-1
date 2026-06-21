import { motion } from 'framer-motion';
import { useCountdown } from '../hooks/useCountdown';

/**
 * Komponen Countdown Timer untuk sisa waktu sewa
 */
export default function CountdownTimer({ endTimestamp, isActive }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(endTimestamp);

  if (!endTimestamp || endTimestamp === 0n) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-surface-400 text-sm">Belum ada data sewa aktif</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-6 border ${
        expired 
          ? 'border-red-500/30 bg-red-500/5' 
          : isActive 
            ? 'border-accent-500/30 bg-accent-500/5' 
            : 'border-amber-500/30 bg-amber-500/5'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider flex items-center gap-2">
          {expired ? (
            <>
              <svg className="w-4 h-4 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sewa Berakhir
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-primary-400 animate-spin" style={{ animationDuration: '6s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sisa Waktu Sewa
            </>
          )}
        </h3>
        <div className={expired ? 'door-locked' : isActive ? 'door-unlocked' : 'door-locked'} />
      </div>

      {/* Countdown digits */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { value: days, label: 'Hari' },
          { value: hours, label: 'Jam' },
          { value: minutes, label: 'Menit' },
          { value: seconds, label: 'Detik' },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className={`text-3xl sm:text-4xl font-black font-mono tabular-nums ${
              expired ? 'text-red-400' : 'text-white'
            }`}>
              {String(item.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-surface-500 mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      {!expired && (
        <div className="mt-4">
          <div className="h-1 w-full bg-surface-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-primary-500"
              initial={{ width: '100%' }}
              animate={{ width: expired ? '0%' : `${Math.max(5, (days / 30) * 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      )}

      {expired && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-400 font-medium">
            Masa sewa telah habis. Akses pintu dikunci otomatis.
          </p>
        </div>
      )}
    </motion.div>
  );
}
