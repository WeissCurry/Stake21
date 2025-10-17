import Image from 'next/image';
import { Menu } from 'lucide-react';
import Logo from '../../../public/Logo-icon.png';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
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
                    <a href="/dapps" className="bg-teal-400 text-black font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 transition-colors">
                        Launch App
                    </a>
                </div>
                <div className="md:hidden">
                    <Menu className="h-6 w-6 text-white" />
                </div>
            </div>
        </header>
    );
}
