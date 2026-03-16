import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

// ─── Defs: gradients & filters shared across SVG elements ───────────────────

const SvgDefs: React.FC = () => (
  <defs>
    {/* Porcupine body fur */}
    <radialGradient id="bodyFur" cx="45%" cy="35%" r="65%">
      <stop offset="0%" stopColor="#6b4c18" />
      <stop offset="40%" stopColor="#3d2810" />
      <stop offset="100%" stopColor="#1e1408" />
    </radialGradient>

    {/* Head fur */}
    <radialGradient id="headFur" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stopColor="#7a5820" />
      <stop offset="50%" stopColor="#4a3010" />
      <stop offset="100%" stopColor="#2a1c08" />
    </radialGradient>

    {/* Belly/underside */}
    <linearGradient id="belly" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#5a4015" />
      <stop offset="100%" stopColor="#2d1e08" />
    </linearGradient>

    {/* Quill gradient — white tip, dark band, cream base */}
    <linearGradient id="quillGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stopColor="#c8a050" />
      <stop offset="30%" stopColor="#2a1c08" />
      <stop offset="55%" stopColor="#2a1c08" />
      <stop offset="60%" stopColor="#e8dfc0" />
      <stop offset="100%" stopColor="#f5f0e0" />
    </linearGradient>

    <linearGradient id="quillGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stopColor="#b89040" />
      <stop offset="25%" stopColor="#1a1008" />
      <stop offset="50%" stopColor="#1a1008" />
      <stop offset="55%" stopColor="#d8cfa8" />
      <stop offset="100%" stopColor="#ece8d8" />
    </linearGradient>

    {/* Ground texture */}
    <radialGradient id="groundGrad" cx="50%" cy="0%" r="80%">
      <stop offset="0%" stopColor="#4a6e30" />
      <stop offset="60%" stopColor="#2d4a1e" />
      <stop offset="100%" stopColor="#1a2e12" />
    </radialGradient>

    {/* Dappled light on ground */}
    <radialGradient id="dapple1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(220,200,120,0.18)" />
      <stop offset="100%" stopColor="rgba(220,200,120,0)" />
    </radialGradient>
    <radialGradient id="dapple2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(200,220,130,0.12)" />
      <stop offset="100%" stopColor="rgba(200,220,130,0)" />
    </radialGradient>

    {/* Atmospheric mist */}
    <linearGradient id="mistGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="rgba(160,190,160,0)" />
      <stop offset="60%" stopColor="rgba(160,190,160,0.22)" />
      <stop offset="100%" stopColor="rgba(160,190,160,0.08)" />
    </linearGradient>

    {/* Nose */}
    <radialGradient id="noseGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stopColor="#3a2810" />
      <stop offset="100%" stopColor="#0d0806" />
    </radialGradient>

    {/* Drop shadow filter */}
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#0a0a05" floodOpacity="0.5" />
    </filter>

    {/* Soft glow for sun */}
    <filter id="sunGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Tree shadow filter */}
    <filter id="treeShadow">
      <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#050e03" floodOpacity="0.6" />
    </filter>
  </defs>
);

// ─── Sky & atmospheric background ───────────────────────────────────────────

const Sky: React.FC<{ frame: number }> = ({ frame }) => {
  const lightShift = interpolate(frame, [0, 220], [0, 8], { extrapolateRight: "clamp" });
  return (
    <>
      {/* Base sky — deep forest canopy */}
      <rect
        x={0} y={0} width={1080} height={608}
        fill={`hsl(140, 35%, ${12 + lightShift}%)`}
      />
      {/* Canopy gradient overlay */}
      <rect
        x={0} y={0} width={1080} height={380}
        fill="rgba(15,30,12,0.55)"
      />
    </>
  );
};

// ─── Sun / light source ──────────────────────────────────────────────────────

const Sun: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const pulse = interpolate(Math.sin(frame / 80), [-1, 1], [0.9, 1.05]);
  return (
    <g opacity={appear * 0.7} transform={`scale(${pulse})`} style={{ transformOrigin: "780px 70px" }}>
      {/* Outer glow */}
      <circle cx={780} cy={70} r={90} fill="rgba(255,200,60,0.08)" />
      <circle cx={780} cy={70} r={60} fill="rgba(255,215,80,0.14)" />
      {/* Sun disk */}
      <circle cx={780} cy={70} r={36} fill="#ffe060" filter="url(#sunGlow)" />
    </g>
  );
};

