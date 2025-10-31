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
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  ArrowRight,
  Zap,
  Lock,
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { NETWORK_CONFIG } from "@/config/network";

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
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);

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

  const rpcProvider = new JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  const readContract = new Contract(
    NETWORK_CONFIG.stakeContract,
    STAKE_ABI,
    rpcProvider
  );

  function formatEthValue(n: BigNumberish): string {
    try {
      return formatEther(n);
    } catch {
      return "0";
    }
  }

  const checkNetwork = async () => {
    if (!window.ethereum || !isConnected) {
      setWrongNetwork(false);
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = "0x" + network.chainId.toString(16);
      setCurrentChainId(chainId);

      if (network.chainId !== BigInt(NETWORK_CONFIG.chainIdDecimal)) {
        setWrongNetwork(true);
      } else {
        setWrongNetwork(false);
      }
    } catch (err) {
      console.error("checkNetwork error:", err);
    }
  };

  const switchToFlowNetwork = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected");
      return;
    }

    setTxLoading(true);
    setError(null);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });

      setWrongNetwork(false);
      await checkNetwork();
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: NETWORK_CONFIG.chainId,
                chainName: NETWORK_CONFIG.chainName,
                nativeCurrency: {
                  name: NETWORK_CONFIG.nativeSymbol,
                  symbol: NETWORK_CONFIG.nativeSymbol,
                  decimals: 18,
                },
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                blockExplorerUrls: [NETWORK_CONFIG.explorerUrl],
              },
            ],
          });

          setWrongNetwork(false);
          await checkNetwork();
        } catch (addError: any) {
          console.error("Failed to add network:", addError);
          setError(`Failed to add ${NETWORK_CONFIG.chainName} to wallet`);
        }
      } else {
        console.error("Failed to switch network:", switchError);
        setError(`Failed to switch to ${NETWORK_CONFIG.chainName}`);
      }
    } finally {
      setTxLoading(false);
    }
  };

  const loadPlatform = async () => {
    setLoading(true);
    setError(null);
    try {
      const conf = await readContract.config();
      setConfig({
        minStake: formatEthValue(conf.minStake),
        maxStake: formatEthValue(conf.maxStake),
        ujrahRate: Number(conf.ujrahRateBps) / 100,
        minLockDays: Number(conf.minLockDays),
        maxLockDays: Number(conf.maxLockDays),
        penalty: Number(conf.earlyWithdrawalPenaltyBps) / 100,
        isActive: conf.isActive,
      });

      const statsRaw = await readContract.getPlatformStats();
      setStats({
        totalStaked: formatEthValue(statsRaw[0]),
        totalUjrahPaid: formatEthValue(statsRaw[1]),
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
      console.error("loadPlatform error:", err);
      setError(err?.reason || err?.message || "Failed to load platform");
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
          const earned = await readContract.calculateEarnedUjrah(id);
          const timeRemaining = await readContract.getTimeRemaining(id);

          items.push({
            akadId: id,
            user: akadResult[0],
            principal: formatEthValue(akadResult[1]),
            ujrahAmount: formatEthValue(akadResult[2]),
            ujrahEarned: formatEthValue(earned),
            startTime: Number(akadResult[3]),
            endTime: Number(akadResult[4]),
            lockPeriodDays: Number(akadResult[5]),
            ujrahRateBps: Number(akadResult[6]),
            status: Number(akadResult[7]),
            ujrahClaimed: akadResult[8],
            timeRemaining: Number(timeRemaining),
          });
        } catch (innerErr) {
          console.error("Error loading akad", id, innerErr);
        }
      }

      items.sort((a, b) => b.akadId - a.akadId);
      setUserAkads(items);
    } catch (err) {
      console.error("loadUserAkads error:", err);
    }
  };

  const handleAgreeToTerms = async () => {
    if (!isConnected || !currentTermsHash || !window.ethereum) {
      setError("Wallet or terms not ready");
      return;
    }

    if (wrongNetwork) {
      setError(`Please switch to ${NETWORK_CONFIG.chainName} first`);
      return;
    }

    setTxLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        NETWORK_CONFIG.stakeContract,
        STAKE_ABI,
        signer
      );
      const tx = await contract.agreeToTerms(currentTermsHash);
      await tx.wait();
      setHasAgreed(true);
    } catch (err: any) {
      console.error("agreeToTerms error:", err);
      setError(err?.reason || err?.message || "Failed to agree to terms");
    } finally {
      setTxLoading(false);
    }
  };

  const handleCreateAkad = async () => {
    if (!isConnected || !config || !window.ethereum) {
      setError("Wallet not connected");
      return;
    }

    if (wrongNetwork) {
      setError(`Please switch to ${NETWORK_CONFIG.chainName} first`);
      return;
    }

    try {
      const currentAgreed = await readContract.hasAgreedToTerms(walletAddress);
      if (!currentAgreed) {
        setError(
          "⚠️ You haven't agreed to Terms & Conditions. Scroll up to agree first."
        );
        setHasAgreed(false);

        if (termsCardRef.current) {
          termsCardRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        return;
      }
      if (!hasAgreed) setHasAgreed(true);
    } catch (checkErr) {
      console.error("Error checking agreement:", checkErr);
      setError("Failed to verify agreement status. Please try again.");
      return;
    }

    const amountNum = Number(selectedAmount);
    const lockDaysNum = Number(selectedLockDays);

    if (!selectedAmount || amountNum <= 0) {
      setError("Enter a valid stake amount");
      return;
    }

    if (
      amountNum < Number(config.minStake) ||
      amountNum > Number(config.maxStake)
    ) {
      setError(
        `Stake must be ${config.minStake}-${config.maxStake} ${NETWORK_CONFIG.nativeSymbol}`
      );
      return;
    }

    if (lockDaysNum < config.minLockDays || lockDaysNum > config.maxLockDays) {
      setError(
        `Lock period must be ${config.minLockDays}-${config.maxLockDays} days`
      );
      return;
    }

    setTxLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        NETWORK_CONFIG.stakeContract,
        STAKE_ABI,
        signer
      );

      const value = parseEther(selectedAmount);

      try {
        await contract.createAkad.estimateGas(lockDaysNum, { value });
      } catch (estimateErr: any) {
        console.error("Gas estimation failed:", estimateErr);

        if (walletAddress) {
          const balance = await provider.getBalance(walletAddress);
          if (balance < value) {
            throw new Error(
              `Insufficient balance. You have ${formatEther(balance)} ${
                NETWORK_CONFIG.nativeSymbol
              }`
            );
          }
        }

        throw new Error(
          "Transaction validation failed. Ensure all conditions are met and you have enough gas."
        );
      }

      const tx = await contract.createAkad(lockDaysNum, { value });
      await tx.wait();

      setSelectedAmount("");
      setSelectedLockDays("30");
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("createAkad error:", err);
      setError(err?.reason || err?.message || "Failed to create akad");
    } finally {
      setTxLoading(false);
    }
  };

  const handleClaimUjrah = async (akadId: number) => {
    if (!window.ethereum) return;
    if (wrongNetwork) {
      setError(`Please switch to ${NETWORK_CONFIG.chainName} first`);
      return;
    }

    setTxLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        NETWORK_CONFIG.stakeContract,
        STAKE_ABI,
        signer
      );
      const tx = await contract.claimUjrah(akadId);
      await tx.wait();
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("claimUjrah error:", err);
      setError(err?.reason || err?.message || "Failed to claim ujrah");
    } finally {
      setTxLoading(false);
    }
  };

  const handleWithdrawPrincipal = async (akadId: number) => {
    if (!window.ethereum) return;
    if (wrongNetwork) {
      setError(`Please switch to ${NETWORK_CONFIG.chainName} first`);
      return;
    }

    setTxLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        NETWORK_CONFIG.stakeContract,
        STAKE_ABI,
        signer
      );
      const tx = await contract.withdrawPrincipal(akadId);
      await tx.wait();
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("withdrawPrincipal error:", err);
      setError(err?.reason || err?.message || "Failed to withdraw principal");
    } finally {
      setTxLoading(false);
    }
  };

  const handleEarlyWithdrawal = async (akadId: number) => {
    if (!confirm("⚠️ Early withdrawal will incur a penalty. Continue?")) return;
    if (!window.ethereum) return;
    if (wrongNetwork) {
      setError(`Please switch to ${NETWORK_CONFIG.chainName} first`);
      return;
    }

    setTxLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        NETWORK_CONFIG.stakeContract,
        STAKE_ABI,
        signer
      );
      const tx = await contract.earlyWithdrawal(akadId);
      await tx.wait();
      await Promise.all([loadUserAkads(), loadPlatform()]);
    } catch (err: any) {
      console.error("earlyWithdrawal error:", err);
      setError(err?.reason || err?.message || "Failed early withdrawal");
    } finally {
      setTxLoading(false);
    }
  };

  const handleTogglePlatform = async (activate: boolean) => {
    if (!isAdmin) {
      setError("Admin only!");
      return;
    }
    if (!window.ethereum) return;
    if (wrongNetwork) {
      setError(`Please switch to ${NETWORK_CONFIG.chainName} first`);
      return;
    }

    setTxLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        NETWORK_CONFIG.stakeContract,
        STAKE_ABI,
        signer
      );
      const tx = activate
        ? await contract.activatePlatform()
        : await contract.deactivatePlatform();
      await tx.wait();
      await loadPlatform();
    } catch (err: any) {
      console.error("togglePlatform error:", err);
      setError(err?.reason || err?.message || "Failed to toggle platform");
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

  useEffect(() => {
    checkNetwork();
    loadPlatform();
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress && !loading) loadUserAkads();
  }, [walletAddress, loading]);

  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => {
        checkNetwork();
        loadPlatform();
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-300">
      {/* Header */}
      <header className="bg-gradient-to-br from-gray-900 via-black to-gray-900 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Staking Platform</h1>
          <p className="text-gray-400 text-base">
            Stake your <span className="text-teal-400">{NETWORK_CONFIG.nativeSymbol}</span> and earn{" "}
            <span className="text-teal-400">Shariah-compliant</span> rewards
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Wrong Network Warning */}
        {isConnected && wrongNetwork && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="font-semibold text-white">Wrong Network</h3>
                <p className="text-sm text-red-300">
                  Please switch to {NETWORK_CONFIG.chainName}
                </p>
              </div>
            </div>
            <Button
              onClick={switchToFlowNetwork}
              disabled={txLoading}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              {txLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Switch to {NETWORK_CONFIG.chainName}
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 flex items-start justify-between">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Platform Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-teal-600/20 via-gray-800 to-black border border-teal-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-teal-400" />
                <span className="text-sm text-gray-400">Total Staked</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(stats.totalStaked).toFixed(2)} {NETWORK_CONFIG.nativeSymbol}
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-600/20 via-gray-800 to-black border border-teal-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <span className="text-sm text-gray-400">Total Ujrah Paid</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {parseFloat(stats.totalUjrahPaid).toFixed(4)} {NETWORK_CONFIG.nativeSymbol}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">Active Akads</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.activeAkads}</div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">Completed</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.completedAkads}</div>
            </div>
          </div>
        )}

        {/* Terms Agreement */}
        {isConnected && !hasAgreed && !wrongNetwork && (
          <div
            ref={termsCardRef}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Terms & Conditions</h3>
                <p className="text-sm text-gray-400">Required before staking</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm text-amber-300 mb-2">⚠️ Important:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• You must agree to terms before staking</li>
                <li>• Each wallet only needs to agree once</li>
                <li>• This process is required for security and compliance</li>
              </ul>
            </div>

            <Button
              onClick={handleAgreeToTerms}
              disabled={txLoading}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl"
            >
              {txLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Agree & Continue
            </Button>
          </div>
        )}

        {/* Create Akad Form */}
        {isConnected &&
          hasAgreed &&
          config &&
          config.isActive &&
          !stats?.isPaused &&
          !wrongNetwork && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Create New Akad</h3>
                <span className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
                  #{nextAkadId}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Stake Amount
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min={config.minStake}
                    max={config.maxStake}
                    placeholder={`${config.minStake} - ${config.maxStake} ${NETWORK_CONFIG.nativeSymbol}`}
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Lock Period
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {stakingPlans.map((plan) => (
                      <button
                        key={plan.days}
                        onClick={() => setSelectedLockDays(plan.days.toString())}
                        className={`h-20 rounded-xl border transition-all ${
                          selectedLockDays === plan.days.toString()
                            ? "bg-teal-400/20 border-teal-400 text-white"
                            : "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600"
                        }`}
                      >
                        <div className="text-base font-semibold">{plan.days} Days</div>
                        <div className="text-sm opacity-70">{plan.apy} APY</div>
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    step="1"
                    min={config.minLockDays}
                    max={config.maxLockDays}
                    placeholder={`Custom: ${config.minLockDays}-${config.maxLockDays} days`}
                    value={selectedLockDays}
                    onChange={(e) => setSelectedLockDays(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>

                {selectedAmount && selectedLockDays && (
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Estimated Ujrah</span>
                      <span className="text-xl font-bold text-teal-400">
                        {calculateEstimatedUjrah()} {NETWORK_CONFIG.nativeSymbol}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateAkad}
                disabled={txLoading || !selectedAmount || !selectedLockDays}
                className="w-full h-14 bg-teal-400 hover:bg-teal-400/90 text-black rounded-xl font-semibold"
              >
                {txLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-5 h-5 mr-2" />
                )}
                Start Staking
              </Button>
            </div>
          )}

        {/* User Akads */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">My Akads</h3>
            <span className="px-3 py-1.5 bg-teal-500/20 rounded-full text-sm font-medium text-teal-400">
              {userAkads.length}
            </span>
          </div>

          {userAkads.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-base font-medium">No active akads yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Create your first akad to start earning rewards
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userAkads.map((akad) => {
                const now = Math.floor(Date.now() / 1000);
                const canWithdraw = akad.status === 0 && now >= akad.endTime;
                const statusMap: Record<number, { text: string; color: string }> = {
                  0: {
                    text: "ACTIVE",
                    color: "bg-teal-500/10 text-teal-400 border-teal-500/30",
                  },
                  1: {
                    text: "COMPLETED",
                    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                  },
                  2: {
                    text: "CANCELLED",
                    color: "bg-red-500/10 text-red-400 border-red-500/30",
                  },
                };
                const status = statusMap[akad.status] || statusMap[0];

                return (
                  <div
                    key={akad.akadId}
                    className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Akad #{akad.akadId}</div>
                        <div className="text-3xl font-bold text-white">
                          {akad.principal} {NETWORK_CONFIG.nativeSymbol}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs border font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-teal-400" />
                          <span className="text-xs text-gray-400">Ujrah Earned</span>
                        </div>
                        <div className="text-base font-semibold text-teal-400">
                          {akad.ujrahEarned} {NETWORK_CONFIG.nativeSymbol}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-gray-400">Time Left</span>
                        </div>
                        <div className="text-base font-semibold text-blue-400">
                          {akad.timeRemaining > 0
                            ? `${Math.ceil(akad.timeRemaining / 86400)}d`
                            : "Complete"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!akad.ujrahClaimed && Number(akad.ujrahEarned) > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleClaimUjrah(akad.akadId)}
                          disabled={txLoading || wrongNetwork}
                          className="h-10 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 rounded-lg"
                        >
                          <DollarSign className="w-4 h-4 mr-1" /> Claim Ujrah
                        </Button>
                      )}

                      {canWithdraw && (
                        <Button
                          size="sm"
                          onClick={() => handleWithdrawPrincipal(akad.akadId)}
                          disabled={txLoading || wrongNetwork}
                          className="h-10 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Withdraw
                        </Button>
                      )}

                      {akad.status === 0 && !canWithdraw && (
                        <Button
                          size="sm"
                          onClick={() => handleEarlyWithdrawal(akad.akadId)}
                          disabled={txLoading || wrongNetwork}
                          className="h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg"
                        >
                          Early Exit
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform Info */}
        {config && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h4 className="text-base font-semibold text-white mb-4">Platform Info</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Min Lock:</span>
                <span className="text-white font-medium">{config.minLockDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Lock:</span>
                <span className="text-white font-medium">{config.maxLockDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ujrah Rate:</span>
                <span className="text-teal-400 font-medium">{config.ujrahRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Early Penalty:</span>
                <span className="text-red-400 font-medium">{config.penalty}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Admin Panel</h3>
                <p className="text-sm text-gray-400">Platform Management</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="sm"
                onClick={() => handleTogglePlatform(true)}
                disabled={txLoading || stats?.isActive || wrongNetwork}
                className="h-11 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 rounded-lg disabled:opacity-50"
              >
                Activate
              </Button>
              <Button
                size="sm"
                onClick={() => handleTogglePlatform(false)}
                disabled={txLoading || !stats?.isActive || wrongNetwork}
                className="h-11 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg disabled:opacity-50"
              >
                Deactivate
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}