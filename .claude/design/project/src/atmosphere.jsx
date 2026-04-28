// Ember particle field — rises from the bottom center, slow drift, warm glow.
// Pass `intensity` 0..1 to scale density; respects prefers-reduced-motion.

function EmberField({ intensity = 0.7, origin = "bottom", hue = "ember", seed = 1 }) {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const reducedMotion = React.useRef(
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Seeded random — consistent particle layouts
    let s = seed * 9301 + 49297;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

    const baseCount = Math.floor(80 * intensity);
    const particles = Array.from({ length: baseCount }, () => makeP());

    function makeP() {
      const side = origin === "bottom" ? 1 : origin === "center" ? 0.5 : 1;
      return {
        x: W * (0.15 + rand() * 0.7),
        y: H * (0.85 + rand() * 0.25),
        vy: -(0.2 + rand() * 0.9),
        vx: (rand() - 0.5) * 0.35,
        size: 0.6 + rand() * 2.2,
        life: rand(),
        maxLife: 0.6 + rand() * 1.2,
        flicker: rand() * Math.PI * 2,
      };
    }

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy * (reducedMotion.current ? 0 : 1);
        p.life += 0.004 * (reducedMotion.current ? 0 : 1);
        p.flicker += 0.05;
        if (p.life > p.maxLife || p.y < -10 || p.x < -10 || p.x > W + 10) {
          Object.assign(p, makeP());
          p.life = 0;
        }
        const lifeFrac = p.life / p.maxLife;
        // Rise, fade out
        const alpha = Math.max(0, Math.sin(lifeFrac * Math.PI) * (0.45 + 0.35 * Math.sin(p.flicker)));
        const r = p.size * (1 + lifeFrac * 0.4);
        const color = hue === "red"
          ? `rgba(255, 90, 40, ${alpha * intensity})`
          : `rgba(255, 160, 60, ${alpha * intensity})`;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
        glow.addColorStop(0, color);
        glow.addColorStop(1, "rgba(255, 90, 40, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
        ctx.fill();
        // Hot core
        ctx.fillStyle = `rgba(255, 240, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [intensity, hue, origin, seed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    />
  );
}

// Heat shimmer — subtle rising blur
function HeatShimmer({ intensity = 0.5 }) {
  return (
    <div
      className="heat-shimmer"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: intensity * 0.7,
        background:
          "radial-gradient(80% 60% at 50% 95%, rgba(255,120,40,0.18) 0%, rgba(255,80,20,0.05) 40%, transparent 72%)",
        filter: "blur(20px)",
      }}
    />
  );
}

// Fire glow — a dominant warm vignette for hero backgrounds
function FireGlow({ intensity = 0.8 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `
          radial-gradient(60% 50% at 50% 85%, rgba(255, 110, 40, ${0.35 * intensity}) 0%, rgba(217, 54, 30, ${0.22 * intensity}) 30%, rgba(12,6,4,0) 70%),
          radial-gradient(40% 35% at 50% 92%, rgba(255, 190, 90, ${0.45 * intensity}) 0%, rgba(255, 90, 40, 0) 60%),
          radial-gradient(120% 80% at 50% 100%, rgba(20,10,6,0.0) 40%, rgba(8,7,6,0.9) 85%)
        `,
        animation: "fire-breathe 5.2s ease-in-out infinite",
      }}
    />
  );
}

// Stylized SVG bonfire scene — for landing variant A
function BonfireScene({ variant = "a", intensity = 1 }) {
  // variant a: detailed scene with silhouettes + instruments + fire
  // variant b: minimal abstract firelit gradient
  if (variant === "b") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: `
            radial-gradient(55% 45% at 50% 72%, rgba(255, 120, 40, 0.45) 0%, rgba(217, 54, 30, 0.30) 30%, rgba(20,10,6,0) 65%),
            radial-gradient(25% 20% at 50% 80%, rgba(255, 220, 140, 0.65) 0%, rgba(255, 120, 40, 0) 70%),
            radial-gradient(120% 80% at 50% 110%, rgba(8,7,6,0.0) 40%, rgba(8,7,6,1) 92%),
            linear-gradient(180deg, #0a0605 0%, #120c09 45%, #1a0f0a 100%)
          `,
        }}
      >
        <EmberField intensity={intensity} />
        <HeatShimmer intensity={intensity} />
      </div>
    );
  }

  // Variant A — stylized scene: silhouettes in a circle with a bonfire
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Deep night gradient base */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(180deg, #050302 0%, #0a0604 40%, #140b08 75%, #1f120c 100%)
          `,
        }}
      />
      {/* Distant trees / horizon */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <radialGradient id="fireCore" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#fff0c2" stopOpacity="1" />
            <stop offset="15%" stopColor="#ffd060" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#ff7a1a" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#d9361e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d9361e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="groundGlow" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#ff7a1a" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#d9361e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="treeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0605" />
            <stop offset="100%" stopColor="#1a0c07" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>

        {/* Ground glow */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#groundGlow)" />

        {/* Distant trees silhouette */}
        <path
          d="M0 700 L0 600 L60 580 L90 560 L140 570 L180 540 L230 560 L280 530 L330 560 L400 520 L460 550 L520 530 L580 560 L640 540 L700 560 L760 535 L820 555 L880 525 L950 550 L1020 530 L1080 560 L1140 540 L1210 560 L1280 530 L1340 555 L1410 540 L1470 560 L1540 540 L1600 560 L1600 700 Z"
          fill="url(#treeGrad)"
          opacity="0.95"
        />

        {/* Bonfire glow backdrop */}
        <circle cx="800" cy="620" r="340" fill="url(#fireCore)" opacity={0.8 * intensity} filter="url(#glow)" />
        <circle cx="800" cy="640" r="200" fill="url(#fireCore)" opacity={0.9 * intensity} />

        {/* Flame shape */}
        <g transform="translate(800 640)" style={{ transformOrigin: "center", animation: "flame-flicker 1.4s ease-in-out infinite alternate" }}>
          <path
            d="M0 -90 C -30 -50 -45 -20 -35 10 C -45 -5 -50 -30 -45 -55 C -58 -25 -62 10 -40 40 C -55 30 -62 15 -60 -5 C -70 20 -55 60 -20 70 C 0 75 20 70 35 55 C 55 30 55 -10 40 -35 C 50 -5 45 25 30 40 C 45 15 45 -20 32 -50 C 36 -20 30 5 20 20 C 28 -5 25 -35 10 -60 C 15 -35 8 -15 -2 -5 C 5 -30 0 -65 0 -90 Z"
            fill="#ffb347"
            opacity="0.88"
          />
          <path
            d="M0 -60 C -20 -35 -25 -10 -18 10 C -8 -5 -4 -25 0 -45 C 4 -25 8 -5 18 10 C 25 -10 20 -35 0 -60 Z"
            fill="#fff0c2"
            opacity="0.9"
          />
        </g>

        {/* Logs */}
        <g transform="translate(800 720)">
          <ellipse cx="0" cy="0" rx="170" ry="10" fill="#0a0605" opacity="0.8" />
          <rect x="-90" y="-8" width="180" height="14" rx="3" fill="#2b1a10" transform="rotate(-8)" />
          <rect x="-100" y="4" width="200" height="14" rx="3" fill="#3a2214" transform="rotate(6)" />
          <rect x="-70" y="-16" width="140" height="12" rx="3" fill="#1a0e08" transform="rotate(18)" />
          {/* Ember tips on logs */}
          <circle cx="-50" cy="-4" r="3" fill="#ff7a1a" opacity="0.9" />
          <circle cx="40" cy="6" r="2.5" fill="#ffb347" opacity="0.95" />
          <circle cx="70" cy="-2" r="2" fill="#ff5a1c" opacity="0.9" />
        </g>

        {/* Seated silhouettes in a loose circle — half visible, facing fire */}
        {/* Left pair */}
        <g fill="#050302" opacity="0.95">
          {/* Person with guitar, left */}
          <g transform="translate(380 760)">
            <ellipse cx="0" cy="0" rx="75" ry="14" fill="#000" opacity="0.5" />
            <path d="M -40 -5 Q -45 -90 -15 -120 Q 20 -130 35 -95 Q 40 -50 40 0 Z" />
            {/* head */}
            <circle cx="5" cy="-130" r="24" />
            {/* guitar body */}
            <g transform="rotate(-22) translate(45 -30)">
              <ellipse cx="0" cy="0" rx="28" ry="36" fill="#2a1509" />
              <ellipse cx="0" cy="5" rx="18" ry="24" fill="#4a2816" />
              <rect x="-3" y="-60" width="6" height="55" fill="#1a0c07" />
              <circle cx="0" cy="0" r="7" fill="#080403" />
              <rect x="-10" y="-68" width="20" height="10" rx="2" fill="#1a0c07" />
            </g>
          </g>
          {/* Person sitting cross-legged, left-center */}
          <g transform="translate(560 780)">
            <ellipse cx="0" cy="0" rx="65" ry="12" fill="#000" opacity="0.5" />
            <path d="M -35 -10 Q -40 -85 -5 -100 Q 30 -95 35 -60 Q 35 -15 40 0 Z" />
            <circle cx="-2" cy="-110" r="22" />
          </g>
        </g>

        {/* Right pair */}
        <g fill="#050302" opacity="0.95">
          {/* Person with hand drum, right-center */}
          <g transform="translate(1040 780)">
            <ellipse cx="0" cy="0" rx="70" ry="13" fill="#000" opacity="0.5" />
            <path d="M -40 -10 Q -40 -90 -5 -105 Q 35 -100 40 -60 Q 40 -15 45 0 Z" />
            <circle cx="-5" cy="-115" r="22" />
            {/* cajón / drum */}
            <g transform="translate(20 -30)">
              <rect x="-20" y="-25" width="40" height="50" rx="3" fill="#3a2214" />
              <rect x="-20" y="-25" width="40" height="6" rx="2" fill="#2a1509" />
              <circle cx="0" cy="5" r="6" fill="#0a0605" />
            </g>
          </g>
          {/* Person with notebook, right */}
          <g transform="translate(1220 760)">
            <ellipse cx="0" cy="0" rx="70" ry="13" fill="#000" opacity="0.5" />
            <path d="M -40 -5 Q -45 -90 -10 -120 Q 30 -125 40 -90 Q 45 -40 45 0 Z" />
            <circle cx="0" cy="-130" r="24" />
            <rect x="15" y="-40" width="26" height="18" fill="#2a1509" transform="rotate(-10)" />
          </g>
        </g>

        {/* Mic stand far back left */}
        <g stroke="#1a0c07" strokeWidth="2" fill="#1a0c07" opacity="0.9" transform="translate(240 700)">
          <line x1="0" y1="0" x2="0" y2="-120" />
          <circle cx="0" cy="-130" r="8" fill="#2a1509" />
          <line x1="-14" y1="0" x2="14" y2="0" />
        </g>

        {/* Guitar case on ground, right */}
        <g transform="translate(1380 790)" fill="#1a0c07">
          <path d="M -50 0 Q -55 -35 -20 -40 Q 10 -42 25 -30 Q 55 -25 55 0 Z" opacity="0.9" />
          <ellipse cx="-15" cy="-25" rx="18" ry="8" fill="#2a1509" />
        </g>

        {/* Foreground ground edge */}
        <rect x="0" y="860" width="1600" height="60" fill="#050302" />
      </svg>

      <EmberField intensity={intensity} />
      <HeatShimmer intensity={intensity} />

      <style>{`
        @keyframes flame-flicker {
          0% { transform: scale(0.96, 1) rotate(-1deg); opacity: 0.9; }
          100% { transform: scale(1.04, 0.98) rotate(1.2deg); opacity: 1; }
        }
        @keyframes fire-breathe {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 1.05; }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { EmberField, HeatShimmer, FireGlow, BonfireScene });
