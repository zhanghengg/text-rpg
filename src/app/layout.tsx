import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Mist Ring: Text RPG',
    template: '%s - Mist Ring',
  },
  description: 'A turn-based text RPG built with Next.js App Router.',
};

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
