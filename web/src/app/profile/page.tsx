"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
    User,
    Wallet,
    Shield,
    Bell,
    ChevronRight,
    TrendingUp,
    Globe,
    Coins,
} from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { WalletConnectButton } from "../../components/walletConnectButton";
import { useEffect, useState } from "react";

function useFlowPrice() {
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPrice() {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=flow&vs_currencies=usd"
                );
                const data = await res.json();
                setPrice(data.flow.usd);
            } catch {
                setPrice(null);
            } finally {
                setLoading(false);
            }
        }
        fetchPrice();
        const interval = setInterval(fetchPrice, 60_000);
        return () => clearInterval(interval);
    }, []);

    return { price, loading };
}

const ProfilePage = () => {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { price, loading } = useFlowPrice();

    const totalFlow = 5.25;
    const totalRewards = 0.012;
    const totalFlowUSD =
        price && !loading
            ? (totalFlow * price).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
            })
            : "-";

    const totalRewardUSD =
        price && !loading
            ? (totalRewards * price).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
            })
            : "-";

    const menuItems = [
        {
            icon: <User className="w-5 h-5 text-teal-400" />,
            title: "Account Information",
            subtitle: "Manage your personal data",
            action: () => { },
        },
        {
            icon: <Wallet className="w-5 h-5 text-teal-400" />,
            title: "Wallet & Payment",
            subtitle: "Set up your wallet and methods",
            action: () => { },
        },
        {
            icon: <Shield className="w-5 h-5 text-teal-400" />,
            title: "Security",
            subtitle: "Two-factor and protection",
            action: () => { },
        },
        {
            icon: <Bell className="w-5 h-5 text-teal-400" />,
            title: "Notifications",
            subtitle: "Control alerts & updates",
            action: () => { },
        },
    ];

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans">
            {/* Header */}
            <header className="bg-gradient-to-br from-gray-900 via-black to-gray-900 shadow-lg text-white">
                <div className="max-w-3xl mx-auto px-6 py-10 text-center md:text-left">
                    <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">
                        My Profile
                    </h1>
                    <p className="text-gray-400 text-base">
                        Manage your <span className="text-teal-400">account</span> and{" "}
                        <span className="text-teal-400">preferences</span>
                    </p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
                {/* Profile Card */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-teal-600/10 border-2 border-teal-500/30 flex items-center justify-center">
                            <User className="w-10 h-10 text-teal-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-1">
                                {isConnected
                                    ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                                    : "Not Connected"}
                            </h2>
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                <Wallet className="w-4 h-4" />{" "}
                                {isConnected ? "Wallet Connected" : "Connect to FLOW Wallet"}
                            </p>
                        </div>
                    </div>

                    <WalletConnectButton />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative group bg-gradient-to-br from-teal-600/20 via-gray-800 to-black rounded-xl p-5 border border-teal-500/20 shadow-md hover:shadow-teal-500/10 transition-all duration-300">
                        <h4 className="text-sm text-gray-400 mb-1">Total Investment</h4>
                        <p className="text-3xl font-bold text-white mb-1">
                            {totalFlow} FLOW
                        </p>
                        <p className="text-xs text-gray-400">≈ {totalFlowUSD}</p>
                    </div>

                    <div className="relative group bg-gradient-to-br from-emerald-600/20 via-gray-800 to-black rounded-xl p-5 border border-emerald-500/20 shadow-md hover:shadow-emerald-500/10 transition-all duration-300">
                        <h4 className="text-sm text-gray-400 mb-1">Rewards This Month</h4>
                        <p className="text-3xl font-bold text-emerald-400 mb-1">
                            {totalRewards} FLOW
                        </p>
                        <p className="text-xs text-gray-400">≈ {totalRewardUSD}</p>
                    </div>
                </div>

                {/* Settings Menu */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
                    {menuItems.map((item, i) => (
                        <div
                            key={i}
                            onClick={item.action}
                            className={`flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/60 transition-colors ${i !== menuItems.length - 1 ? "border-b border-slate-700/50" : ""
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-teal-600/10 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-white">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                    ))}
                </div>

                {/* Preferences */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-teal-600/10 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-white">Language</p>
                                <p className="text-xs text-gray-400">English</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>

                    <div className="flex items-center justify-between p-5 hover:bg-slate-800/60 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-teal-600/10 flex items-center justify-center">
                                <Coins className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-white">Currency</p>
                                <p className="text-xs text-gray-400">USD</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 pt-8">
                    Version 1.0.0 • © 2025 Stake21 FLOW
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
