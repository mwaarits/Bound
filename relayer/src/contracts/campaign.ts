import type { ethers } from 'ethers';

// ponytail: ethers.Contract methods are dynamic (Proxy); strict TS can't verify them.
// Cast inline rather than building a custom typed interface — the ABI IS the type.

export async function belanja(c: ethers.Contract, penerima: string, toko: string, jumlah: bigint, nonce: bigint, expiry: bigint) {
  return (c as any).belanja(penerima, toko, jumlah, nonce, expiry);
}

export async function donasi(c: ethers.Contract, jumlah: bigint) {
  return (c as any).donasi(jumlah);
}

export async function setWhitelist(c: ethers.Contract, toko: string, diizinkan: boolean) {
  return (c as any).setWhitelist(toko, diizinkan);
}

export async function setPenerimaBatch(c: ethers.Contract, orang: string[], diizinkan: boolean[]) {
  return (c as any).setPenerimaBatch(orang, diizinkan);
}

export async function getSudahBelanja(c: ethers.Contract, addr: string): Promise<bigint> {
  return (await (c as any).sudahBelanja(addr)) as bigint;
}

export async function getIsPenerima(c: ethers.Contract, addr: string): Promise<boolean> {
  return (await (c as any).isPenerima(addr)) as boolean;
}

export async function getIsWhitelist(c: ethers.Contract, addr: string): Promise<boolean> {
  return (await (c as any).isWhitelist(addr)) as boolean;
}

export async function getJatahPerPenerima(c: ethers.Contract): Promise<bigint> {
  return (await (c as any).jatahPerPenerima()) as bigint;
}
