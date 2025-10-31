"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContracts,
  useChainId,
} from "wagmi";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/MetricCard";
import {
  ArrowLeft,
  Wallet,
  Check,
  Info,
  TrendingDown,
  Clock,
  Lock,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { NETWORK_CONFIG } from "@/config/network";

// ===== CONSTANTS =====
const MIN_VALIDATOR_STAKE = 150_000;
const FLOW_PRICE_USD = 0.55;

const CONTRACT_ABI = [
  {
    inputs: [],
    name: "getAvailableBalance",
    outputs: [{ internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", type: "uint256" }],
    name: "withdrawPrincipal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", type: "address" }],
    name: "getUserAkads",
    outputs: [{ internalType: "uint256[]", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", type: "uint256" }],
    name: "getAkad",
    outputs: [
      { internalType: "address", type: "address" },
      { internalType: "uint256", type: "uint256" },
      { internalType: "uint256", type: "uint256" },
      { internalType: "uint64", type: "uint64" },
      { internalType: "uint64", type: "uint64" },
      { internalType: "uint32", type: "uint32" },
      { internalType: "uint32", type: "uint32" },
      { internalType: "uint8", type: "uint8" },
      { internalType: "bool", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// ===== TYPES =====
interface Akad {
  akadId: number;
  principal: string;
  endTime: number;
  status: number;
}

interface WithdrawState {
  isProcessing: boolean;
  showSuccess: boolean;
  txHash?: `0x${string}`;
  selectedAkadId: number | null;
  error: string | null;
}

// ===== HELPER FUNCTIONS =====
const parseErrorMessage = (error) => {
  const msg = error.message.toLowerCase();
  if (msg.includes("lockperiodnotended")) {
    return "Lock period not ended yet.";
  }
  if (msg.includes("insufficient")) {
    return "Insufficient gas balance.";
  }
  return "Withdrawal failed. Try again.";
};

const switchToCorrectNetwork = async () => {
  try {
    await window.ethereum?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK_CONFIG.chainId }],
    });
  } catch (error) {
    console.error("Failed to switch network:", error);
  }
};

// ===== MAIN COMPONENT =====
export default function WithdrawPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [state, setState] = useState({
    isProcessing: false,
    showSuccess: false,
    selectedAkadId: null,
    error: null,
    txHash: undefined,
  });

  const wrongNetwork = isConnected && chainId !== NETWORK_CONFIG.chainIdDecimal;

  // ===== CONTRACT READS =====
  const { data: availableBalanceWei, refetch: refetchBalance } = useReadContracts({
    contracts:
      isConnected && address && !wrongNetwork
        ? [
            {
              address: NETWORK_CONFIG.stakeContract,
              abi: CONTRACT_ABI,
              functionName: "getAvailableBalance",
            },
          ]
        : [],
  });

  const availableBalance = useMemo(() => {
    const balance = availableBalanceWei?.[0]?.result;
    return balance ? parseFloat(formatEther(balance)) : 0;
  }, [availableBalanceWei]);

  const { data: userAkadsData } = useReadContracts({
    contracts:
      address && !wrongNetwork
        ? [
            {
              address: NETWORK_CONFIG.stakeContract,
              abi: CONTRACT_ABI,
              functionName: "getUserAkads",
              args: [address],
            },
          ]
        : [],
  });

  const userAkadIds = userAkadsData?.[0]?.result;

  const akadContracts = useMemo(() => {
    if (!userAkadIds || userAkadIds.length === 0) return [];
    return userAkadIds.map((id) => ({
      address: NETWORK_CONFIG.stakeContract,
      abi: CONTRACT_ABI,
      functionName: "getAkad",
      args: [id],
    }));
  }, [userAkadIds]);

  const { data: akadsData, isLoading: loadingAkads } = useReadContracts({
    contracts: akadContracts,
  });

  // ===== FILTER ELIGIBLE AKADS =====
  const eligibleAkads = useMemo(() => {
    if (!akadsData || !userAkadIds) return [];
    
    const now = Math.floor(Date.now() / 1000);
    const akads = [];

    akadsData.forEach((result, i) => {
      if (result.status === "failure" || !result.result) return;

      const [_, principal, __, endTime, ___, ____, _____, status] = result.result;
      const akadId = Number(userAkadIds[i]);
      const principalEth = formatEther(principal);
      const isCompleted = Number(status) === 1;
      const isExpired = Number(endTime) <= now;

      if (isCompleted || isExpired) {
        akads.push({
          akadId,
          principal: principalEth,
          endTime: Number(endTime),
          status: Number(status),
        });
      }
    });

    return akads.sort((a, b) => b.akadId - a.akadId);
  }, [akadsData, userAkadIds]);

  // Auto-select first eligible akad
  useEffect(() => {
    if (eligibleAkads.length > 0 && !state.selectedAkadId) {
      setState((prev) => ({ ...prev, selectedAkadId: eligibleAkads[0].akadId }));
    }
  }, [eligibleAkads, state.selectedAkadId]);

  // ===== CONTRACT WRITE =====
  const { writeContract, isPending: isWritePending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setState((prev) => ({
          ...prev,
          txHash: hash,
          isProcessing: false,
          error: null,
        }));
      },
      onError: (err) => {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: parseErrorMessage(err),
        }));
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isTxSuccess } = 
    useWaitForTransactionReceipt({ hash: state.txHash });

  useEffect(() => {
    if (isTxSuccess && state.txHash) {
      setState((prev) => ({ ...prev, showSuccess: true }));
      refetchBalance();
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  }, [isTxSuccess, state.txHash, refetchBalance, router]);

  // ===== HANDLERS =====
  const handleWithdraw = useCallback(() => {
    if (!isConnected || !state.selectedAkadId || state.isProcessing || wrongNetwork) {
      return;
    }

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));
    
    writeContract({
      address: NETWORK_CONFIG.stakeContract,
      abi: CONTRACT_ABI,
      functionName: "withdrawPrincipal",
      args: [BigInt(state.selectedAkadId)],
    });
  }, [isConnected, state.selectedAkadId, state.isProcessing, writeContract, wrongNetwork]);

  const selectedAkad = eligibleAkads.find((a) => a.akadId === state.selectedAkadId);
  const withdrawAmount = selectedAkad?.principal || "0";
  const isLoading = state.isProcessing || isConfirming || isWritePending;
  const isDisabled = !isConnected || !state.selectedAkadId || isLoading || 
                     eligibleAkads.length === 0 || wrongNetwork;

  // ===== SUCCESS SCREEN =====
  if (state.showSuccess) {
    return (
      <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Withdrawal Successful!
            </h2>
            <p className="text-gray-400 text-base">
              {withdrawAmount} {NETWORK_CONFIG.nativeSymbol} is being sent to your wallet
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full h-14 bg-teal-400 hover:bg-teal-400/90 text-black rounded-xl font-semibold shadow-lg"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ===== MAIN UI =====
  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-gray-900 via-black to-gray-900 shadow-lg text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">
            Withdraw {NETWORK_CONFIG.nativeSymbol}
          </h1>
          <p className="text-gray-400 text-base">
            Claim your <span className="text-teal-400">completed akads</span> and withdraw funds
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Wrong Network Warning */}
        {wrongNetwork && (
          <div className="relative group bg-gradient-to-br from-red-900/20 via-slate-900 to-slate-900 rounded-2xl p-6 border border-red-500/30 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-white mb-1">Wrong Network</h3>
                  <p className="text-sm text-gray-400">
                    Please switch to {NETWORK_CONFIG.chainName} to continue
                  </p>
                </div>
              </div>
              <Button
                onClick={switchToCorrectNetwork}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Switch Network
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {state.error && (
          <div className="bg-gradient-to-br from-red-900/20 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl p-5 flex items-start justify-between shadow-xl">
            <p className="text-sm text-red-400">{state.error}</p>
            <button
              onClick={() => setState((prev) => ({ ...prev, error: null }))}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Available Balance */}
        <MetricCard
          className="text-white bg-gradient-to-br from-teal-600/20 via-gray-800 to-black border border-teal-500/20"
          title="Available for Withdrawal"
          value={`${availableBalance.toFixed(3)} ${NETWORK_CONFIG.nativeSymbol}`}
          subtitle={`≈ $${(availableBalance * FLOW_PRICE_USD).toFixed(2)} USD`}
          variant="accent"
          icon={<Wallet className="w-6 h-6 text-teal-400" />}
        />

        {/* Validator Info */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-1">
                Validator Minimum Stake
              </p>
              <p className="text-sm text-gray-400">
                {MIN_VALIDATOR_STAKE.toLocaleString()} {NETWORK_CONFIG.nativeSymbol}
              </p>
            </div>
          </div>
        </div>

        {/* Select Akad */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl space-y-5">
          <h3 className="text-xl font-semibold text-white">Select Akad to Withdraw</h3>

          {loadingAkads ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-3 text-teal-400 opacity-50 animate-spin" />
              <p className="text-sm text-gray-400">Loading your akads...</p>
            </div>
          ) : eligibleAkads.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-base font-medium">No withdrawable akads</p>
              <p className="text-sm text-gray-500 mt-1">Complete your staking period to withdraw</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eligibleAkads.map((akad) => (
                <button
                  key={akad.akadId}
                  onClick={() =>
                    setState((prev) => ({ ...prev, selectedAkadId: akad.akadId }))
                  }
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-center justify-between group hover:shadow-lg ${
                    state.selectedAkadId === akad.akadId
                      ? "bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/50 shadow-lg shadow-teal-500/10"
                      : "bg-slate-800/50 border-slate-700/50 hover:border-teal-500/30 hover:bg-slate-800/80"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-base text-white mb-1">Akad #{akad.akadId}</p>
                    <p className="text-sm text-gray-400">
                      {akad.principal} {NETWORK_CONFIG.nativeSymbol}
                    </p>
                  </div>
                  {state.selectedAkadId === akad.akadId && (
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-blue-900/10 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-6 flex gap-4 shadow-xl">
          <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-white mb-2 text-base">Important Notes</p>
            <ul className="text-gray-400 space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-1">•</span>
                <span>Only completed or expired akads can be withdrawn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-1">•</span>
                <span>Gas fees are deducted from your wallet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-1">•</span>
                <span>Withdrawal is instant after confirmation</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={isDisabled}
          className="w-full h-16 bg-teal-400 hover:bg-teal-400/90 text-black rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold transition-all hover:shadow-teal-400/20 hover:shadow-xl"
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
              {isConfirming ? "Confirming Transaction..." : "Processing..."}
            </span>
          ) : (
            <>
              <TrendingDown className="w-5 h-5 mr-2" />
              Withdraw {withdrawAmount} {NETWORK_CONFIG.nativeSymbol}
            </>
          )}
        </Button>
      </main>
    </div>
  );
}