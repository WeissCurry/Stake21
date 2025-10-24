"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
    User,
    Mail,
    Wallet,
    Shield,
    Bell,
    ChevronRight,
    LogOut,
    Edit,
} from "lucide-react";
import NavigationBar from "../../components/NavigationBar";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { WalletConnectButton } from "../../components/walletConnectButton";


const ProfilePage = () => {
    const router = useRouter();

    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();

    const menuItems = [
        {
            icon: <User className="w-5 h-5" />,
            title: "Account Information",
            subtitle: "Manage your personal data",
            action: () => {},
        },
        {
            icon: <Wallet className="w-5 h-5" />,
            title: "Wallet & Payment",
            subtitle: "Set up payment methods",
            action: () => {},
        },
        {
            icon: <Shield className="w-5 h-5" />,
            title: "Security",
            subtitle: "Password and authentication",
            action: () => {},
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: "Notifications",
            subtitle: "Notification settings",
            action: () => {},
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="bg-gradient-hero text-primary-foreground shadow-medium">
                <div className="max-w-md mx-auto px-6 py-8 text-white">
                    <h1 className="text-2xl font-bold mb-1">My Profile</h1>
                    <p className="text-sm opacity-90">
                        Manage your account and preferences
                    </p>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 -mt-4 space-y-6">
                {/* Profile Card */}
                <div className="bg-gradient-card rounded-2xl p-6 border border-border shadow-medium">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                            <User className="w-10 h-10 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-foreground mb-1">
                                {isConnected
                                    ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                                    : "Not Connected"}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {isConnected ? (
                                    <>
                                        <Wallet className="w-4 h-4" />
                                        <span>Wallet Connected</span>
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        <span>ahmad.fauzi@email.com</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <WalletConnectButton/>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card rounded-xl p-4 border border-border shadow-medium">
                        <p className="text-sm text-muted-foreground mb-1">
                            Total Investment
                        </p>
                        <p className="text-2xl font-bold text-foreground">5.25 ETH</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 border border-border shadow-medium">
                        <p className="text-sm text-muted-foreground mb-1">
                            Rewards This Month
                        </p>
                        <p className="text-2xl font-bold text-success">0.012 ETH</p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="bg-card rounded-2xl border border-border shadow-medium overflow-hidden">
                    {menuItems.map((item, i) => (
                        <div
                            key={i}
                            onClick={item.action}
                            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                                i !== menuItems.length - 1
                                    ? "border-b border-border"
                                    : ""
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-foreground">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.subtitle}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                    ))}
                </div>

                {/* Additional Settings */}
                <div className="bg-card rounded-2xl border border-border shadow-medium overflow-hidden">
                    <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="text-lg">🇺🇸</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-foreground">
                                        Language
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        English
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="text-lg">💰</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-foreground">
                                        Currency
                                    </p>
                                    <p className="text-xs text-muted-foreground">USD</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                {/*<Button className="w-full h-12 border-2 border-destructive text-destructive hover:bg-destructive hover:text-white rounded-xl transition-colors">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
*/}
                <div className="text-center text-xs text-muted-foreground pb-4">
                    Version 1.0.0 • © 2025 Stake21
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;