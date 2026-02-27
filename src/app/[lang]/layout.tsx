import type { Metadata } from 'next';

import { isLang, type Lang } from '@/lib/i18n/i18n';

import '../globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Mist Ring: Text RPG',
    template: '%s - Mist Ring',
  },
  description: 'A turn-based text RPG built with Next.js App Router.',
};

export default async function LangLayout(props: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const lang = (isLang(params.lang) ? params.lang : 'en') as Lang;

  return (
    <html lang={lang}>
      <body className="antialiased">{props.children}</body>
    </html>
  );
}
