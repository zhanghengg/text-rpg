import type { Metadata } from 'next';

import { isLang, type Lang } from '@/lib/i18n/i18n';

import { GameClient } from './GameClient';

export const metadata: Metadata = {
  title: 'Game',
  description: 'A turn-based text RPG prototype (local save).',
};

export default async function GamePage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  const lang = (isLang(params.lang) ? params.lang : 'en') as Lang;

  return <GameClient lang={lang} />;
}
