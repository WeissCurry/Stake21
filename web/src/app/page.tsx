"use client";

import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { TrendingUp, Wallet, Shield, Zap, ArrowRight, Sparkles, Users, Award } from "lucide-react";
import NavigationBar from "../components/NavigationBar";

const HomePage = () => {
    const router = useRouter();

    const features = [
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Ujrah Harian",
            description: "Dapatkan ujrah setiap hari secara otomatis",
            color: "bg-success/10 text-success",
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "100% Aman",
            description: "Smart contract teraudit dan terverifikasi",
            color: "bg-blue-500/10 text-blue-500",
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Proses Cepat",
            description: "Staking dan withdraw instant",
            color: "bg-purple-500/10 text-purple-500",
        },
    ];

    const stats = [
        { value: "8.5%", label: "APY Tertinggi", icon: <TrendingUp className="w-5 h-5" /> },
        { value: "5,420+", label: "Pengguna Aktif", icon: <Users className="w-5 h-5" /> },
        { value: "$2.8M+", label: "Total Staking", icon: <Wallet className="w-5 h-5" /> },
    ];

    const testimonials = [
        {
            name: "Ahmad R.",
            comment: "Sudah 3 bulan staking di sini, ujrah selalu tepat waktu!",
            earning: "+2.5 ETH",
        },
        {
            name: "Siti M.",
            comment: "Platform paling mudah digunakan untuk pemula.",
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
                        <span className="text-sm font-semibold">Halal & Syariah Compliant</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-3 leading-tight">
                        Sewakan ETH,<br />Raih Ujrah Harian
                    </h1>
                    <p className="text-base opacity-90 mb-8">
                        Platform staking ETH terpercaya dengan sistem bagi hasil yang transparan dan sesuai syariah
                    </p>
                    
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/staking")}
                            className="flex-1 h-14 bg-primary-foreground/20 backdrop-blur-sm text-white hover:bg-primary-foreground/30 rounded-xl shadow-medium font-semibold text-base border border-white/20"
                        >
                            Mulai Staking
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
                        <p className="text-sm font-semibold text-foreground mb-0.5">Ujrah Dibagikan Hari Ini</p>
                        <p className="text-xs text-muted-foreground">124.5 ETH telah dibayarkan ke 5,420 pengguna</p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground px-1">Mengapa Pilih Kami?</h2>
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
                    <h2 className="text-xl font-bold text-foreground px-1">Kata Mereka</h2>
                    <div className="space-y-3">
                        {testimonials.map((testimonial, i) => (
                            <div key={i} className="bg-gradient-card rounded-xl p-5 border border-border shadow-medium">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">Pengguna Aktif</p>
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
                        <h2 className="text-2xl font-bold mb-2">Siap Memulai?</h2>
                        <p className="text-sm opacity-90 mb-6">
                            Daftar sekarang dan dapatkan bonus ujrah 0.5% untuk staking pertama Anda!
                        </p>
                        <Button
                            onClick={() => router.push("/staking")}
                            className="w-full h-14 bg-primary-foreground/20 backdrop-blur-sm text-white hover:bg-primary-foreground/30 rounded-xl shadow-medium font-semibold text-base border border-white/20"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Mulai Sekarang
                        </Button>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="text-center space-y-2 pb-4">
                    <p className="text-xs text-muted-foreground">
                        🔒 Platform terenkripsi dan teraudit secara berkala
                    </p>
                    <p className="text-xs text-muted-foreground">
                        📱 Tersedia di Web, iOS & Android
                    </p>
                </div>
            </main>

            <NavigationBar />
        </div>
    );
};

export default HomePage;