import type { Metadata } from 'next';

import { GameClient } from './GameClient';

export const metadata: Metadata = {
  title: 'Game',
  description: 'A turn-based text RPG prototype (local save).',
};

export default function GamePage() {
  return <GameClient />;
}
