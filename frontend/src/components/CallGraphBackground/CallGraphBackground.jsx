import './CallGraphBackground.css';

const STRIPE_COLORS = {
  test: 'rgba(22, 163, 74, 0.55)',
  dead: 'rgba(244, 63, 94, 0.5)',
  leaf: 'rgba(217, 119, 6, 0.55)',
};

// Each node has a deliberately varied silhouette: different widths, heights,
// line counts, pill counts, optional accent stripe (green test / rose dead /
// amber leaf), and optional active glow. This kills the "templated card"
// monotone feel.
const NODES = [
  { id: 'a', x: 30,   y: 60,  w: 150, h: 56, lines: 2, pills: 2, stripe: null,   active: 0 },
  { id: 'b', x: 60,   y: 230, w: 160, h: 62, lines: 2, pills: 3, stripe: null,   active: 1 },
  { id: 'c', x: 10,   y: 410, w: 128, h: 42, lines: 1, pills: 0, stripe: 'leaf', active: 0 },
  { id: 'd', x: 90,   y: 580, w: 140, h: 52, lines: 2, pills: 1, stripe: null,   active: 0 },

  { id: 'e', x: 230,  y: 30,  w: 145, h: 50, lines: 2, pills: 2, stripe: 'test', active: 0 },
  { id: 'f', x: 200,  y: 170, w: 118, h: 40, lines: 1, pills: 0, stripe: null,   active: 0 },
  { id: 'g', x: 280,  y: 340, w: 168, h: 64, lines: 2, pills: 3, stripe: null,   active: 0 },
  { id: 'h', x: 240,  y: 530, w: 134, h: 48, lines: 1, pills: 1, stripe: 'dead', active: 0 },

  { id: 'i', x: 440,  y: 90,  w: 155, h: 58, lines: 2, pills: 2, stripe: null,   active: 2 },
  { id: 'j', x: 470,  y: 240, w: 150, h: 56, lines: 2, pills: 2, stripe: null,   active: 0 },
  { id: 'k', x: 410,  y: 400, w: 122, h: 42, lines: 1, pills: 0, stripe: null,   active: 0 },
  { id: 'l', x: 480,  y: 580, w: 142, h: 52, lines: 2, pills: 1, stripe: 'test', active: 0 },

  { id: 'm', x: 660,  y: 50,  w: 130, h: 46, lines: 1, pills: 1, stripe: null,   active: 0 },
  { id: 'n', x: 690,  y: 200, w: 165, h: 60, lines: 2, pills: 3, stripe: null,   active: 0 },
  { id: 'o', x: 640,  y: 360, w: 146, h: 52, lines: 2, pills: 2, stripe: 'leaf', active: 0 },
  { id: 'p', x: 700,  y: 540, w: 140, h: 50, lines: 2, pills: 2, stripe: null,   active: 0 },

  { id: 'q', x: 880,  y: 130, w: 132, h: 46, lines: 1, pills: 0, stripe: null,   active: 0 },
  { id: 'r', x: 910,  y: 290, w: 160, h: 62, lines: 2, pills: 3, stripe: null,   active: 3 },
  { id: 's', x: 870,  y: 460, w: 145, h: 52, lines: 2, pills: 1, stripe: 'dead', active: 0 },

  { id: 't', x: 1100, y: 200, w: 140, h: 50, lines: 2, pills: 2, stripe: null,   active: 0 },
  { id: 'u', x: 1080, y: 410, w: 126, h: 42, lines: 1, pills: 0, stripe: 'test', active: 0 },
];

const EDGES = [
  { from: 'a', to: 'e' },                  { from: 'a', to: 'f' },
  { from: 'b', to: 'f', pulse: 1 },        { from: 'b', to: 'g' },
  { from: 'c', to: 'g' },                  { from: 'c', to: 'h' },
  { from: 'd', to: 'h', dashed: true },

  { from: 'e', to: 'i' },                  { from: 'f', to: 'i', pulse: 2 },
  { from: 'f', to: 'j' },                  { from: 'g', to: 'j' },
  { from: 'g', to: 'k', dashed: true },    { from: 'h', to: 'k' },
  { from: 'h', to: 'l' },

  { from: 'i', to: 'm' },                  { from: 'i', to: 'n' },
  { from: 'j', to: 'n' },                  { from: 'j', to: 'o' },
  { from: 'k', to: 'o', dashed: true },    { from: 'k', to: 'p' },
  { from: 'l', to: 'p' },

  { from: 'm', to: 'q' },                  { from: 'n', to: 'q' },
  { from: 'n', to: 'r', pulse: 3 },        { from: 'o', to: 'r' },
  { from: 'o', to: 's' },                  { from: 'p', to: 's' },

  { from: 'q', to: 't' },                  { from: 'r', to: 't' },
  { from: 'r', to: 'u' },                  { from: 's', to: 'u', dashed: true },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

function pathFor(edge) {
  const a = NODE_BY_ID[edge.from];
  const b = NODE_BY_ID[edge.to];
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x;
  const y2 = b.y + b.h / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

function Card({ x, y, w, h, active, lines, pills, stripe }) {
  const cardCls = active
    ? `cg-bg-card cg-bg-card--active cg-bg-card--active-${active}`
    : 'cg-bg-card';

  // Compact (lines=1) cards skip the "file path" label and center the function line vertically.
  const fnLineY = lines === 1 ? y + h / 2 - 2.5 : y + 22;
  const fileLineW = Math.min(72, w - 44);
  const fnLineW = Math.min(124, w - 24);
  const subLineW = Math.min(82, w - 32);
  const pillY = y + h - 13;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} className={cardCls} />
      {stripe && (
        <rect
          x={x}
          y={y + 0.5}
          width={3.5}
          height={h - 1}
          rx={1.5}
          fill={STRIPE_COLORS[stripe]}
        />
      )}
      <circle cx={x + 11} cy={y + 13} r={3} className="cg-bg-card-dot" />
      {lines === 2 && (
        <rect x={x + 20} y={y + 9} width={fileLineW} height={3} rx={1.5} className="cg-bg-card-line--soft" />
      )}
      <rect x={x + 11} y={fnLineY} width={fnLineW} height={5} rx={2} className="cg-bg-card-line" />
      {lines === 2 && (
        <rect x={x + 11} y={y + 33} width={subLineW} height={3.5} rx={1.5} className="cg-bg-card-line--soft" />
      )}
      {pills >= 1 && <rect x={x + 11} y={pillY} width={26} height={7} rx={2} className="cg-bg-card-line--soft" />}
      {pills >= 2 && <rect x={x + 41} y={pillY} width={20} height={7} rx={2} className="cg-bg-card-line--soft" />}
      {pills >= 3 && <rect x={x + 65} y={pillY} width={16} height={7} rx={2} className="cg-bg-card-line--soft" />}
    </g>
  );
}

export default function CallGraphBackground() {
  return (
    <div className="cg-bg-wrap" aria-hidden="true">
      <svg
        className="cg-bg-svg"
        viewBox="0 0 1260 700"
        preserveAspectRatio="xMidYMid slice"
      >
        {EDGES.map((e, i) => {
          let cls = 'cg-bg-edge';
          if (e.dashed) cls += ' cg-bg-edge--dashed';
          if (e.pulse) cls += ` cg-bg-edge--pulse cg-bg-edge--pulse-${e.pulse}`;
          return <path key={`e-${i}`} d={pathFor(e)} className={cls} />;
        })}

        {NODES.map((n) => <Card key={n.id} {...n} />)}
      </svg>
    </div>
  );
}
