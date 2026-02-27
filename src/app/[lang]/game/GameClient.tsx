'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { BattleState, Player } from '@/lib/types';

import { getDict } from '@/lib/i18n/dict';
import { isLang, type Lang } from '@/lib/i18n/i18n';
import { JOB_LABEL, MAP_LABEL } from '@/lib/i18n/labels';
import { newGame, recalcPlayer, startBattle, stepBattle, type PlayerAction } from '@/lib/game';
import { canEquip, equipItem, unequipSlot } from '@/lib/gear/gear';
import type { GearSlot } from '@/lib/types';
import { clearSave, loadSave, writeSave } from '@/lib/save';

type Screen = 'camp' | 'battle' | 'inventory';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function bar(p: number) {
  const v = clamp(p, 0, 1);
  const filled = Math.round(v * 18);
  return `${'█'.repeat(filled)}${'░'.repeat(18 - filled)}`;
}

function otherLang(lang: Lang): Lang {
  return lang === 'zh' ? 'en' : 'zh';
}

export function GameClient(props: { lang: Lang }) {
  const lang = props.lang;
  const t = getDict(lang);

  const [player, setPlayer] = useState<Player | null>(() => {
    const saved = loadSave();
    return saved ? recalcPlayer(saved) : null;
  });
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [screen, setScreen] = useState<Screen>('camp');

  useEffect(() => {
    if (player) writeSave(player);
  }, [player]);

  const hpLine = useMemo(() => {
    if (!player) return null;
    const p = player.hp / player.derived.hpMax;
    return `${player.hp}/${player.derived.hpMax}  ${bar(p)}`;
  }, [player]);

  function ensurePlayer() {
    if (!player) {
      setPlayer(newGame('Adventurer', 'guard'));
    }
  }

  function onNew() {
    const name = window.prompt(t.prompts.name, lang === 'zh' ? '冒险者' : 'Adventurer') ?? 'Adventurer';
    const job = (window.prompt(`${t.prompts.pickJob}\n${t.prompts.pickJobHelp}`, 'guard') ?? 'guard') as Player['job'];

    const p0 = newGame(name, job);
    const p = { ...p0, lang };
    setBattle(null);
    setPlayer(p);
    setScreen('camp');
  }

  function onDeleteSave() {
    if (!window.confirm(t.prompts.deleteSave)) return;
    clearSave();
    setBattle(null);
    setPlayer(null);
    setScreen('camp');
  }

  function onStartBattle() {
    ensurePlayer();
    const p = player ?? newGame('Adventurer', 'guard');
    const seed = p.world.pendingBattleSeed ?? Math.floor(Date.now() / 1000);
    setBattle(startBattle(seed, p));
    setScreen('battle');
  }

  function act(action: PlayerAction) {
    if (!player || !battle) return;
    const next = stepBattle(player, battle, action);
    setPlayer(next.player);
    setBattle(next.battle);
  }

  const alt = otherLang(lang);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="title">{t.appName}</div>
          <div className="sub">{lang === 'zh' ? '本地存档 · 回合制 · MVP2底座' : 'Local save · Turn-based · MVP2 foundation'}</div>
        </div>
        <div className="nav">
          <button className={screen === 'camp' ? 'tab on' : 'tab'} onClick={() => setScreen('camp')}>
            {t.nav.camp}
          </button>
          <Link className="tab link" href={`/${lang}/map`}>
            {t.nav.explore}
          </Link>
          <button
            className={screen === 'inventory' ? 'tab on' : 'tab'}
            onClick={() => setScreen('inventory')}
            disabled={!player}
          >
            {t.nav.gear}
          </button>
          <button
            className={screen === 'battle' ? 'tab on' : 'tab'}
            onClick={() => setScreen('battle')}
            disabled={!battle}
          >
            {t.nav.battle}
          </button>
          <Link className="tab link" href={`/${lang}`}>
            {t.nav.home}
          </Link>
          <Link className="tab link" href={`/${alt}/game`} prefetch={false}>
            {alt === 'zh' ? '中文' : 'EN'}
          </Link>
        </div>
      </header>

      <section className="grid">
        <aside className="panel">
          <div className="h">{t.status.title}</div>
          {!player ? (
            <div className="muted">{t.status.noSave}</div>
          ) : (
            <>
              <div className="kv">
                <span className="k">{t.status.name}</span>
                <span className="v">{player.name}</span>
              </div>
              <div className="kv">
                <span className="k">{t.status.job}</span>
                <span className="v">{JOB_LABEL[lang][player.job]}</span>
              </div>
              <div className="kv">
                <span className="k">{t.status.level}</span>
                <span className="v">
                  {player.level} (EXP {player.exp}/{player.expToNext})
                </span>
              </div>
              <div className="kv">
                <span className="k">{t.status.hp}</span>
                <span className="v mono">{hpLine}</span>
              </div>
              <div className="kv">
                <span className="k">{t.status.gold}</span>
                <span className="v">{player.gold}g</span>
              </div>
              <div className="kv">
                <span className="k">{t.status.map}</span>
                <span className="v">{MAP_LABEL[lang][player.world.mapId]}</span>
              </div>
            </>
          )}

          <div className="actions">
            <button className="btn" onClick={onNew}>
              {t.status.newGame}
            </button>
            <button className="btn" onClick={onStartBattle} disabled={!player}>
              {t.status.fight}
            </button>
            <button className="btn danger" onClick={onDeleteSave}>
              {t.status.deleteSave}
            </button>
          </div>
        </aside>

        <main className="panel main">
          {screen === 'camp' ? <Camp t={t} player={player} /> : null}
          {screen === 'inventory' ? (
            <GearView t={t} player={player} lang={lang} onPlayer={(p) => setPlayer(p)} />
          ) : null}
          {screen === 'battle' ? <BattleView t={t} battle={battle} onAct={act} /> : null}
        </main>
      </section>

      <style>{css}</style>
    </div>
  );
}

