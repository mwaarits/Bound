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

export function getCampaignMeta(addr: string): CampaignMeta {
  if (typeof window === 'undefined') return DEFAULT_META;
  try {
    const raw = localStorage.getItem(`campaign:${addr}`);
    return raw ? { ...DEFAULT_META, ...JSON.parse(raw) } : DEFAULT_META;
  } catch {
    return DEFAULT_META;
  }
}

export function setCampaignMeta(addr: string, meta: CampaignMeta): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`campaign:${addr}`, JSON.stringify(meta));
}

/**
 * Resize and compress an uploaded image file on a canvas so it fits comfortably in localStorage.
 */
export function compressImageFile(file: File, maxWidth = 960, quality = 0.82): Promise<string> {
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
