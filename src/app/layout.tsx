import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletProvider"; // Importa el proveedor

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoomLen - Rent-backed Advances for Property Owners",
  description: "Unlock liquidity from rental agreements. Get 80-90% of future rent upfront through DeFi. Tokenized leases, instant advances, risk-based pricing on Polkadot.",
  keywords: ["DeFi", "Rent", "NFT", "Lending", "Polkadot", "Real Estate", "LATAM", "Property", "Liquidity", "Smart Contracts"],
  authors: [{ name: "RoomLen Team" }],
  creator: "RoomLen",
  publisher: "RoomLen",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://roomlen.io",
    title: "RoomLen - Rent-backed Advances Platform",
    description: "Convert signed leases into instant capital. DeFi protocol for property owners and investors on Polkadot.",
    siteName: "RoomLen",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RoomLen - Rent-backed Advances Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoomLen - Rent-backed Advances",
    description: "Unlock liquidity from rental agreements through DeFi on Polkadot",
    images: ["/og-image.png"],
    creator: "@roomlen",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
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