// ─── God rays ────────────────────────────────────────────────────────────────

const GodRays: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 30, 180, 220], [0, 0.18, 0.18, 0.08], {
    extrapolateRight: "clamp",
  });
  const rays = [
    { x1: 770, x2: 200, width: 60 },
    { x1: 780, x2: 450, width: 40 },
    { x1: 785, x2: 620, width: 30 },
    { x1: 790, x2: 700, width: 50 },
    { x1: 775, x2: 900, width: 35 },
    { x1: 800, x2: 1050, width: 45 },
  ];
  return (
    <g opacity={opacity}>
      {rays.map((r, i) => (
        <polygon
          key={i}
          points={`${r.x1 - r.width / 4},70 ${r.x1 + r.width / 4},70 ${r.x2 + r.width},608 ${r.x2 - r.width},608`}
          fill="rgba(240,220,100,0.12)"
        />
      ))}
    </g>
  );
};

// ─── Background trees (far — desaturated, hazy) ──────────────────────────────

const BackgroundTrees: React.FC<{ frame: number }> = ({ frame }) => {
  const sway = Math.sin(frame / 90) * 1.5;
  const trees = [
    { x: 30,  h: 420, w: 24, crown: 110 },
    { x: 140, h: 380, w: 20, crown: 95 },
    { x: 280, h: 450, w: 26, crown: 120 },
    { x: 420, h: 360, w: 18, crown: 90 },
    { x: 540, h: 430, w: 22, crown: 108 },
    { x: 660, h: 400, w: 20, crown: 100 },
    { x: 790, h: 460, w: 28, crown: 125 },
    { x: 920, h: 390, w: 22, crown: 98 },
    { x: 1020, h: 420, w: 24, crown: 112 },
  ];
  return (
    <g opacity={0.55} style={{ filter: "blur(1.5px)" }}>
      {trees.map((t, i) => {
        const sw = Math.sin(frame / 90 + i * 0.8) * 1.2;
        const groundY = 608 - 160;
        return (
          <g key={i} transform={`rotate(${sw}, ${t.x}, ${groundY})`}>
            {/* Trunk */}
            <rect
              x={t.x - t.w / 2} y={groundY - t.h}
              width={t.w} height={t.h}
              fill="#2a1c08"
              rx={3}
            />
            {/* Crown — layered ovals for depth */}
            <ellipse
              cx={t.x} cy={groundY - t.h - t.crown * 0.3}
              rx={t.crown * 0.6} ry={t.crown * 0.8}
              fill="#1e3a18"
            />
            <ellipse
              cx={t.x - t.crown * 0.15} cy={groundY - t.h - t.crown * 0.1}
              rx={t.crown * 0.45} ry={t.crown * 0.6}
              fill="#16300f"
            />
          </g>
        );
      })}
    </g>
  );
};

// ─── Midground trees ─────────────────────────────────────────────────────────

const MidTrees: React.FC<{ frame: number }> = ({ frame }) => {
  const trees = [
    { x: -20, h: 500, w: 44, crown: 160 },
    { x: 170, h: 460, w: 36, crown: 145 },
    { x: 360, h: 520, w: 48, crown: 170 },
    { x: 700, h: 490, w: 42, crown: 158 },
    { x: 870, h: 510, w: 46, crown: 165 },
    { x: 1040, h: 470, w: 38, crown: 150 },
  ];
  const groundY = 608 - 160;
  return (
    <g filter="url(#treeShadow)">
      {trees.map((t, i) => {
        const sw = Math.sin(frame / 70 + i * 1.1) * 2.5;
        return (
          <g key={i} transform={`rotate(${sw}, ${t.x}, ${groundY})`}>
            {/* Trunk with texture */}
            <rect
              x={t.x - t.w / 2} y={groundY - t.h}
              width={t.w} height={t.h}
              fill="#1e1408" rx={5}
            />
            {/* Bark highlights */}
            <rect
              x={t.x - t.w / 2 + 6} y={groundY - t.h + 20}
              width={5} height={t.h - 40}
              fill="rgba(100,70,20,0.3)" rx={2}
            />
            {/* Crown layers */}
            <ellipse
              cx={t.x} cy={groundY - t.h - t.crown * 0.2}
              rx={t.crown * 0.65} ry={t.crown * 0.85}
              fill="#1a4020"
            />
            <ellipse
              cx={t.x + t.crown * 0.1} cy={groundY - t.h}
              rx={t.crown * 0.5} ry={t.crown * 0.65}
              fill="#143518"
            />
            <ellipse
              cx={t.x - t.crown * 0.2} cy={groundY - t.h + t.crown * 0.1}
              rx={t.crown * 0.4} ry={t.crown * 0.5}
              fill="#0f2a12"
            />
          </g>
        );
      })}
    </g>
  );
};

