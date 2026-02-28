'use client';

import Link from 'next/link';
import { useEffect, useMemo, useReducer, useRef } from 'react';

import type { Lang } from '@/lib/i18n/i18n';
import { isLang } from '@/lib/i18n/i18n';

import { clearRpg, loadRpg, saveRpg } from '@/lib/rpg/storage';
import { initialRuntime, step } from '@/lib/rpg/reducer';
import type { RpgRuntime } from '@/lib/rpg/reducer';
import type { Action } from '@/lib/rpg/state';

function fmtJobZh(jobId: string) {
  if (jobId === 'guard') return '战士';
  if (jobId === 'ranger') return '游侠';
  if (jobId === 'warlock') return '术士';
  if (jobId === 'cleric') return '牧师';
  if (jobId === 'rogue') return '盗贼';
  if (jobId === 'scholar') return '学者';
  return jobId;
}

function rarityZh(r: string) {
  if (r === 'common') return '白';
  if (r === 'uncommon') return '绿';
  if (r === 'rare') return '蓝';
  if (r === 'epic') return '紫';
  return r;
}

function rarityColor(r: string) {
  if (r === 'uncommon') return '#43d18c';
  if (r === 'rare') return '#4aa6ff';
  if (r === 'epic') return '#d082ff';
  return 'rgba(255,255,255,0.78)';
}

function elementZh(e: string) {
  if (e === 'water') return '水';
  if (e === 'wind') return '风';
  if (e === 'fire') return '火';
  if (e === 'wood') return '木';
  return e;
}

function slotZh(s: string) {
  if (s === 'weapon') return '武器';
  if (s === 'armor') return '护甲';
  if (s === 'accessory') return '饰品';
  return s;
}

