import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import LandingNav from "@/components/Landingnav";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ATOMX - x402 Pay-per-API Gateway",
  description:
    "Cronos-native API Gateway for AI agents. Pay per request with USDC using the x402 protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
           <div className="fixed top-0 left-0 right-0 z-50">
            <LandingNav />
          </div>
          
          <main className="pt-16">
            {children}
          </main>
          <Toaster />
          </ThirdwebProvider>
      </body>
    </html>
  );
}
