import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OnchainProviders } from "@/lib/OnchainProviders";
import { WalletProvider } from "@/lib/WalletProvider";
// import '@coinbase/onchainkit/styles.css'; // Commented out due to Tailwind v4 conflict

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoomLen - Rent-backed Advances for Property Owners",
  description: "Unlock liquidity from rental agreements. Get 80-90% of future rent upfront through DeFi. Tokenized leases, instant advances, risk-based pricing on Base.",
  keywords: ["DeFi", "Rent", "NFT", "Lending", "Base", "Real Estate", "LATAM", "Property", "Liquidity", "Smart Contracts"],
  authors: [{ name: "RoomLen Team" }],
  creator: "RoomLen",
  publisher: "RoomLen",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://roomlen.io",
    title: "RoomLen - Rent-backed Advances Platform",
    description: "Convert signed leases into instant capital. DeFi protocol for property owners and investors on Base.",
    siteName: "RoomLen",
    images: [
      {
        url: "/roomlenlogo2.png",
        width: 1200,
        height: 630,
        alt: "RoomLen - Rent-backed Advances Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoomLen - Rent-backed Advances",
    description: "Unlock liquidity from rental agreements through DeFi on Base",
    images: ["/roomlenlogo2.png"],
    creator: "@roomlen",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/roomlenlogo.png",
    apple: "/roomlenlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <OnchainProviders>
          <WalletProvider>{children}</WalletProvider>
        </OnchainProviders>
      </body>
    </html>
  );
}
