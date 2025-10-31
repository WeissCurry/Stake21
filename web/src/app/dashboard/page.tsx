"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from "lucide-react";
import MetricCard from "../../components/MetricCard";
import { useEffect, useState } from "react";

// ✅ Custom hook untuk ambil harga FLOW dari CoinGecko
function useFlowPrice() {
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPrice() {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=flow&vs_currencies=usd"
                );
                const data = await res.json();
                setPrice(data.flow.usd);
            } catch (e) {
                setError("Failed to fetch price");
            } finally {
                setLoading(false);
            }
        }

        fetchPrice();
        const interval = setInterval(fetchPrice, 60 * 1000); // refresh tiap 1 menit
        return () => clearInterval(interval);
    }, []);

    return { price, loading, error };
}

const DashboardPage = () => {
    const router = useRouter();
    const { price, loading, error } = useFlowPrice();
    const totalStake = 5000; // contoh total FLOW user

    const handleWithdraw = () => router.push("/withdraw");

    const transactions = [
        { type: "Daily Reward Received", amount: "+0.0004 FLOW", date: "Oct 9, 2025", positive: true },
        { type: "Daily Reward Received", amount: "+0.0004 FLOW", date: "Oct 8, 2025", positive: true },
        { type: "FLOW Staked", amount: "3.00 FLOW", date: "Oct 5, 2025", positive: false },
        { type: "Daily Reward Received", amount: "+0.0003 FLOW", date: "Oct 4, 2025", positive: true },
        { type: "FLOW Staked", amount: "2.25 FLOW", date: "Oct 1, 2025", positive: false },
    ];

    const totalStakeUSD =
        price && !loading ? (totalStake * price).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-";

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans">
            <header className="bg-gradient-to-br from-gray-900 via-black to-gray-900 shadow-lg text-white">
                <div className="max-w-4xl mx-auto px-6 py-10 text-center md:text-left">
                    <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Your Dashboard</h1>
                    <p className="text-gray-400 text-base">
                        Monitor your <span className="text-teal-400">investments</span> and{" "}
                        <span className="text-teal-400">earnings</span> in real time.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    <MetricCard
                        className="text-white bg-gradient-to-br from-teal-600/20 via-gray-800 to-black border border-teal-500/20"
                        title="Current FLOW Price"
                        value={
                            loading
                                ? "Loading..."
                                : error
                                    ? "Error"
                                    : `$${price?.toFixed(3)}`
                        }
                        subtitle="USD per FLOW"
                        variant="accent"
                        icon={<Wallet className="w-6 h-6 text-teal-400" />}
                    />

                    {/* ✅ Total FLOW Staked */}
                    <MetricCard
                        className="text-white bg-gradient-to-br from-teal-600/20 via-gray-800 to-black border border-teal-500/20"
                        title="Total FLOW Staked"
                        value={`${totalStake.toLocaleString()} FLOW`}
                        subtitle={`≈ ${totalStakeUSD}`}
                        variant="accent"
                        icon={<Wallet className="w-6 h-6 text-teal-400" />}
                    />

                </div>
                {/* ✅ Live FLOW price */}

                {/* ✅ Total Rewards Card */}
                <div className="relative group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 mb-2">Total Rewards Received</h3>
                                <p className="text-3xl font-bold text-white mb-1 tracking-tight">0.081 FLOW</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-slate-400">
                                        ≈{" "}
                                        {price
                                            ? (0.081 * price).toLocaleString("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            })
                                            : "$–"}
                                    </p>
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">
                                        +12.5%
                                    </span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Mini bar chart */}
                        <div className="relative pt-4 border-t border-slate-700/50">
                            <div className="flex items-end gap-1.5 h-20">
                                {[40, 55, 45, 70, 65, 80, 75].map((height, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-gradient-to-t from-emerald-500/30 to-emerald-400/50 rounded-t hover:from-emerald-500/50 hover:to-emerald-400/70 transition-all duration-200 cursor-pointer"
                                        style={{ height: `${height}%`, animationDelay: `${i * 100}ms` }}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-3">Reward growth over the last 7 days</p>
                        </div>
                    </div>
                </div>

                {/* ✅ Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        onClick={() => router.push("/staking")}
                        className="h-14 bg-teal-400 hover:bg-teal-400/90 text-primary-foreground rounded-xl shadow-medium"
                    >
                        <ArrowUpRight className="w-5 h-5 mr-2" /> Stake More
                    </Button>
                    <Button
                        onClick={handleWithdraw}
                        className="h-14 border-2 rounded-xl bg-transparent text-foreground hover:bg-muted/50"
                    >
                        <ArrowDownLeft className="w-5 h-5 mr-2" /> Withdraw
                    </Button>
                </div>

                {/* ✅ Transaction History */}
                <div className="bg-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
                    <div className="space-y-1">
                        {transactions.map((tx, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-sm text-foreground">{tx.type}</p>
                                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                                </div>
                                <p
                                    className={`font-semibold text-sm ${tx.positive ? "text-success" : "text-foreground"
                                        }`}
                                >
                                    {tx.amount}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
