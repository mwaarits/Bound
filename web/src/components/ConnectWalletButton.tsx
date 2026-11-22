'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
} from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { mockIDRXAbi } from '@/lib/abi';
import {
  MOCKIDRX_ADDRESS,
  etherscanAddrUrl,
  isValidAddress,
  shortenAddress,
} from '@/lib/campaigns';
import { formatIDR } from '@/lib/format';

function MetaMaskIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M21.2 2.5L13.3 8.4l1.5-3.5L21.2 2.5z" fill="#E17726" />
      <path d="M2.8 2.5l7.8 5.9-1.4-3.5L2.8 2.5z" fill="#E27625" />
      <path d="M18.4 16.7l-2.1 3.2 4.5 1.2 1.3-4.3-3.7-.1z" fill="#E27625" />
      <path d="M1.9 16.8l1.3 4.3 4.5-1.2-2.1-3.2-3.7.1z" fill="#E27625" />
      <path d="M7.5 10.6l-1.3 1.9 4.5.2-.2-4.8-3 2.7z" fill="#E27625" />
      <path d="M16.5 10.6l-3-2.8-.1 4.9 4.4-.2-1.3-1.9z" fill="#E27625" />
      <path d="M7.7 19.9l2.7-1.3-2.3-1.8-.4 3.1z" fill="#E27625" />
      <path d="M13.6 18.6l2.7 1.3-.4-3.1-2.3 1.8z" fill="#E27625" />
      <path d="M16.3 19.9l-2.7-1.3.2 1.8v.8l2.5-1.3z" fill="#D5BFB2" />
      <path d="M7.7 19.9l2.5 1.3v-.8l.2-1.8-2.7 1.3z" fill="#D5BFB2" />
      <path d="M10.3 15.6l-2.2-.7 1.6-.7.6 1.4z" fill="#233447" />
      <path d="M13.7 15.6l.6-1.4 1.6.7-2.2.7z" fill="#233447" />
      <path d="M7.7 19.9l.4-3.2-2.5.1 2.1 3.1z" fill="#CC6228" />
      <path d="M15.9 16.7l.4 3.2 2.1-3.1-2.5-.1z" fill="#CC6228" />
      <path d="M17.8 12.5l-4.4.2.4 2.9.6-1.4 1.6.7 1.8-2.4z" fill="#CC6228" />
      <path d="M8.1 14.9l1.6-.7.6 1.4.4-2.9-4.5-.2 1.9 2.4z" fill="#CC6228" />
      <path d="M6.2 12.5l1.9 3.7-.1-1.8-1.8-1.9z" fill="#E27525" />
      <path d="M16 14.4l-.1 1.8 1.9-3.7-1.8 1.9z" fill="#E27525" />
      <path d="M10.7 12.7l-.4 2.9.5 2.6.1-3.4-.2-2.1z" fill="#E27525" />
      <path d="M13.4 12.7l-.2 2.1.1 3.4.5-2.6-.4-2.9z" fill="#E27525" />
    </svg>
  );
}

