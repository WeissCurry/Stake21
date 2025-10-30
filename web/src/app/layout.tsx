// app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
// Hapus import NavigationBar, karena sudah dihandle di ClientLayout
// import NavigationBar from "../components/NavigationBar"; 
import ClientLayout from "../components/ClientLayout"; 

export const metadata: Metadata = {
  title: "Stake21",
  description: "Sharia-Compliant Crypto Staking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Bungkus children dengan ClientLayout */}
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}