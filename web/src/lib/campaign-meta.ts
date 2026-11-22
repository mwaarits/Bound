import { useEffect, useState } from 'react';
import { relayerGet, relayerPost } from '@/lib/relayer-client';

export type CampaignMeta = {
  title: string;
  description: string;
  target: string;
  imageUrl?: string;
};

const DEFAULT_META: CampaignMeta = {
  title: 'Banjir Demak 2025',
  description:
    'Bantuan donasi untuk korban banjir Demak. Dana hanya bisa dibelanjakan di toko whitelist yang terdaftar.',
  target: '50000000',
  imageUrl: '',
};

const remoteCache = new Map<string, CampaignMeta>();
const inflightRequests = new Map<string, Promise<CampaignMeta | null>>();

export function buildCampaignMetaMessage(address: string, timestamp: number): string {
  return `Bound: Simpan metadata kampanye ${address.toLowerCase()} (${timestamp})`;
}

export function getCampaignMeta(addr: string): CampaignMeta {
  const key = addr.toLowerCase();
  const cached = remoteCache.get(key);
  if (cached) return cached;
  if (typeof window === 'undefined') return DEFAULT_META;
  try {
    const raw =
      localStorage.getItem(`campaign:${key}`) ?? localStorage.getItem(`campaign:${addr}`);
    return raw ? { ...DEFAULT_META, ...JSON.parse(raw) } : DEFAULT_META;
  } catch {
    return DEFAULT_META;
  }
}

export function setCampaignMeta(addr: string, meta: CampaignMeta): void {
  const key = addr.toLowerCase();
  remoteCache.set(key, meta);
  if (typeof window === 'undefined') return;
  localStorage.setItem(`campaign:${key}`, JSON.stringify(meta));
}

export async function fetchCampaignMeta(addr: string): Promise<CampaignMeta | null> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return null;
  const key = addr.toLowerCase();
  const existing = inflightRequests.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await relayerGet<{
        title?: string;
        description?: string;
        target?: string;
        imageUrl?: string;
        error?: string;
      }>(`/campaigns/${key}/meta`);
      if (res && !res.error && res.title) {
        const normalized: CampaignMeta = {
          title: res.title,
          description: res.description ?? DEFAULT_META.description,
          target: res.target ?? DEFAULT_META.target,
          imageUrl: res.imageUrl ?? '',
        };
        setCampaignMeta(key, normalized);
        return normalized;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, promise);
  return promise;
}

export async function saveCampaignMetaRemote(
  addr: string,
  meta: CampaignMeta,
  signMessageAsync: (args: { message: string }) => Promise<string>
): Promise<CampaignMeta> {
  const key = addr.toLowerCase();
  const timestamp = Date.now();
  const signature = await signMessageAsync({
    message: buildCampaignMetaMessage(key, timestamp),
  });
  const res = await relayerPost<{
    title?: string;
    description?: string;
    target?: string;
    imageUrl?: string;
    error?: string;
  }>(`/campaigns/${key}/meta`, {
    title: meta.title,
    description: meta.description,
    target: meta.target,
    imageUrl: meta.imageUrl ?? '',
    timestamp,
    signature,
  });

  if (res?.error) {
    throw new Error(
      res.error === 'BUKAN_OPERATOR'
        ? 'Signature bukan dari dompet Bound Operator pemilik kampanye.'
        : `Gagal menyimpan ke server (${res.error}).`
    );
  }

  const saved: CampaignMeta = {
    title: res.title ?? meta.title,
    description: res.description ?? meta.description,
    target: res.target ?? meta.target,
    imageUrl: res.imageUrl ?? meta.imageUrl ?? '',
  };
  setCampaignMeta(key, saved);
  return saved;
}

export function useCampaignMeta(
  addr: string,
  refreshKey = 0
): [CampaignMeta, React.Dispatch<React.SetStateAction<CampaignMeta>>] {
  const [meta, setMeta] = useState<CampaignMeta>(DEFAULT_META);

  useEffect(() => {
    setMeta(getCampaignMeta(addr));
    let cancelled = false;
    fetchCampaignMeta(addr).then((remote) => {
      if (!cancelled && remote) {
        setMeta(remote);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [addr, refreshKey]);

  return [meta, setMeta];
}

/**
 * Resize and compress an uploaded image file on a canvas so it fits comfortably in storage and payloads.
 */
export function compressImageFile(file: File, maxWidth = 960, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
