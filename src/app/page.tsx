import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="wrap">
      <div className="hero">
        <div className="badge">Mist Ring</div>
        <h1 className="h1">A turn-based text RPG about fog, steel, and bad decisions.</h1>
        <p className="p">
          Pick a job. Explore node maps. Fight monsters. Level up. Farm gear. Everything is saved locally in your
          browser.
        </p>

        <div className="cta">
          <Link className="btn primary" href="/game">
            Enter Game
          </Link>
          <a className="btn" href="https://github.com/zhanghengg/text-rpg" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>

        <div className="grid">
          <div className="card">
            <div className="k">Jobs</div>
            <div className="v">Guard · Ranger · Warlock · Cleric · Rogue · Scholar</div>
          </div>
          <div className="card">
            <div className="k">Maps</div>
            <div className="v">Borderlands · Mistwood · Old Mine · Rift Corridor</div>
          </div>
          <div className="card">
            <div className="k">Loop</div>
            <div className="v">Explore → Battle → Loot → Upgrade → Push deeper</div>
          </div>
        </div>

        <div className="foot">MVP2 foundation build: systems first, content next.</div>
      </div>

      <style>{css}</style>
    </div>
  );
}

const css = String.raw`
  :root {
    --bg0: #060712;
    --bg1: #0b0e23;
    --ink: rgba(255,255,255,0.92);
    --muted: rgba(255,255,255,0.70);
    --stroke: rgba(255,255,255,0.12);
    --a: #70f6ff;
    --b: #ff4fd8;
    --c: #ffd36e;
  }

  .wrap {
    min-height: 100vh;
    background:
      radial-gradient(1100px 700px at 20% 10%, rgba(112,246,255,0.16), transparent 55%),
      radial-gradient(1200px 800px at 80% 20%, rgba(255,79,216,0.13), transparent 58%),
      radial-gradient(900px 700px at 55% 95%, rgba(255,211,110,0.11), transparent 55%),
      linear-gradient(180deg, var(--bg0), var(--bg1));
    color: var(--ink);
    display: grid;
    place-items: center;
    padding: 28px 16px;
  }

  .hero {
    width: min(980px, 100%);
    border: 1px solid var(--stroke);
    background: rgba(255,255,255,0.04);
    border-radius: 22px;
    padding: clamp(18px, 4vw, 30px);
    box-shadow: 0 40px 120px rgba(0,0,0,0.45);
    backdrop-filter: blur(14px);
  }

  .badge {
    display: inline-flex;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.25);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 800;
    font-size: 12px;
  }

  .h1 {
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    letter-spacing: -0.03em;
    margin: 12px 0 10px;
    line-height: 1.08;
    font-weight: 900;
    font-size: clamp(34px, 4.4vw, 52px);
  }

  .p {
    margin: 0;
    max-width: 70ch;
    color: var(--muted);
    line-height: 1.75;
    font-size: 15px;
  }

  .cta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin: 18px 0 18px;
  }

  .btn {
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.22);
    color: rgba(255,255,255,0.88);
    border-radius: 999px;
    padding: 11px 14px;
    font-size: 13px;
    font-weight: 900;
    transition: transform 160ms ease, background 160ms ease;
  }

  .btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); }

  .primary {
    background: linear-gradient(90deg, rgba(112,246,255,0.24), rgba(255,79,216,0.18), rgba(255,211,110,0.16));
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 10px;
  }

  .card {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    border-radius: 18px;
    padding: 12px 12px;
  }

  .k {
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.64);
    margin-bottom: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }

  .v { color: rgba(255,255,255,0.86); font-size: 13px; line-height: 1.55; }

  .foot {
    margin-top: 14px;
    color: rgba(255,255,255,0.52);
    font-size: 12px;
  }

  @media (max-width: 860px) {
    .grid { grid-template-columns: 1fr; }
  }
`;
