'use client';

import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ConnectButton } from "thirdweb/react";
import { client, cronosTestnet } from '@/app/client';
import { createWallet } from "thirdweb/wallets";

const wallets = [
  createWallet("io.metamask"),
];

type NavItem = {
  name: string;
  url: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

export function NavBar({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 mx-auto max-w-5xl w-[90%]",
        "rounded-full border border-white/20",
        "backdrop-blur-xl bg-transparent",
      
        className
      )}
    >
      <div className="container mx-auto flex justify-between items-center px-6 py-2">
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <p className="text-2xl font-bold">
         <span className='text-[#10E46C]'>A</span>TOMX
          </p>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.url;

            return (
              <Link
                key={item.name}
                href={item.url}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                  "transition-all",
                  isActive 
                    ? "" 
                    : "text-white hover:text-green-500 hover:bg-green-500/10"
                )}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {mounted && (
            <ConnectButton
              client={client}
              chain={cronosTestnet}
              wallets={wallets}
              appMetadata={{
                name: "ATOMX Gateway",
                url: "https://atomx.xyz",
              }}
              connectButton={{
                label: "Connect Wallet",
              }}
            />
          )}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-full text-white/80 hover:text-green-500 hover:bg-green-500/10 transition-all"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-14 mt-4 left-0 right-0 md:hidden rounded-xl border border-white/20 bg-black/70 backdrop-blur-xl ">
          <div className="container mx-auto px-4 py-3">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.url;

              return (
                <Link
                  key={item.name}
                  href={item.url}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg",
                    "transition-all",
                    isActive 
                      ? "text-green-500 bg-green-500/15" 
                      : "text-white hover:text-green-500 hover:bg-green-500/10"
                  )}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            <div className="mt-3 px-4">
              {mounted && (
                <ConnectButton
                  client={client}
                  chain={cronosTestnet}
                  wallets={wallets}
                  appMetadata={{
                    name: "ATOMX Gateway",
                    url: "https://atomx.xyz",
                  }}
                  connectButton={{
                    label: "Connect Wallet",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
