import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isLang } from '@/lib/i18n/i18n';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  const seg = pathname.split('/')[1];
  if (isLang(seg)) return NextResponse.next();

  const accept = req.headers.get('accept-language') || '';
  const lang = accept.toLowerCase().includes('zh') ? 'zh' : 'en';

  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)'],
};
