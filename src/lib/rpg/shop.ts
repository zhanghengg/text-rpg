import type { RpgItem } from './state';

export const SHOP_STOCK: RpgItem[] = [
  { id: 'potion_small', name: '小型血瓶', kind: 'potion', qty: 1, price: 18 },
  { id: 'potion_mana', name: '小型蓝瓶', kind: 'potion', qty: 1, price: 18 },
  { id: 'potion_big', name: '中型血瓶', kind: 'potion', qty: 1, price: 45 },
];

export function sellPrice(it: RpgItem) {
  // Simple rule: sell for 50% of price, or 6 for potions without price.
  const base = it.price ?? (it.kind === 'potion' ? 12 : 20);
  return Math.max(1, Math.floor(base * 0.5));
}
