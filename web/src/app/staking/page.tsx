"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import {
  Contract,
  JsonRpcProvider,
  BrowserProvider,
  formatEther,
  parseEther,
  BigNumberish,
} from "ethers";
import { Button } from "../../components/ui/button";
import { Shield, Loader2, ArrowRight, Zap, Lock, DollarSign, TrendingUp, Wallet, Clock, CheckCircle } from "lucide-react";
import MetricCard from "../../components/MetricCard";

const STAKE_CONTRACT = "0x7ff069bc532c43d1dd5777e69729cfc5d14cfce6";
const RPC_URL = "https://sepolia.base.org";

const STAKE_ABI = [
  "function config() view returns (uint128 minStake, uint128 maxStake, uint32 ujrahRateBps, uint32 minLockDays, uint32 maxLockDays, uint32 earlyWithdrawalPenaltyBps, bool isActive)",
  "function getConfig() view returns (uint256 minStake, uint256 maxStake, uint256 ujrahRateBps, uint256 minLockDays, uint256 maxLockDays, uint256 penaltyBps, bool isActive)",
  "function getPlatformStats() view returns (uint256 totalStakedAmount, uint256 totalUjrahPaidAmount, uint256 activeAkads, uint256 completedAkads, uint256 totalAkads, bool isActive, bool isPaused)",
  "function currentTermsHash() view returns (bytes32)",
  "function hasAgreedToTerms(address) view returns (bool)",
  "function agreeToTerms(bytes32)",
  "function createAkad(uint32 _lockPeriodDays) payable returns (uint256 akadId)",
  "function getUserAkads(address _user) view returns (uint256[])",
  "function getAkad(uint256 _akadId) view returns (address user, uint256 principal, uint256 ujrahAmount, uint64 startTime, uint64 endTime, uint32 lockPeriodDays, uint32 ujrahRate, uint8 status, bool ujrahClaimed)",
  "function calculateEarnedUjrah(uint256 _akadId) view returns (uint256)",
  "function calculateUjrah(uint256 _principal, uint32 _lockDays) view returns (uint256)",
  "function getTimeRemaining(uint256 _akadId) view returns (uint256)",
  "function claimUjrah(uint256 _akadId) returns (uint256)",
  "function withdrawPrincipal(uint256 _akadId)",
  "function earlyWithdrawal(uint256 _akadId)",
  "function ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function activatePlatform()",
  "function deactivatePlatform()",
  "function nextAkadId() view returns (uint256)",
  "function paused() view returns (bool)",
];

type ConfigState = {
  minStake: string;
  maxStake: string;
  ujrahRate: number;
  minLockDays: number;
  maxLockDays: number;
  penalty: number;
  isActive: boolean;
};

type StatsState = {
  totalStaked: string;
  totalUjrahPaid: string;
  activeAkads: number;
  completedAkads: number;
  totalAkads: number;
  isActive: boolean;
  isPaused: boolean;
};

type AkadData = {
  akadId: number;
  user: string;
  principal: string;
  ujrahAmount: string;
  ujrahEarned: string;
  startTime: number;
  endTime: number;
  lockPeriodDays: number;
  ujrahRateBps: number;
  status: number;
  ujrahClaimed: boolean;
  timeRemaining: number;
};

