import { Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Bound, Donasi Terprogram Tepat Sasaran',
  description: 'Donasi bantuan bencana yang hanya bisa dibelanjakan di toko whitelist terdaftar.',
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} bg-bg-base text-text-primary font-sans min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
