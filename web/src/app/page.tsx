import { BoundWordmark } from '@/components/BoundWordmark';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center space-y-8 p-6">
      <BoundWordmark />
      <p className="text-body text-text-secondary text-center max-w-md">
        Donasi terprogram — hanya bisa dibelanjakan di toko whitelist.
      </p>
    </main>
  );
}
