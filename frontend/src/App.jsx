import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import React from 'react';
import { useWeb3 } from './hooks/useWeb3';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import TenantPortal from './components/TenantPortal';
import LandlordDashboard from './components/LandlordDashboard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#333' }}>
          <h2>Something went wrong in TenantPortal.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const web3 = useWeb3();
  const [currentView, setCurrentView] = useState('tenant');

  // Auto-set view based on role
  const effectiveView = web3.isAdmin && currentView === 'dashboard' ? 'dashboard' : 'tenant';

  const handlePayRent = async (days) => {
    try {
      await web3.payRent(days);
      toast.success('🎉 Pembayaran berhasil! Pintu akan segera terbuka.', { duration: 5000, style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(16,185,129,0.3)' } });
    } catch (err) {
      toast.error(err.reason || err.message || 'Transaksi gagal', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' } });
    }
  };

  const handleRegister = async (addr, name, room, initialDays) => {
    try {
      await web3.registerTenant(addr, name, room, initialDays);
      toast.success('🎉 Penyewa berhasil didaftarkan!', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(16,185,129,0.3)' } });
    } catch (err) {
      toast.error(err.reason || err.message || 'Gagal mendaftarkan penyewa', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' } });
    }
  };

  const handleOverrideDoor = async (addr, lock, additionalDays = 0) => {
    try {
      await web3.overrideDoor(addr, lock, additionalDays);
      toast.success(lock ? '🚪 Pintu dikunci manual' : '🚪 Pintu dibuka manual', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(99,102,241,0.3)' } });
    } catch (err) {
      toast.error(err.reason || err.message || 'Gagal mengubah akses', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' } });
    }
  };

  const handleRemoveTenant = async (addr) => {
    try {
      await web3.removeTenant(addr);
      toast.success('🗑️ Penyewa dihapus', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(16,185,129,0.3)' } });
    } catch (err) {
      toast.error(err.reason || err.message || 'Gagal menghapus', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' } });
    }
  };

  const handleWithdraw = async () => {
    try {
      await web3.withdrawFunds();
      toast.success('💰 Dana berhasil ditarik!', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(16,185,129,0.3)' } });
    } catch (err) {
      toast.error(err.reason || err.message || 'Gagal menarik dana', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' } });
    }
  };

  const handleSetAdmin = async (addr, status) => {
    try {
      await web3.setAdmin(addr, status);
      toast.success(status ? '✅ Admin berhasil ditambahkan' : '❌ Admin dihapus', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(16,185,129,0.3)' } });
    } catch (err) {
      toast.error(err.reason || err.message || 'Gagal mengubah status admin', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' } });
    }
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />

      <Navbar
        account={web3.account}
        chainId={web3.chainId}
        isOwner={web3.isAdmin || web3.isOwner}
        isConnecting={web3.isConnecting}
        onConnect={web3.connectWallet}
        onDisconnect={web3.disconnectWallet}
        currentView={effectiveView}
        onViewChange={setCurrentView}
      />

      {!web3.account ? (
        <LandingHero onConnect={web3.connectWallet} isConnecting={web3.isConnecting} />
      ) : effectiveView === 'dashboard' && web3.isAdmin ? (
        <LandlordDashboard
          account={web3.account}
          contractInfo={web3.contractInfo}
          tenantList={web3.tenantList}
          isLoading={web3.isLoading}
          txPending={web3.txPending}
          onRegisterTenant={handleRegister}
          onRemoveTenant={handleRemoveTenant}
          onOverrideDoor={handleOverrideDoor}
          onWithdrawFunds={handleWithdraw}
          onSetAdmin={handleSetAdmin}
          error={web3.error}
        />
      ) : (
        <ErrorBoundary>
          <TenantPortal
            account={web3.account}
            leaseStatus={web3.leaseStatus}
            tenantDetails={web3.tenantDetails}
            contractInfo={web3.contractInfo}
            currentPenalty={web3.currentPenalty}
            txPending={web3.txPending}
            onPayRent={handlePayRent}
            error={web3.error}
            dataLoaded={web3.dataLoaded}
          />
        </ErrorBoundary>
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 text-center border-t border-surface-800/50">
        <p className="text-xs text-surface-600">
          Digital Lease © {new Date().getFullYear()} • Powered by Ethereum & IoT
        </p>
      </footer>
    </div>
  );
}
