import type { Metadata } from 'next';

import { isLang, type Lang } from '@/lib/i18n/i18n';

import { RpgClient } from './RpgClient';

export const metadata: Metadata = {
  title: 'RPG',
};

export default async function RpgPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  const lang = (isLang(params.lang) ? params.lang : 'zh') as Lang;
  return <RpgClient lang={lang} />;
}
