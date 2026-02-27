'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { BattleState, Player } from '@/lib/types';

import { JOB_LABEL, MAP_LABEL } from '@/lib/content';
import { newGame, startBattle, stepBattle, type PlayerAction, recalcPlayer } from '@/lib/game';
import { clearSave, loadSave, writeSave } from '@/lib/save';

type Screen = 'camp' | 'battle' | 'inventory' | 'map';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function bar(p: number) {
  const v = clamp(p, 0, 1);
  const filled = Math.round(v * 18);
  return `${'█'.repeat(filled)}${'░'.repeat(18 - filled)}`;
}

export function GameClient() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [screen, setScreen] = useState<Screen>('camp');

  useEffect(() => {
    const saved = loadSave();
    if (saved) setPlayer(recalcPlayer(saved));
  }, []);

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
    const name = window.prompt('Name your adventurer:', 'Adventurer') ?? 'Adventurer';
    const job = (window.prompt(
      'Pick a job: guard / ranger / warlock / cleric / rogue / scholar',
      'guard',
    ) ?? 'guard') as Player['job'];

    const p = newGame(name, job);
    setBattle(null);
    setPlayer(p);
    setScreen('camp');
  }

  function onDeleteSave() {
    if (!window.confirm('Delete local save?')) return;
    clearSave();
    setBattle(null);
    setPlayer(null);
    setScreen('camp');
  }

  function onStartBattle() {
    ensurePlayer();
    const p = player ?? newGame('Adventurer', 'guard');
    const seed = Math.floor(Date.now() / 1000);
    setBattle(startBattle(seed, p));
    setScreen('battle');
  }

  function act(action: PlayerAction) {
    if (!player || !battle) return;
    const next = stepBattle(player, battle, action);
    setPlayer(next.player);
    setBattle(next.battle);
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="title">Mist Ring: Text RPG</div>
          <div className="sub">Local save · Turn-based · MVP2 foundation</div>
        </div>
        <div className="nav">
          <button className={screen === 'camp' ? 'tab on' : 'tab'} onClick={() => setScreen('camp')}>
            Camp
          </button>
          <button
            className={screen === 'map' ? 'tab on' : 'tab'}
            onClick={() => setScreen('map')}
            disabled={!player}
          >
            Map
          </button>
          <button
            className={screen === 'inventory' ? 'tab on' : 'tab'}
            onClick={() => setScreen('inventory')}
            disabled={!player}
          >
            Gear
          </button>
          <button
            className={screen === 'battle' ? 'tab on' : 'tab'}
            onClick={() => setScreen('battle')}
            disabled={!battle}
          >
            Battle
          </button>
          <Link className="tab link" href="/">
            Home
          </Link>
        </div>
      </header>

      <section className="grid">
        <aside className="panel">
          <div className="h">Status</div>
          {!player ? (
            <div className="muted">No local save loaded.</div>
          ) : (
            <>
              <div className="kv">
                <span className="k">Name</span>
                <span className="v">{player.name}</span>
              </div>
              <div className="kv">
                <span className="k">Job</span>
                <span className="v">{JOB_LABEL[player.job]}</span>
              </div>
              <div className="kv">
                <span className="k">Level</span>
                <span className="v">
                  {player.level} (EXP {player.exp}/{player.expToNext})
                </span>
              </div>
              <div className="kv">
                <span className="k">HP</span>
                <span className="v mono">{hpLine}</span>
              </div>
              <div className="kv">
                <span className="k">Gold</span>
                <span className="v">{player.gold}g</span>
              </div>
              <div className="kv">
                <span className="k">Map</span>
                <span className="v">{MAP_LABEL[player.world.mapId]}</span>
              </div>
            </>
          )}

          <div className="actions">
            <button className="btn" onClick={onNew}>
              New Game
            </button>
            <button className="btn" onClick={onStartBattle} disabled={!player}>
              Fight
            </button>
            <button className="btn danger" onClick={onDeleteSave}>
              Delete Save
            </button>
          </div>
        </aside>

        <main className="panel main">
          {screen === 'camp' ? <Camp player={player} /> : null}
          {screen === 'map' ? <MapView player={player} /> : null}
          {screen === 'inventory' ? <GearView player={player} /> : null}
          {screen === 'battle' ? <BattleView battle={battle} onAct={act} /> : null}
        </main>
      </section>

      <style>{css}</style>
    </div>
  );
}

function Camp(props: { player: Player | null }) {
  const p = props.player;
  return (
    <>
      <div className="h">Camp</div>
      {!p ? (
        <p className="p">Start a new game to generate a local save.</p>
      ) : (
        <>
          <p className="p">
            The camp sits at the edge of the Borderlands. The fog pulses beyond the lanterns, waiting.
          </p>
          <div className="callout">
            MVP2 scope note: maps, gear slots, jobs are defined; content depth (events, item pools, skills) will
            be expanded next.
          </div>
        </>
      )}
    </>
  );
}

function MapView(props: { player: Player | null }) {
  const p = props.player;
  return (
    <>
      <div className="h">Map</div>
      {!p ? (
        <p className="p">No save.</p>
      ) : (
        <>
          <p className="p">
            Current region: <span className="strong">{MAP_LABEL[p.world.mapId]}</span> · Node:{' '}
            <span className="mono">{p.world.nodeId}</span>
          </p>
          <div className="map">
            <div className="node on">Camp</div>
            <div className="node">Fork</div>
            <div className="node">Ruins</div>
            <div className="node">Den</div>
          </div>
          <div className="muted">(Placeholder node graph; next step will make this procedural + event-driven.)</div>
        </>
      )}
    </>
  );
}

function GearView(props: { player: Player | null }) {
  const p = props.player;
  return (
    <>
      <div className="h">Gear</div>
      {!p ? (
        <p className="p">No save.</p>
      ) : (
        <>
          <div className="muted">Inventory ({p.inventory.length})</div>
          <div className="list">
            {p.inventory.map((it) => (
              <div key={it.id} className="item">
                <div className="row">
                  <div className="strong">{it.name}</div>
                  <div className="tag">{it.rarity}</div>
                </div>
                <div className="muted small">
                  {it.slot} · req Lv.{it.levelReq} · +
                  {Object.entries(it.stats)
                    .map(([k, v]) => `${k}:${v}`)
                    .join('  ')}
                </div>
              </div>
            ))}
          </div>
          <div className="muted">(Next: equip/unequip, drops, shop, crafting, random affixes.)</div>
        </>
      )}
    </>
  );
}

function BattleView(props: { battle: BattleState | null; onAct: (a: PlayerAction) => void }) {
  const b = props.battle;
  return (
    <>
      <div className="h">Battle</div>
      {!b ? (
        <p className="p">No active battle.</p>
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
              Attack
            </button>
            <button className="btn" onClick={() => props.onAct('defend')} disabled={b.status !== 'inBattle'}>
              Defend
            </button>
            <button className="btn" onClick={() => props.onAct('escape')} disabled={b.status !== 'inBattle'}>
              Escape
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
