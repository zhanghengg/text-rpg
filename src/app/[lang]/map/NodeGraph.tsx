'use client';

import type { GeneratedMap } from '@/lib/world/world';

export function NodeGraph(props: {
  map: GeneratedMap;
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const { map, currentId, onSelect } = props;

  const nodes = Object.values(map.nodes);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  }

  const pad = 0.8;
  minX -= pad;
  maxX += pad;
  minY -= pad;
  maxY += pad;

  function x2px(x: number) {
    const w = 920;
    return ((x - minX) / Math.max(0.001, maxX - minX)) * w;
  }

  function y2px(y: number) {
    const h = 560;
    return ((y - minY) / Math.max(0.001, maxY - minY)) * h;
  }

  const edges: { a: string; b: string }[] = [];
  for (const n of nodes) {
    for (const to of n.to) {
      edges.push({ a: n.id, b: to });
    }
  }

  return (
    <div className="graph">
      <svg className="wires" viewBox="0 0 920 560" aria-hidden="true">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(112,246,255,0.35)" />
            <stop offset="1" stopColor="rgba(255,79,216,0.22)" />
          </linearGradient>
        </defs>
        {edges.map((e) => {
          const a = map.nodes[e.a];
          const b = map.nodes[e.b];
          if (!a || !b) return null;
          const x1 = x2px(a.x);
          const y1 = y2px(a.y);
          const x2 = x2px(b.x);
          const y2 = y2px(b.y);
          const dx = Math.max(30, Math.abs(x2 - x1) * 0.5);
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
          return (
            <path
              key={`${e.a}-${e.b}`}
              d={d}
              fill="none"
              stroke="url(#g)"
              strokeWidth={2}
              opacity={0.7}
            />
          );
        })}
      </svg>

      {nodes.map((n) => {
        const left = x2px(n.x);
        const top = y2px(n.y);
        const isOn = n.id === currentId;

        return (
          <button
            key={n.id}
            className={isOn ? 'node on' : 'node'}
            style={{ left, top }}
            onClick={() => onSelect(n.id)}
            title={`${n.label} (${n.type})`}
          >
            <span className="dot" />
            <span className="lbl">{n.label}</span>
          </button>
        );
      })}

      <style>{css}</style>
    </div>
  );
}

const css = String.raw`
  .graph {
    position: relative;
    width: 100%;
    height: 560px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.12);
    background: radial-gradient(900px 520px at 25% 20%, rgba(112,246,255,0.10), transparent 60%),
                radial-gradient(900px 520px at 80% 40%, rgba(255,79,216,0.08), transparent 62%),
                rgba(0,0,0,0.18);
    overflow: hidden;
  }

  .wires {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .node {
    position: absolute;
    transform: translate(-50%, -50%);
    display: inline-flex;
    gap: 8px;
    align-items: center;
    max-width: 220px;

    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.26);
    color: rgba(255,255,255,0.88);
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 900;

    transition: transform 160ms ease, background 160ms ease, border 160ms ease;
  }

  .node:hover {
    transform: translate(-50%, -52%);
    background: rgba(255,255,255,0.08);
  }

  .node.on {
    border-color: rgba(112,246,255,0.32);
    background: rgba(112,246,255,0.12);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: radial-gradient(circle at 30% 30%, rgba(112,246,255,0.9), rgba(112,246,255,0.0) 70%),
                radial-gradient(circle at 70% 40%, rgba(255,79,216,0.85), rgba(255,79,216,0.0) 72%),
                radial-gradient(circle at 50% 80%, rgba(255,211,110,0.85), rgba(255,211,110,0.0) 75%);
  }

  .lbl {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 920px) {
    .graph { height: 520px; }
  }
`;