function Camp(props: { t: ReturnType<typeof getDict>; player: Player | null }) {
  const p = props.player;
  const t = props.t;
  return (
    <>
      <div className="h">{t.camp.title}</div>
      {!p ? <p className="p">{t.camp.noSave}</p> : <>
        <p className="p">{t.camp.text}</p>
        <div className="callout">{t.camp.note}</div>
      </>}
    </>
  );
}

function GearView(props: {
  t: ReturnType<typeof getDict>;
  player: Player | null;
  lang: Lang;
  onPlayer: (p: Player) => void;
}) {
  const p = props.player;
  const t = props.t;

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function onEquip(id: string) {
    if (!p || busy) return;
    setToast(null);
    setBusy(true);
    try {
      const it = p.inventory.find((x) => x.id === id);
      if (!it) return;

      const ok = canEquip(p, it);
      if (!ok.ok) {
        setToast(props.lang === 'zh' ? '等级不足。' : 'Level too low.');
        return;
      }

      const res = equipItem(p, it);
      props.onPlayer(res.player);
      setToast(props.lang === 'zh' ? `已装备：${it.name}` : `Equipped: ${it.name}`);
    } finally {
      setBusy(false);
    }
  }

  function onUnequip(slot: string) {
    if (!p || busy) return;
    setToast(null);
    setBusy(true);
    try {
      const res = unequipSlot(p, slot as GearSlot);
      props.onPlayer(res.player);
      if (res.removed) setToast(props.lang === 'zh' ? `已卸下：${res.removed.name}` : `Unequipped: ${res.removed.name}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="h">{t.gear.title}</div>
      {!p ? (
        <p className="p">{t.gear.noSave}</p>
      ) : (
        <>
          <div className="muted">{t.gear.inventory} ({p.inventory.length})</div>

          <div className="equipGrid">
            {Object.entries(p.equipment).map(([slot, it]) =>
              it ? (
                <div key={slot} className="slotCard">
                  <div className="row">
                    <div className="strong">{slot}</div>
                    <button className="miniBtn" onClick={() => onUnequip(slot)} disabled={busy}>
                      {t.gear.unequip}
                    </button>
                  </div>
                  <div className="muted small">{it.name}</div>
                </div>
              ) : null,
            )}
          </div>

          {toast ? <div className="toast">{toast}</div> : null}

          <div className="list">
            {p.inventory.map((it) => (
              <div key={it.id} className="item">
                <div className="row">
                  <div className="strong">{it.name}</div>
                  <div className="tag">{t.gear.rarity[it.rarity]}</div>
                </div>
                <div className="muted small">
                  {it.slot} · {t.gear.levelReq}{it.levelReq} · {t.gear.statsPrefix}
                  {Object.entries(it.stats)
                    .map(([k, v]) => `${k}:${v}`)
                    .join('  ')}
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="miniBtn" onClick={() => onEquip(it.id)} disabled={busy}>
                    {t.gear.equip}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="muted">{t.gear.next}</div>
        </>
      )}
    </>
  );
}

function BattleView(props: {
  t: ReturnType<typeof getDict>;
  battle: BattleState | null;
  onAct: (a: PlayerAction) => void;
}) {
  const b = props.battle;
  const t = props.t;

  return (
    <>
      <div className="h">{t.battle.title}</div>
      {!b ? (
        <p className="p">{t.battle.noBattle}</p>
      ) : (
        <>
          <div className="battleTop">
            <div className="strong">
              {b.enemy.name} <span className="muted">Lv.{b.enemy.level}</span>
            </div>
            <div className="muted">
              HP {b.enemyHp}/{b.enemy.hpMax} · Turn {b.turn} · Status {b.status}
            </div>
          </div>

          <div className="controls">
            <button className="btn" onClick={() => props.onAct('attack')} disabled={b.status !== 'inBattle'}>
              {t.battle.attack}
            </button>
            <button className="btn" onClick={() => props.onAct('defend')} disabled={b.status !== 'inBattle'}>
              {t.battle.defend}
            </button>
            <button className="btn" onClick={() => props.onAct('escape')} disabled={b.status !== 'inBattle'}>
              {t.battle.escape}
            </button>
          </div>

          <div className="log">
            {b.log.slice(-14).map((e) => (
              <div key={e.t + e.text} className={`line ${e.side}`}>
                {e.text}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

const css = String.raw`
  .wrap {
    width: min(1100px, 100%);
    margin: 0 auto;
    padding: 28px 16px 40px;
  }

  .top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .title {
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-size: 22px;
  }

  .sub {
    color: rgba(255,255,255,0.68);
    font-size: 13px;
    margin-top: 4px;
  }

  .nav {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tab {
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.25);
    color: rgba(255,255,255,0.86);
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
    transition: transform 160ms ease, background 160ms ease;
  }

  .tab:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); }
  .tab.on { background: rgba(112,246,255,0.12); border-color: rgba(112,246,255,0.22); }
  .tab:disabled { opacity: 0.45; cursor: not-allowed; }
  .tab.link { display: inline-flex; align-items: center; }

  .grid {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 14px;
    align-items: start;
  }

  .panel {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    border-radius: 18px;
    box-shadow: 0 30px 90px rgba(0,0,0,0.38);
    backdrop-filter: blur(14px);
    padding: 14px;
  }

  .panel.main { min-height: 420px; }

  .h {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 12px;
    color: rgba(255,255,255,0.72);
    margin-bottom: 10px;
  }

  .kv {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px dashed rgba(255,255,255,0.10);
  }

  .k { color: rgba(255,255,255,0.62); font-size: 13px; }
  .v { color: rgba(255,255,255,0.88); font-size: 13px; text-align: right; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
  .muted { color: rgba(255,255,255,0.64); }
  .small { font-size: 12px; }
  .strong { color: rgba(255,255,255,0.92); font-weight: 800; }

  .actions {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .btn {
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.22);
    color: rgba(255,255,255,0.88);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 800;
    transition: transform 160ms ease, background 160ms ease;
  }

  .btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); }
  .btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .danger { border-color: rgba(255,110,110,0.25); background: rgba(255,110,110,0.08); }

  .p {
    margin: 0;
    line-height: 1.7;
    color: rgba(255,255,255,0.82);
    font-size: 14px;
  }

  .callout {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(112,246,255,0.18);
    background: rgba(112,246,255,0.08);
    color: rgba(255,255,255,0.82);
    font-size: 13px;
    line-height: 1.6;
  }

  .map {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin: 10px 0 10px;
  }

  .node {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    padding: 12px;
    text-align: center;
    font-weight: 800;
    color: rgba(255,255,255,0.86);
  }

  .node.on { border-color: rgba(112,246,255,0.22); background: rgba(112,246,255,0.08); }

  .equipGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 10px 0 10px;
  }

  .slotCard {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    padding: 10px 12px;
  }

  .miniBtn {
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.18);
    color: rgba(255,255,255,0.84);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 900;
    transition: transform 160ms ease, background 160ms ease;
  }

  .miniBtn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); }
  .miniBtn:disabled { opacity: 0.55; cursor: not-allowed; }

  .toast {
    margin-top: 10px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.22);
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.6;
  }

  .list {
    display: grid;
    gap: 10px;
    margin: 10px 0 10px;
  }

  .item {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    padding: 10px 12px;
  }

  .row { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }

  .tag {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.18);
    color: rgba(255,255,255,0.72);
  }

  .battleTop { display: grid; gap: 4px; margin-bottom: 10px; }

  .controls { display: flex; gap: 10px; flex-wrap: wrap; margin: 8px 0 12px; }

  .log {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.22);
    padding: 10px 12px;
    max-height: 320px;
    overflow: auto;
  }

  .line { font-size: 13px; line-height: 1.55; padding: 3px 0; color: rgba(255,255,255,0.80); }
  .line.player { color: rgba(112,246,255,0.92); }
  .line.enemy { color: rgba(255,211,110,0.92); }
  .line.system { color: rgba(255,255,255,0.74); }

  @media (max-width: 920px) {
    .grid { grid-template-columns: 1fr; }
  }
`;

export function parseLang(v: string): Lang {
  return (isLang(v) ? v : 'en') as Lang;
}
