import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

/**
 * Custom Hook: useWeb3
 * 
 * Hook utama untuk semua interaksi Web3 menggunakan Ethers.js v6.
 * Menangani: koneksi wallet, pembacaan status, transaksi pembayaran,
 * dan event listener real-time.
 */
export function useWeb3() {
  // ============ State ============
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Contract data
  const [leaseStatus, setLeaseStatus] = useState({ isActive: false, endTime: 0n });
  const [tenantDetails, setTenantDetails] = useState(null);
  const [contractInfo, setContractInfo] = useState({
    rentAmount: 0n,
    leaseDuration: 0n,
    penaltyRate: 0n,
    gracePeriod: 0n,
    balance: 0n,
    tenantCount: 0n,
  });
  const [currentPenalty, setCurrentPenalty] = useState(0n);
  const [tenantList, setTenantList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const contractRef = useRef(null);

  // ============ 1. Koneksi Wallet ============
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask tidak terdeteksi! Silakan install MetaMask.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Ethers.js v6: BrowserProvider menggantikan Web3Provider
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const userSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(userSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      // Cek apakah user adalah owner kontrak
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, browserProvider);
      contractRef.current = contract;

      try {
        const ownerAddress = await contract.owner();
        setIsOwner(ownerAddress.toLowerCase() === accounts[0].toLowerCase());
        const adminStatus = await contract.isAdmin(accounts[0]);
        setIsAdmin(adminStatus);
      } catch (e) {
        console.warn('Gagal membaca owner/admin kontrak:', e.message);
        setIsOwner(false);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Gagal koneksi wallet:', err);
      setError(err.message || 'Gagal menghubungkan wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ============ 2. Membaca Status (Read-Only) ============
  const fetchLeaseStatus = useCallback(async (targetAddress = null) => {
    if (!provider) return;

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const addr = targetAddress || account;
      if (!addr) return;

      const [isActive, endTime] = await contract.getLeaseStatus(addr);
      setLeaseStatus({ isActive, endTime });

      // Ambil detail lengkap
      const details = await contract.getTenantDetails(addr);
      setTenantDetails({
        name: details[0],
        roomNumber: details[1],
        leaseStart: details[2],
        leaseEnd: details[3],
        isActive: details[4],
        isRegistered: details[5],
        totalPaid: details[6],
        totalPenalties: details[7],
      });

      // Ambil denda saat ini (estimasi 30 hari)
      const penalty = await contract.getCurrentPenalty(addr, 30);
      setCurrentPenalty(penalty);
    } catch (err) {
      console.error('Gagal membaca status sewa:', err);
      // Reset ke default jika gagal baca (misal akun tidak terdaftar)
      setTenantDetails(null);
      setLeaseStatus({ isActive: false, endTime: 0n });
      setCurrentPenalty(0n);
    } finally {
      setDataLoaded(true);
    }
  }, [provider, account]);

  // ============ 3. Ambil Info Kontrak ============
  const fetchContractInfo = useCallback(async () => {
    if (!provider) return;

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const [rentAmount, leaseDuration, penaltyRate, gracePeriod, balance, tenantCount] = 
        await Promise.all([
          contract.rentAmount(),
          contract.leaseDuration(),
          contract.penaltyRate(),
          contract.gracePeriod(),
          contract.getContractBalance(),
          contract.getTenantCount(),
        ]);

      setContractInfo({ rentAmount, leaseDuration, penaltyRate, gracePeriod, balance, tenantCount });
    } catch (err) {
      console.error('Gagal membaca info kontrak:', err);
    }
  }, [provider]);

  // ============ 4. Ambil Daftar Penyewa ============
  const fetchTenantList = useCallback(async () => {
    if (!provider) return;

    setIsLoading(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = await contract.getTenantCount();
      const list = [];

      for (let i = 0; i < Number(count); i++) {
        const addr = await contract.getTenantByIndex(i);
        const details = await contract.getTenantDetails(addr);
        const [isActive, endTime] = await contract.getLeaseStatus(addr);
        
        list.push({
          address: addr,
          name: details[0],
          roomNumber: Number(details[1]),
          leaseStart: details[2],
          leaseEnd: details[3],
          isActive,
          isRegistered: details[5],
          totalPaid: details[6],
          totalPenalties: details[7],
        });
      }

      setTenantList(list);
    } catch (err) {
      console.error('Gagal membaca daftar penyewa:', err);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // ============ 5. Transaksi Pembayaran (Write) ============
  const payRent = useCallback(async (days = 30, amountInEth = null) => {
    if (!signer) {
      setError('Wallet belum terhubung');
      throw new Error('Wallet belum terhubung');
    }

    setTxPending(true);
    setError(null);

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Gunakan jumlah yang diberikan atau jumlah sewa dihitung berdasarkan hari
      let value;
      if (amountInEth) {
        value = parseEther(amountInEth.toString());
      } else {
        const rentAmt = await contract.rentAmount();
        const leaseDuration = await contract.leaseDuration();
        const requiredRent = (rentAmt * BigInt(days)) / (leaseDuration / 86400n);
        const penalty = await contract.getCurrentPenalty(account, days);
        value = requiredRent + penalty;
      }

      // Kirim transaksi
      const tx = await contract.payRent(days, { value });
      console.log('Menunggu konfirmasi block...', tx.hash);

      // Tunggu konfirmasi
      const receipt = await tx.wait();
      console.log('Pembayaran sukses! Block:', receipt.blockNumber);

      // Refresh data
      await Promise.all([
        fetchLeaseStatus(),
        fetchContractInfo(),
      ]);

      return receipt;
    } catch (err) {
      console.error('Gagal bayar:', err);
      setError(err.reason || err.message || 'Transaksi gagal');
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [signer, account, fetchLeaseStatus, fetchContractInfo]);

  // ============ 6. Registrasi Penyewa (Owner Only) ============
  const registerTenant = useCallback(async (tenantAddress, name, roomNumber, initialDays = 0) => {
    if (!signer || !isAdmin) {
      throw new Error('Hanya admin yang bisa mendaftarkan penyewa');
    }

    setTxPending(true);
    setError(null);

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.registerTenant(tenantAddress, name, roomNumber, initialDays);
      await tx.wait();

      await Promise.all([fetchTenantList(), fetchContractInfo()]);
      return tx;
    } catch (err) {
      console.error('Gagal registrasi:', err);
      setError(err.reason || err.message);
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [signer, isAdmin, fetchTenantList, fetchContractInfo]);

  // ============ 7. Override Akses Pintu (Owner Only) ============
  const overrideDoor = useCallback(async (tenantAddress, lock, additionalDays = 0) => {
    if (!signer || !isAdmin) {
      throw new Error('Hanya admin yang bisa mengontrol akses');
    }

    setTxPending(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.overrideDoorAccess(tenantAddress, lock, additionalDays);
      await tx.wait();

      await fetchTenantList();
      return tx;
    } catch (err) {
      console.error('Gagal override pintu:', err);
      setError(err.reason || err.message);
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [signer, isAdmin, fetchTenantList]);

  // ============ 8. Hapus Penyewa (Owner Only) ============
  const removeTenant = useCallback(async (tenantAddress) => {
    if (!signer || !isAdmin) {
      throw new Error('Hanya admin yang bisa menghapus penyewa');
    }

    setTxPending(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.removeTenant(tenantAddress);
      await tx.wait();

      await Promise.all([fetchTenantList(), fetchContractInfo()]);
      return tx;
    } catch (err) {
      setError(err.reason || err.message);
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [signer, isAdmin, fetchTenantList, fetchContractInfo]);

  // ============ 9. Tarik Dana (Owner Only) ============
  const withdrawFunds = useCallback(async () => {
    if (!signer || !isOwner) {
      throw new Error('Hanya pemilik yang bisa menarik dana');
    }

    setTxPending(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.withdrawFunds();
      await tx.wait();

      await fetchContractInfo();
      return tx;
    } catch (err) {
      setError(err.reason || err.message);
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [signer, isOwner, fetchContractInfo]);

  // ============ 9b. Set Admin ============
  const setAdmin = useCallback(async (adminAddress, status) => {
    if (!signer || !isAdmin) {
      throw new Error('Hanya admin yang bisa menambah/menghapus admin');
    }

    setTxPending(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.setAdmin(adminAddress, status);
      await tx.wait();
      return tx;
    } catch (err) {
      setError(err.reason || err.message);
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [signer, isAdmin]);

  // ============ 10. Event Listeners ============
  useEffect(() => {
    if (!provider || !account) return;

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Listen: RentPaid
    const handleRentPaid = (tenant, amount, newEndTime) => {
      console.log(`🏠 Sewa dibayar oleh ${tenant}: ${formatEther(amount)} ETH`);
      if (tenant.toLowerCase() === account.toLowerCase()) {
        fetchLeaseStatus();
      }
      if (isAdmin) {
        fetchTenantList();
        fetchContractInfo();
      }
    };

    // Listen: LeaseExpired
    const handleLeaseExpired = (tenant) => {
      console.log(`⚠️ Sewa expired untuk ${tenant}`);
      if (tenant.toLowerCase() === account.toLowerCase()) {
        fetchLeaseStatus();
      }
      if (isAdmin) {
        fetchTenantList();
      }
    };

    // Listen: TenantRegistered
    const handleTenantRegistered = (tenant, name, roomNumber) => {
      console.log(`✅ Penyewa baru: ${name} (Kamar ${roomNumber})`);
      if (isAdmin) {
        fetchTenantList();
        fetchContractInfo();
      }
      if (tenant.toLowerCase() === account.toLowerCase()) {
        fetchLeaseStatus();
      }
    };

    // Listen: DoorAccessOverride
    const handleDoorOverride = (tenant, locked) => {
      console.log(`🚪 Akses pintu ${locked ? 'dikunci' : 'dibuka'} untuk ${tenant}`);
      if (tenant.toLowerCase() === account.toLowerCase()) {
        fetchLeaseStatus();
      }
    };

    contract.on('RentPaid', handleRentPaid);
    contract.on('LeaseExpired', handleLeaseExpired);
    contract.on('TenantRegistered', handleTenantRegistered);
    contract.on('DoorAccessOverride', handleDoorOverride);

    // Cleanup listeners
    return () => {
      contract.off('RentPaid', handleRentPaid);
      contract.off('LeaseExpired', handleLeaseExpired);
      contract.off('TenantRegistered', handleTenantRegistered);
      contract.off('DoorAccessOverride', handleDoorOverride);
    };
  }, [provider, account, isOwner, isAdmin, fetchLeaseStatus, fetchTenantList, fetchContractInfo]);

  // ============ 11. Deteksi Perubahan Account/Network ============
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
        setProvider(null);
        setIsOwner(false);
        setDataLoaded(false);
      } else {
        // Reset semua data tenant sebelum reconnect ke akun baru
        setTenantDetails(null);
        setLeaseStatus({ isActive: false, endTime: 0n });
        setCurrentPenalty(0n);
        setTenantList([]);
        setDataLoaded(false);
        setAccount(accounts[0]);
        connectWallet(); // Reconnect
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet]);

  // ============ 12. Auto-fetch data saat terhubung ============
  useEffect(() => {
    if (provider && account) {
      fetchLeaseStatus();
      fetchContractInfo();
      if (isAdmin) {
        fetchTenantList();
      }
    }
  }, [provider, account, isOwner, isAdmin, fetchLeaseStatus, fetchContractInfo, fetchTenantList]);

  // ============ 13. Disconnect Wallet ============
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsOwner(false);
    setIsAdmin(false);
    setLeaseStatus({ isActive: false, endTime: 0n });
    setTenantDetails(null);
    setCurrentPenalty(0n);
    setTenantList([]);
    setError(null);
    setDataLoaded(false);
  }, []);

  return {
    // State
    provider,
    signer,
    account,
    chainId,
    isOwner,
    isAdmin,
    dataLoaded,
    isConnecting,
    isLoading,
    txPending,
    error,
    leaseStatus,
    tenantDetails,
    contractInfo,
    currentPenalty,
    tenantList,

    // Actions
    connectWallet,
    disconnectWallet,
    payRent,
    registerTenant,
    overrideDoor,
    removeTenant,
    withdrawFunds,
    setAdmin,
    fetchLeaseStatus,
    fetchContractInfo,
    fetchTenantList,
    setError,
  };
}
