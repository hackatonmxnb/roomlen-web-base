import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletProvider"; // Importa el proveedor

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoomLEN - Rent-backed advances",
  description: "Convert a signed lease into upfront capital today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>{children}</WalletProvider> 
      </body>
    </html>
  );
}
