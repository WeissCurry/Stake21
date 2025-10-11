"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from "lucide-react";
import MetricCard from "../../components/MetricCard";
import NavigationBar from "../../components/NavigationBar";

const DashboardPage = () => {
    const router = useRouter();

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
            <header className="bg-gradient-hero text-primary-foreground shadow-medium">
                <div className="max-w-md mx-auto px-6 py-8">
                    <h1 className="text-2xl font-bold mb-1">Dashboard Anda</h1>
                    <p className="text-sm opacity-90">Pantau investasi dan pendapatan Anda</p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 -mt-4 space-y-6">
                {/* Main Balance Card */}
                <MetricCard
                    title="Total ETH Disewakan"
                    value="5.25 ETH"
                    subtitle="≈ $10,500.00 USD"
                    variant="accent"
                    icon={<Wallet className="w-6 h-6" />}
                />

                {/* Earnings Card */}
                <div className="bg-gradient-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Total Ujrah Diterima
                            </h3>
                            <p className="text-3xl font-bold text-foreground mb-1">0.081 ETH</p>
                            <p className="text-sm text-muted-foreground">≈ $162.00 USD</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-success" />
                        </div>
                    </div>

                    {/* Simple earnings visualization */}
                    <div className="flex items-end gap-1 h-20 pt-4 border-t border-border">
                        {[40, 55, 45, 70, 65, 80, 75].map((height, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-success/20 rounded-t-sm"
                                style={{ height: `${height}%` }}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Pertumbuhan ujrah 7 hari terakhir
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        onClick={() => router.push("/staking")} // <-- Langkah 3: Ubah navigasi
                        className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-medium"
                    >
                        <ArrowUpRight className="w-5 h-5 mr-2" /> Sewa Lagi
                    </Button>
                    <Button className="h-14 border-2 rounded-xl bg-transparent text-foreground hover:bg-muted/50">
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