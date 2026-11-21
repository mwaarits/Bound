import { DonateForm } from '@/components/DonateForm';

export default function DonatePage({ params }: { params: { addr: string } }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-bg-base text-text-primary md:bg-chrome-dark md:text-text-on-dark flex items-center justify-between">
        <a href="/" className="text-[28px] leading-none font-extrabold tracking-[-0.02em] md:text-[36px] md:text-text-on-dark">bound</a>
        <a href={`/campaign/${params.addr}`} className="text-body hover:opacity-80">Dashboard</a>
      </header>
      <DonateForm campaignAddr={params.addr} />
    </div>
  );
}