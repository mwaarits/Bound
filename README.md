# Bound

**Donasi terprogram yang hanya bisa dibelanjakan di toko kebutuhan pokok terdaftar.**

Live App: **[https://gobound.xyz](https://gobound.xyz)** · Relayer API: `https://bound-relayer.fly.dev` · Network: **Ethereum Sepolia (Testnet)**

---

## Apa itu Bound?

**Bound** adalah platform penyaluran donasi bantuan bencana berbasis smart contract di Ethereum Sepolia. Donatur mengirim token **m-IDRX** ke kolam kampanye on-chain, sementara penerima manfaat dapat membelanjakan jatah bantuannya di toko mitra **tanpa perlu memiliki dompet kripto, seed phrase, ataupun saldo ETH** (cukup dengan nomor WhatsApp, kode OTP, dan scan QR tagihan kasir).

> Catatan: Bound saat ini berjalan di jaringan **Ethereum Sepolia Testnet** menggunakan token uji coba `MockIDRX (m-IDRX)`, bukan uang asli.

---

## Masalah yang Diselesaikan (Problem)

Penyaluran donasi maupun bantuan sosial secara tunai atau transfer bebas menghadapi beberapa kendala utama di lapangan:

1. **Penggunaan dana di luar tujuan bantuan**: Setelah dana tunai berpindah ke penerima, tidak ada mekanisme teknis yang memastikan dana tersebut benar-benar dipakai untuk kebutuhan pokok, bukan disalahgunakan atau dialihkan ke hal konsumtif non-pokok.
2. **Transparansi & auditabilitas terbatas**: Donatur sulit memverifikasi secara mandiri berapa dana yang masih tersisa di kolam kampanye dan ke toko mana saja dana dibelanjakan tanpa bergantung pada laporan manual.
3. **Hambatan adopsi Web3 bagi penerima**: Jika bantuan dikirim langsung ke dompet Web3 biasa, penerima di daerah terdampak bencana harus mengurus aplikasi wallet, seed phrase, dan biaya gas ETH.

---

## Solusi Bound (Solution)

Bound memindahkan aturan penyaluran dana dari kepercayaan administratif menjadi aturan kode di dalam smart contract (`Campaign.sol`):

- **Tanpa fungsi tarik tunai atau transfer bebas**: Smart contract `Campaign` tidak menyediakan fungsi penarikan tunai (`withdraw`) maupun transfer bebas ke alamat pribadi. Fungsi `belanja(...)` hanya mengizinkan pengiriman token ke alamat **toko yang masuk daftar `isWhitelist`**.
- **Pembatasan jatah & frekuensi belanja on-chain**: Kontrak menegakkan `jatahPerPenerima`, batas maksimal per transaksi (`maxPerTx`), batas belanja harian (`maxPerHari`), masa kedaluwarsa tagihan (`expiry`), serta proteksi replay menggunakan `nonce` sekali pakai.
- **Gasless UX untuk penerima dan donatur non-Web3**: Penerima masuk lewat nomor WhatsApp + OTP; Relayer membuatkan alamat custodial terenkripsi AES-256-GCM dan menandatangani/membayar gas transaksi `belanja` di blockchain.
- **Multi-kampanye & audit publik real-time**: Operator/NGO dapat meluncurkan kontrak kampanye baru lewat `CampaignFactory`, dan siapa saja dapat melihat saldo kolam serta riwayat event `Donasi`, `Belanja`, `WhitelistDiubah`, dan `PenerimaDiubah` langsung dari Ethereum Sepolia.

---

## Cara Kerja

```text
[Operator / NGO]
  ├─ Buat kampanye via CampaignFactory.createCampaign(...)
  ├─ Daftarkan alamat Relayer (setAgent)
  ├─ Daftarkan toko mitra ke whitelist (setWhitelist)
  └─ Daftarkan nomor WA penerima (relayer -> setPenerimaBatch)
          │
          ▼
[Donatur]
  └─ Kirim m-IDRX ke kolam kontrak (MetaMask atau WA + OTP)
          │
          ▼
[Toko Whitelist]
  └─ Masukkan nominal belanja di /toko -> QR tagihan sekali pakai (valid 5 menit)
          │
          ▼
[Penerima]
  └─ Login WA + OTP di /penerima -> Scan QR / tempel payload -> Klik Bayar
          │
          ▼
[Relayer -> Smart Contract Campaign.belanja()]
  └─ Validasi penerima, whitelist toko, jatah, limit harian, expiry & nonce
  └─ Kontrak mengirim m-IDRX langsung dari kolam kampanye ke dompet toko
```

1. **Penyiapan Kampanye**: Operator men-deploy kontrak kampanye (atau menggunakan kampanye aktif), mengatur alamat Relayer sebagai `agent`, menambahkan alamat dompet toko ke whitelist, serta mendaftarkan daftar penerima (`isPenerima`).
2. **Penggalangan Dana**: Donatur mendonasikan `m-IDRX` melalui halaman donasi menggunakan MetaMask atau jalur WA + OTP.
3. **Pembuatan Tagihan oleh Toko**: Kasir toko mitra membuka halaman **Toko**, mengisi alamat dompet toko dan nominal belanja, lalu sistem membuat QR payload bertanda waktu (`expiry` 5 menit) dengan `nonce` unik.
4. **Pembayaran oleh Penerima**: Penerima login di halaman **Penerima** menggunakan nomor WA + OTP, memindai QR toko, meninjau ringkasan belanja, dan menekan **Bayar**. Backend Relayer memanggil `Campaign.belanja(...)` secara gasless dan dana langsung masuk ke dompet toko.

---

## Struktur Monorepo & Tech Stack

```text
Bound/
├── contracts/   # Smart contract Solidity 0.8.24 + Foundry (Campaign, CampaignFactory, MockIDRX)
├── relayer/     # Backend Fastify + SQLite (better-sqlite3) + ethers.js v6 (WA OTP, custodial wallet, gasless tx)
└── web/         # Frontend Next.js 14 App Router + Tailwind CSS + wagmi v2 + viem
```

### Kontrak Testnet (Ethereum Sepolia, Chain ID `11155111`)

| Kontrak | Alamat |
| --- | --- |
| `MockIDRX` | `0xb21ef113569c97634020e7d68cb435e8826fa8fa` |
| `Campaign` (Default) | `0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef` |

---

## Cara Clone & Menjalankan Secara Lokal

### Prasyarat

- **Node.js** `>= 22`
- **pnpm** `9.15.0` (aktifkan lewat `corepack enable`)
- **Foundry** (`forge`, opsional jika ingin meng-compile atau menguji ulang smart contract di `contracts/`)

### 1. Clone repository & install dependency

```bash
git clone --recurse-submodules https://github.com/mwaarits/Bound.git
cd Bound
corepack enable
pnpm install
```

*(Jika hanya menjalankan `relayer` dan `web`, `git clone https://github.com/mwaarits/Bound.git` tanpa submodules sudah cukup karena ABI sudah dibundel di `web/src/abi/` dan `relayer/src/abi/`.)*

### 2. Konfigurasi environment backend (`relayer/.env`)

Buat file `relayer/.env` dengan variabel berikut:

```env
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CHAIN_ID=11155111
MOCKIDRX_ADDRESS=0xb21ef113569c97634020e7d68cb435e8826fa8fa
CAMPAIGN_FACTORY_ADDRESS=0x0000000000000000000000000000000000000002
CAMPAIGN_ADDRESS=0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef
RELAYER_PRIVATE_KEY=0x_PRIVATE_KEY_EOA_RELAYER_SEPOLIA
MASTER_KEY=0x_KUNCI_ENKRIPSI_32_BYTE_HEX
JWT_SECRET=minimal_32_karakter_rahasia_jwt_anda
JWT_TTL_SECONDS=900
OTP_MODE=mock
PORT=4000
HOST=0.0.0.0
DB_PATH=./data/relayer.db
```

> Pastikan akun `RELAYER_PRIVATE_KEY` memiliki saldo Sepolia ETH agar bisa mengirim transaksi gasless `belanja` dan `donasi`.

### 3. Konfigurasi environment frontend (`web/.env.local`)

Buat file `web/.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_MOCKIDRX_ADDRESS=0xb21ef113569c97634020e7d68cb435e8826fa8fa
NEXT_PUBLIC_CAMPAIGN_ADDRESS=0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef
NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=
NEXT_PUBLIC_RELAYER_URL=http://localhost:4000
```

### 4. Jalankan backend & frontend

Buka dua terminal di root repo:

```bash
# Terminal 1 - Relayer (port 4000)
pnpm dev:relayer
```

```bash
# Terminal 2 - Frontend Next.js (port 3000)
pnpm dev:web
```

Akses aplikasi di `http://localhost:3000`.

### Perintah Pengujian & Build

```bash
pnpm test:relayer    # Unit test relayer (Vitest)
pnpm build:relayer   # Compile TypeScript relayer
pnpm build:web       # Sync ABI & build production Next.js
pnpm test:contracts  # Unit test smart contract (Foundry)
```

---

## Tutorial Penggunaan Aplikasi

Anda dapat langsung mencoba versi live di **[https://gobound.xyz](https://gobound.xyz)** atau secara lokal di `http://localhost:3000`:

1. **Sebagai Operator / NGO (`/campaigns` dan `/campaign/[alamat]`)**
   - Hubungkan **MetaMask** (jaringan **Ethereum Sepolia**) menggunakan wallet pemilik kontrak kampanye.
   - Di `/campaigns`, Anda dapat melihat daftar kampanye atau membuat kampanye baru jika `CampaignFactory` dikonfigurasi.
   - Buka halaman detail kampanye lalu masuk ke tab **Panel Operator**:
     - Edit judul, deskripsi, target dana, serta upload foto kampanye lalu klik **Simpan Metadata** (tanda tangan gratis tanpa gas fee).
     - Daftarkan alamat publik **Bound Relayer** pada kolom *Relayer / Agent Kampanye* (`setAgent`).
     - Tambahkan alamat wallet toko kebutuhan pokok ke whitelist (`setWhitelist`).
     - Masukkan daftar `Nama, NomorWA` penerima bantuan untuk membuat dompet custodial dan mendaftarkannya secara batch ke kontrak (`setPenerimaBatch`).

2. **Sebagai Donatur (`/campaign/[alamat]/donate`)**
   - **Jalur MetaMask**: Hubungkan MetaMask di jaringan Sepolia, tekan **Top-up 10.000.000 m-IDRX** (faucet testnet gratis) jika saldo token belum cukup, masukkan nominal donasi, lalu konfirmasi transaksi di MetaMask.
   - **Jalur WA + OTP**: Masukkan nomor WhatsApp dan kode OTP demo, lalu kirim donasi secara gasless melalui relayer.

3. **Sebagai Toko Whitelist (`/toko`)**
   - Pastikan alamat dompet toko Anda sudah didaftarkan operator ke whitelist kampanye.
   - Isi **Nama Toko**, **Alamat Dompet Toko**, dan **Nominal Belanja (Rp)**, lalu klik **Buat QR**.
   - Tunjukkan QR kepada penerima atau salin payload QR untuk mode demo.

4. **Sebagai Penerima Bantuan (`/penerima`)**
   - Masukkan nomor WhatsApp yang telah didaftarkan operator dan verifikasi kode OTP. *(Pada mode demo testnet `OTP_MODE=mock`, kode OTP demo ditampilkan oleh relayer di log/UI).*
   - Pindai QR dari halaman Toko (atau tempel payload QR pada tab **Tempel**).
   - Periksa detail nama toko serta nominal tagihan, lalu klik **Bayar**. Relayer mengeksekusi `belanja` di Sepolia dan saldo `m-IDRX` langsung berpindah ke dompet toko.
