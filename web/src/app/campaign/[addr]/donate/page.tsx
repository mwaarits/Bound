import { DonateForm } from '@/components/DonateForm';
import { BoundWordmark } from '@/components/BoundWordmark';

export default function DonatePage({ params }: { params: { addr: string } }) {
  return (
    <div className="min-h-screen">
      <header className="p-4"><BoundWordmark /></header>
      <DonateForm campaignAddr={params.addr} />
    </div>
  );
}