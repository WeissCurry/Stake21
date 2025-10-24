import Image from 'next/image';
import { Twitter, Linkedin, Github } from 'lucide-react';
import Logo from '../../../public/Logo-icon.png';

export default function Footer() {
    return (
        <footer className="bg-gray-900/50 border-t border-gray-800">
            <div className="container mx-auto px-6 py-16">
                <div className="grid md:grid-cols-5 gap-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Image src={Logo} alt="Stake21 Logo" className="lg:w-[100px] w-9" />
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
                        <a href="https://github.com/riyqnn/Deen" className="text-gray-500 hover:text-white"><Github /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
