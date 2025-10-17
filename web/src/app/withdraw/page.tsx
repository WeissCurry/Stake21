"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, AlertCircle, Check, Info, Home, TrendingUp, History, User } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { WalletConnectButton } from "@/components/walletConnectButton";

const WithdrawPage = () => {
    const [currentPage, setCurrentPage] = useState("dashboard");
    const [amount, setAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mock data
    const availableBalance = 5.25;
    const lockedBalance = 0;
    const pendingRewards = 0.081;
    const minWithdrawal = 0.1;
    
    // Wagmi hooks
    const { address, isConnected } = useAccount();
    const { connect } = useConnect({ connector: injected() });
    const { disconnect } = useDisconnect();
    const handleWithdraw = () => {
        if (!isConnected) {
          alert("Silakan hubungkan wallet Anda terlebih dahulu!");
          return;
        }

        setIsProcessing(true);

        setTimeout(() => {
          setIsProcessing(false);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setAmount("");
          }, 3000);
        }, 2000);
    };

    const setMaxAmount = () => setAmount(availableBalance.toString());

    const isValidAmount = 
        amount &&
        parseFloat(amount) >= minWithdrawal &&
        parseFloat(amount) <= availableBalance;

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Penarikan Berhasil!</h2>
                        <p className="text-gray-600">
                            {amount} ETH sedang diproses ke wallet Anda
                        </p>
                    </div>
                    <Button
                        onClick={() => setCurrentPage("dashboard")}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                    >
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
                <div className="max-w-md mx-auto px-6 py-6">
                    <button
                        onClick={() => setCurrentPage("dashboard")}
                        className="flex items-center text-sm mb-4 opacity-90 hover:opacity-100 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </button>
                    {/* Connect / Disconnect Button */}
                    {isConnected ? (
                        <button
                          onClick={() => disconnect()}
                          className="bg-white text-blue-700 text-sm px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                        >
                          {address.slice(0, 6)}...{address.slice(-4)}
                        </button>
                        ) : (
                        <button
                          onClick={() => connect()}
                          className="bg-white text-blue-700 text-sm px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                        >
                          Connect Wallet
                        </button>
                    )}
                    <WalletConnectButton />
                    <h1 className="text-2xl font-bold mb-1">Tarik Dana</h1>
                    <p className="text-sm opacity-90">Tarik ETH yang telah disewakan</p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 -mt-4 space-y-6">
                {/* Balance Overview */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-600 mb-2">
                                ETH Tersedia untuk Ditarik
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{availableBalance} ETH</p>
                            <p className="text-sm text-gray-600">≈ ${(availableBalance * 2000).toFixed(2)} USD</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Ujrah Tertunda</p>
                            <p className="text-sm font-semibold text-gray-900">{pendingRewards} ETH</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">ETH Terkunci</p>
                            <p className="text-sm font-semibold text-gray-900">{lockedBalance} ETH</p>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Amount Input */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Jumlah Penarikan</h3>
                    
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
                                className="w-full h-14 px-4 pr-20 text-xl font-semibold bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                                ETH
                            </span>
                        </div>
                        
                        <button
                            onClick={setMaxAmount}
                            className="text-sm text-blue-600 font-medium hover:underline"
                        >
                            Tarik Maksimal
                        </button>

                        {amount && (
                            <p className="text-sm text-gray-600">
                                ≈ ${(parseFloat(amount) * 2000).toFixed(2)} USD
                            </p>
                        )}
                    </div>

                    {/* Info Alert */}
                    <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-gray-900 font-medium mb-1">Informasi Penarikan</p>
                            <ul className="text-gray-700 space-y-1 text-xs">
                                <li>• Minimum penarikan: {minWithdrawal} ETH</li>
                                <li>• Waktu proses: 1-3 hari kerja</li>
                                <li>• Gas fee akan dipotong otomatis</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Warning if amount is invalid */}
                {amount && parseFloat(amount) < minWithdrawal && (
                    <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-gray-900">
                            Jumlah minimum penarikan adalah {minWithdrawal} ETH
                        </p>
                    </div>
                )}

                {amount && parseFloat(amount) > availableBalance && (
                    <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-gray-900">
                            Saldo tidak mencukupi. Maksimal: {availableBalance} ETH
                        </p>
                    </div>
                )}

                {/* Withdraw Button */}
                <Button
                    onClick={handleWithdraw}
                    disabled={!isValidAmount || isProcessing}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold"
                >
                    {isProcessing ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                        </span>
                    ) : (
                        "Konfirmasi Penarikan"
                    )}
                </Button>

                {/* Recent Withdrawals */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Riwayat Penarikan</h3>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-gray-50">
                            <div>
                                <p className="font-medium text-sm text-gray-900">Penarikan ETH</p>
                                <p className="text-xs text-gray-600">5 Okt 2025 • Selesai</p>
                            </div>
                            <p className="font-semibold text-sm text-gray-900">2.00 ETH</p>
                        </div>
                        <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-gray-50">
                            <div>
                                <p className="font-medium text-sm text-gray-900">Penarikan ETH</p>
                                <p className="text-xs text-gray-600">1 Sep 2025 • Selesai</p>
                            </div>
                            <p className="font-semibold text-sm text-gray-900">1.50 ETH</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                <div className="max-w-md mx-auto px-6 py-3">
                    <div className="flex justify-around items-center">
                        <button
                            onClick={() => setCurrentPage("dashboard")}
                            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                                currentPage === "dashboard" ? "text-blue-600" : "text-gray-500"
                            }`}
                        >
                            <Home className="w-5 h-5" />
                            <span className="text-xs font-medium">Home</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage("staking")}
                            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                                currentPage === "staking" ? "text-blue-600" : "text-gray-500"
                            }`}
                        >
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-xs font-medium">Staking</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage("history")}
                            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                                currentPage === "history" ? "text-blue-600" : "text-gray-500"
                            }`}
                        >
                            <History className="w-5 h-5" />
                            <span className="text-xs font-medium">Riwayat</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage("profile")}
                            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                                currentPage === "profile" ? "text-blue-600" : "text-gray-500"
                            }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="text-xs font-medium">Profil</span>
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default WithdrawPage;