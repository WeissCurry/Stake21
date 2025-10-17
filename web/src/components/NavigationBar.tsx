"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "../lib/utils";
import Logo from '../../public/Logo-icon.png';
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NavigationBar = () => { 
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    { href: "/staking", label: "Staking" },
    { href: "/withdraw", label: "Withdraw" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src={Logo} alt="App Logo" className="w-9" />
            <span className="text-xl font-bold text-white">Stake21</span>
          </Link>

 
          <nav className="hidden md:flex items-center gap-8 text-gray-300">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-white",
                    isActive ? "text-teal-400 font-semibold" : ""
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Tombol Aksi Desktop */}
          <div className="hidden md:flex items-center gap-4">

            {/* INI TOMBOL CONNECT MOCKUP. nanti benerin pake <ConnectButton /> */}
            <div>Connect Button</div>
            {/* <ConnectButton /> */}
          </div>

          {/* Tombol Menu Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu Dropdown Mobile */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-[77px] left-0 right-0 bg-black/90 backdrop-blur-md z-40 p-6 border-b border-gray-800">
          <nav className="flex flex-col items-center gap-6">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)} // Tutup menu setelah diklik
                    className={cn(
                      "text-lg text-gray-300 hover:text-white transition-colors w-full text-center py-2 rounded-md",
                      isActive ? "text-teal-400 font-bold bg-gray-800" : ""
                    )}
                  >
                    {item.label}
                  </Link>
                )
            })}
            
            <div className="mt-4 w-full flex justify-center">
            {/* INI TOMBOL CONNECT MOCKUP. nanti benerin pake <ConnectButton /> */}
            <div>Connect Button</div>
            {/* <ConnectButton /> */}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default NavigationBar;
