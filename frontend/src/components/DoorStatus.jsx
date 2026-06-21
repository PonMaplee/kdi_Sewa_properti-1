import { motion } from 'framer-motion';

/**
 * Komponen visualisasi status kunci pintu IoT
 */
export default function DoorStatus({ isActive, isRegistered }) {
  const isUnlocked = isActive && isRegistered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 overflow-hidden relative"
    >
      {/* Background glow */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        isUnlocked 
          ? 'bg-gradient-to-br from-accent-500/5 to-transparent' 
          : 'bg-gradient-to-br from-red-500/5 to-transparent'
      }`} />

      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Status Kunci Pintu IoT
        </h3>

        <div className="flex items-center gap-6">
          {/* Door icon with fluid bounce micro-animation */}
          <motion.div
            key={isUnlocked ? 'unlocked' : 'locked'}
            initial={{ scale: 0.85, rotate: isUnlocked ? -10 : 10, opacity: 0.7 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            className={`w-20 h-24 rounded-xl flex items-center justify-center
              ${isUnlocked 
                ? 'bg-accent-500/10 border-2 border-accent-500/30 shadow-neon-green' 
                : 'bg-red-500/10 border-2 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
          >
            {isUnlocked ? (
              <svg className="w-10 h-10 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </motion.div>

          {/* Status text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={isUnlocked ? 'door-unlocked' : 'door-locked'} />
              <span className={`text-xl font-bold ${isUnlocked ? 'text-accent-400' : 'text-red-400'}`}>
                {isUnlocked ? 'TERBUKA' : 'TERKUNCI'}
              </span>
            </div>
            <p className="text-sm text-surface-400">
              {isUnlocked 
                ? 'Akses pintu aktif. Smart lock dalam mode unlock.' 
                : !isRegistered 
                  ? 'Anda belum terdaftar sebagai penyewa.'
                  : 'Akses ditolak. Silakan bayar sewa untuk membuka akses.'
              }
            </p>

            {/* IoT sync indicator */}
            <div className="flex items-center gap-1.5 mt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-[10px] text-surface-500 uppercase tracking-wider">
                IoT Sync Active • MQTT Protocol
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
