import Link from 'next/link';
import { DonateForm } from '@/components/DonateForm';

export default function DonatePage({ params }: { params: { addr: string } }) {
  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between text-body-sm text-text-secondary">
        <Link href={`/campaign/${params.addr}`} className="hover:text-brand-primary font-medium">
          ← Kembali ke Dashboard Kampanye
        </Link>
        <Link href="/campaigns" className="hover:text-brand-primary">
          Semua Kampanye
        </Link>
      </div>
      <DonateForm campaignAddr={params.addr} />
    </main>
  );
}
