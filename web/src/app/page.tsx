'use client';

import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { mockIDRXAbi, campaignAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';
import { DEFAULT_CAMPAIGN, MOCKIDRX_ADDRESS, isValidAddress } from '@/lib/campaigns';
import { useCampaignList } from '@/hooks/useCampaignList';
import { CampaignCard } from '@/components/CampaignCard';

export default function Home() {
  const { campaigns, isLoading: listLoading } = useCampaignList();
  const validDefault = isValidAddress(DEFAULT_CAMPAIGN) && isValidAddress(MOCKIDRX_ADDRESS);

  const { data: pool, isLoading: poolLoading } = useReadContract({
    address: MOCKIDRX_ADDRESS,
    abi: mockIDRXAbi,
    functionName: 'balanceOf',
    args: [DEFAULT_CAMPAIGN],
    query: { enabled: validDefault },
  });
  const { data: jatah } = useReadContract({
    address: DEFAULT_CAMPAIGN,
    abi: campaignAbi,
    functionName: 'jatahPerPenerima',
    query: { enabled: isValidAddress(DEFAULT_CAMPAIGN) },
  });

  const poolNum = (pool as bigint) ?? 0n;
  const poolDisplay = poolLoading ? 'Memuat...' : formatIDR(poolNum);

  return (
    <div className="flex-1 flex flex-col bg-bg-base">
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 py-10 sm:py-16 md:py-20 max-w-5xl mx-auto w-full animate-enter">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 text-center lg:text-left">
              <h1 className="text-[2rem] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-display-lg md:text-display-xl text-text-primary mb-5 sm:mb-6">
                Donasi yang <span className="text-brand-primary">pasti sampai</span>
                <br />
                ke kebutuhan pokok
              </h1>
              <p className="text-body sm:text-body-lg text-text-secondary max-w-2xl mx-auto lg:mx-0 mb-8">
                Bound mengunci dana donasi di smart contract agar penerima hanya bisa membelanjakannya
                di toko whitelist terdaftar. Dana tidak bisa ditarik tunai atau dipakai di luar tujuan
                bantuan, dan setiap transaksi tercatat di Ethereum Sepolia.
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
                <Link
                  href={`/campaign/${DEFAULT_CAMPAIGN}/donate`}
                  className="px-7 py-3.5 min-h-[48px] rounded-default bg-brand-primary hover:bg-brand-primary-deep active:scale-[0.98] text-text-on-dark text-body sm:text-body-lg font-semibold flex items-center justify-center transition-all"
                >
                  Donasi Sekarang
                </Link>
                <Link
                  href="/campaigns"
                  className="px-7 py-3.5 min-h-[48px] rounded-default border border-border-subtle bg-bg-surface hover:border-brand-primary active:scale-[0.98] text-text-primary text-body sm:text-body-lg font-medium flex items-center justify-center transition-all"
                >
                  Lihat Daftar Kampanye ({campaigns.length})
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center animate-enter-delay-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/hero-donation.svg"
                alt="Ilustrasi kotak donasi bantuan kebutuhan pokok"
                width={460}
                height={293}
                fetchPriority="high"
                className="w-full max-w-[340px] sm:max-w-[420px] h-auto"
              />
            </div>
          </div>
        </section>

        {/* Active Campaigns (supports 1 or many) */}
        <section id="kampanye" className="px-4 sm:px-6 py-10 sm:py-12 bg-bg-surface border-y border-border-subtle">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-h2 font-semibold text-text-primary">Kampanye aktif</h2>
                <p className="text-body text-text-secondary mt-1">
                  Pilih kampanye untuk berdonasi atau memeriksa saldo dan riwayatnya langsung dari kontrak.
                </p>
              </div>
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-brand-primary hover:text-brand-primary-deep shrink-0"
              >
                Semua kampanye & buat baru
              </Link>
            </div>

            {listLoading && campaigns.length === 0 ? (
              <div className="rounded-lg bg-bg-base border border-border-subtle p-8 text-center text-body text-text-secondary">
                Memuat daftar kampanye...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center sm:justify-items-start">
                {campaigns.slice(0, 6).map((c) => (
                  <CampaignCard key={c.address} campaign={c} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Why Bound */}
        <section id="mengapa-bound" className="px-4 sm:px-6 py-12 sm:py-16 max-w-5xl mx-auto w-full space-y-8 animate-enter-delay-1">
          <div>
            <h2 className="text-h2 font-semibold text-text-primary mb-2">Mengapa Bound</h2>
            <p className="text-body text-text-secondary">
              Kenapa penyaluran bantuan bencana perlu dikunci langsung di smart contract
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
            <div className="md:col-span-7 rounded-lg bg-brand-surface border border-brand-primary/25 p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-default bg-bg-base border border-brand-primary/20 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/shield-lock.svg" alt="" width={24} height={24} className="w-6 h-6" />
                </div>
                <p className="text-caption font-semibold text-brand-primary">Penguncian di level kontrak</p>
                <h3 className="text-h2 font-bold text-text-primary">Dana hanya keluar ke toko terdaftar</h3>
                <p className="text-body text-text-secondary leading-relaxed">
                  Pada bantuan tunai biasa, pemakaian dana sulit dipastikan setelah berpindah tangan.
                  Di Bound, kontrak tidak menyediakan fungsi tarik tunai atau kirim bebas ke rekening
                  lain. Dana hanya bisa berpindah saat penerima berbelanja di alamat toko yang
                  disetujui operator.
                </p>
              </div>
              <p className="text-caption text-text-secondary/80">
                Aturan dijalankan otomatis oleh smart contract di Ethereum Sepolia.
              </p>
            </div>

            <div className="md:col-span-5 flex flex-col gap-4 justify-between">
              <div className="flex-1 rounded-lg bg-bg-surface border border-border-subtle p-5 sm:p-6 space-y-2.5 hover:border-brand-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-default bg-bg-base border border-border-subtle flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/blockchain.svg" alt="" width={20} height={20} className="w-5 h-5" />
                  </span>
                  <h3 className="text-h3 font-semibold text-text-primary">Bisa diaudit siapa saja</h3>
                </div>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  Setiap donasi, pembayaran ke toko, dan perubahan daftar whitelist tercatat di
                  Ethereum Sepolia. Publik bisa memeriksa kolam dana langsung dari kontrak.
                </p>
              </div>
              <div className="flex-1 rounded-lg bg-bg-surface border border-border-subtle p-5 sm:p-6 space-y-2.5 hover:border-brand-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-default bg-bg-base border border-border-subtle flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/qr-scan.svg" alt="" width={20} height={20} className="w-5 h-5" />
                  </span>
                  <h3 className="text-h3 font-semibold text-text-primary">Penerima tidak perlu dompet kripto</h3>
                </div>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  Penerima masuk dengan nomor WhatsApp dan kode OTP, lalu memindai QR toko untuk
                  membayar. Relayer menanggung gas fee, jadi penerima tidak perlu seed phrase atau ETH.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="cara-kerja" className="px-4 sm:px-6 py-12 sm:py-16 bg-bg-surface border-y border-border-subtle">
          <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 space-y-2">
              <h2 className="text-h2 font-semibold text-text-primary">Cara kerja</h2>
              <p className="text-body text-text-secondary">
                Empat langkah penyaluran dana dari donatur ke toko kebutuhan pokok.
              </p>
            </div>
            <ol className="md:col-span-8 divide-y divide-border-subtle border-y border-border-subtle">
              {[
                {
                  num: '01',
                  title: 'Operator menyiapkan kampanye',
                  desc: 'Operator membuat kontrak kampanye, menentukan batas belanja tiap penerima, lalu mendaftarkan toko whitelist dan nomor WA penerima.',
                },
                {
                  num: '02',
                  title: 'Donatur mengirim m-IDRX',
                  desc: 'Donatur mengirim m-IDRX ke kolam kontrak kampanye lewat MetaMask atau akun WA + OTP.',
                },
                {
                  num: '03',
                  title: 'Toko membuat QR tagihan',
                  desc: 'Kasir toko memasukkan nominal belanja untuk membuat QR sekali pakai yang berlaku 5 menit.',
                },
                {
                  num: '04',
                  title: 'Penerima memindai QR dan membayar',
                  desc: 'Penerima masuk dengan WA + OTP, memindai QR toko, lalu menekan Bayar. Kontrak langsung mengirim dana ke dompet toko.',
                },
              ].map((s) => (
                <li key={s.num} className="py-5 flex items-start gap-5">
                  <span className="text-numeric-ledger text-body-sm font-semibold text-brand-primary pt-0.5 shrink-0">
                    {s.num}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-body-lg font-semibold text-text-primary">{s.title}</h3>
                    <p className="text-body-sm text-text-secondary leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For Who */}
        <section id="untuk-siapa" className="px-6 py-16 max-w-5xl mx-auto w-full">
          <h2 className="text-h2 font-semibold text-text-primary mb-2 text-center md:text-left">
            Masuk sesuai peran
          </h2>
          <p className="text-body text-text-secondary mb-10 text-center md:text-left">
            Pilih halaman sesuai peran Anda dalam kampanye ini
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: 'Operator / NGO',
                badge: 'MetaMask',
                icon: '/icons/dashboard.svg',
                desc: 'Buat kampanye baru, atur toko whitelist, dan daftarkan penerima bantuan.',
                href: '/campaigns',
                cta: 'Kelola kampanye',
              },
              {
                role: 'Donatur',
                badge: 'MetaMask / OTP',
                icon: '/icons/donation.svg',
                desc: 'Kirim m-IDRX ke kolam kampanye dan pantau pemakaiannya di dashboard.',
                href: `/campaign/${DEFAULT_CAMPAIGN}/donate`,
                cta: 'Kirim donasi',
              },
              {
                role: 'Penerima',
                badge: 'WA + OTP',
                icon: '/icons/qr-scan.svg',
                desc: 'Lihat sisa jatah belanja, pindai QR toko terdaftar, lalu bayar tanpa gas fee.',
                href: '/penerima',
                cta: 'Masuk sebagai penerima',
              },
              {
                role: 'Toko whitelist',
                badge: 'QR tagihan',
                icon: '/icons/store.svg',
                desc: 'Buat QR nominal belanja untuk penerima dan terima m-IDRX langsung di dompet toko.',
                href: '/toko',
                cta: 'Buat QR toko',
              },
            ].map((r) => (
              <Link
                key={r.role}
                href={r.href}
                className="group flex flex-col justify-between rounded-lg bg-bg-surface border border-border-subtle p-5 space-y-4 hover:border-brand-primary hover:bg-bg-base hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-9 h-9 rounded-default bg-bg-base border border-border-subtle flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.icon} alt="" width={20} height={20} className="w-5 h-5" />
                    </span>
                    <span className="inline-block rounded-sm bg-brand-surface text-brand-primary text-caption font-medium px-2 py-0.5">
                      {r.badge}
                    </span>
                  </div>
                  <h3 className="text-h3 font-semibold text-text-primary">{r.role}</h3>
                  <p className="text-body-sm text-text-secondary leading-relaxed">{r.desc}</p>
                </div>
                <p className="text-body-sm text-brand-primary font-semibold underline-offset-4 group-hover:underline">
                  {r.cta}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Transparency */}
        <section id="transparansi" className="px-6 pb-16 max-w-5xl mx-auto w-full">
          <div className="rounded-xl bg-chrome-dark text-text-on-dark p-8 md:p-12 space-y-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-h2 font-semibold">Data langsung dari kontrak</h2>
              <span className="inline-flex items-center gap-1.5 text-caption text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Ethereum Sepolia
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
              {[
                { label: 'Kolam kampanye utama', value: poolDisplay, unit: 'm-IDRX' },
                {
                  label: 'Jatah per penerima',
                  value: jatah ? formatIDR(jatah as bigint) : 'Memuat...',
                  unit: 'm-IDRX',
                },
                { label: 'Kampanye terdeteksi', value: String(campaigns.length), unit: 'kontrak aktif' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-1">
                  <p className="text-caption text-text-on-dark/70">{s.label}</p>
                  <p className="text-numeric-ledger text-text-on-dark text-h2">{s.value}</p>
                  <p className="text-caption text-text-on-dark/70">{s.unit}</p>
                </div>
              ))}
            </div>
            <p className="text-body-sm text-text-on-dark/75 leading-relaxed">
              Angka di atas dibaca langsung dari smart contract di Ethereum Sepolia, bukan dari
              database saldo internal.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-chrome-dark text-text-on-dark border-t border-white/10">
        <div className="max-w-5xl mx-auto w-full px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <span className="text-[24px] font-extrabold tracking-[-0.02em]">bound</span>
              <p className="text-body-sm text-text-on-dark/70">
                Donasi terprogram untuk bantuan bencana. Hanya bisa dibelanjakan di toko whitelist.
              </p>
            </div>
            <div className="space-y-3">
              <h2 className="text-body-sm font-semibold text-text-on-dark/90">Platform</h2>
              <div className="space-y-2">
                <Link href="/campaigns" className="block text-body-sm text-text-on-dark/75 hover:text-text-on-dark">
                  Daftar Kampanye
                </Link>
                <Link
                  href={`/campaign/${DEFAULT_CAMPAIGN}/donate`}
                  className="block text-body-sm text-text-on-dark/75 hover:text-text-on-dark"
                >
                  Donasi
                </Link>
                <Link href="/penerima" className="block text-body-sm text-text-on-dark/75 hover:text-text-on-dark">
                  Penerima
                </Link>
                <Link href="/toko" className="block text-body-sm text-text-on-dark/75 hover:text-text-on-dark">
                  Toko
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-body-sm font-semibold text-text-on-dark/90">Tech Stack</h2>
              <div className="space-y-2 text-body-sm text-text-on-dark/75">
                <p>Solidity + Foundry</p>
                <p>Next.js + wagmi + viem</p>
                <p>Node.js Relayer</p>
                <p>Ethereum Sepolia</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-caption text-text-on-dark/70">
              Testnet demo, bukan mainnet. Jangan kirim uang asli.
            </p>
            <p className="text-caption text-text-on-dark/70">
              © 2026 Bound, Campus Web3 Hackathon
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
