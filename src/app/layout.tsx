import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoomLen - Rent-backed advances for property owners",
  description: "Convert a signed lease into upfront capital today. Investors receive monthly rent streams via on-chain escrow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
