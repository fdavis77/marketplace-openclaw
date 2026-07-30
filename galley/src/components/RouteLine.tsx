interface Port {
  name: string;
  x: number;
  y: number;
}

const PORTS: Port[] = [
  { name: "Monaco", x: 40, y: 150 },
  { name: "Antibes", x: 220, y: 70 },
  { name: "Palma", x: 460, y: 130 },
];

// The signature motif: a plotted course, like a route marked on a nautical chart,
// tracing between real Mediterranean ports. Draws itself once on load.
export function RouteLine({ className = "" }: { className?: string }) {
  const pathD = PORTS.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      viewBox="0 0 500 220"
      className={className}
      role="img"
      aria-label="A plotted course connecting Monaco, Antibes, and Palma"
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-brass)"
        strokeWidth="2"
        strokeDasharray="6 6"
        opacity="0.35"
      />
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-brass)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1000}
        strokeDasharray="1000"
        strokeDashoffset="1000"
        className="motion-safe:animate-draw-route"
      />
      {PORTS.map((port) => (
        <g key={port.name}>
          <circle cx={port.x} cy={port.y} r="5" fill="var(--color-linen)" stroke="var(--color-brass)" strokeWidth="2" />
          <text
            x={port.x}
            y={port.y - 14}
            textAnchor="middle"
            className="font-display"
            fill="var(--color-linen)"
            fontSize="15"
            letterSpacing="0.5"
          >
            {port.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
