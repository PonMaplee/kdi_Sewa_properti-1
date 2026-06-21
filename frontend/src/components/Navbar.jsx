import { motion } from 'framer-motion';
import { formatAddress } from '../utils/helpers';
import { SUPPORTED_CHAINS } from '../utils/constants';

/**
 * Komponen Navbar dengan wallet connection
 */
export default function Navbar({ account, chainId, isOwner, isConnecting, onConnect, onDisconnect, currentView, onViewChange }) {
  const chainInfo = chainId ? SUPPORTED_CHAINS[chainId] : null;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-surface-950/70 border-b border-surface-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Digital Lease</h1>
              <p className="text-[10px] text-surface-500 -mt-0.5 hidden sm:block">Sewa Kost Terdesentralisasi</p>
            </div>
          </div>

          {/* Navigation tabs (visible when connected) */}
          {account && (
            <div className="hidden md:flex items-center gap-1 bg-surface-800/30 rounded-xl p-1">
              {isOwner && (
                <button
                  id="nav-dashboard"
                  onClick={() => onViewChange('dashboard')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    currentView === 'dashboard'
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-surface-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                  Dashboard
                </button>
              )}
              <button
                id="nav-tenant"
                onClick={() => onViewChange('tenant')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  currentView === 'tenant'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-surface-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Portal Sewa
              </button>
            </div>
          )}

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {account ? (
              <div className="flex items-center gap-3">
                {/* Chain badge */}
                {chainInfo && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800/50 border border-surface-700/30">
                    <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
                    <span className="text-xs text-surface-300">{chainInfo.name}</span>
                  </div>
                )}

                {/* Role badge */}
                {isOwner ? (
                  <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    ADMIN
                  </span>
                ) : (
                  <span className="badge bg-primary-500/15 text-primary-400 border border-primary-500/30 text-[10px] flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    TENANT
                  </span>
                )}

                {/* Address + Disconnect */}
                <button
                  id="btn-disconnect"
                  onClick={onDisconnect}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800/50 border border-surface-700/30 
                           hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-200 group"
                >
                  <span className="text-sm font-mono text-surface-300 group-hover:text-red-400 transition-colors">
                    {formatAddress(account)}
                  </span>
                  <svg className="w-4 h-4 text-surface-500 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <motion.button
                id="btn-connect-wallet"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConnect}
                disabled={isConnecting}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Hubungkan Wallet
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {account && (
        <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {isOwner && (
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentView === 'dashboard' ? 'bg-primary-600/20 text-primary-400' : 'text-surface-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Dashboard
            </button>
          )}
          <button
            onClick={() => onViewChange('tenant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentView === 'tenant' ? 'bg-primary-600/20 text-primary-400' : 'text-surface-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Portal
          </button>
        </div>
      )}
    </motion.nav>
  );
}
