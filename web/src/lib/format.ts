export function formatIDR(rawWei: bigint): string {
  const idr = Number(rawWei) / 1e18;
  return 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(idr);
}
