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
    <div className="min-h-screen flex flex-col bg-bg-base">
      <header className="sticky top-0 z-50 p-4 bg-bg-base/95 backdrop-blur text-text-primary md:bg-chrome-dark/95 md:text-text-on-dark flex items-center justify-between border-b border-border-subtle md:border-white/10">
        <span className="text-[28px] leading-none font-extrabold tracking-[-0.02em] md:text-[36px]">bound</span>
        <nav className="flex items-center gap-2 md:gap-6 text-body">
          <Link href="/penerima" className="hidden md:inline hover:opacity-80">Penerima</Link>
          <Link href="/toko" className="hidden md:inline hover:opacity-80">Toko</Link>
          <Link href={`/campaign/${CAMPAIGN}`} className="hidden md:inline hover:opacity-80">Dashboard</Link>
          <Link href={`/campaign/${CAMPAIGN}/donate`} className="px-4 py-2 rounded-default bg-brand-primary text-text-on-dark text-body font-medium min-h-[40px] flex items-center">Donasi Sekarang</Link>
        </nav>
      </header>

      <section className="px-6 py-16 md:py-24 max-w-5xl mx-auto w-full text-center">
        <div className="inline-block rounded-full bg-brand-surface text-brand-primary text-body-sm px-4 py-1.5 mb-6">Ethereum Sepolia • Hackathon Demo</div>
        <h1 className="text-display-lg text-text-primary mb-6 leading-tight">
          Donasi yang <span className="text-brand-primary">tidak bisa</span><br />masuk ke judol
        </h1>
        <p className="text-body-lg text-text-secondary max-w-2xl mx-auto mb-10">
          Bound mengubah donasi menjadi hak belanja yang hanya bisa dipakai di toko whitelist. Tidak ada jalur transfer bebas. Tidak ada cash-out ke judi. Semua transparan di blockchain.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/campaign/${CAMPAIGN}/donate`} className="px-8 py-4 min-h-[48px] rounded-default bg-brand-primary text-text-on-dark text-body-lg font-medium flex items-center justify-center">Donasi Sekarang</Link>
          <Link href={`/campaign/${CAMPAIGN}`} className="px-8 py-4 min-h-[48px] rounded-default border border-border-subtle text-text-primary text-body-lg font-medium flex items-center justify-center">Lihat Kampanye</Link>
        </div>
      </section>

      <section className="px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="rounded-lg bg-bg-surface border border-border-subtle shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-col md:flex-row gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-h2 font-semibold text-text-primary">{meta.title}</h2>
                <span className="rounded-full bg-brand-surface text-brand-primary text-caption px-2.5 py-1">Aktif</span>
              </div>
              <p className="text-body text-text-secondary max-w-lg">{meta.description}</p>
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-numeric-ledger text-h2 text-text-primary">{formatIDR(poolNum)}</span>
              <span className="text-body-sm text-text-secondary">/ {formatIDR(target)}</span>
            </div>
            <div className="h-2.5 rounded-default bg-border-subtle overflow-hidden">
              <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-caption text-text-secondary mt-2">Terkumpul / Target</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border-ledger">
            <div>
              <p className="text-body-sm text-text-secondary">Jatah per Penerima</p>
              <p className="text-numeric-ledger text-text-primary mt-1">{jatah ? formatIDR(jatah as bigint) : '...'}</p>
            </div>
            <div>
              <p className="text-body-sm text-text-secondary">Progress</p>
              <p className="text-numeric-ledger text-text-primary mt-1">{progress}%</p>
            </div>
            <div>
              <p className="text-body-sm text-text-secondary">Jaringan</p>
              <p className="text-numeric-ledger text-text-primary mt-1">Sepolia</p>
            </div>
          </div>
          <Link href={`/campaign/${CAMPAIGN}/donate`} className="block w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark text-display-md text-center leading-[48px]">Donasi Sekarang</Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-h2 font-semibold text-text-primary mb-2 text-center md:text-left">Mengapa Bound</h2>
        <p className="text-body text-text-secondary mb-10 text-center md:text-left">Problem yang Bound selesaikan</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🚫', title: 'Anti Judol', desc: '28.4 juta NIK cocok dengan pemain judol. Rp 957 miliar mengalir dari bansos ke judi. Bound memotong jalurnya — tidak ada fungsi transfer, uang hanya keluar ke toko whitelist.' },
            { icon: '🔗', title: 'Transparan di Chain', desc: 'Setiap donasi, belanja, dan perubahan whitelist tercatat permanen di blockchain. Juri bisa membaca kolam, riwayat, dan whitelist langsung dari chain.' },
            { icon: '📱', title: 'Mudah untuk Penerima', desc: 'Login pakai nomor WA + OTP. Scan QR toko, tekan Bayar. Tanpa seed phrase, tanpa gas. Seperti DANA, bukan seperti MetaMask.' },
          ].map((c) => (
            <div key={c.title} className="rounded-lg bg-bg-surface border border-border-subtle shadow-xs p-6 space-y-3">
              <div className="text-2xl">{c.icon}</div>
              <h3 className="text-h3 font-semibold text-text-primary">{c.title}</h3>
              <p className="text-body text-text-secondary">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-h2 font-semibold text-text-primary mb-10 text-center md:text-left">Cara Kerja</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: '1', title: 'Donatur Donasi', desc: 'Pilih jumlah, hubungkan MetaMask atau login OTP. Dana masuk ke kolam kampanye di blockchain.', color: 'bg-brand-surface text-brand-primary' },
            { num: '2', title: 'Penerima Belanja', desc: 'Login WA + OTP. Scan QR toko whitelist. Tekan Bayar. Dana keluar hanya ke toko terdaftar.', color: 'bg-bg-surface text-text-primary border border-border-subtle' },
            { num: '3', title: 'Transparan', desc: 'Semua donasi, belanja, dan perubahan whitelist tercatat di chain. Juri bisa audit kapan saja.', color: 'bg-bg-surface-saffron text-success-text' },
          ].map((s) => (
            <div key={s.num} className="space-y-4">
              <div className={`w-12 h-12 rounded-full ${s.color} text-body-lg font-semibold flex items-center justify-center`}>{s.num}</div>
              <h3 className="text-h3 font-semibold text-text-primary">{s.title}</h3>
              <p className="text-body text-text-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 bg-bg-surface border-y border-border-subtle">
        <div className="max-w-5xl mx-auto w-full">
          <h2 className="text-h2 font-semibold text-text-primary mb-2 text-center md:text-left">Untuk Siapa</h2>
          <p className="text-body text-text-secondary mb-10 text-center md:text-left">Bound melayani 4 peran</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: 'Operator', desc: 'NGO/relawan membuat kampanye, daftar toko + penerima', href: `/campaign/${CAMPAIGN}`, cta: 'Buka Dashboard' },
              { role: 'Donatur', desc: 'Donasi dengan MetaMask atau OTP login', href: `/campaign/${CAMPAIGN}/donate`, cta: 'Donasi' },
              { role: 'Penerima', desc: 'Login WA, scan QR toko, bayar', href: '/penerima', cta: 'Login Penerima' },
              { role: 'Toko', desc: 'Buat QR untuk tagihan, terima dana di dompet', href: '/toko', cta: 'Buat QR' },
            ].map((r) => (
              <Link key={r.role} href={r.href} className="block rounded-lg bg-bg-base border border-border-subtle p-5 space-y-3 hover:border-brand-primary transition-colors">
                <h3 className="text-h3 font-semibold text-text-primary">{r.role}</h3>
                <p className="text-body-sm text-text-secondary">{r.desc}</p>
                <p className="text-body-sm text-brand-primary font-medium">{r.cta} →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="rounded-lg bg-chrome-dark text-text-on-dark p-8 md:p-12 space-y-6">
          <h2 className="text-h2 font-semibold">Transparansi Mutlak</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Kolam Kampanye', value: formatIDR(poolNum), unit: 'mIDRX' },
              { label: 'Jatah per Penerima', value: jatah ? formatIDR(jatah as bigint) : '...', unit: 'mIDRX' },
              { label: 'Jalur Transfer', value: '0', unit: 'tidak ada' },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="text-body-sm text-text-on-dark/60">{s.label}</p>
                <p className="text-numeric-ledger text-text-on-dark text-h2">{s.value}</p>
                <p className="text-caption text-text-on-dark/40">{s.unit}</p>
              </div>
            ))}
          </div>
          <p className="text-body text-text-on-dark/60">Semua data di atas dibaca langsung dari smart contract di Ethereum Sepolia. Tidak ada database tersembunyi. Tidak ada server yang bisa dimanipulasi.</p>
        </div>
      </section>

      <footer className="bg-chrome-dark text-text-on-dark">
        <div className="max-w-5xl mx-auto w-full px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <span className="text-[24px] font-extrabold tracking-[-0.02em]">bound</span>
              <p className="text-body-sm text-text-on-dark/60">Donasi terprogram untuk bencana. Anti-judol by design.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-body-sm font-semibold text-text-on-dark/80">Platform</h4>
              <div className="space-y-2">
                <Link href={`/campaign/${CAMPAIGN}/donate`} className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Donasi</Link>
                <Link href="/penerima" className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Penerima</Link>
                <Link href="/toko" className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Toko</Link>
                <Link href={`/campaign/${CAMPAIGN}`} className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Dashboard</Link>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-body-sm font-semibold text-text-on-dark/80">Tentang</h4>
              <div className="space-y-2">
                <a className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Cara Kerja</a>
                <a className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Anti-Judol</a>
                <a className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Transparansi</a>
                <a className="block text-body-sm text-text-on-dark/60 hover:text-text-on-dark">Smart Contract</a>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-body-sm font-semibold text-text-on-dark/80">Tech Stack</h4>
              <div className="space-y-2 text-body-sm text-text-on-dark/60">
                <p>Solidity + Foundry</p>
                <p>Next.js + wagmi</p>
                <p>Node.js + ethers</p>
                <p>Ethereum Sepolia</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-caption text-text-on-dark/40">Testnet demo — bukan mainnet. Jangan kirim uang asli.</p>
            <p className="text-caption text-text-on-dark/40">© 2026 Bound • Campus Web3 Hackathon</p>
          </div>
        </div>
      </footer>
    </div>
  );
}