export function RpgClient(props: { lang: Lang }) {
  const lang = props.lang;

  const [rt, dispatch] = useReducer(
    step as unknown as (s: RpgRuntime, a: Action) => RpgRuntime,
    undefined as unknown as RpgRuntime,
    () => {
      const loaded = loadRpg();
      return loaded ?? initialRuntime();
    },
  );

  useEffect(() => {
    saveRpg(rt);
  }, [rt]);

  const logEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end' });
  }, [rt.logs.length]);

  const save = rt.save;

  const statusLine = useMemo(() => {
    const loc =
      save.mode === 'CAMP'
        ? '营地'
        : `${
            save.mapId === 'breeze_plains'
              ? '微风平原'
              : save.mapId === 'whispering_forest'
                ? '絮语森林'
                : save.mapId === 'ember_caverns'
                  ? '余烬洞窟'
                  : '荒野'
          } (${save.pos.x},${save.pos.y})`;
    return loc;
  }, [save.mode, save.mapId, save.pos.x, save.pos.y]);

  function newGame() {
    const name = window.prompt('给你的冒险者起个名字：', '冒险者') ?? '冒险者';
    const raw = window.prompt(
      '选择职业ID：\n- guard 战士\n- ranger 游侠\n- warlock 术士\n- cleric 牧师\n- rogue 盗贼\n- scholar 学者',
      'guard',
    );

    const jobId = (raw === 'guard' || raw === 'ranger' || raw === 'warlock' || raw === 'cleric' || raw === 'rogue' || raw === 'scholar'
      ? raw
      : 'guard');

    dispatch({ type: 'NEW_GAME', name, jobId, seed: Math.floor(Date.now() / 1000) });
  }

  function delSave() {
    if (!window.confirm('确定删除存档？')) return;
    clearRpg();
    window.location.reload();
  }

  const actions = useMemo(() => {
    if (save.mode === 'CAMP') {
      return (
        <>
          <button className="btn" onClick={() => dispatch({ type: 'CAMP_REST' })}>
            休息
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'CAMP_OPEN_SHOP' })}>
            商店
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'CAMP_START_EXPLORE', mapId: 'breeze_plains' })}>
            出城探索（微风平原）
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'CAMP_START_EXPLORE', mapId: 'whispering_forest' })}>
            出城探索（絮语森林）
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'CAMP_START_EXPLORE', mapId: 'ember_caverns' })}>
            出城探索（余烬洞窟）
          </button>
        </>
      );
    }

    if (save.mode === 'SHOP') {
      return (
        <>
          <button className="btn" onClick={() => dispatch({ type: 'SHOP_LEAVE' })}>
            返回营地
          </button>
        </>
      );
    }

    if (save.mode === 'EXPLORING') {
      return (
        <>
          <button className="btn" onClick={() => dispatch({ type: 'MOVE', dir: 'N' })}>
            向北 (N)
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'MOVE', dir: 'S' })}>
            向南 (S)
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'MOVE', dir: 'W' })}>
            向西 (W)
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'MOVE', dir: 'E' })}>
            向东 (E)
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'SET_MODE', mode: 'CAMP' })}>
            返回营地
          </button>
        </>
      );
    }

    return (
      <>
        <button className="btn" onClick={() => dispatch({ type: 'COMBAT_ATTACK' })}>
          普通攻击
        </button>
        <button className="btn" onClick={() => dispatch({ type: 'USE_POTION', potionId: 'potion_small' })}>
          使用血瓶
        </button>
        <button className="btn" onClick={() => dispatch({ type: 'USE_POTION', potionId: 'potion_mana' })}>
          使用蓝瓶
        </button>
        <button className="btn" onClick={() => dispatch({ type: 'COMBAT_ESCAPE' })}>
          逃跑
        </button>
      </>
    );
  }, [save.mode]);

  return (
    <div className="wrap">
      <header className="status">
        <div className="left">
          <div className="name">
            {save.name} <span className="muted">({fmtJobZh(save.jobId)})</span>
          </div>
          <div className="meta">
            Lv.{save.level} · EXP {save.exp}/{save.expToNext} · 位置：{statusLine}
          </div>
        </div>
        <div className="right">
          <div className="hp">HP {save.hp}/{save.hpMax}</div>
          <div className="mp">MP {save.mp}/{save.mpMax}</div>
          <div className="gold">金币 {save.gold}</div>
        </div>
      </header>

      <section className="grid">
        <div className="log">
          {rt.logs.map((e) => (
            <div key={e.id} className="line">
              {e.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        <aside className="inv">
          <div className="h">装备</div>
          <div className="muted small">
            武器：{save.equipment.weapon ? (
              <>
                {save.equipment.weapon.name}{' '}
                <button className="mini" onClick={() => dispatch({ type: 'UNEQUIP_GEAR', slot: 'weapon' })}>
                  卸下
                </button>
              </>
            ) : (
              '无'
            )}
            <br />
            护甲：{save.equipment.armor ? (
              <>
                {save.equipment.armor.name}{' '}
                <button className="mini" onClick={() => dispatch({ type: 'UNEQUIP_GEAR', slot: 'armor' })}>
                  卸下
                </button>
              </>
            ) : (
              '无'
            )}
            <br />
            饰品：{save.equipment.accessory ? (
              <>
                {save.equipment.accessory.name}{' '}
                <button className="mini" onClick={() => dispatch({ type: 'UNEQUIP_GEAR', slot: 'accessory' })}>
                  卸下
                </button>
              </>
            ) : (
              '无'
            )}
          </div>

          <div className="hr" />

          <div className="h">背包</div>
          {save.inventory.length === 0 ? <div className="muted">空</div> : null}
          {save.inventory.map((it) => (
            <div key={it.id} className="it">
              <div className="row">
                <div className="strong">{it.name}</div>
                <div className="muted">{'qty' in it && it.qty ? `x${it.qty}` : ''}</div>
              </div>
              <div className="muted small">
                {it.kind === 'gear' ? (
                  <>
                    <span className="tag" style={{ color: rarityColor(it.rarity) }}>
                      {rarityZh(it.rarity)}
                    </span>
                    <span className="tag">{slotZh(it.slot)}</span>
                    {it.element ? <span className="tag">元素 {elementZh(it.element)}</span> : null}
                    <span className="tag">战力 P{it.power}</span>
                    <span className="aff">
                      {it.affixes.length
                        ? it.affixes.map((a) => `${a.nameZh}+${a.value}`).join(' · ')
                        : '无词缀'}
                    </span>
                  </>
                ) : (
                  it.kind
                )}
              </div>
              {save.mode === 'SHOP' ? (
                <button className="mini" onClick={() => dispatch({ type: 'SHOP_SELL', itemId: it.id })}>
                  出售
                </button>
              ) : it.kind === 'gear' ? (
                <button className="mini" onClick={() => dispatch({ type: 'EQUIP_GEAR', itemId: it.id })}>
                  穿戴
                </button>
              ) : null}
            </div>
          ))}

          {save.mode === 'SHOP' ? (
            <>
              <div className="hr" />
              <div className="h">商店货架</div>
              <div className="muted small">买药水；也可以把背包物品卖掉换金币。</div>
              <div className="shop">
                <button className="shopItem" onClick={() => dispatch({ type: 'SHOP_BUY', itemId: 'potion_small' })}>
                  小型血瓶 (18g)
                </button>
                <button className="shopItem" onClick={() => dispatch({ type: 'SHOP_BUY', itemId: 'potion_mana' })}>
                  小型蓝瓶 (18g)
                </button>
                <button className="shopItem" onClick={() => dispatch({ type: 'SHOP_BUY', itemId: 'potion_big' })}>
                  中型血瓶 (45g)
                </button>
              </div>
            </>
          ) : null}

          <div className="hr" />

          <div className="h">系统</div>
          <div className="btnRow">
            <button className="btn" onClick={newGame}>
              新建角色
            </button>
            <button className="btn" onClick={delSave}>
              删除存档
            </button>
            <Link className="btn" href={`/${isLang(lang) ? lang : 'zh'}`}>
              返回首页
            </Link>
          </div>
        </aside>
      </section>

      <footer className="actions">{actions}</footer>

      <style>{css}</style>
    </div>
  );
}

const css = String.raw`
  .wrap {
    width: min(1200px, 100%);
    margin: 0 auto;
    padding: 18px 14px 20px;
  }

  .status {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.22);
    border-radius: 16px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .name { font-weight: 900; letter-spacing: -0.01em; }
  .meta { color: rgba(255,255,255,0.68); font-size: 13px; margin-top: 4px; }

  .right { display: grid; gap: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }

  .grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 12px;
    margin-top: 12px;
  }

  .log {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    border-radius: 16px;
    padding: 12px;
    height: 520px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 13px;
    line-height: 1.55;
  }

  .line { padding: 3px 0; color: rgba(255,255,255,0.84); }

  .inv {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    border-radius: 16px;
    padding: 12px;
    height: 520px;
    overflow: auto;
  }

  .h {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 12px;
    color: rgba(255,255,255,0.72);
    margin-bottom: 10px;
  }

  .it {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    padding: 10px;
    margin-bottom: 10px;
  }

  .mini {
    margin-top: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.22);
    color: rgba(255,255,255,0.86);
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 900;
  }

  .shop { display: grid; gap: 10px; margin-top: 10px; }

  .shopItem {
    text-align: left;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    padding: 10px;
    font-weight: 900;
    color: rgba(255,255,255,0.88);
  }

  .row { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
  .strong { font-weight: 900; }
  .muted { color: rgba(255,255,255,0.64); }
  .small { font-size: 12px; }

  .hr { height: 1px; background: rgba(255,255,255,0.10); margin: 12px 0; }

  .tag {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.24);
    margin-right: 6px;
    margin-top: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .aff {
    display: inline-block;
    margin-top: 6px;
    color: rgba(255,255,255,0.70);
  }

  .actions {
    margin-top: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    border-radius: 16px;
    padding: 12px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.22);
    color: rgba(255,255,255,0.88);
    border-radius: 999px;
    padding: 9px 12px;
    font-size: 13px;
    font-weight: 800;
    transition: transform 160ms ease, background 160ms ease;
  }

  .btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); }

  .btnRow { display: grid; gap: 10px; }

  @media (max-width: 920px) {
    .grid { grid-template-columns: 1fr; }
    .log { height: 420px; }
    .inv { height: auto; }
  }
`;
