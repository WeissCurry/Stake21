"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Wallet, AlertCircle, Check, Info, TrendingDown, Clock } from "lucide-react";
import { 
    useAccount, 
    useWaitForTransactionReceipt,  // ✅ FIXED: GANTI INI!
    useReadContract,
    useWriteContract 
} from "wagmi";
import { parseEther, formatEther } from "viem";

// SMART CONTRACT ADDRESS & ABI
const CONTRACT_ADDRESS = "0x7ff069bc532c43d1dd5777e69729cfc5d14cfce6"; // GANTI INI!
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "getAvailableBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_akadId", "type": "uint256"}],
    "name": "withdrawPrincipal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserAkads",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const WithdrawPage = () => {
    const router = useRouter();
    const [amount, setAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [pendingRewards] = useState(0.081);
    const [lockedBalance] = useState(0);
    const [currentAkadId, setCurrentAkadId] = useState(0);
    const [txHash, setTxHash] = useState("");

    const minWithdrawal = 0.1;
    const ETH_PRICE = 2000;

    const { address, isConnected } = useAccount();

    // Read contracts - SAME
    const { 
        data: availableBalanceWei, 
        refetch: refetchBalance 
    } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAvailableBalance",
        enabled: isConnected && !!address,
    });

    const availableBalance = availableBalanceWei 
        ? parseFloat(formatEther(availableBalanceWei)) 
        : 0;

    const { 
        data: userAkadsData 
    } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getUserAkads",
        args: [address || "0x0"],
        enabled: isConnected && !!address,
    });

    const userAkads = userAkadsData || [];

    useEffect(() => {
        if (userAkads.length > 0) {
            setCurrentAkadId(userAkads[userAkads.length - 1]);
        }
    }, [userAkads]);

    // Write contract - SAME
    const { writeContract, isPending: isWritePending } = useWriteContract({
        mutation: {
            onSuccess: (hash) => {
                setTxHash(hash);
                setIsProcessing(false);
            },
            onError: (error) => {
                setIsProcessing(false);
                console.error("Withdraw failed:", error);
                
                if (error.message.includes("InsufficientBalance")) {
                    alert("Saldo tidak mencukupi!");
                } else if (error.message.includes("LockPeriodNotEnded")) {
                    alert("Dana masih terkunci. Tunggu periode lock berakhir.");
                } else {
                    alert("Penarikan gagal. Silakan coba lagi.");
                }
            }
        }
    });

    // ✅ FIXED: useWaitForTransactionReceipt + hash sebagai string
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: txHash as `0x${string}`,
        onSuccess: () => {
            setShowSuccess(true);
            refetchBalance();
            setTimeout(() => {
                setShowSuccess(false);
                setAmount("");
                router.push("/dashboard");
            }, 3000);
        }
    });

    const handleWithdraw = async () => {
        if (!isConnected) {
            alert("Hubungkan wallet dulu di Navbar!");
            router.push("/dashboard");
            return;
        }

        if (!isValidAmount) return;

        setIsProcessing(true);

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "withdrawPrincipal",
            args: [currentAkadId],
        });
    };

    const setMaxAmount = () => setAmount(availableBalance.toFixed(3));

    const isValidAmount = 
        amount &&
        parseFloat(amount) >= minWithdrawal &&
        parseFloat(amount) <= availableBalance;

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto animate-pulse">
                        <Check className="w-10 h-10 text-success" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Penarikan Berhasil!</h2>
                        <p className="text-muted-foreground">
                            {amount} ETH sedang diproses ke wallet Anda
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold"
                    >
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="bg-gradient-hero text-primary-foreground shadow-medium">
                <div className="max-w-md mx-auto px-6 py-8">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center text-sm mb-4 opacity-90 hover:opacity-100 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </button>
                    <h1 className="text-2xl font-bold mb-1 text-white">Tarik Dana</h1>
                    <p className="text-sm opacity-90 text-white">Tarik ETH yang telah disewakan</p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 -mt-4 space-y-6">
                <div className="bg-gradient-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                ETH Tersedia untuk Ditarik
                            </h3>
                            <p className="text-3xl font-bold text-foreground mb-1">
                                {availableBalance.toFixed(3)} ETH
                            </p>
                            <p className="text-sm text-muted-foreground">
                                ≈ ${(availableBalance * ETH_PRICE).toFixed(2)} USD
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-primary" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Ujrah Tertunda</p>
                            <p className="text-sm font-semibold text-success">
                                {pendingRewards.toFixed(3)} ETH
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">ETH Terkunci</p>
                            <p className="text-sm font-semibold text-foreground">
                                {lockedBalance.toFixed(3)} ETH
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Jumlah Penarikan</h3>
                    
                    <div className="space-y-2">
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.0"
                                step="0.01"
                                min={minWithdrawal}
                                max={availableBalance}
                                className="w-full h-16 px-4 pr-20 text-2xl font-bold bg-muted/50 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-foreground"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                                ETH
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <button
                                onClick={setMaxAmount}
                                className="text-sm text-primary font-semibold hover:underline"
                            >
                                Tarik Maksimal
                            </button>
                            {amount && (
                                <p className="text-sm text-muted-foreground">
                                    ≈ ${(parseFloat(amount) * ETH_PRICE).toFixed(2)} USD
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-foreground font-medium mb-1">Informasi Penarikan</p>
                            <ul className="text-muted-foreground space-y-1 text-xs">
                                <li>• Minimum penarikan: {minWithdrawal} ETH</li>
                                <li>• Waktu proses: 1-3 hari kerja</li>
                                <li>• Gas fee akan dipotong otomatis</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {amount && parseFloat(amount) < minWithdrawal && (
                    <div className="flex gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-foreground">
                            Jumlah minimum penarikan adalah {minWithdrawal} ETH
                        </p>
                    </div>
                )}

                {amount && parseFloat(amount) > availableBalance && (
                    <div className="flex gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                        <p className="text-sm text-foreground">
                            Saldo tidak mencukupi. Maksimal: {availableBalance.toFixed(3)} ETH
                        </p>
                    </div>
                )}

                <Button
                    onClick={handleWithdraw}
                    disabled={!isValidAmount || isProcessing || isConfirming || isWritePending || !isConnected}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-medium disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold"
                >
                    {isProcessing || isConfirming || isWritePending ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isConfirming ? "Menunggu Konfirmasi..." : "Memproses..."}
                        </span>
                    ) : !isConnected ? (
                        "Hubungkan Wallet"
                    ) : (
                        <>
                            <TrendingDown className="w-5 h-5 mr-2" />
                            Konfirmasi Penarikan
                        </>
                    )}
                </Button>

                <div className="bg-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Riwayat Penarikan</h3>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-foreground">Penarikan ETH</p>
                                    <p className="text-xs text-muted-foreground">5 Okt 2025 • Selesai</p>
                                </div>
                            </div>
                            <p className="font-semibold text-sm text-foreground">2.00 ETH</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WithdrawPage;