export default function StakingPage() {
  const { address: walletAddress, isConnected } = useAccount();

  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<ConfigState | null>(null);
  const [stats, setStats] = useState<StatsState | null>(null);

  const [currentTermsHash, setCurrentTermsHash] = useState<string | null>(null);
  const [hasAgreed, setHasAgreed] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedLockDays, setSelectedLockDays] = useState("30");
  const [nextAkadId, setNextAkadId] = useState(0);

  const [userAkads, setUserAkads] = useState<AkadData[]>([]);

  const termsCardRef = useRef<HTMLDivElement>(null);

  const rpcProvider = new JsonRpcProvider(RPC_URL);
  const readContract = new Contract(STAKE_CONTRACT, STAKE_ABI, rpcProvider);

  function fmtEth(n: BigNumberish): string {
    try {
      return formatEther(n);
    } catch {
      return "0";
    }
  }

  const loadPlatform = async () => {
    setLoading(true);
    setError(null);
    try {
      const conf = await readContract.config();
      setConfig({
        minStake: fmtEth(conf.minStake),
        maxStake: fmtEth(conf.maxStake),
        ujrahRate: Number(conf.ujrahRateBps) / 100,
        minLockDays: Number(conf.minLockDays),
        maxLockDays: Number(conf.maxLockDays),
        penalty: Number(conf.earlyWithdrawalPenaltyBps) / 100,
        isActive: conf.isActive,
      });

      const statsRaw = await readContract.getPlatformStats();
      setStats({
        totalStaked: fmtEth(statsRaw[0]),
        totalUjrahPaid: fmtEth(statsRaw[1]),
        activeAkads: Number(statsRaw[2]),
        completedAkads: Number(statsRaw[3]),
        totalAkads: Number(statsRaw[4]),
        isActive: statsRaw[5],
        isPaused: statsRaw[6],
      });

      const th = await readContract.currentTermsHash();
      setCurrentTermsHash(th ? th.toString() : null);
      setNextAkadId(Number(await readContract.nextAkadId()));

      if (walletAddress) {
        const agreed = await readContract.hasAgreedToTerms(walletAddress);
        setHasAgreed(agreed);
        
        try {
          const adminRole = await readContract.ADMIN_ROLE();
          const hasAdmin = await readContract.hasRole(adminRole, walletAddress);
          setIsAdmin(hasAdmin);
        } catch {
          setIsAdmin(false);
        }
      }
    } catch (err: any) {
      console.error("loadPlatform err", err);
      setError(err?.reason || err?.message || "Gagal load platform");
    } finally {
      setLoading(false);
    }
  };

  const loadUserAkads = async () => {
    if (!walletAddress) {
      setUserAkads([]);
      return;
    }
    try {
      const ids: BigNumberish[] = await readContract.getUserAkads(walletAddress);
      const idArray = ids.map((b: any) => Number(b.toString()));
      const items: AkadData[] = [];
      
      for (const id of idArray) {
        try {
          const akadResult = await readContract.getAkad(id);
          const user = akadResult[0];
          const principal = akadResult[1];
          const ujrahAmount = akadResult[2];
          const startTime = akadResult[3];
          const endTime = akadResult[4];
          const lockDays = akadResult[5];
          const ujrahRate = akadResult[6];
          const status = akadResult[7];
          const ujrahClaimed = akadResult[8];
          
          const earned = await readContract.calculateEarnedUjrah(id);
          const timeRemaining = await readContract.getTimeRemaining(id);

          items.push({
            akadId: id,
            user: user,
            principal: fmtEth(principal),
            ujrahAmount: fmtEth(ujrahAmount),
            ujrahEarned: fmtEth(earned),
            startTime: Number(startTime),
            endTime: Number(endTime),
            lockPeriodDays: Number(lockDays),
            ujrahRateBps: Number(ujrahRate),
            status: Number(status),
            ujrahClaimed,
            timeRemaining: Number(timeRemaining),
          });
        } catch (innerErr) {
          console.error("Error loading akad", id, innerErr);
        }
      }
      items.sort((a, b) => b.akadId - a.akadId);
      setUserAkads(items);
    } catch (err) {
      console.error("loadUserAkads err", err);
    }
  };

  useEffect(() => {
    loadPlatform();
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress && !loading) loadUserAkads();
  }, [walletAddress, loading]);

  const handleAgreeToTerms = async () => {
    if (!isConnected || !currentTermsHash || !window.ethereum) {
      setError("Wallet atau terms tidak siap");
      return;
    }
    setTxLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(STAKE_CONTRACT, STAKE_ABI, signer);
      const tx = await contract.agreeToTerms(currentTermsHash);
      await tx.wait();
      setHasAgreed(true);
    } catch (err: any) {
      console.error("agreeToTerms error:", err);
      setError(err?.reason || err?.message || "Gagal setuju terms");
    } finally {
      setTxLoading(false);
    }
  };

   const handleCreateAkad = async () => {
    if (!isConnected || !config || !window.ethereum) {
      setError("Wallet belum connect");
      return;
    }

    // VALIDASI: Check agreement status dari contract langsung
    try {
      const currentAgreed = await readContract.hasAgreedToTerms(walletAddress);
      if (!currentAgreed) {
        setError("⚠️ Anda belum menyetujui Terms & Conditions. Scroll ke atas untuk agree terlebih dahulu.");
        setHasAgreed(false); // Update state
        
        // Auto scroll ke terms card
        if (termsCardRef.current) {
          termsCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      // Update state jika ternyata sudah agreed
      if (!hasAgreed) setHasAgreed(true);
    } catch (checkErr) {
      console.error("Error checking agreement:", checkErr);
      setError("Gagal memeriksa status agreement. Silakan coba lagi.");
      return;
    }
    
    const amountNum = Number(selectedAmount);
    const lockDaysNum = Number(selectedLockDays);
    
    if (!selectedAmount || amountNum <= 0) {
      setError("Masukkan jumlah stake yang valid");
      return;
    }
    
    if (amountNum < Number(config.minStake) || amountNum > Number(config.maxStake)) {
      setError(`Stake harus ${config.minStake}-${config.maxStake} ETH`);
      return;
    }
    
    if (lockDaysNum < config.minLockDays || lockDaysNum > config.maxLockDays) {
      setError(`Lock period ${config.minLockDays}-${config.maxLockDays} hari`);
      return;
    }

    setTxLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(STAKE_CONTRACT, STAKE_ABI, signer);
      
      const value = parseEther(selectedAmount);
      
      // Estimasi gas terlebih dahulu untuk deteksi error lebih awal
      try {
        await contract.createAkad.estimateGas(lockDaysNum, { value });
      } catch (estimateErr: any) {
        console.error("Gas estimation failed:", estimateErr);
        
        // Check balance
        if (walletAddress) {
          const balance = await provider.getBalance(walletAddress);
          if (balance < value) {
            throw new Error(`Saldo tidak cukup. Anda memiliki ${formatEther(balance)} ETH`);
          }
        }
        
        throw new Error("Transaksi gagal validasi. Pastikan semua kondisi terpenuhi dan Anda memiliki cukup gas.");
      }
      
      const tx = await contract.createAkad(lockDaysNum, { value });
      await tx.wait();
      
      setSelectedAmount("");
      setSelectedLockDays("30");
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("createAkad error:", err);
      setError(err?.reason || err?.message || "Gagal buat akad");
    } finally {
      setTxLoading(false);
    }
  };

  const handleClaimUjrah = async (akadId: number) => {
    if (!window.ethereum) return;
    setTxLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(STAKE_CONTRACT, STAKE_ABI, signer);
      const tx = await contract.claimUjrah(akadId);
      await tx.wait();
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("claimUjrah error:", err);
      setError(err?.reason || err?.message || "Gagal klaim ujrah");
    } finally {
      setTxLoading(false);
    }
  };

  const handleWithdrawPrincipal = async (akadId: number) => {
    if (!window.ethereum) return;
    setTxLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(STAKE_CONTRACT, STAKE_ABI, signer);
      const tx = await contract.withdrawPrincipal(akadId);
      await tx.wait();
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("withdrawPrincipal error:", err);
      setError(err?.reason || err?.message || "Gagal tarik principal");
    } finally {
      setTxLoading(false);
    }
  };

  const handleEarlyWithdrawal = async (akadId: number) => {
    if (!confirm("⚠️ Early withdrawal akan dikenakan penalty. Lanjutkan?")) return;
    if (!window.ethereum) return;
    setTxLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(STAKE_CONTRACT, STAKE_ABI, signer);
      const tx = await contract.earlyWithdrawal(akadId);
      await tx.wait();
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("earlyWithdrawal error:", err);
      setError(err?.reason || err?.message || "Gagal early withdrawal");
    } finally {
      setTxLoading(false);
    }
  };

  const handleTogglePlatform = async (activate: boolean) => {
    if (!isAdmin) {
      setError("Hanya admin!");
      return;
    }
    if (!window.ethereum) return;
    setTxLoading(true);
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(STAKE_CONTRACT, STAKE_ABI, signer);
      const tx = activate 
        ? await contract.activatePlatform() 
        : await contract.deactivatePlatform();
      await tx.wait();
      await loadPlatform();
    } catch (err: any) {
      console.error("togglePlatform error:", err);
      setError(err?.reason || err?.message || "Gagal toggle platform");
    } finally {
      setTxLoading(false);
    }
  };

  const stakingPlans = [
    { days: 30, apy: "4.5%" },
    { days: 60, apy: "6.2%" },
    { days: 90, apy: "8.5%" },
  ];

  const calculateEstimatedUjrah = () => {
    if (!selectedAmount || !selectedLockDays || !config) return "0";
    const amt = parseFloat(selectedAmount);
    const days = Number(selectedLockDays);
    const rate = config.ujrahRate / 100;
    const ujrah = (amt * rate * days) / 365;
    return ujrah.toFixed(6);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-gradient-hero shadow-medium text-white">
        <div className="max-w-md mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-1">Stake ETH</h1>
          <p className="text-sm opacity-90">Staking ETH Syariah - Dapatkan Ujrah Halal</p>
          {walletAddress && (
            <p className="text-xs mt-2 opacity-80">
              {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 -mt-4 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Platform Status Warnings */}
        {stats && !stats.isActive && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-400">Platform Tidak Aktif</p>
              {isAdmin && (
                <Button onClick={() => handleTogglePlatform(true)} size="sm" disabled={txLoading} className="h-8 bg-amber-500 hover:bg-amber-600 text-white">
                  Aktifkan
                </Button>
              )}
            </div>
          </div>
        )}

        {stats && stats.isPaused && (
          <div className="bg-slate-700/30 border border-slate-600/30 rounded-2xl p-4">
            <p className="text-sm font-medium text-slate-400">Platform Dijeda</p>
          </div>
        )}

        {/* Terms Agreement Card */}
        {isConnected && !hasAgreed && (
          <div ref={termsCardRef} className="relative group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Syarat & Ketentuan</h3>
                  <p className="text-xs text-slate-400">Wajib sebelum staking</p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs text-amber-300 mb-2">⚠️ Penting:</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• Anda harus agree to terms sebelum bisa melakukan staking</li>
                  <li>• Setiap wallet hanya perlu agree sekali</li>
                  <li>• Proses ini diperlukan untuk keamanan dan kepatuhan</li>
                </ul>
              </div>

              <p className="text-sm text-slate-300">
                Dengan menyetujui, Anda memahami risiko dan aturan staking sesuai prinsip syariah.
              </p>

              <Button 
                onClick={handleAgreeToTerms} 
                disabled={txLoading} 
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/20"
              >
                {txLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                Setuju & Lanjutkan
              </Button>

              {currentTermsHash && (
                <p className="text-xs text-slate-500 text-center">
                  Hash: {currentTermsHash.slice(0, 16)}...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Create Akad Form */}
        {isConnected && hasAgreed && config && config.isActive && !stats?.isPaused && (
          <div className="relative group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Buat Akad Baru</h3>
                <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                  #{nextAkadId}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Jumlah Stake</label>
                  <input
                    type="number"
                    step="0.001"
                    min={config.minStake}
                    max={config.maxStake}
                    placeholder={`${config.minStake} - ${config.maxStake} ETH`}
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Periode Lock</label>
                  <div className="grid grid-cols-3 gap-2">
                    {stakingPlans.map((plan) => (
                      <button
                        key={plan.days}
                        onClick={() => setSelectedLockDays(plan.days.toString())}
                        className={`h-16 rounded-xl border transition-all ${
                          selectedLockDays === plan.days.toString()
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-sm font-semibold">{plan.days} Hari</div>
                        <div className="text-xs opacity-70">{plan.apy} APY</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedAmount && selectedLockDays && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Estimasi Ujrah</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {calculateEstimatedUjrah()} ETH
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreateAkad} 
                disabled={txLoading || !selectedAmount || !selectedLockDays} 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20"
              >
                {txLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Mulai Staking
              </Button>
            </div>
          </div>
        )}

        {/* User Akads */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Akad Saya</h3>
            <span className="px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary">
              {userAkads.length}
            </span>
          </div>
          
          {userAkads.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">Belum ada akad aktif</p>
              <p className="text-slate-500 text-xs mt-1">Buat akad pertama Anda sekarang</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userAkads.map(akad => {
                const now = Math.floor(Date.now() / 1000);
                const canWithdraw = akad.status === 0 && now >= akad.endTime;
                const statusMap: Record<number, { text: string; color: string }> = {
                  0: { text: "ACTIVE", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
                  1: { text: "COMPLETED", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
                  2: { text: "CANCELLED", color: "bg-red-500/10 text-red-400 border-red-500/30" }
                };
                const status = statusMap[akad.status] || statusMap[0];
                
                return (
                  <div key={akad.akadId} className="relative group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Akad #{akad.akadId}</div>
                          <div className="text-2xl font-bold text-white">{akad.principal} ETH</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs border ${status.color}`}>
                          {status.text}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs text-slate-400">Ujrah Earned</span>
                          </div>
                          <div className="text-sm font-semibold text-emerald-400">
                            {akad.ujrahEarned} ETH
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs text-slate-400">Remaining</span>
                          </div>
                          <div className="text-sm font-semibold text-blue-400">
                            {akad.timeRemaining > 0 ? `${Math.ceil(akad.timeRemaining / 86400)}d` : "Done"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!akad.ujrahClaimed && Number(akad.ujrahEarned) > 0 && (
                          <Button 
                            size="sm" 
                            onClick={() => handleClaimUjrah(akad.akadId)} 
                            disabled={txLoading}
                            className="h-8 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg"
                          >
                            <DollarSign className="w-3 h-3 mr-1" /> Claim
                          </Button>
                        )}
                        
                        {canWithdraw && (
                          <Button 
                            size="sm" 
                            onClick={() => handleWithdrawPrincipal(akad.akadId)} 
                            disabled={txLoading}
                            className="h-8 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Withdraw
                          </Button>
                        )}
                        
                        {akad.status === 0 && !canWithdraw && (
                          <Button 
                            size="sm" 
                            onClick={() => handleEarlyWithdrawal(akad.akadId)} 
                            disabled={txLoading}
                            className="h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg"
                          >
                            Early Exit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Total Staked"
              value={`${parseFloat(stats.totalStaked).toFixed(2)} ETH`}
              variant="secondary"
              icon={<Lock className="w-5 h-5" />}
            />
            <MetricCard
              title="Total Ujrah"
              value={`${parseFloat(stats.totalUjrahPaid).toFixed(4)} ETH`}
              variant="secondary"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricCard
              title="Active Akads"
              value={stats.activeAkads.toString()}
              variant="secondary"
              icon={<Zap className="w-5 h-5" />}
            />
            <MetricCard
              title="Completed"
              value={stats.completedAkads.toString()}
              variant="secondary"
              icon={<CheckCircle className="w-5 h-5" />}
            />
          </div>
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <div className="relative group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Admin Panel</h3>
                  <p className="text-xs text-slate-400">Platform Management</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  onClick={() => handleTogglePlatform(true)} 
                  disabled={txLoading || stats?.isActive}
                  className="flex-1 h-10 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg disabled:opacity-50"
                >
                  Activate
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleTogglePlatform(false)} 
                  disabled={txLoading || !stats?.isActive}
                  className="flex-1 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg disabled:opacity-50"
                >
                  Deactivate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        {config && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Platform Info</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Min Lock:</span>
                <span className="ml-2 text-slate-300 font-medium">{config.minLockDays} days</span>
              </div>
              <div>
                <span className="text-slate-500">Max Lock:</span>
                <span className="ml-2 text-slate-300 font-medium">{config.maxLockDays} days</span>
              </div>
              <div>
                <span className="text-slate-500">Ujrah Rate:</span>
                <span className="ml-2 text-emerald-400 font-medium">{config.ujrahRate}%</span>
              </div>
              <div>
                <span className="text-slate-500">Early Penalty:</span>
                <span className="ml-2 text-red-400 font-medium">{config.penalty}%</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}