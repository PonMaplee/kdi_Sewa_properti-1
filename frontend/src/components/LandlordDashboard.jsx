import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'ethers';
import { formatAddress, formatDate } from '../utils/helpers';
import CustomModal from './CustomModal';

export default function LandlordDashboard({
  account, contractInfo, tenantList, isLoading, txPending,
  onRegisterTenant, onRemoveTenant, onOverrideDoor, onWithdrawFunds, onSetAdmin, error,
}) {
  const [showForm, setShowForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newTenant, setNewTenant] = useState({ address: '', name: '', roomNumber: '', initialDays: 0 });
  const [newAdmin, setNewAdmin] = useState('');

  // Custom modal triggers
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    description: '',
    placeholder: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const triggerConfirmLock = (tenant) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Kunci Pintu Akses',
      description: `Apakah Anda yakin ingin mengunci pintu kamar #${tenant.roomNumber} untuk ${tenant.name} sekarang? Waktu sewa aktif penyewa akan direset.`,
      onConfirm: () => {
        onOverrideDoor(tenant.address, true, 0);
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerPromptUnlock = (tenant) => {
    setModal({
      isOpen: true,
      type: 'prompt',
      title: 'Buka Pintu Akses',
      description: `Masukkan jumlah hari akses sewa tambahan yang ingin Anda berikan kepada ${tenant.name}:`,
      placeholder: 'Jumlah hari (contoh: 30)',
      defaultValue: '1',
      onConfirm: (val) => {
        const parsedDays = parseInt(val);
        if (!isNaN(parsedDays) && parsedDays > 0) {
          onOverrideDoor(tenant.address, false, parsedDays);
          setModal(prev => ({ ...prev, isOpen: false }));
        } else {
          setModal({
            isOpen: true,
            type: 'alert',
            title: 'Input Tidak Valid',
            description: 'Silakan masukkan jumlah hari sewa yang valid (minimal 1 hari).',
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const triggerConfirmDelete = (tenant) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Hapus Penyewa',
      description: `Apakah Anda yakin ingin menghapus penyewa ${tenant.name} (Kamar #${tenant.roomNumber})? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        onRemoveTenant(tenant.address);
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const balanceEth = contractInfo?.balance ? formatEther(contractInfo.balance) : '0';
  const rentEth = contractInfo?.rentAmount ? formatEther(contractInfo.rentAmount) : '0';
  const activeTenants = tenantList.filter(t => t.isActive);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await onRegisterTenant(newTenant.address, newTenant.name, parseInt(newTenant.roomNumber), Number(newTenant.initialDays) || 0);
      setNewTenant({ address: '', name: '', roomNumber: '', initialDays: 0 });
      setShowForm(false);
    } catch (err) {}
  };

  const handleSetAdmin = async (e) => {
    e.preventDefault();
    try {
      await onSetAdmin(newAdmin, true);
      setNewAdmin('');
      setShowAdminForm(false);
    } catch (err) {}
  };

  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
            Dashboard <span className="gradient-text">Pemilik</span>
          </h2>
          <p className="text-sm text-surface-400 mt-1">Kelola penyewa, pantau pendapatan, dan kontrol akses pintu</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAdminForm(!showAdminForm)} className="btn-secondary text-sm flex items-center gap-2 cursor-pointer">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Tambah Admin
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-2 cursor-pointer">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tambah Penyewa
          </motion.button>
          <motion.button id="btn-withdraw" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onWithdrawFunds} disabled={txPending || contractInfo?.balance === 0n} className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tarik Dana
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card"><span className="stat-label">Total Penyewa</span><span className="stat-value">{tenantList.length}</span></div>
        <div className="stat-card"><span className="stat-label">Penyewa Aktif</span><span className="stat-value text-accent-400">{activeTenants.length}</span></div>
        <div className="stat-card"><span className="stat-label">Sewa Expired</span><span className="stat-value text-red-400">{tenantList.length - activeTenants.length}</span></div>
        <div className="stat-card border-accent-500/20"><span className="stat-label">Saldo Kontrak</span><span className="stat-value text-accent-400">{parseFloat(balanceEth).toFixed(4)}</span><span className="text-xs text-surface-500">ETH</span></div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleRegister} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Registrasi Penyewa Baru
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Alamat Wallet</label>
                  <input id="input-tenant-address" type="text" placeholder="0x..." value={newTenant.address} onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })} className="input-field font-mono text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Nama Penyewa</label>
                  <input id="input-tenant-name" type="text" placeholder="Nama lengkap" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} className="input-field text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Nomor Kamar</label>
                  <input id="input-room-number" type="number" placeholder="101" value={newTenant.roomNumber} onChange={(e) => setNewTenant({ ...newTenant, roomNumber: e.target.value })} className="input-field text-sm" required min="1" />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Akses Awal (Hari)</label>
                  <input id="input-initial-days" type="number" placeholder="0" value={newTenant.initialDays} onChange={(e) => setNewTenant({ ...newTenant, initialDays: e.target.value })} className="input-field text-sm" min="0" />
                </div>
              </div>
              {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"><p className="text-sm text-red-400">{error}</p></div>}
              <div className="flex gap-3">
                <button id="btn-register-submit" type="submit" disabled={txPending} className="btn-success text-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Daftarkan
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm cursor-pointer">Batal</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSetAdmin} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                </svg>
                Tambah Admin Baru
              </h3>
              <div className="mb-4">
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Alamat Wallet Admin</label>
                <input type="text" placeholder="0x..." value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} className="input-field font-mono text-sm w-full" required />
              </div>
              {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"><p className="text-sm text-red-400">{error}</p></div>}
              <div className="flex gap-3">
                <button type="submit" disabled={txPending} className="btn-success text-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tambah Admin
                </button>
                <button type="button" onClick={() => setShowAdminForm(false)} className="btn-secondary text-sm cursor-pointer">Batal</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="p-6 border-b border-surface-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Daftar Penyewa
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-surface-400">Memuat data penyewa...</div>
        ) : tenantList.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-surface-800 rounded-xl flex items-center justify-center text-surface-500 mb-3 border border-surface-700/50">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-surface-400 text-sm">Belum ada penyewa terdaftar</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {tenantList.map((tenant, i) => (
              <div key={tenant.address} className="p-4 sm:p-6 hover:bg-surface-800/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${tenant.isActive ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>{tenant.roomNumber}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{tenant.name}</h4>
                        <span className={tenant.isActive ? 'badge-active text-[10px]' : 'badge-expired text-[10px]'}>{tenant.isActive ? 'Aktif' : 'Expired'}</span>
                      </div>
                      <p className="text-xs font-mono text-surface-500">{formatAddress(tenant.address)}</p>
                      <p className="text-[10px] text-surface-500 mt-1">Jatuh Tempo: {formatDate(tenant.leaseEnd)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      if (tenant.isActive) {
                        triggerConfirmLock(tenant);
                      } else {
                        triggerPromptUnlock(tenant);
                      }
                    }} disabled={txPending} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer ${tenant.isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-accent-500/10 text-accent-400 border border-accent-500/20 hover:bg-accent-500/20'}`}>
                      {tenant.isActive ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Kunci
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Buka
                        </>
                      )}
                    </button>
                    <button onClick={() => triggerConfirmDelete(tenant)} disabled={txPending} className="p-1.5 rounded-lg bg-surface-800/50 text-surface-400 border border-surface-700/30 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div variants={item} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Informasi Kontrak
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><span className="text-xs text-surface-500 uppercase tracking-wider">Sewa / Bulan</span><p className="font-mono font-semibold text-white mt-1">{parseFloat(rentEth).toFixed(4)} ETH</p></div>
          <div><span className="text-xs text-surface-500 uppercase tracking-wider">Durasi Sewa</span><p className="font-semibold text-white mt-1">{contractInfo?.leaseDuration ? `${Number(contractInfo.leaseDuration) / 86400} hari` : '-'}</p></div>
          <div><span className="text-xs text-surface-500 uppercase tracking-wider">Denda</span><p className="font-semibold text-white mt-1">{contractInfo?.penaltyRate?.toString() || '0'}%</p></div>
          <div><span className="text-xs text-surface-500 uppercase tracking-wider">Masa Tenggang</span><p className="font-semibold text-white mt-1">{contractInfo?.gracePeriod ? `${Number(contractInfo.gracePeriod) / 3600} jam` : '-'}</p></div>
        </div>
      </motion.div>
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        description={modal.description}
        placeholder={modal.placeholder}
        defaultValue={modal.defaultValue}
        onConfirm={modal.onConfirm}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </motion.div>
  );
}
