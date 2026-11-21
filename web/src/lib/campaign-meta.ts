export type CampaignMeta = {
  title: string;
  description: string;
  target: string;
};

const DEFAULT_META: CampaignMeta = {
  title: 'Banjir Demak 2025',
  description: 'Bantuan donasi untuk korban banjir Demak. Dana hanya bisa dibelanjakan di toko whitelist yang terdaftar.',
  target: '50000000',
};

export function getCampaignMeta(addr: string): CampaignMeta {
  if (typeof window === 'undefined') return DEFAULT_META;
  const raw = localStorage.getItem(`campaign:${addr}`);
  return raw ? { ...DEFAULT_META, ...JSON.parse(raw) } : DEFAULT_META;
}

export function setCampaignMeta(addr: string, meta: CampaignMeta): void {
  localStorage.setItem(`campaign:${addr}`, JSON.stringify(meta));
}
