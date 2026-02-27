'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Lang } from '@/lib/i18n/i18n';
import { getDict } from '@/lib/i18n/dict';
import { MAP_LABEL } from '@/lib/i18n/labels';
import type { Player } from '@/lib/types';

import { loadSave, writeSave } from '@/lib/save';
import { recalcPlayer } from '@/lib/game';
import { generateMap } from '@/lib/world/generate';
import type { MapNode, NodeType } from '@/lib/world/world';

import { NodeGraph } from './NodeGraph';
import { rollEvent, type WorldEvent } from '@/lib/events/events';
import { rollDrop } from '@/lib/loot/loot';

type Toast = { kind: 'good' | 'bad' | 'info'; text: string };

function nodeKindLabel(lang: Lang, t: ReturnType<typeof getDict>, type: NodeType) {
  if (lang === 'zh') {
    if (type === 'camp') return '营地';
    if (type === 'fight') return '战斗';
    if (type === 'event') return '事件';
    if (type === 'shop') return '商人';
    if (type === 'elite') return '精英';
    if (type === 'boss') return '首领';
    if (type === 'treasure') return '宝箱';
  }

  return type;
}

export function MapClient(props: { lang: Lang }) {
  const lang = props.lang;
  const t = getDict(lang);

  const [player, setPlayer] = useState<Player | null>(() => {
    const saved = loadSave();
    return saved ? recalcPlayer(saved) : null;
  });

  const [event, setEvent] = useState<WorldEvent | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (player) writeSave(player);
  }, [player]);

  const gen = useMemo(() => {
    if (!player) return null;
    return generateMap(player.world.seed, player.world.mapId, lang);
  }, [player, lang]);

  const current = useMemo(() => {
    if (!gen || !player) return null;
    return gen.map.nodes[player.world.nodeId] ?? null;
  }, [gen, player]);

  const exits = useMemo(() => {
    if (!gen || !current) return [] as MapNode[];
    return current.to.map((id) => gen.map.nodes[id]).filter(Boolean);
  }, [gen, current]);

  function applyWorldDelta(next: Player, delta: { gold?: number; hp?: number; fog?: number }) {
    const hp = Math.max(0, Math.min(next.derived.hpMax, next.hp + (delta.hp ?? 0)));
    return {
      ...next,
      hp,
      gold: next.gold + (delta.gold ?? 0),
      world: {
        ...next.world,
        fog: Math.max(0, next.world.fog + (delta.fog ?? 0)),
      },
    };
  }

  function moveTo(node: MapNode) {
    if (!player || !gen) return;
    setToast(null);
    setEvent(null);

    const next: Player = {
      ...player,
      world: {
        ...player.world,
        nodeId: node.id,
        fog: Math.max(0, player.world.fog + 1),
      },
    };

    // Unlock next map after beating each boss (progress is stored in save).
    if (node.type === 'boss') {
      const unlockOrder: Player['world']['mapId'][] = ['borderlands', 'mistwood', 'oldmine', 'riftcorridor'];
      const ix = Math.max(0, unlockOrder.indexOf(player.world.mapId));
      const nextMap = unlockOrder[Math.min(unlockOrder.length - 1, ix + 1)];
      if (nextMap && nextMap !== player.world.mapId) {
        next.world = {
          ...next.world,
          unlockedMaps: {
            ...(player.world.unlockedMaps ?? { borderlands: true }),
            [nextMap]: true,
          },
        };
        setToast({
          kind: 'good',
          text: lang === 'zh' ? `你已解锁新地图：${MAP_LABEL[lang][nextMap]}` : `New map unlocked: ${MAP_LABEL[lang][nextMap]}`,
        });
      }
    }

    // If player is at boss and chooses to move, automatically switch to the next unlocked map.
    if (player.world.nodeId === 'boss' && node.id === 'boss') {
      const unlocked = player.world.unlockedMaps ?? { borderlands: true };
      const order: Player['world']['mapId'][] = ['borderlands', 'mistwood', 'oldmine', 'riftcorridor'];
      const curIx = Math.max(0, order.indexOf(player.world.mapId));
      const target = order.slice(curIx + 1).find((m) => unlocked[m]);
      if (target) {
        const next2: Player = {
          ...next,
          world: {
            ...next.world,
            mapId: target,
            nodeId: 'camp',
            fog: 0,
          },
        };
        setPlayer(next2);
        return;
      }
    }

    if (node.type === 'event') {
      const ev = rollEvent(player.world.seed + Number(node.id.replace(/\D/g, '') || 0) + next.world.fog, lang);
      setPlayer(next);
      setEvent(ev);
      return;
    }

    if (node.type === 'treasure') {
      const drop = rollDrop(player.world.seed + next.world.fog * 97, player.level, player.job);
      const next2 = {
        ...next,
        inventory: [drop, ...next.inventory],
      };
      setPlayer(next2);
      setToast({ kind: 'good', text: lang === 'zh' ? `你找到装备：${drop.name}` : `Found gear: ${drop.name}` });
      return;
    }

    if (node.type === 'fight' || node.type === 'elite' || node.type === 'boss') {
      const battleSeed = player.world.seed + next.world.fog * 1337;
      const next2 = {
        ...next,
        world: {
          ...next.world,
          pendingBattleSeed: battleSeed,
        },
      };
      setPlayer(next2);
      setToast({
        kind: 'info',
        text:
          lang === 'zh'
            ? '遭遇敌人：点击右上角“游戏”进入战斗。'
            : 'Enemy encountered: use the “Game” button to start the fight.',
      });
      return;
    }

    setPlayer(next);
  }

  function choose(optionId: string) {
    if (!player || !event) return;
    const opt = event.options.find((o) => o.id === optionId);
    if (!opt) return;

    const next = applyWorldDelta(player, {
      gold: opt.outcome.goldDelta,
      hp: opt.outcome.hpDelta,
      fog: opt.outcome.fogDelta,
    });

    setPlayer(next);
    setToast({ kind: 'info', text: opt.outcome.text });
    setEvent(null);
  }

  if (!player) {
    return (
      <div className="wrap">
        <div className="panel">
          <div className="h">{lang === 'zh' ? '探索' : 'Explore'}</div>
          <p className="p">{lang === 'zh' ? '没有存档。请先去游戏页创建角色。' : 'No save found. Create a character in Game first.'}</p>
          <Link className="btn" href={`/${lang}/game`}>
            {t.nav.game}
          </Link>
        </div>
        <style>{css}</style>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <div className="title">{lang === 'zh' ? '探索' : 'Explore'}</div>
          <div className="sub">
            {t.status.map}: {MAP_LABEL[lang][player.world.mapId]} · {lang === 'zh' ? '雾值' : 'Fog'} {player.world.fog}
          </div>
        </div>
        <div className="topActions">
          <Link className="btn" href={`/${lang}/game`}>
            {t.nav.game}
          </Link>
          <Link className="btn" href={`/${lang}`}>
            {t.nav.home}
          </Link>
        </div>
      </header>

      <section className="mapbar">
        <div className="mapbarTitle">{lang === 'zh' ? '地图' : 'Maps'}</div>
        <div className="mapTabs">
          {(['borderlands', 'mistwood', 'oldmine', 'riftcorridor'] as Player['world']['mapId'][]).map((id) => {
            const unlocked = player.world.unlockedMaps ?? { borderlands: true };
            const ok = Boolean(unlocked[id]);
            const isOn = id === player.world.mapId;
            return (
              <button
                key={id}
                className={isOn ? 'tab on' : 'tab'}
                disabled={!ok}
                onClick={() => {
                  if (!ok) return;
                  if (id === player.world.mapId) return;
                  setToast(null);
                  setEvent(null);
                  setPlayer({
                    ...player,
                    world: {
                      ...player.world,
                      mapId: id,
                      nodeId: 'camp',
                      fog: 0,
                    },
                  });
                }}
                title={ok ? MAP_LABEL[lang][id] : lang === 'zh' ? '未解锁：击败上一张图首领后解锁' : 'Locked: beat the previous boss to unlock'}
              >
                <span className="tabName">{MAP_LABEL[lang][id]}</span>
                {!ok ? <span className="tabLock">{lang === 'zh' ? '未解锁' : 'Locked'}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="h">{lang === 'zh' ? '当前位置' : 'Current'}</div>
          <div className="nodeCard">
            <div className="row">
              <div className="strong">{current?.label ?? player.world.nodeId}</div>
              <div className="tag">{nodeKindLabel(lang, t, current?.type ?? 'event')}</div>
            </div>
            <div className="muted small">{lang === 'zh' ? '选择下一步移动，可能触发事件/战斗/宝箱。' : 'Pick your next step: event, battle, treasure.'}</div>
          </div>

          {toast ? <div className={`toast ${toast.kind}`}>{toast.text}</div> : null}

          {event ? (
            <div className="event">
              <div className="strong">{event.title}</div>
              <div className="p" style={{ marginTop: 8 }}>
                {event.body}
              </div>
              <div className="opts">
                {event.options.map((o) => (
                  <button key={o.id} className="btn" onClick={() => choose(o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="h" style={{ marginTop: 14 }}>
                {lang === 'zh' ? '可选路径' : 'Exits'}
              </div>
              <div className="exits">
                {exits.length === 0 ? (
                  <div className="muted">{lang === 'zh' ? '没有出口（可能到终点了）。' : 'No exits (end of path).'}</div>
                ) : (
                  exits.map((n) => (
                    <button key={n.id} className="exit" onClick={() => moveTo(n)}>
                      <div className="strong">{n.label}</div>
                      <div className="muted small">{nodeKindLabel(lang, t, n.type)}</div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="panel">
          <div className="h">{lang === 'zh' ? '节点图' : 'Node Graph'}</div>
          {gen ? (
            <NodeGraph map={gen.map} currentId={player.world.nodeId} onSelect={(id) => {
              const n = gen.map.nodes[id];
              if (!n) return;
              // Allow move only if reachable from current or it's the current node.
              const cur = gen.map.nodes[player.world.nodeId];
              const ok = id === player.world.nodeId || (cur?.to ?? []).includes(id);
              if (!ok) {
                setToast({ kind: 'bad', text: lang === 'zh' ? '不可达。请从当前节点选择下一步。' : 'Not reachable. Pick a connected exit.' });
                return;
              }
              moveTo(n);
            }} />
          ) : (
            <div className="muted">{lang === 'zh' ? '地图加载中…' : 'Loading…'}</div>
          )}
          <div className="muted small" style={{ marginTop: 10 }}>
            {lang === 'zh' ? '点击相连节点移动（仅允许从当前节点走一步）。' : 'Click a connected node to move (one step from current).'}
          </div>
        </div>
      </section>

      <style>{css}</style>
    </div>
  );
}

const css = String.raw`
  .wrap {
    width: min(1100px, 100%);
    margin: 0 auto;
    padding: 28px 16px 40px;
    color: rgba(255,255,255,0.92);
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-end;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .title {
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    font-weight: 900;
    letter-spacing: -0.02em;
    font-size: 22px;
  }

  .sub {
    color: rgba(255,255,255,0.64);
    font-size: 13px;
    margin-top: 3px;
  }

  .topActions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .mapbar {
    margin: 12px 0 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    border-radius: 18px;
    box-shadow: 0 30px 90px rgba(0,0,0,0.22);
    backdrop-filter: blur(14px);
    padding: 12px;
  }

  .mapbarTitle {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 12px;
    color: rgba(255,255,255,0.72);
    margin-bottom: 10px;
  }

  .mapTabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.18);
    color: rgba(255,255,255,0.88);
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 900;
    transition: transform 160ms ease, background 160ms ease, border 160ms ease;
  }

  .tab:hover { transform: translateY(-1px); background: rgba(255,255,255,0.07); }

  .tab.on {
    border-color: rgba(112,246,255,0.32);
    background: rgba(112,246,255,0.10);
  }

  .tab:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .tabLock {
    font-size: 11px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.62);
    background: rgba(0,0,0,0.14);
  }

  .grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
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

  .h {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 12px;
    color: rgba(255,255,255,0.72);
    margin-bottom: 10px;
  }

  .p { margin: 0; line-height: 1.7; color: rgba(255,255,255,0.82); font-size: 14px; }
  .muted { color: rgba(255,255,255,0.64); }
  .small { font-size: 12px; }
  .strong { font-weight: 900; }

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

  .nodeCard {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    border-radius: 16px;
    padding: 12px;
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

  .exits { display: grid; gap: 10px; }

  .exit {
    text-align: left;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.18);
    padding: 12px;
    transition: transform 160ms ease, background 160ms ease;
  }

  .exit:hover { transform: translateY(-1px); background: rgba(255,255,255,0.07); }

  .toast {
    margin-top: 10px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.22);
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.6;
  }

  .toast.good { border-color: rgba(112,246,255,0.22); }
  .toast.bad { border-color: rgba(255,110,110,0.22); }

  .event {
    margin-top: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.18);
    border-radius: 16px;
    padding: 12px;
  }

  .opts { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }


  @media (max-width: 920px) {
    .grid { grid-template-columns: 1fr; }
  }
`;
