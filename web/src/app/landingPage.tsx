import type { NextPage } from 'next';
import Image from 'next/image';
import {
  ShieldCheck,
  TrendingUp,
  Code,
  Globe,
  Database,
  Users,
  Twitter,
  Linkedin,
  Github,
  ChevronRight,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import type { ComponentType, SVGProps, ReactNode } from 'react';

import Logo from '../../public/Logo-icon.png';

// Komponen untuk kartu fitur
const FeatureCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children?: ReactNode;
}) => (
  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-teal-400/50 transition-colors duration-300">
    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-teal-400/10 text-teal-400 mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{children}</p>
  </div>
);

// Komponen untuk kartu testimoni
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

// Komponen untuk item FAQ (Accordion style)
type FaqItemProps = {
  question: string;
  answer?: ReactNode;
};
const FaqItem = ({ question, answer }: FaqItemProps) => (
  <div className="border-b border-gray-800 py-6">
    <div className="flex justify-between items-center cursor-pointer">
      <h4 className="text-lg font-medium text-white">{question}</h4>
      <Plus className="h-5 w-5 text-gray-400" />
    </div>
    {/* Logic for accordion expansion would be added here */}
  </div>
);

const LandingPage: NextPage = () => {
  return (
    <div className="bg-black text-gray-300 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* <ShieldCheck className="h-7 w-7 text-teal-400" /> */}
            <Image src={Logo} alt="Stake21 Logo" className="w-9" />
            <span className="text-xl font-bold text-white">Stake21</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="hover:text-white transition-colors">How It Works</a>
            <a href="#" className="hover:text-white transition-colors">Sharia Compliance</a>
            <a href="#" className="hover:text-white transition-colors">Farcaster</a>
            <a href="#" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <button className="bg-teal-400 text-black font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 transition-colors">
              Launch App
            </button>
          </div>
          <div className="md:hidden">
            <Menu className="h-6 w-6 text-white" />
          </div>
        </div>
      </header>

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
                Stake21s introduces a revolutionary Sharia-compliant model, allowing you to earn fixed returns on your ETH through a transparent rental agreement (Akad Ijarah), free from uncertainty and interest.
              </p>
              <div className="flex justify-center md:justify-start gap-4">
                <button className="bg-teal-400 text-black font-semibold py-3 px-6 rounded-lg hover:bg-teal-500 transition-colors">
                  Start Staking
                </button>
                <button className="border border-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors">
                  Learn About Ijarah
                </button>
              </div>
            </div>
            <div>
              {/* Placeholder for 3D graphic */}
              <div className="w-full h-80 md:h-96 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-gray-600"></span>
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
        <section className="container mx-auto px-6 py-24">
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
              {/* Placeholder for flowchart graphic */}
              <div className="w-full h-80 md:h-96 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-gray-600"></span>
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
        <section className="container mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Common Questions Answered</h2>
          </div>
          <div className="max-w-3xl mx-auto mt-12">
            <FaqItem question="Is this really Halal? How is it different from normal staking?" />
            <FaqItem question="What is Akad Ijarah?" />
            <FaqItem question="How is my return fixed if staking rewards fluctuate?" />
            <FaqItem question="What are the risks involved?" />
            <FaqItem question="How do I start with Farcaster?" />
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="text-teal-400 font-semibold mb-2 block">GET STARTED</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join the Halal DeFi Revolution</h2>
            <p className="text-gray-400 mb-8">
              Start your journey into a faith-compliant financial future. Stake your ETH with principles and peace of mind, right from your Farcaster feed.
            </p>
            <button className="bg-teal-400 text-black font-semibold py-3 px-8 rounded-lg hover:bg-teal-500 transition-colors text-lg">
              Start Staking Today
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-800">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-5 gap-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                {/* <ShieldCheck className="h-7 w-7 text-teal-400" /> */}
                <Image src={Logo} alt="Stake21 Logo" className="lg:w-[100px] w-9" />
                <span className="text-xl font-bold text-white">Stake21</span>
              </div>
            </div>
            <div className="md:col-start-3">
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Dashboard</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Sharia Certificate</a></li>
                <li><a href="#" className="hover:text-white">Audit Reports</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">&copy; 2025 Stake21s. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-white"><Twitter /></a>
              <a href="#" className="text-gray-500 hover:text-white"><Linkedin /></a>
              <a href="#" className="text-gray-500 hover:text-white"><Github /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
