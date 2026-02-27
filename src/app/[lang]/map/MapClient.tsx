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
          <div className="h">{lang === 'zh' ? '地图概览' : 'Map Overview'}</div>
          <div className="mini">
            {(gen ? Object.values(gen.map.nodes) : []).slice(0, 18).map((n) => (
              <div key={n.id} className={n.id === player.world.nodeId ? 'miniNode on' : 'miniNode'}>
                <div className="miniTop">
                  <span className="miniId">{n.id}</span>
                  <span className="miniTag">{n.type}</span>
                </div>
                <div className="miniLabel">{n.label}</div>
              </div>
            ))}
          </div>
          <div className="muted small" style={{ marginTop: 10 }}>
            {lang === 'zh'
              ? '（临时概览：下一步会做成真正的节点图与可视化连线。）'
              : '(Temporary overview: next step will draw a proper node graph.)'}
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

  .mini {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .miniNode {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    padding: 10px;
  }

  .miniNode.on { border-color: rgba(112,246,255,0.22); background: rgba(112,246,255,0.06); }

  .miniTop { display: flex; justify-content: space-between; gap: 10px; }
  .miniId { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 12px; }
  .miniTag { font-size: 11px; color: rgba(255,255,255,0.64); }
  .miniLabel { margin-top: 6px; font-weight: 800; font-size: 13px; }

  @media (max-width: 920px) {
    .grid { grid-template-columns: 1fr; }
  }
`;
