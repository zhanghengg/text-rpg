import type { Metadata } from 'next';

import { isLang, type Lang } from '@/lib/i18n/i18n';

import { MapClient } from './MapClient';

export const metadata: Metadata = {
  title: 'Explore',
};

export default async function MapPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  const lang = (isLang(params.lang) ? params.lang : 'en') as Lang;
  return <MapClient lang={lang} />;
}
