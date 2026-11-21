'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BoundWordmark({ onDark = false }: { onDark?: boolean }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const cls = `text-[28px] leading-none font-extrabold tracking-[-0.02em] md:text-[36px] lg:text-[40px] ${onDark ? 'text-text-on-dark' : 'text-text-primary'}`;

  if (isHome) return <span className={cls} aria-label="Bound home">bound</span>;
  return (
    <Link href="/" aria-label="Bound home" className={cls}>
      bound
    </Link>
  );
}