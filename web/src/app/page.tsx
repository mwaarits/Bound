'use client';

import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { mockIDRXAbi, campaignAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';
import { getCampaignMeta } from '@/lib/campaign-meta';

const CAMPAIGN = process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS as `0x${string}`;
const MOCKIDRX = process.env.NEXT_PUBLIC_MOCKIDRX_ADDRESS as `0x${string}`;

export default function Home() {
  const meta = getCampaignMeta(CAMPAIGN);
  const { data: pool } = useReadContract({ address: MOCKIDRX, abi: mockIDRXAbi, functionName: 'balanceOf', args: [CAMPAIGN] });
  const { data: jatah } = useReadContract({ address: CAMPAIGN, abi: campaignAbi, functionName: 'jatahPerPenerima' });
  const target = BigInt(meta.target) * 10n ** 18n;
  const poolNum = (pool as bigint) ?? 0n;
  const progress = target > 0n ? Math.min(100, Number(poolNum * 100n / target)) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-bg-base text-text-primary md:bg-chrome-dark md:text-text-on-dark flex items-center justify-between">
        <span className="text-[28px] leading-none font-extrabold tracking-[-0.02em] md:text-[36px]">bound</span>
        <nav className="flex gap-4 text-body">
          <Link href={`/campaign/${CAMPAIGN}/donate`} className="hover:opacity-80">Donasi</Link>
          <Link href="/penerima" className="hover:opacity-80 hidden md:inline">Penerima</Link>
          <Link href="/toko" className="hover:opacity-80 hidden md:inline">Toko</Link>
          <Link href={`/campaign/${CAMPAIGN}`} className="hover:opacity-80 hidden md:inline">Dashboard</Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-4xl mx-auto w-full">
        <h1 className="text-display-lg text-text-primary text-center mb-4">
          Donasi yang <span className="text-brand-primary">hanya bisa dibelanjakan</span> di toko whitelist
        </h1>
        <p className="text-body-lg text-text-secondary text-center max-w-xl mb-12">
          {meta.description}
        </p>

        <div className="w-full max-w-md rounded-lg bg-bg-surface border border-border-subtle shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 font-semibold text-text-primary">{meta.title}</h2>
            <span className="rounded-full bg-brand-surface text-brand-primary text-caption px-2 py-1">Aktif</span>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-numeric-ledger text-text-primary">{formatIDR(poolNum)}</span>
              <span className="text-body-sm text-text-secondary">/ {formatIDR(target)}</span>
            </div>
            <div className="h-2 rounded-default bg-border-subtle overflow-hidden">
              <div className="h-full bg-brand-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-caption text-text-secondary mt-2">Terkumpul / Target</p>
          </div>
          {jatah && (
            <div className="flex justify-between text-body">
              <span className="text-text-secondary">Jatah per penerima</span>
              <span className="text-numeric-ledger text-text-primary">{formatIDR(jatah as bigint)}</span>
            </div>
          )}
          <Link href={`/campaign/${CAMPAIGN}/donate`} className="block w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark text-display-md text-center leading-[48px]">
            Donasi Sekarang
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto w-full">
        <h2 className="text-h2 font-semibold text-text-primary mb-8 text-center md:text-left">Cara Kerja</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: '1', title: 'Donatur donasi', desc: 'Donatur memilih jumlah donasi, MetaMask atau OTP login. Dana masuk ke kolam kampanye.' },
            { num: '2', title: 'Penerima belanja', desc: 'Penerima scan QR toko whitelist, tekan Bayar. Dana keluar hanya ke toko terdaftar.' },
            { num: '3', title: 'Transparan di chain', desc: 'Semua donasi, belanja, dan perubahan whitelist tercatat permanen di blockchain.' },
          ].map((s) => (
            <div key={s.num} className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-surface text-brand-primary text-body-lg font-semibold flex items-center justify-center">{s.num}</div>
              <h3 className="text-h3 font-semibold text-text-primary">{s.title}</h3>
              <p className="text-body text-text-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[20px] font-extrabold tracking-[-0.02em] text-text-primary">bound</span>
          <div className="flex gap-6 text-body-sm text-text-secondary">
            <Link href={`/campaign/${CAMPAIGN}/donate`} className="hover:text-brand-primary">Donasi</Link>
            <Link href="/penerima" className="hover:text-brand-primary">Penerima</Link>
            <Link href="/toko" className="hover:text-brand-primary">Toko</Link>
            <Link href={`/campaign/${CAMPAIGN}`} className="hover:text-brand-primary">Dashboard</Link>
          </div>
          <p className="text-caption text-text-secondary">Ethereum Sepolia testnet • Hackathon demo</p>
        </div>
      </footer>
    </div>
  );
}