// ─── Ground & forest floor ───────────────────────────────────────────────────

const Ground: React.FC<{ frame: number }> = ({ frame }) => {
  // Dappled light patches drift slowly
  const driftX = interpolate(frame, [0, 220], [0, 15]);
  return (
    <>
      {/* Main ground plane */}
      <ellipse cx={540} cy={490} rx={600} ry={130} fill="url(#groundGrad)" />
      <rect x={0} y={490} width={1080} height={120} fill="#1a2e12" />

      {/* Moss / ground cover detail */}
      {[60, 180, 320, 460, 590, 710, 840, 970].map((x, i) => (
        <ellipse
          key={i}
          cx={x + Math.sin(i * 3) * 12}
          cy={468 + Math.sin(i * 5) * 6}
          rx={55 + Math.sin(i * 2) * 15}
          ry={12 + Math.sin(i * 4) * 4}
          fill={i % 2 === 0 ? "#2d5020" : "#243d1a"}
          opacity={0.8}
        />
      ))}

      {/* Leaf litter */}
      {Array.from({ length: 18 }, (_, i) => (
        <ellipse
          key={i}
          cx={(i * 67 + 30) % 1080}
          cy={472 + Math.sin(i * 7) * 8}
          rx={8 + Math.sin(i * 3) * 4}
          ry={4 + Math.sin(i * 5) * 2}
          fill={["#5a3a10", "#4a6820", "#3d2808", "#6b4a15"][i % 4]}
          opacity={0.65}
          transform={`rotate(${i * 23}, ${(i * 67 + 30) % 1080}, ${472 + Math.sin(i * 7) * 8})`}
        />
      ))}

      {/* Dappled light on ground */}
      <ellipse cx={280 + driftX} cy={475} rx={90} ry={30} fill="url(#dapple1)" />
      <ellipse cx={580 + driftX * 0.7} cy={482} rx={70} ry={22} fill="url(#dapple2)" />
      <ellipse cx={820 + driftX * 1.2} cy={470} rx={80} ry={25} fill="url(#dapple1)" />
    </>
  );
};

// ─── Foreground grass blades ─────────────────────────────────────────────────

