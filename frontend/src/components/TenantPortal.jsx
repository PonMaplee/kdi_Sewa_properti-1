import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatEther } from 'ethers';
import CountdownTimer from './CountdownTimer';
import DoorStatus from './DoorStatus';
import { formatDate, formatAddress } from '../utils/helpers';

/**
 * Portal Penyewa — halaman utama untuk penyewa
 * Menampilkan: Status sewa, countdown timer, status pintu, tombol bayar
 */
export default function TenantPortal({
  account,
  leaseStatus,
  tenantDetails,
  contractInfo,
  currentPenalty,
  txPending,
  onPayRent,
  error,
  dataLoaded,
}) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [rentalDays, setRentalDays] = useState(30);
  const isRegistered = tenantDetails?.isRegistered || false;
  const isActive = leaseStatus?.isActive || false;
  const endTime = leaseStatus?.endTime || 0n;

  const rentAmountEth = contractInfo?.rentAmount ? formatEther(contractInfo.rentAmount) : '0';
  const penaltyEth = currentPenalty ? formatEther(currentPenalty) : '0';
  const totalPaidEth = tenantDetails?.totalPaid ? formatEther(tenantDetails.totalPaid) : '0';
  const totalPenaltiesEth = tenantDetails?.totalPenalties ? formatEther(tenantDetails.totalPenalties) : '0';

  const leaseDurationDays = contractInfo?.leaseDuration ? Number(contractInfo.leaseDuration) / 86400 : 30;
  const rentPerDay = contractInfo?.rentAmount ? Number(formatEther(contractInfo.rentAmount)) / leaseDurationDays : 0;
  
  const dynamicRentEth = rentPerDay * rentalDays;
  const penaltyRate = contractInfo?.penaltyRate ? Number(contractInfo.penaltyRate) : 0;
  const hasPenalty = currentPenalty > 0n;
  const dynamicPenaltyEth = hasPenalty ? (dynamicRentEth * penaltyRate) / 100 : 0;
  const totalDueEth = dynamicRentEth + dynamicPenaltyEth;

  const handlePay = async () => {
    try {
      await onPayRent(rentalDays);
      setShowPayModal(false);
    } catch (err) {
      // Error handled by parent
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Loading state
  if (!dataLoaded) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <div className="glass-card p-8 text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4 text-primary-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <h2 className="text-xl font-semibold text-white mb-2">Memuat Data...</h2>
          <p className="text-surface-400 text-sm">Mengambil data sewa dari blockchain Sepolia</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-surface-800/80 border border-surface-700/50 rounded-2xl flex items-center justify-center text-primary-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Belum Terdaftar</h2>
          <p className="text-surface-400 mb-4">
            Alamat wallet Anda belum terdaftar sebagai penyewa. Hubungi pemilik properti untuk didaftarkan.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/50 border border-surface-700/30">
            <span className="text-xs text-surface-500">Wallet:</span>
            <span className="text-sm font-mono text-primary-400">{formatAddress(account)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Selamat datang, <span className="gradient-text">{tenantDetails?.name || 'Penyewa'}</span>
          </h2>
          <p className="text-sm text-surface-400 mt-1">
            Kamar #{tenantDetails?.roomNumber?.toString()} • {formatAddress(account)}
          </p>
        </div>
        <div className={`badge ${isActive ? 'badge-active' : 'badge-expired'} flex items-center gap-1.5`}>
          {isActive ? (
            <>
              <svg className="w-3.5 h-3.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sewa Aktif
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sewa Tidak Aktif
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="stat-label">Biaya Sewa / {leaseDurationDays} Hari</span>
          <span className="stat-value text-primary-400">{parseFloat(rentAmountEth).toFixed(4)}</span>
          <span className="text-xs text-surface-500">ETH</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Dibayar</span>
          <span className="stat-value text-accent-400">{parseFloat(totalPaidEth).toFixed(4)}</span>
          <span className="text-xs text-surface-500">ETH</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Denda</span>
          <span className="stat-value text-amber-400">{parseFloat(totalPenaltiesEth).toFixed(4)}</span>
          <span className="text-xs text-surface-500">ETH</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Denda ({rentalDays} Hari)</span>
          <span className={`stat-value ${hasPenalty ? 'text-red-400' : 'text-accent-400'}`}>
            {hasPenalty ? parseFloat(dynamicPenaltyEth).toFixed(4) : '0'}
          </span>
          <span className="text-xs text-surface-500">{hasPenalty ? 'ETH (harus dibayar)' : 'Tidak ada denda'}</span>
        </div>
      </div>

      {/* Countdown & Door Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CountdownTimer endTimestamp={endTime} isActive={isActive} />
        <DoorStatus isActive={isActive} isRegistered={isRegistered} />
      </div>

      {/* Payment Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Pembayaran Sewa
        </h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-surface-800">
            <span className="text-surface-400 text-sm">Durasi Sewa (Hari)</span>
            <input 
              type="number" 
              min="1" 
              max="365" 
              value={rentalDays} 
              onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-1 bg-surface-900 border border-surface-700 rounded-lg text-white text-right outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex justify-between items-center py-2 border-b border-surface-800">
            <span className="text-surface-400 text-sm">Biaya Sewa</span>
            <span className="font-mono font-semibold text-white">{parseFloat(dynamicRentEth).toFixed(4)} ETH</span>
          </div>
          {hasPenalty && (
            <div className="flex justify-between items-center py-2 border-b border-surface-800">
              <span className="text-red-400 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Denda Keterlambatan ({contractInfo?.penaltyRate?.toString() || '10'}%)
              </span>
              <span className="font-mono font-semibold text-red-400">+{parseFloat(dynamicPenaltyEth).toFixed(4)} ETH</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3 bg-surface-800/30 rounded-xl px-4 -mx-1">
            <span className="font-semibold text-white text-sm">Total Bayar</span>
            <span className="font-mono font-bold text-xl text-primary-400">{parseFloat(totalDueEth).toFixed(4)} ETH</span>
          </div>
        </div>

        {/* Lease info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-surface-500 mb-6 bg-surface-900/30 p-4 rounded-xl border border-surface-800/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Mulai Sewa: <strong>{formatDate(tenantDetails?.leaseStart)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Jatuh Tempo: <strong>{formatDate(tenantDetails?.leaseEnd)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Durasi: <strong>{(tenantDetails?.leaseEnd && tenantDetails?.leaseStart && tenantDetails.leaseEnd > tenantDetails.leaseStart) ? `${Math.round(Number(tenantDetails.leaseEnd - tenantDetails.leaseStart) / 86400)} hari` : '-'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Masa Tenggang: <strong>{contractInfo?.gracePeriod ? `${Number(contractInfo.gracePeriod) / 3600} jam` : '-'}</strong></span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          id="btn-pay-rent"
          onClick={handlePay}
          disabled={txPending}
          className={`w-full ${hasPenalty ? 'btn-danger' : 'btn-success'} text-lg py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50`}
        >
          {txPending ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menunggu Konfirmasi Block...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {hasPenalty ? `Bayar Sewa + Denda (${parseFloat(totalDueEth).toFixed(4)} ETH)` : `Bayar Sewa (${parseFloat(dynamicRentEth).toFixed(4)} ETH)`}
            </>
          )}
        </button>

        <p className="text-[10px] text-surface-500 text-center mt-3">
          Transaksi akan dikonfirmasi melalui MetaMask. Gas fee tambahan berlaku.
        </p>
      </div>
    </div>
  );
}
