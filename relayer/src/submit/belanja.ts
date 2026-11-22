import { ethers } from 'ethers';
import { CampaignAbi } from '../abi/Campaign.abi.js';

const iface = new ethers.Interface(CampaignAbi);

export function decodeCanonicalError(errorData: string): string {
  try {
    const parsed = iface.parseError(errorData);
    return parsed?.name ?? 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

// ponytail: submitBelanja not testable without deployed contracts (T2.x deferred);
// error decoder is the testable surface. Live submit tested at T10.x demo rehearsal.
export async function submitBelanja(
  campaign: ethers.Contract,
  args: { penerima: string; toko: string; jumlah: bigint; nonce: bigint; expiry: bigint }
): Promise<{ txHash: string; status: 'ok' | 'revert'; reason?: string }> {
  try {
    const tx = await (campaign as any).belanja(args.penerima, args.toko, args.jumlah, args.nonce, args.expiry);
    const rc = await tx.wait();
    return { txHash: rc.hash, status: 'ok' };
  } catch (err: any) {
    const reason = err.data ? decodeCanonicalError(err.data) : 'CHAIN_ERROR';
    return { txHash: '', status: 'revert', reason };
  }
}
