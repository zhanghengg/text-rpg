import type { GearSlot, Item, Player } from '@/lib/types';

import { recalcPlayer } from '@/lib/game';

const RING_SLOTS: GearSlot[] = ['ring1', 'ring2'];

export function canEquip(p: Player, it: Item) {
  if (p.level < it.levelReq) return { ok: false as const, reason: 'level' as const };
  return { ok: true as const };
}

export function equipItem(p: Player, it: Item): { player: Player; replaced?: Item } {
  const baseSlot = it.slot;

  let slot: GearSlot = baseSlot;
  if (baseSlot === 'ring1' || baseSlot === 'ring2') {
    const r1 = p.equipment.ring1;
    const r2 = p.equipment.ring2;
    if (!r1) slot = 'ring1';
    else if (!r2) slot = 'ring2';
    else slot = 'ring1';
  }

  const replaced = p.equipment[slot];

  const equipment = { ...p.equipment, [slot]: it };
  const inventory = [
    ...p.inventory.filter((x) => x.id !== it.id),
    ...(replaced ? [replaced] : []),
  ];

  const next = recalcPlayer({ ...p, equipment, inventory });
  return { player: next, replaced };
}

export function unequipSlot(p: Player, slot: GearSlot): { player: Player; removed?: Item } {
  const removed = p.equipment[slot];
  if (!removed) return { player: p };

  const equipment = { ...p.equipment };
  delete equipment[slot];

  const inventory = [removed, ...p.inventory];
  const next = recalcPlayer({ ...p, equipment, inventory });
  return { player: next, removed };
}

export function allSlots(): GearSlot[] {
  return ['weapon', 'offhand', 'head', 'chest', 'hands', 'legs', 'feet', 'neck', ...RING_SLOTS];
}