export function ConnectWalletButton({
  variant = 'navbar',
  fullWidth = false,
}: {
  variant?: 'navbar' | 'primary';
  fullWidth?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [installHint, setInstallHint] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectErr, setConnectErr] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const canReadBalance = Boolean(
    mounted && isConnected && address && isValidAddress(MOCKIDRX_ADDRESS)
  );

  const { data: balance } = useReadContract({
    address: MOCKIDRX_ADDRESS,
    abi: mockIDRXAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: canReadBalance },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setInstallHint(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && (menuOpen || installHint)) {
        setMenuOpen(false);
        setInstallHint(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, installHint]);

  async function handleConnect() {
    setConnectErr('');
    setInstallHint(false);

    const hasMetaMask =
      typeof window !== 'undefined' &&
      Boolean((window as { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask);

    if (!hasMetaMask) {
      setInstallHint(true);
      return;
    }

    const mmConnector = connectors[0];
    if (!mmConnector) {
      setInstallHint(true);
      return;
    }

    try {
      await connectAsync({ connector: mmConnector });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.toLowerCase().includes('rejected')) {
        setConnectErr('Gagal menghubungkan MetaMask. Coba lagi.');
      }
    }
  }

  function handleCopy() {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const widthCls = fullWidth ? 'w-full justify-center' : '';

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center gap-2 rounded-default px-4 py-2 min-h-[40px] text-body-sm font-medium bg-brand-primary text-text-on-dark opacity-70 ${widthCls}`}
      >
        <MetaMaskIcon />
        <span>Hubungkan MetaMask</span>
      </button>
    );
  }

  if (isConnected && address && walletChainId !== sepolia.id) {
    return (
      <button
        type="button"
        onClick={() => switchChain({ chainId: sepolia.id })}
        disabled={isSwitching}
        className={`inline-flex items-center gap-2 rounded-default px-4 py-2 min-h-[40px] text-body-sm font-semibold bg-success text-text-primary hover:opacity-90 transition-opacity ${widthCls}`}
      >
        <span className="w-2 h-2 rounded-full bg-error" />
        <span>{isSwitching ? 'Mengganti jaringan...' : 'Ganti ke Sepolia'}</span>
      </button>
    );
  }

  if (isConnected && address) {
    const isNavbar = variant === 'navbar';
    return (
      <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={`inline-flex items-center gap-2.5 rounded-default px-3.5 py-2 min-h-[40px] text-body-sm font-medium transition-colors ${widthCls} ${
            isNavbar
              ? 'bg-white/10 text-text-on-dark border border-white/15 hover:bg-white/15'
              : 'bg-bg-surface text-text-primary border border-border-subtle hover:border-brand-primary'
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-mono text-caption sm:text-body-sm">
            {shortenAddress(address)}
          </span>
          {typeof balance === 'bigint' && (
            <span
              className={`hidden sm:inline font-mono text-caption px-2 py-0.5 rounded-sm ${
                isNavbar
                  ? 'bg-brand-primary/30 text-emerald-200'
                  : 'bg-brand-surface text-brand-primary'
              }`}
            >
              {formatIDR(balance)}
            </span>
          )}
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-lg bg-bg-base text-text-primary border border-border-subtle shadow-md p-3 space-y-3 z-50"
          >
            <div className="space-y-1 pb-2.5 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-secondary">MetaMask • Sepolia</span>
                <span className="inline-flex items-center gap-1 text-caption text-brand-primary font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  Terhubung
                </span>
              </div>
              <p className="font-mono text-body-sm text-text-primary break-all">{address}</p>
              {typeof balance === 'bigint' && (
                <p className="text-caption text-text-secondary pt-1">
                  Saldo: <span className="font-mono font-medium text-text-primary">{formatIDR(balance)} mIDRX</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full text-left px-3 py-2 rounded-default text-body-sm hover:bg-bg-surface transition-colors"
              >
                {copied ? '✓ Alamat tersalin' : 'Salin Alamat'}
              </button>
              <a
                href={etherscanAddrUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left px-3 py-2 rounded-default text-body-sm hover:bg-bg-surface transition-colors"
              >
                Lihat di Sepolia Etherscan ↗
              </a>
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-default text-body-sm text-error hover:bg-error/5 transition-colors"
              >
                Putuskan Dompet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className={`inline-flex items-center gap-2 rounded-default px-4 py-2 min-h-[40px] text-body-sm font-semibold bg-brand-primary text-text-on-dark hover:bg-brand-primary-deep transition-colors ${widthCls}`}
      >
        <MetaMaskIcon />
        <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan MetaMask'}</span>
      </button>

      {(installHint || connectErr) && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg bg-bg-base text-text-primary border border-border-subtle shadow-md p-4 space-y-2.5 z-50">
          {installHint ? (
            <>
              <p className="text-body-sm font-semibold text-text-primary">
                MetaMask tidak terdeteksi
              </p>
              <p className="text-caption text-text-secondary">
                Bound menggunakan ekstensi browser MetaMask di jaringan Ethereum Sepolia.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-3 py-2 rounded-default bg-brand-primary text-text-on-dark text-body-sm font-medium hover:bg-brand-primary-deep"
              >
                Pasang MetaMask ↗
              </a>
            </>
          ) : (
            <p className="text-body-sm text-error">{connectErr}</p>
          )}
        </div>
      )}
    </div>
  );
}
