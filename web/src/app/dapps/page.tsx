"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { TrendingUp, Wallet, Shield, Zap, ArrowRight, Sparkles, Users, Award } from "lucide-react";

const Dapps = () => {
    const router = useRouter();

    const features = [
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Daily Rewards",
            description: "Earn rewards automatically every day",
            color: "bg-success/10 text-success",
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "100% Secure",
            description: "Audited and verified smart contracts",
            color: "bg-blue-500/10 text-blue-500",
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Fast Processing",
            description: "Instant staking and withdrawal",
            color: "bg-purple-500/10 text-purple-500",
        },
    ];

    const stats = [
        { value: "8.5%", label: "Highest APY", icon: <TrendingUp className="w-5 h-5" /> },
        { value: "5,420+", label: "Active Users", icon: <Users className="w-5 h-5" /> },
        { value: "$2.8M+", label: "Total Staked", icon: <Wallet className="w-5 h-5" /> },
    ];

    const testimonials = [
        {
            name: "Ahmad R.",
            comment: "Been staking here for 3 months, rewards always on time!",
            earning: "+2.5 ETH",
        },
        {
            name: "Siti M.",
            comment: "The easiest platform to use for beginners.",
            earning: "+1.8 ETH",
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Hero Section */}
            <header className="bg-gradient-hero text-primary-foreground shadow-medium overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="max-w-md mx-auto px-6 py-12 relative text-white">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-semibold">Halal & Shariah Compliant</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-3 leading-tight">
                        Stake ETH,<br />Earn Daily Rewards
                    </h1>
                    <p className="text-base opacity-90 mb-8">
                        Trusted ETH staking platform with transparent profit-sharing system that is Shariah compliant
                    </p>
                    
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/staking")}
                            className="flex-1 h-14 bg-primary-foreground/20 backdrop-blur-sm text-white hover:bg-primary-foreground/30 rounded-xl shadow-medium font-semibold text-base border border-white/20"
                        >
                            Start Staking
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            className="h-14 px-6 border-2 border-white/20 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm rounded-xl font-semibold text-white"
                        >
                            Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 space-y-8 mt-6">
                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-gradient-card rounded-xl p-4 border border-border shadow-medium text-center">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                                {stat.icon}
                            </div>
                            <p className="text-xl font-bold text-foreground mb-1">{stat.value}</p>
                            <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Live Earnings Banner */}
                <div className="bg-gradient-to-r from-success/10 via-success/5 to-transparent border border-success/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center animate-pulse">
                        <Award className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-0.5">Rewards Distributed Today</p>
                        <p className="text-xs text-muted-foreground">124.5 ETH paid out to 5,420 users</p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground px-1">Why Choose Us?</h2>
                    <div className="grid gap-3">
                        {features.map((feature, i) => (
                            <div key={i} className="bg-card rounded-xl p-5 border border-border shadow-medium hover:shadow-lg transition-all">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center flex-shrink-0`}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-base text-foreground mb-1">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Testimonials */}
                <div className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground px-1">What They Say</h2>
                    <div className="space-y-3">
                        {testimonials.map((testimonial, i) => (
                            <div key={i} className="bg-gradient-card rounded-xl p-5 border border-border shadow-medium">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">Active User</p>
                                    </div>
                                    <div className="bg-success/10 px-3 py-1 rounded-full">
                                        <p className="text-xs font-semibold text-success">{testimonial.earning}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground italic">"{testimonial.comment}"</p>
                                <div className="flex gap-1 mt-3">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-yellow-500">⭐</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-hero text-primary-foreground rounded-2xl p-6 shadow-medium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative text-white">
                        <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
                        <p className="text-sm opacity-90 mb-6">
                            Sign up now and get a 0.5% bonus reward for your first stake!
                        </p>
                        <Button
                            onClick={() => router.push("/staking")}
                            className="w-full h-14 bg-primary-foreground/20 backdrop-blur-sm text-white hover:bg-primary-foreground/30 rounded-xl shadow-medium font-semibold text-base border border-white/20"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Start Now
                        </Button>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="text-center space-y-2 pb-4">
                    <p className="text-xs text-muted-foreground">
                        🔒 Encrypted platform with regular audits
                    </p>
                    <p className="text-xs text-muted-foreground">
                        📱 Available on Web, iOS & Android
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Dapps;