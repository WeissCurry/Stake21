import type { NextPage } from 'next';
import Image from 'next/image';
import {
    ShieldCheck,
    TrendingUp,
    Code,
} from 'lucide-react';
import type { ComponentType, SVGProps, ReactNode } from 'react';

import FaqSection from '@/components/HomePage/FaqSection';
import Header from '@/components/HomePage/Header';
import Footer from '@/components/HomePage/Footer';
import ThreeDPlaceholder from '@/components/HomePage/ThreeDPlaceholder';
import Model from "../../public/StakingModel.png";
import SwiperPartner from '@/components/HomePage/SwiperPartner';

const FeatureCard = ({
    icon: Icon,
    title,
    children,
}: {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    children?: ReactNode;
}) => (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-teal-400/50 hover:scale-105 transition-transform duration-300">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-teal-400/10 text-teal-400 mb-4">
            <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

type TestimonialCardProps = {
    quote: string;
    name: string;
    title?: string;
    avatarUrl?: string;
};
const TestimonialCard = ({ quote, name, title, avatarUrl }: TestimonialCardProps) => (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <p className="text-gray-300 mb-4">"{quote}"</p>
        <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-700 mr-4 flex-shrink-0">
                {/* Placeholder for avatar image */}
            </div>
            <div>
                <p className="font-semibold text-white">{name}</p>
                <p className="text-sm text-gray-400">{title}</p>
            </div>
        </div>
    </div>
);

const LandingPage: NextPage = () => {
    return (
        <div className="bg-black text-gray-300 font-sans antialiased">
            <Header />
            <main>
                {/* Hero Section */}
                <section className="container mx-auto px-6 py-24 md:py-32">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="text-center md:text-left">
                            <span className="text-teal-400 font-semibold mb-2 block">
                                SHARIA-COMPLIANT ETH STAKING
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                                Stake ETH with Confidence. Halal, Transparent, Secure.
                            </h1>
                            <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto md:mx-0">
                                Stake21 introduces a revolutionary Sharia-compliant model, allowing you to earn fixed returns on your ETH through a transparent rental agreement (Akad Ijarah), free from uncertainty and interest.
                            </p>
                            <div className="flex justify-center md:justify-start gap-4">
                                <a href="/staking" className="bg-teal-400 text-black font-semibold py-3 px-6 rounded-lg hover:bg-teal-500 transition-colors inline-block text-center">
                                    Start Staking
                                </a>
                                <a href="#ijarah-model" className="border border-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors">
                                    Learn About Ijarah
                                </a>
                            </div>
                        </div>
                        <div>
                            <div className="w-full h-80 md:h-96  rounded-lg flex items-center justify-center">
                                <ThreeDPlaceholder />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Guiding Principles Section */}
                <section className="py-12">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-teal-400">Halal by Design</h3>
                                <p className="text-gray-400 mt-2">Built upon the Islamic principle of Ijarah (rental), not interest-based lending.</p>
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-teal-400">Radical Transparency</h3>
                                <p className="text-gray-400 mt-2">Continuously audited on-chain by independent Sharia advisors.</p>
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-teal-400">Financial Inclusion</h3>
                                <p className="text-gray-400 mt-2">Opening the doors of DeFi to the $3 trillion global Muslim investment market.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* <section className='py-12'>
                    <SwiperPartner />
                </section> */}

                {/* How It Works Section */}
                <section className="container mx-auto px-6 py-24">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="text-teal-400 font-semibold mb-2 block">HOW IT WORKS</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A New Paradigm for Staking</h2>
                        <p className="text-gray-400">
                            Discover the core components that make our platform compliant, transparent, and ready for the future of Islamic DeFi.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mt-16">
                        <FeatureCard icon={ShieldCheck} title="Sharia-Compliant by Design">
                            Our platform is built on the principles of Akad Ijarah (rental), avoiding interest (Riba) and uncertainty (Gharar). Your investment aligns with your faith.
                        </FeatureCard>
                        <FeatureCard icon={TrendingUp} title="Fixed, Predictable Returns">
                            Receive a fixed, pre-agreed rental fee (Ujrah) for your ETH's validation rights. We absorb the staking reward volatility, you enjoy peace of mind.
                        </FeatureCard>
                        <FeatureCard icon={Code} title="Radical Transparency">
                            All transactions are verifiable on-chain. Our compliance is continuously monitored by an independent Sharia auditor, ensuring unwavering integrity.
                        </FeatureCard>
                    </div>
                </section>

                {/* Ijarah Model Section */}
                <section className="ijarah-model container mx-auto px-6 py-24">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1">
                            <span className="text-teal-400 font-semibold mb-2 block">INNOVATION</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">The Ijarah Model: A Halal Alternative</h2>
                            <p className="text-gray-400 mb-8">
                                We've reimagined staking. Instead of lending your ETH for interest, you lease its validation rights for a fixed fee. This creates a fair and transparent system.
                            </p>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="text-xl font-bold text-teal-400">1.</div>
                                    <div>
                                        <h3 className="font-semibold text-white">Clear & Fair Agreement</h3>
                                        <p className="text-gray-400">You (the Mu'jir) agree to lease your ETH's validation rights via a clear digital contract.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-xl font-bold text-teal-400">2.</div>
                                    <div>
                                        <h3 className="font-semibold text-white">Platform as Lessee</h3>
                                        <p className="text-gray-400">Stake21s (the Musta'jir) rents those rights to perform staking operations on your behalf.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-xl font-bold text-teal-400">3.</div>
                                    <div>
                                        <h3 className="font-semibold text-white">Fixed Rental Payment (Ujrah)</h3>
                                        <p className="text-gray-400">You receive a fixed, periodic payment, regardless of staking reward fluctuations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <div className="w-full h-80 md:h-96 bg-[#000d24] rounded-lg relative">
                                <Image src={Model} alt="Ijarah Staking Model" className="object-contain" fill />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="bg-gray-900/30 py-24">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto">
                            <span className="text-teal-400 font-semibold mb-2 block">TESTIMONIALS</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by Community Leaders</h2>
                            <p className="text-gray-400">
                                Hear from experts in Islamic Finance and Web3 who believe in our mission.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                            <TestimonialCard
                                name="Dr. Aisha Ahmed"
                                title="Sharia Finance Scholar"
                                quote="Stake21s' use of the Ijarah contract is a brilliant and legitimate innovation. It finally provides a DeFi solution that I can confidently recommend to my community."
                            />
                            <TestimonialCard
                                name="Farid Khan"
                                title="Web3 Developer & Investor"
                                quote="The transparency is a game-changer. Having an on-chain auditor isn't just a feature, it's a statement of commitment to genuine Sharia compliance."
                            />
                            <TestimonialCard
                                name="Yusuf Abdul-Malik"
                                title="Early Adopter"
                                quote="I've always been hesitant about DeFi. Stake21s gave me the peace of mind to participate and earn on my assets without compromising my principles."
                            />
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="container mx-auto px-6">
                    <FaqSection />
                </section>

                {/* CTA Section */}
                <section className="container mx-auto px-6 py-24 text-center">
                    <div className="max-w-3xl mx-auto">
                        <span className="text-teal-400 font-semibold mb-2 block">GET STARTED</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join the Halal DeFi Revolution</h2>
                        <p className="text-gray-400 mb-8">
                            Start your journey into a faith-compliant financial future. Stake your ETH with principles and peace of mind, right from your Farcaster feed.
                        </p>
                        <a href="/staking" className="bg-teal-400 text-black font-semibold py-3 px-8 rounded-lg hover:bg-teal-500 transition-colors text-lg">
                            Start Staking Today
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
