"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from "lucide-react";
import MetricCard from "../../components/MetricCard";
import NavigationBar from "../../components/NavigationBar";

const DashboardPage = () => {
    const router = useRouter();

      const handleWithdraw = () => {
        router.push("/withdraw");
    };

    const transactions = [
        { type: "Ujrah Harian Diterima", amount: "+0.0004 ETH", date: "9 Okt 2025", positive: true },
        { type: "Ujrah Harian Diterima", amount: "+0.0004 ETH", date: "8 Okt 2025", positive: true },
        { type: "ETH Disewakan", amount: "3.00 ETH", date: "5 Okt 2025", positive: false },
        { type: "Ujrah Harian Diterima", amount: "+0.0003 ETH", date: "4 Okt 2025", positive: true },
        { type: "ETH Disewakan", amount: "2.25 ETH", date: "1 Okt 2025", positive: false },
    ];

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-gradient-hero text-primary-foreground shadow-medium text-white">
                <div className="max-w-md mx-auto px-6 py-8">
                    <h1 className="text-2xl font-bold mb-1">Dashboard Anda</h1>
                    <p className="text-sm opacity-90">Pantau investasi dan pendapatan Anda</p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 -mt-4 space-y-6">
                {/* Main Balance Card */}
                <MetricCard 
                    className="text-white"
                    title="Total ETH Disewakan"
                    value="5.25 ETH"
                    subtitle="≈ $10,500.00 USD"
                    variant="accent"
                    icon={<Wallet className="w-6 h-6" />}
                />

                {/* Earnings Card */}
                <div className="relative group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Gradient overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-2">
                        Total Ujrah Diterima
                        </h3>
                        <p className="text-3xl font-bold text-white mb-1 tracking-tight">
                        0.081 ETH
                        </p>
                        <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-400">≈ $162.00 USD</p>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">
                            +12.5%
                        </span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    </div>

                    {/* Enhanced chart with gradient */}
                    <div className="relative pt-4 border-t border-slate-700/50">
                    <div className="flex items-end gap-1.5 h-20">
                        {[40, 55, 45, 70, 65, 80, 75].map((height, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-emerald-500/30 to-emerald-400/50 rounded-t hover:from-emerald-500/50 hover:to-emerald-400/70 transition-all duration-200 cursor-pointer"
                            style={{ 
                            height: `${height}%`,
                            animationDelay: `${i * 100}ms`
                            }}
                        />
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-3">
                        Pertumbuhan ujrah 7 hari terakhir
                    </p>
                    </div>
                </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        onClick={() => router.push("/staking")} // <-- Langkah 3: Ubah navigasi
                        className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-medium"
                    >
                        <ArrowUpRight className="w-5 h-5 mr-2" /> Sewa Lagi
                    </Button>
                    <Button 
                    onClick={handleWithdraw}
                    className="h-14 border-2 rounded-xl bg-transparent text-foreground hover:bg-muted/50">
                        <ArrowDownLeft className="w-5 h-5 mr-2" /> Tarik Dana
                    </Button>
                </div>

                {/* Transaction History */}
                <div className="bg-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Riwayat Transaksi</h3>
                    <div className="space-y-1">
                        {transactions.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div>
                                    <p className="font-medium text-sm text-foreground">{tx.type}</p>
                                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                                </div>
                                <p className={`font-semibold text-sm ${tx.positive ? "text-success" : "text-foreground"}`}>
                                    {tx.amount}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <NavigationBar />
        </div>
    );
};

export default DashboardPage;