const Grass: React.FC<{ frame: number }> = ({ frame }) => {
  const blades = Array.from({ length: 40 }, (_, i) => ({
    x: i * 28 + Math.sin(i * 7.3) * 8,
    h: 18 + Math.sin(i * 2.1) * 9,
    w: 4 + (i % 3),
    color: ["#4a8c38", "#3a7028", "#558840", "#3d6e2a"][i % 4],
    phase: i * 0.4,
  }));
  return (
    <g>
      {blades.map((b, i) => {
        const sway = Math.sin((frame + b.phase * 40) / 32) * 5;
        const tip = { x: b.x + b.w / 2 + sway, y: 460 - b.h };
        return (
          <path
            key={i}
            d={`M ${b.x} 465 Q ${b.x + b.w / 2 + sway * 0.5} ${460 - b.h * 0.5} ${tip.x} ${tip.y}`}
            stroke={b.color}
            strokeWidth={b.w}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </g>
  );
};

// ─── Porcupine ───────────────────────────────────────────────────────────────

const Porcupine: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const { width } = useVideoConfig();

  // Walk from off-screen left, ease into center
  const walkIn = spring({ frame, fps, config: { damping: 30, stiffness: 60 }, durationInFrames: 70 });
  const tx = interpolate(walkIn, [0, 1], [-240, width * 0.33]);

  // Idle breathing bob after arrival
  const arrived = frame > 65;
  const breathe = arrived ? Math.sin((frame - 65) / 18) * 4 : 0;

  // Leg swing only while walking
  const walking = frame < 75;
  const legSwing = walking ? Math.sin(frame / 7) * 22 : 0;

  // Quill bristle on stopping
  const bristleFrame = frame - 72;
  const quillBristle = bristleFrame > 0
    ? spring({ frame: bristleFrame, fps, config: { damping: 12, stiffness: 180 }, durationInFrames: 25 })
    : 0;
  const quillSpread = interpolate(quillBristle, [0, 1], [1, 1.18]);

  // Blink cycles
  const blinkAt = [100, 148, 195];
  const isBlinking = blinkAt.some((b) => frame >= b && frame <= b + 4);

  // Tail wag
  const tailWag = Math.sin(frame / 22) * 10;

  // Sniff animation (nose twitch)
  const sniff = Math.sin(frame / 9) * 1.5;

  const quills = Array.from({ length: 22 }, (_, i) => {
    const baseAngle = -85 + i * 8; // fan: -85° to +88°
    const len = (38 + Math.sin(i * 1.7) * 12) * quillSpread;
    const thick = 2.2 + Math.sin(i * 0.9) * 0.6;
    const grad = i % 2 === 0 ? "url(#quillGrad)" : "url(#quillGrad2)";
    // origin — along the back of the body
    const originX = 100 + i * 3.5;
    const originY = 85 - Math.sin((i / 22) * Math.PI) * 18;
    const rad = (baseAngle * Math.PI) / 180;
    const tx2 = originX + Math.cos(rad) * len;
    const ty = originY + Math.sin(rad) * len;
    return { originX, originY, tx: tx2, ty, thick, grad };
  });

  return (
    <g transform={`translate(${tx}, ${breathe})`} filter="url(#shadow)">
      {/* ── Quills (behind body) ── */}
      <g>
        {quills.map((q, i) => (
          <line
            key={i}
            x1={q.originX} y1={q.originY}
            x2={q.tx} y2={q.ty}
            stroke={q.grad}
            strokeWidth={q.thick}
            strokeLinecap="round"
            opacity={0.92}
          />
        ))}
      </g>

      {/* ── Body ── */}
      {/* Shadow beneath body */}
      <ellipse cx={120} cy={165} rx={105} ry={18} fill="rgba(0,0,0,0.35)" />

      {/* Main body — organic path */}
      <path
        d={`
          M 35,140
          C 20,110 30,70 80,62
          C 110,56 145,58 175,68
          C 205,78 225,95 228,118
          C 232,145 218,165 185,170
          C 155,175 90,175 60,168
          C 38,163 40,155 35,140
          Z
        `}
        fill="url(#bodyFur)"
      />

      {/* Underside belly */}
      <path
        d={`M 55,168 C 90,180 155,180 185,170 C 175,178 90,178 55,168 Z`}
        fill="url(#belly)"
        opacity={0.7}
      />

      {/* Fur texture strokes on body */}
      {Array.from({ length: 14 }, (_, i) => {
        const bx = 50 + i * 13;
        const by = 100 + Math.sin(i * 1.3) * 20;
        return (
          <path
            key={i}
            d={`M ${bx} ${by} Q ${bx + 4} ${by - 6} ${bx + 8} ${by}`}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      {/* ── Tail ── */}
      <path
        d={`M 38,150 C 10,145 -12,138 -18,128 C -22,120 -15,112 -5,118 C 5,124 15,135 38,140 Z`}
        fill="#2a1c08"
        transform={`rotate(${tailWag}, 38, 150)`}
      />
      {/* Tail quills */}
      {[-4, 0, 4].map((off, i) => (
        <line
          key={i}
          x1={10 + off} y1={130 + off * 2}
          x2={-15 + off * 3} y2={108 + off}
          stroke="url(#quillGrad)"
          strokeWidth={1.8}
          strokeLinecap="round"
          transform={`rotate(${tailWag * 0.6}, 38, 150)`}
        />
      ))}

      {/* ── Legs ── */}
      {[
        { x: 70,  side: 1 },
        { x: 100, side: -1 },
        { x: 145, side: 1 },
        { x: 170, side: -1 },
      ].map((leg, i) => {
        const swing = (i % 2 === 0 ? legSwing : -legSwing) * (i < 2 ? 1 : 0.75);
        return (
          <g key={i} transform={`rotate(${swing}, ${leg.x}, 168)`}>
            <path
              d={`M ${leg.x - 8},168 C ${leg.x - 6},185 ${leg.x + 4},192 ${leg.x + 6},200`}
              stroke="#2a1c08"
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
            />
            {/* Foot */}
            <ellipse cx={leg.x + 6} cy={202} rx={10} ry={5} fill="#1e1408" />
          </g>
        );
      })}

      {/* ── Head ── */}
      <path
        d={`
          M 175,100
          C 178,78 192,62 215,62
          C 240,62 262,78 268,100
          C 274,120 265,142 248,150
          C 230,158 195,155 182,140
          C 172,128 172,118 175,100
          Z
        `}
        fill="url(#headFur)"
      />

      {/* Head fur texture */}
      {Array.from({ length: 8 }, (_, i) => {
        const hx = 190 + i * 8;
        const hy = 90 + Math.sin(i * 1.5) * 12;
        return (
          <path
            key={i}
            d={`M ${hx} ${hy} Q ${hx + 3} ${hy - 5} ${hx + 6} ${hy}`}
            stroke="rgba(0,0,0,0.22)"
            strokeWidth={1.1}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      {/* Ear */}
      <path
        d={`M 202,68 C 196,52 204,44 212,48 C 218,52 216,64 210,70 Z`}
        fill="#3d2810"
      />
      <path
        d={`M 204,66 C 200,55 206,49 211,52 C 215,55 213,64 209,68 Z`}
        fill="#5a1810"
        opacity={0.6}
      />

      {/* ── Snout ── */}
      <path
        d={`
          M 262,108
          C 268,102 285,102 292,110
          C 298,118 296,130 288,134
          C 280,138 264,134 260,124
          C 257,116 258,112 262,108
          Z
        `}
        fill="#5a3d10"
        transform={`translate(0, ${sniff})`}
      />

      {/* Nose */}
      <ellipse
        cx={291} cy={116}
        rx={9} ry={7}
        fill="url(#noseGrad)"
        transform={`translate(0, ${sniff})`}
      />
      {/* Nostril highlights */}
      <ellipse cx={289} cy={114} rx={2.5} ry={2} fill="rgba(80,40,10,0.5)" transform={`translate(0, ${sniff})`} />

      {/* Whiskers */}
      {[[-6, 2], [-4, 8], [-2, 14], [4, 1], [6, 7], [8, 13]].map(([dx, dy], i) => (
        <line
          key={i}
          x1={278 + dx * 0.5} y1={120 + dy * 0.3}
          x2={278 + dx * 0.5 + (i < 3 ? -22 : 22)} y2={120 + dy * 0.3 + dy * 0.4}
          stroke="rgba(240,220,180,0.75)"
          strokeWidth={0.8}
          strokeLinecap="round"
          transform={`translate(0, ${sniff})`}
        />
      ))}

      {/* ── Eye ── */}
      <ellipse
        cx={247} cy={90}
        rx={8} ry={isBlinking ? 1.5 : 8}
        fill="#0d0a05"
      />
      {!isBlinking && (
        <>
          <ellipse cx={250} cy={86} rx={3} ry={3} fill="#1a1408" />
          {/* Catchlight */}
          <ellipse cx={251} cy={85} rx={2} ry={2} fill="rgba(255,255,255,0.75)" />
        </>
      )}
      {/* Eyelid when blinking */}
      {isBlinking && (
        <ellipse cx={247} cy={90} rx={10} ry={4} fill="#3d2810" opacity={0.9} />
      )}
    </g>
  );
};

// ─── Atmospheric mist layer ──────────────────────────────────────────────────

const Mist: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 40, 180, 220], [0, 0.6, 0.6, 0.3], {
    extrapolateRight: "clamp",
  });
  const drift = interpolate(frame, [0, 220], [0, 30]);
  return (
    <rect
      x={-drift} y={300}
      width={1150} height={200}
      fill="url(#mistGrad)"
      opacity={opacity}
    />
  );
};

// ─── Floating pollen particles ───────────────────────────────────────────────

const Particles: React.FC<{ frame: number }> = ({ frame }) => {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    x: ((i * 83 + frame * (0.4 + i * 0.05)) % 1150) - 50,
    y: 120 + Math.sin((frame + i * 50) / 55) * 70 + i * 28,
    r: 2 + (i % 3),
    opacity: 0.12 + Math.sin((frame + i * 30) / 45) * 0.06,
  }));
  return (
    <g>
      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#e8d870" opacity={p.opacity} />
      ))}
    </g>
  );
};

// ─── Foreground tree silhouettes (darkest, closest) ──────────────────────────

const ForegroundEdges: React.FC = () => (
  <g opacity={0.9}>
    {/* Left edge trunk + roots */}
    <path
      d={`M -10,608 C -10,500 10,400 -5,200 C 5,180 30,185 25,200 C 40,400 30,500 30,608 Z`}
      fill="#0d1008"
    />
    {/* Right edge */}
    <path
      d={`M 1090,608 C 1090,500 1070,380 1085,180 C 1075,165 1050,170 1055,185 C 1040,380 1060,500 1050,608 Z`}
      fill="#0d1008"
    />
    {/* Hanging leaves foreground left */}
    <ellipse cx={40} cy={160} rx={80} ry={55} fill="#0f1e0c" opacity={0.9} />
    <ellipse cx={-20} cy={200} rx={60} ry={40} fill="#0a1808" opacity={0.85} />
    {/* Hanging leaves foreground right */}
    <ellipse cx={1040} cy={170} rx={75} ry={50} fill="#0f1e0c" opacity={0.9} />
    <ellipse cx={1090} cy={210} rx={55} ry={38} fill="#0a1808" opacity={0.85} />
  </g>
);

// ─── Title card ──────────────────────────────────────────────────────────────

const TitleCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const y = interpolate(appear, [0, 1], [18, 0]);
  return (
    <g opacity={appear} transform={`translate(0, ${y})`}>
      {/* Backdrop pill */}
      <rect x={270} y={32} width={540} height={90} rx={16} fill="rgba(0,0,0,0.48)" />
      <text
        x={540} y={68}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={16}
        fill="rgba(255,235,140,0.82)"
        letterSpacing={3}
      >
        A DAY IN THE LIFE OF
      </text>
      <text
        x={540} y={108}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={38}
        fontWeight="bold"
        fill="#ffffff"
      >
        Percy the Porcupine
      </text>
    </g>
  );
};

// ─── End card ────────────────────────────────────────────────────────────────

const EndCard: React.FC<{ frame: number }> = ({ frame }) => {
  const fadeIn = interpolate(frame, [185, 215], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g opacity={fadeIn}>
      <rect x={0} y={0} width={1080} height={608} fill={`rgba(0,0,0,${fadeIn * 0.72})`} />
      <text
        x={540} y={320}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={64}
        fill="rgba(255,235,140,0.9)"
        letterSpacing={8}
      >
        The End
      </text>
    </g>
  );
};

// ─── Root composition ────────────────────────────────────────────────────────

export const PorcupineForest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#0a0f08" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <SvgDefs />

        {/* Render order: back → front */}
        <Sky frame={frame} />
        <Sun frame={frame} fps={fps} />
        <GodRays frame={frame} />
        <BackgroundTrees frame={frame} />
        <MidTrees frame={frame} />
        <Ground frame={frame} />
        <Grass frame={frame} />
        <Mist frame={frame} />
        <Porcupine frame={frame} fps={fps} />
        <Particles frame={frame} />
        <ForegroundEdges />

        {/* Title */}
        {frame >= 10 && frame <= 90 && (
          <TitleCard frame={frame - 10} fps={fps} />
        )}

        {/* End card */}
        {frame >= 185 && (
          <EndCard frame={frame} />
        )}
      </svg>
    </AbsoluteFill>
  );
};
