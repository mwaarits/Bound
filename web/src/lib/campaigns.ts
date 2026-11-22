export const DEFAULT_CAMPAIGN = (process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS ??
  '0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef') as `0x${string}`;

export const CAMPAIGN_FACTORY = (process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS ??
  '') as `0x${string}`;

export const MOCKIDRX_ADDRESS = (process.env.NEXT_PUBLIC_MOCKIDRX_ADDRESS ??
  '') as `0x${string}`;

export type CampaignRecord = {
  address: `0x${string}`;
  name?: string;
  operator?: `0x${string}`;
  isDefault?: boolean;
};

const LOCAL_CAMPAIGNS_KEY = 'bound:campaigns:v1';

export function isValidAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function shortenAddress(addr: string, start = 6, end = 4): string {
  if (!addr || addr.length <= start + end + 2) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

export function parseIDRInputToWei(input: string): bigint | null {
  const cleaned = input.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  try {
    const val = BigInt(cleaned);
    if (val <= 0n) return null;
    return val * 10n ** 18n;
  } catch {
    return null;
  }
}

export function etherscanTxUrl(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function etherscanAddrUrl(addr: string): string {
  return `https://sepolia.etherscan.io/address/${addr}`;
}

export function getLocalCampaigns(): CampaignRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CAMPAIGNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CampaignRecord[];
    return Array.isArray(parsed)
      ? parsed.filter((c) => c && isValidAddress(c.address))
      : [];
  } catch {
    return [];
  }
}

export function addLocalCampaign(record: CampaignRecord): void {
  if (typeof window === 'undefined') return;
  const existing = getLocalCampaigns();
  const key = record.address.toLowerCase();
  const filtered = existing.filter((c) => c.address.toLowerCase() !== key);
  localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify([record, ...filtered]));
}

export type RecipientLabel = {
  nama: string;
  wa: string;
};

export function getRecipientLabels(campaignAddr: string): Record<string, RecipientLabel> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`bound:recipients:${campaignAddr.toLowerCase()}`);
    return raw ? (JSON.parse(raw) as Record<string, RecipientLabel>) : {};
  } catch {
    return {};
  }
}

export function saveRecipientLabels(
  campaignAddr: string,
  entries: { address: string; nama: string; wa: string }[]
): Record<string, RecipientLabel> {
  const next = { ...getRecipientLabels(campaignAddr) };
  for (const e of entries) {
    next[e.address.toLowerCase()] = { nama: e.nama, wa: e.wa };
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(`bound:recipients:${campaignAddr.toLowerCase()}`, JSON.stringify(next));
  }
  return next;
}
