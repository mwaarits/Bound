'use client';

import { useEffect, useState } from 'react';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { relayerPost } from '@/lib/relayer-client';
import { mockIDRXAbi, campaignAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';
import { useCampaignMeta } from '@/lib/campaign-meta';
import {
  MOCKIDRX_ADDRESS,
  etherscanTxUrl,
  isValidAddress,
  parseIDRInputToWei,
  shortenAddress,
} from '@/lib/campaigns';
import { ErrorToast } from '@/components/ErrorToast';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { StepIndicator } from '@/components/StepIndicator';

const PRESET_AMOUNTS = [
  { label: 'Rp 10.000', value: '10000' },
  { label: 'Rp 50.000', value: '50000' },
  { label: 'Rp 100.000', value: '100000' },
  { label: 'Rp 500.000', value: '500000' },
];

const MOCK_TOPUP_WEI = 10_000_000n * 10n ** 18n;

function getMockTopup(key: string): bigint {
  if (typeof window === 'undefined' || !key) return 0n;
  try {
    const raw = localStorage.getItem(`bound:mock-midrx:${key.toLowerCase()}`);
    return raw ? BigInt(raw) : 0n;
  } catch {
    return 0n;
  }
}

function saveMockTopup(key: string, value: bigint): void {
  if (typeof window === 'undefined' || !key) return;
  localStorage.setItem(`bound:mock-midrx:${key.toLowerCase()}`, value.toString());
}

export function DonateForm({ campaignAddr }: { campaignAddr: string }) {
  const [path, setPath] = useState<'own' | 'embedded'>('own');
  const [meta] = useCampaignMeta(campaignAddr);

  return (
    <div className="rounded-xl bg-bg-base border border-border-subtle shadow-xs p-6 sm:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-default bg-brand-surface border border-brand-primary/20 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/donation.svg" alt="" width={22} height={22} className="w-5 h-5" />
          </span>
          <span className="inline-block rounded-full bg-brand-surface text-brand-primary text-caption font-medium px-2.5 py-0.5">
            {meta.title}
          </span>
        </div>
        <h1 className="text-h1 font-bold text-text-primary">Donasi ke Kampanye</h1>
        <p className="text-body-sm text-text-secondary">
          Pilih cara berdonasi: langsung dari dompet MetaMask atau tanpa dompet menggunakan nomor
          WA + OTP.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-1 rounded-lg bg-bg-surface border border-border-subtle">
        <button
          type="button"
          onClick={() => setPath('own')}
          className={`rounded-default py-2.5 px-3 text-body-sm font-semibold transition-colors ${
            path === 'own'
              ? 'bg-brand-primary text-text-on-dark shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Punya dompet (MetaMask)
        </button>
        <button
          type="button"
          onClick={() => setPath('embedded')}
          className={`rounded-default py-2.5 px-3 text-body-sm font-semibold transition-colors ${
            path === 'embedded'
              ? 'bg-brand-primary text-text-on-dark shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Tanpa dompet (WA + OTP)
        </button>
      </div>

      {path === 'own' ? (
        <OwnWalletPath campaignAddr={campaignAddr} />
      ) : (
        <EmbeddedPath campaignAddr={campaignAddr} />
      )}
    </div>
  );
}

function OwnWalletPath({ campaignAddr }: { campaignAddr: string }) {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState('50000');
  const [busyStep, setBusyStep] = useState<'topup' | 'approve' | 'donate' | null>(null);
  const [mockTopupWei, setMockTopupWei] = useState<bigint>(0n);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isWrongNetwork = isConnected && walletChainId !== sepolia.id;

  useEffect(() => {
    if (address) {
      setMockTopupWei(getMockTopup(address));
    } else {
      setMockTopupWei(0n);
    }
  }, [address]);

  const validAddrs = Boolean(
    isConnected && address && isValidAddress(MOCKIDRX_ADDRESS) && isValidAddress(campaignAddr)
  );

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: MOCKIDRX_ADDRESS,
    abi: mockIDRXAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: validAddrs },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MOCKIDRX_ADDRESS,
    abi: mockIDRXAbi,
    functionName: 'allowance',
    args: address ? [address, campaignAddr as `0x${string}`] : undefined,
    query: { enabled: validAddrs },
  });

  if (!isConnected || !address) {
    return (
      <div className="rounded-lg bg-bg-surface border border-border-subtle p-6 text-center space-y-4">
        <div className="space-y-1">
          <p className="text-body-lg font-semibold text-text-primary">
            Hubungkan dompet MetaMask untuk donasi
          </p>
          <p className="text-body-sm text-text-secondary">
            Anda dapat melakukan Top-up m-IDRX uji coba lalu mengirim donasi ke kolam kampanye di
            Sepolia.
          </p>
        </div>
        <div className="flex justify-center">
          <ConnectWalletButton variant="primary" />
        </div>
      </div>
    );
  }

  const jumlahWei = parseIDRInputToWei(amount);
  const balanceNum = (balance as bigint) ?? 0n;
  const totalBalance = balanceNum + mockTopupWei;
  const allowanceNum = (allowance as bigint) ?? 0n;
  const hasEnoughBalance = jumlahWei !== null && totalBalance >= jumlahWei;
  const hasEnoughAllowance = jumlahWei !== null && allowanceNum >= jumlahWei;

  const activeStep = !hasEnoughBalance ? 0 : !hasEnoughAllowance ? 1 : 2;

  async function topUpMock() {
    setErrorMsg('');
    setTxHash('');
    setBusyStep('topup');
    setStatus('Memproses Top-up m-IDRX (simulasi)...');
    await new Promise((r) => setTimeout(r, 350));
    const next = mockTopupWei + MOCK_TOPUP_WEI;
    setMockTopupWei(next);
    if (address) saveMockTopup(address, next);
    setStatus('Top-up simulasi berhasil (+Rp 10.000.000 m-IDRX). Lanjut ke langkah Approve.');
    setBusyStep(null);
  }

  async function approve() {
    if (!jumlahWei) {
      setErrorMsg('Masukkan jumlah donasi yang valid.');
      return;
    }
    setErrorMsg('');
    setTxHash('');
    setBusyStep('approve');
    setStatus('Menyetujui kontrak kampanye untuk mengambil mIDRX...');
    try {
      const tx = await writeContractAsync({
        chainId: sepolia.id,
        address: MOCKIDRX_ADDRESS,
        abi: mockIDRXAbi,
        functionName: 'approve',
        args: [campaignAddr as `0x${string}`, jumlahWei],
      });
      setTxHash(tx);
      setStatus('Transaksi Approve terkirim. Menunggu konfirmasi blok Sepolia...');
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      await refetchAllowance();
      setStatus('Approve berhasil! Sekarang klik tombol Donasi di bawah.');
    } catch {
      setErrorMsg('Approve dibatalkan atau gagal. Pastikan MetaMask di jaringan Sepolia.');
      setStatus('');
    } finally {
      setBusyStep(null);
    }
  }

  async function donate() {
    if (!jumlahWei) {
      setErrorMsg('Masukkan jumlah donasi yang valid.');
      return;
    }
    setErrorMsg('');
    setTxHash('');
    setBusyStep('donate');
    setStatus('Mengirim donasi ke kolam kampanye...');
    try {
      const tx = await writeContractAsync({
        chainId: sepolia.id,
        address: campaignAddr as `0x${string}`,
        abi: campaignAbi,
        functionName: 'donasi',
        args: [jumlahWei],
      });
      setTxHash(tx);
      setStatus('Transaksi Donasi terkirim. Menunggu konfirmasi blok Sepolia...');
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      await Promise.all([refetchBalance(), refetchAllowance()]);
      setStatus(`Terima kasih! Donasi ${formatIDR(jumlahWei)} berhasil masuk ke kolam kampanye.`);
    } catch {
      setErrorMsg('Donasi gagal. Pastikan saldo & approve mIDRX mencukupi.');
      setStatus('');
    } finally {
      setBusyStep(null);
    }
  }

  return (
    <div className="space-y-5">
      <StepIndicator steps={['Top-up m-IDRX', 'Approve', 'Donasi']} current={activeStep} />

      {/* Balance & Allowance readout */}
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-bg-surface border border-border-subtle p-4">
        <div>
          <p className="text-caption text-text-secondary">Saldo m-IDRX Anda</p>
          <p className="text-numeric-ledger text-body font-semibold text-text-primary mt-0.5">
            {formatIDR(totalBalance)}
          </p>
          {mockTopupWei > 0n && (
            <p className="text-caption text-brand-primary mt-0.5">Termasuk top-up simulasi</p>
          )}
        </div>
        <div>
          <p className="text-caption text-text-secondary">Allowance Saat Ini</p>
          <p className="text-numeric-ledger text-body font-semibold text-text-primary mt-0.5">
            {formatIDR(allowanceNum)}
          </p>
        </div>
      </div>

      {/* Amount Input & Presets */}
      <div className="space-y-2.5">
        <label htmlFor="donate-amount" className="block text-body-sm font-medium text-text-primary">
          Jumlah Donasi (IDR)
        </label>
        <input
          id="donate-amount"
          type="number"
          inputMode="numeric"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full min-h-[48px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body-lg font-mono"
          aria-label="Jumlah donasi (IDR)"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setAmount(p.value)}
              className={`py-2 px-2.5 rounded-default text-caption font-medium border transition-colors ${
                amount === p.value
                  ? 'bg-brand-surface border-brand-primary text-brand-primary'
                  : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Single Progressive Action Button (guarded for Sepolia) */}
      <div className="space-y-2.5">
        {isWrongNetwork ? (
          <div className="rounded-lg bg-bg-surface-saffron border border-success/40 p-4 space-y-3">
            <p className="text-body-sm font-semibold text-success-text">
              MetaMask Anda bukan di jaringan Ethereum Sepolia (Testnet)
            </p>
            <p className="text-caption text-success-text">
              Jangan konfirmasi transaksi di Ethereum Mainnet agar tidak memakai ETH asli. Pindah
              ke Sepolia dulu.
            </p>
            <button
              type="button"
              onClick={() => switchChain({ chainId: sepolia.id })}
              disabled={isSwitching}
              className="w-full min-h-[48px] rounded-default bg-success text-text-primary px-4 py-3 text-body font-bold hover:opacity-90 disabled:opacity-60"
            >
              {isSwitching ? 'Mengganti ke Sepolia...' : 'Ganti ke Jaringan Sepolia'}
            </button>
          </div>
        ) : !hasEnoughBalance ? (
          <button
            type="button"
            onClick={() => void topUpMock()}
            disabled={busyStep !== null}
            className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark px-4 py-3 text-body-lg font-bold transition-colors disabled:opacity-60"
          >
            {busyStep === 'topup' ? 'Memproses Top-up...' : 'Top-up m-IDRX (+Rp 10 Juta Simulasi)'}
          </button>
        ) : !hasEnoughAllowance ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void approve()}
              disabled={busyStep !== null || !jumlahWei}
              className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark px-4 py-3 text-body-lg font-bold transition-colors disabled:opacity-60"
            >
              {busyStep === 'approve'
                ? 'Menyetujui di MetaMask...'
                : `Approve ${jumlahWei ? formatIDR(jumlahWei) : 'm-IDRX'}`}
            </button>
            <button
              type="button"
              onClick={() => void topUpMock()}
              disabled={busyStep !== null}
              className="w-full text-center text-caption text-text-secondary hover:text-brand-primary py-1"
            >
              + Tambah saldo top-up simulasi
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void donate()}
            disabled={busyStep !== null || !jumlahWei}
            className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark px-4 py-3 text-body-lg font-bold transition-colors disabled:opacity-60"
          >
            {busyStep === 'donate'
              ? 'Mengirim Donasi...'
              : `Donasi ${jumlahWei ? formatIDR(jumlahWei) : ''}`}
          </button>
        )}
      </div>

      {status && (
        <div className="rounded-default bg-brand-surface border border-brand-primary/25 p-3.5 text-body-sm text-brand-primary space-y-1">
          <p>{status}</p>
          {txHash && (
            <a
              href={etherscanTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-caption font-semibold underline"
            >
              Lihat transaksi di Sepolia Etherscan ↗
            </a>
          )}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-default border border-error/25 bg-error/5 p-3.5 text-body-sm text-error"
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}

function EmbeddedPath({ campaignAddr }: { campaignAddr: string }) {
  const [wa, setWa] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [walletAddr, setWalletAddr] = useState('');
  const [mockBalanceWei, setMockBalanceWei] = useState<bigint>(0n);
  const [amount, setAmount] = useState('50000');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const jumlahWei = parseIDRInputToWei(amount);

  async function requestOtp() {
    setError('');
    if (!wa.trim()) {
      setError('Masukkan nomor WA terlebih dahulu.');
      return;
    }
    setBusy(true);
    setStatus('Mengirim OTP...');
    try {
      await relayerPost('/auth/request-otp', { wa: wa.trim() });
      setStatus('OTP terkirim! Gunakan kode demo: 123456');
    } catch {
      setError('CHAIN_ERROR');
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setError('');
    setBusy(true);
    setStatus('Memverifikasi OTP...');
    try {
      const res = await relayerPost<{ token?: string; walletAddress?: string }>(
        '/auth/verify-otp',
        { wa: wa.trim(), code: code.trim() }
      );
      if (res.token) {
        setToken(res.token);
        const w = res.walletAddress ?? '';
        setWalletAddr(w);
        setMockBalanceWei(getMockTopup(w));
        setStatus('Login berhasil! Silakan Top-up m-IDRX lalu klik Donasi.');
      } else {
        setError('OTP salah');
        setStatus('');
      }
    } catch {
      setError('CHAIN_ERROR');
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  async function topUpMock() {
    setError('');
    setBusy(true);
    setStatus('Memproses Top-up m-IDRX (simulasi)...');
    await new Promise((r) => setTimeout(r, 350));
    const next = mockBalanceWei + MOCK_TOPUP_WEI;
    setMockBalanceWei(next);
    if (walletAddr) saveMockTopup(walletAddr, next);
    setStatus('Top-up simulasi berhasil (+Rp 10.000.000 m-IDRX).');
    setBusy(false);
  }

  async function donate() {
    if (!jumlahWei) {
      setError('Masukkan jumlah donasi yang valid.');
      return;
    }
    setError('');
    setTxHash('');
    setBusy(true);
    setStatus('Mengirim donasi ke Sepolia lewat relayer (mohon tunggu 10-20 detik)...');
    try {
      const res = await relayerPost<{ status: string; txHash?: string; reason?: string }>(
        '/donatur/donate-embedded',
        { jumlah: amount, campaign: campaignAddr },
        token
      );
      if (res.status === 'ok') {
        const nextBal = mockBalanceWei > jumlahWei ? mockBalanceWei - jumlahWei : 0n;
        setMockBalanceWei(nextBal);
        if (walletAddr) saveMockTopup(walletAddr, nextBal);
        setTxHash(res.txHash ?? '');
        setStatus(`Donasi ${formatIDR(jumlahWei)} berhasil tercatat di Ethereum Sepolia!`);
      } else {
        setStatus('');
        setError(res.reason ?? 'unknown');
      }
    } catch {
      setError('CHAIN_ERROR');
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <StepIndicator steps={['Verifikasi WA + OTP', 'Top-up & Donasi']} current={token ? 1 : 0} />

      {!token ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="embedded-wa" className="block text-body-sm font-medium text-text-primary mb-1">
              Nomor WhatsApp
            </label>
            <div className="flex gap-2">
              <input
                id="embedded-wa"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
                placeholder="Nomor WA (+62...)"
                className="flex-1 min-h-[46px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body"
              />
              <button
                type="button"
                onClick={() => void requestOtp()}
                disabled={busy}
                className="min-h-[46px] px-4 rounded-default bg-bg-surface border border-border-subtle text-body-sm font-medium hover:border-brand-primary shrink-0"
              >
                Kirim OTP
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="embedded-otp" className="block text-body-sm font-medium text-text-primary mb-1">
              Kode OTP
            </label>
            <input
              id="embedded-otp"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Kode OTP (123456)"
              className="w-full min-h-[46px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body font-mono"
            />
          </div>

          <button
            type="button"
            onClick={() => void verifyOtp()}
            disabled={busy}
            className="w-full min-h-[48px] rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body font-semibold"
          >
            Verifikasi & Masuk
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-default bg-bg-surface border border-border-subtle p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-caption text-text-secondary">Dompet Kustodian Anda</span>
              <span className="font-mono text-body-sm font-medium text-text-primary">
                {shortenAddress(walletAddr, 8, 6)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <span className="text-caption text-text-secondary">Saldo m-IDRX (Simulasi)</span>
              <span className="font-mono text-body-sm font-semibold text-brand-primary">
                {formatIDR(mockBalanceWei)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="embedded-amount" className="block text-body-sm font-medium text-text-primary">
              Jumlah Donasi (IDR)
            </label>
            <input
              id="embedded-amount"
              type="number"
              inputMode="numeric"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-[48px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body-lg font-mono"
              aria-label="Jumlah donasi (IDR)"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setAmount(p.value)}
                  className={`py-2 px-2.5 rounded-default text-caption font-medium border transition-colors ${
                    amount === p.value
                      ? 'bg-brand-surface border-brand-primary text-brand-primary'
                      : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {jumlahWei === null || mockBalanceWei < jumlahWei ? (
              <button
                type="button"
                onClick={() => void topUpMock()}
                disabled={busy}
                className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark px-4 py-3 text-body-lg font-bold transition-colors disabled:opacity-60"
              >
                {busy ? 'Memproses Top-up...' : 'Top-up m-IDRX (+Rp 10 Juta Simulasi)'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void donate()}
                  disabled={busy || !jumlahWei}
                  className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark px-4 py-3 text-body-lg font-bold disabled:opacity-60"
                >
                  {busy ? 'Mengirim Donasi...' : `Donasi ${formatIDR(jumlahWei)}`}
                </button>
                <button
                  type="button"
                  onClick={() => void topUpMock()}
                  disabled={busy}
                  className="w-full text-center text-caption text-text-secondary hover:text-brand-primary py-1"
                >
                  + Tambah saldo top-up simulasi
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status && (
        <div className="rounded-default bg-brand-surface border border-brand-primary/25 p-3.5 text-body-sm text-brand-primary space-y-1">
          <p>{status}</p>
          {txHash && (
            <a
              href={etherscanTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-caption font-semibold underline"
            >
              Lihat transaksi di Sepolia Etherscan ↗
            </a>
          )}
        </div>
      )}
      {error && <ErrorToast reason={error} />}
    </div>
  );
}
