"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { TrendingUp, Lock, Zap, Shield, Info, ArrowRight } from "lucide-react";
import NavigationBar from "../../components/NavigationBar";

const StakingPage = () => {
    const router = useRouter();
    const [selectedAmount, setSelectedAmount] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("flexible");

    const stakingPlans = [
        {
            id: "flexible",
            title: "Flexible",
            duration: "Kapan saja",
            apy: "4.5%",
            icon: <Zap className="w-5 h-5" />,
            color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        },
        {
            id: "locked-30",
            title: "Terkunci 30 Hari",
            duration: "30 hari",
            apy: "6.2%",
            icon: <Lock className="w-5 h-5" />,
            color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        },
        {
            id: "locked-90",
            title: "Terkunci 90 Hari",
            duration: "90 hari",
            apy: "8.5%",
            icon: <Shield className="w-5 h-5" />,
            color: "bg-success/10 text-success border-success/20",
        },
    ];

    const quickAmounts = ["0.5", "1.0", "2.5", "5.0"];

    const calculateEarnings = (amount: string | number) => {
        if (!amount || isNaN(Number(amount))) return "0.00";
        
        const plan = stakingPlans.find(p => p.id === selectedPlan);
        if (!plan) return "0.00"; 

        const apy = parseFloat(plan.apy) / 100;
        const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        const earnings = parsedAmount * apy;
        return earnings.toFixed(2);
        };


    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-gradient-hero text-primary-foreground shadow-medium">
                <div className="max-w-md mx-auto px-6 py-8 text-white">
                    <h1 className="text-2xl font-bold mb-1">Staking ETH</h1>
                    <p className="text-sm opacity-90">Sewakan ETH dan dapatkan ujrah harian</p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 -mt-4 space-y-6">
                {/* Balance Card */}
                <div className="bg-gradient-card rounded-2xl p-6 border border-border shadow-medium">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Saldo Tersedia</p>
                        <Button className="text-xs h-7 px-3 bg-primary/10 hover:bg-primary/20 text-primary">
                            Deposit
                        </Button>
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-1">12.45 ETH</p>
                    <p className="text-sm text-muted-foreground">≈ $24,900.00 USD</p>
                </div>

                {/* Staking Plans */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground px-1">Pilih Paket Staking</h3>
                    <div className="grid gap-3">
                        {stakingPlans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`bg-card rounded-xl p-4 border-2 cursor-pointer transition-all shadow-medium ${
                                    selectedPlan === plan.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${plan.color} border flex items-center justify-center`}>
                                            {plan.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">{plan.title}</p>
                                            <p className="text-xs text-muted-foreground">{plan.duration}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-success">{plan.apy}</p>
                                        <p className="text-xs text-muted-foreground">APY</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Amount Input */}
                <div className="bg-card rounded-2xl p-6 border border-border shadow-medium space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Jumlah ETH</h3>
                    
                    <div className="relative">
                        <input
                            type="number"
                            value={selectedAmount}
                            onChange={(e) => setSelectedAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-16 px-4 text-2xl font-bold bg-muted/50 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                            ETH
                        </span>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {quickAmounts.map((amount) => (
                            <Button
                                key={amount}
                                onClick={() => setSelectedAmount(amount)}
                                className="h-10 bg-muted hover:bg-primary/10 text-foreground hover:text-primary border border-border rounded-lg text-sm font-semibold"
                            >
                                {amount}
                            </Button>
                        ))}
                    </div>

                    {/* Estimated Earnings */}
                    <div className="bg-gradient-hero/5 rounded-xl p-4 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">Estimasi Ujrah</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-success">
                                {calculateEarnings(selectedAmount)} ETH
                            </p>
                            <p className="text-xs text-muted-foreground">
                                / {selectedPlan === "flexible" ? "30" : selectedPlan === "locked-30" ? "30" : "90"} hari
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Ujrah dibayarkan setiap hari secara otomatis</p>
                        <p>• Minimum staking: 0.1 ETH</p>
                        <p>• Tidak ada biaya penarikan untuk paket flexible</p>
                    </div>
                </div>

                {/* Staking Button */}
                <Button
                    disabled={!selectedAmount || parseFloat(selectedAmount) < 0.1}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-medium text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Mulai Staking
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {/* Current Staking Summary */}
                <div className="bg-card rounded-2xl p-6 border border-border shadow-medium">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Staking Aktif Anda</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Distaking</p>
                            <p className="text-lg font-bold text-foreground">5.25 ETH</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Ujrah Hari Ini</p>
                            <p className="text-lg font-bold text-success">+0.0004 ETH</p>
                        </div>
                    </div>
                </div>
            </main>

            <NavigationBar />
        </div>
    );
};

export default StakingPage;