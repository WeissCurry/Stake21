// components/ClientLayout.tsx
"use client"; // <-- Tandai sebagai Client Component

import { usePathname } from "next/navigation";
import NavigationBar from "./NavigationBar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Tampilkan NavigationBar jika path BUKAN "/"
  const showNavbar = pathname !== "/";

  return (
    <>
      {showNavbar && <NavigationBar />}
      {children}
    </>
  );
}