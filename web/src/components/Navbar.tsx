'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

const NAV_ITEMS = [
  { label: 'Beranda', href: '/', match: (p: string) => p === '/' },
  {
    label: 'Kampanye',
    href: '/campaigns',
    match: (p: string) => p === '/campaigns' || p.startsWith('/campaign/'),
  },
  { label: 'Penerima', href: '/penerima', match: (p: string) => p.startsWith('/penerima') },
  { label: 'Toko', href: '/toko', match: (p: string) => p.startsWith('/toko') },
];

export function Navbar() {
  const pathname = usePathname() ?? '/';
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 bg-chrome-dark/95 backdrop-blur text-text-on-dark border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[26px] leading-none font-extrabold tracking-[-0.02em] text-text-on-dark hover:opacity-90"
            aria-label="Bound beranda"
          >
            bound
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-caption text-text-on-dark/75">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Sepolia
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-default text-body-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-text-on-dark'
                    : 'text-text-on-dark/70 hover:text-text-on-dark hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ConnectWalletButton variant="navbar" />
          </div>

          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-default border border-white/15 text-body-sm font-medium text-text-on-dark hover:bg-white/10 active:scale-[0.98] transition-all"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span>{mobileOpen ? 'Tutup' : 'Menu'}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-chrome-dark px-4 py-3 space-y-2 animate-pop">
          <nav className="flex flex-col gap-1" aria-label="Navigasi seluler">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3.5 py-2.5 rounded-default text-body font-medium transition-colors ${
                    active
                      ? 'bg-white/15 text-text-on-dark'
                      : 'text-text-on-dark/75 hover:text-text-on-dark hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-white/10 sm:hidden">
            <ConnectWalletButton variant="navbar" fullWidth />
          </div>
        </div>
      )}
    </header>
  );
}
