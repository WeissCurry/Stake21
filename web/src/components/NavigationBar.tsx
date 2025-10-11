"use client"; 

import { Home, LayoutDashboard, User } from "lucide-react";
import Link from "next/link"; 
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils"; 

const NavigationBar = () => {
  const pathname = usePathname(); 

  const navItems = [
    { href: "/", icon: Home, label: "Beranda" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-large z-50">
      <div className="max-w-md mx-auto px-6 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            // Langkah 3: Buat logika untuk menentukan link aktif
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href} // <-- Langkah 1: Gunakan 'href'
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200",
                  // Gunakan variabel 'isActive' yang sudah kita buat
                  isActive
                    ? "text-primary bg-secondary/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;