'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ── Constants ───────────────────────────────────────────────────────

export const SPEED_OPTIONS = [
  { label: '0.1x', value: 0.1 },
  { label: '0.25x', value: 0.25 },
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
];

export const EASING_PRESETS = [
  { label: 'Ease Out', value: [0.33, 1, 0.68, 1] as BezierPoints },
  { label: 'Linear', value: [0, 0, 1, 1] as BezierPoints },
  { label: 'Ease In', value: [0.42, 0, 1, 1] as BezierPoints },
  { label: 'Ease In-Out', value: [0.42, 0, 0.58, 1] as BezierPoints },
  { label: 'Bounce', value: [0.34, 1.56, 0.64, 1] as BezierPoints },
  { label: 'Snap', value: [0, 0.9, 0.1, 1] as BezierPoints },
];

/** Combined presets: easing + tempo + pressure tuned together for realistic styles. */
export interface SignaturePreset {
  label: string;
  description: string;
  easing: BezierPoints;
  tempo: number;
  pressure: number;
}

export const SIGNATURE_PRESETS: SignaturePreset[] = [
  {
    label: 'Natural',
    description: 'Confident, relaxed signing — the default',
    easing: [0.22, 0.68, 0.35, 1],
    tempo: 0.45,
    pressure: 0.35,
  },
  {
    label: 'Formal',
    description: 'Deliberate, even-paced — like signing a document',
    easing: [0.25, 0.1, 0.25, 1],
    tempo: 0.15,
    pressure: 0.15,
  },
  {
    label: 'Quick',
    description: 'Fast and loose — like signing a receipt',
    easing: [0.16, 1, 0.3, 1],
    tempo: 0.7,
    pressure: 0.45,
  },
  {
    label: 'Elegant',
    description: 'Smooth acceleration — calligraphy-like',
    easing: [0.37, 0, 0.63, 1],
    tempo: 0.3,
    pressure: 0.5,
  },
  {
    label: 'Mechanical',
    description: 'Uniform speed and width — robotic precision',
    easing: [0, 0, 1, 1],
    tempo: 0,
    pressure: 0,
  },
  {
    label: 'Swoopy',
    description: 'Aggressive ease-out — bold, confident strokes',
    easing: [0.08, 0.82, 0.17, 1],
    tempo: 0.55,
    pressure: 0.4,
  },
];

export type BezierPoints = [number, number, number, number];

// ── Bezier Parsing ──────────────────────────────────────────────────

export function parseBezier(css: string): BezierPoints {
  if (css === 'linear') return [0, 0, 1, 1];
  const m = css.match(/cubic-bezier\(\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)/);
  if (m) return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
  return [0.33, 1, 0.68, 1];
}

export function formatBezier(p: BezierPoints): string {
  return `cubic-bezier(${p.map((v) => Number(v.toFixed(2))).join(', ')})`;
}


// ── Hook ────────────────────────────────────────────────────────────

export interface AnimationControl {
  playing: boolean;
  currentTime: number;
  totalDuration: number;
  speed: number;
  easing: string;
  togglePlay: () => void;
  seek: (timeMs: number) => void;
  changeSpeed: (v: number) => void;
  changeEasing: (v: string) => void;
}

export function useAnimationControl(
  containerRef: React.RefObject<HTMLElement | null>,
  animKey: number,
): AnimationControl {
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [easing, setEasingState] = useState(formatBezier(EASING_PRESETS[0].value));
  const animsRef = useRef<Animation[]>([]);
  const rafRef = useRef(0);

  const getAnims = useCallback(() => {
    const el = containerRef.current;
    if (!el) return [];
    return Array.from(el.querySelectorAll('.hws-path')).flatMap((p) =>
      p.getAnimations(),
    );
  }, [containerRef]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const anims = getAnims();
      animsRef.current = anims;

      anims.forEach((a) => {
        a.playbackRate = speed;
        (a.effect as KeyframeEffect | null)?.updateTiming({ easing });
      });

      let maxEnd = 0;
      for (const a of anims) {
        const t = a.effect?.getComputedTiming();
        if (t) maxEnd = Math.max(maxEnd, (t.delay ?? 0) + Number(t.duration ?? 0));
      }
      setTotalDuration(maxEnd);
      setCurrentTime(0);
      setPlaying(true);
    }, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, getAnims]);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const anims = animsRef.current;
      let maxTime = 0;
      for (const a of anims) {
        if (a.currentTime != null) {
          maxTime = Math.max(maxTime, a.currentTime as number);
        }
      }
      if (anims.length > 0) setCurrentTime(maxTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const pause = useCallback(() => {
    animsRef.current.forEach((a) => a.pause());
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    animsRef.current.forEach((a) => a.play());
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    playing ? pause() : play();
  }, [playing, pause, play]);

  const seek = useCallback((timeMs: number) => {
    animsRef.current.forEach((a) => { a.currentTime = timeMs; });
    setCurrentTime(timeMs);
  }, []);

  const changeSpeed = useCallback((v: number) => {
    setSpeedState(v);
    animsRef.current.forEach((a) => { a.playbackRate = v; });
  }, []);

  const changeEasing = useCallback((v: string) => {
    setEasingState(v);
    animsRef.current.forEach((a) => {
      (a.effect as KeyframeEffect | null)?.updateTiming({ easing: v });
    });
  }, []);

  return { playing, currentTime, totalDuration, speed, easing, togglePlay, seek, changeSpeed, changeEasing };
}

// ── Curve Editor ────────────────────────────────────────────────────

const GRAPH = 140;
const PAD = 24;
const CANVAS_W = GRAPH + PAD * 2;
const CANVAS_H = GRAPH + PAD * 2;
const HANDLE_R = 6;
const Y_MIN = -0.4;
const Y_MAX = 1.4;
const Y_RANGE = Y_MAX - Y_MIN;

export interface CurveState {
  sy: number; // start point Y (x fixed at 0)
  x1: number; // P1 control handle
  y1: number;
  x2: number; // P2 control handle
  y2: number;
  ey: number; // end point Y (x fixed at 1)
}

export type DragTarget = 'start' | 'p1' | 'p2' | 'end' | null;

export function curveFromBezier(bp: BezierPoints): CurveState {
  return { sy: 0, x1: bp[0], y1: bp[1], x2: bp[2], y2: bp[3], ey: 1 };
}

export function curveHasDefaultEndpoints(c: CurveState): boolean {
  return Math.abs(c.sy) < 0.01 && Math.abs(c.ey - 1) < 0.01;
}

export function curveLabel(c: CurveState): string {
  if (!curveHasDefaultEndpoints(c)) return 'Custom';
  for (const preset of EASING_PRESETS) {
    const [x1, y1, x2, y2] = preset.value;
    if (
      Math.abs(c.x1 - x1) < 0.01 && Math.abs(c.y1 - y1) < 0.01 &&
      Math.abs(c.x2 - x2) < 0.01 && Math.abs(c.y2 - y2) < 0.01
    ) return preset.label;
  }
  for (const preset of SIGNATURE_PRESETS) {
    const [x1, y1, x2, y2] = preset.easing;
    if (
      Math.abs(c.x1 - x1) < 0.01 && Math.abs(c.y1 - y1) < 0.01 &&
      Math.abs(c.x2 - x2) < 0.01 && Math.abs(c.y2 - y2) < 0.01
    ) return preset.label;
  }
  return 'Custom';
}

// ── Bezier math for sampling ────────────────────────────────────────

export function bezierComponent(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function solveBezierT(targetX: number, p0x: number, p1x: number, p2x: number, p3x: number): number {
  let lo = 0, hi = 1;
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    if (bezierComponent(mid, p0x, p1x, p2x, p3x) < targetX) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function curveToCSS(c: CurveState): string {
  if (curveHasDefaultEndpoints(c)) {
    return formatBezier([c.x1, c.y1, c.x2, c.y2]);
  }
  // Sample the custom bezier and output linear()
  const n = 30;
  const values: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const t = solveBezierT(x, 0, c.x1, c.x2, 1);
    const y = bezierComponent(t, c.sy, c.y1, c.y2, c.ey);
    values.push(Number(y.toFixed(3)).toString());
  }
  return `linear(${values.join(', ')})`;
}

// ── Canvas drawing ──────────────────────────────────────────────────

function toCanvas(bx: number, by: number): [number, number] {
  return [
    PAD + bx * GRAPH,
    PAD + ((Y_MAX - by) / Y_RANGE) * GRAPH,
  ];
}

function fromCanvas(cx: number, cy: number): [number, number] {
  return [
    Math.max(0, Math.min(1, (cx - PAD) / GRAPH)),
    Y_MAX - ((cy - PAD) / GRAPH) * Y_RANGE,
  ];
}

function drawCurve(canvas: HTMLCanvasElement, c: CurveState, dpr: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid background
  ctx.fillStyle = '#f8f8f8';
  const [gx0, gy0] = toCanvas(0, Y_MAX);
  const [gx1, gy1] = toCanvas(1, Y_MIN);
  ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);

  // Unit square highlight
  ctx.fillStyle = '#fff';
  const [ux0, uy0] = toCanvas(0, 1);
  const [ux1, uy1] = toCanvas(1, 0);
  ctx.fillRect(ux0, uy0, ux1 - ux0, uy1 - uy0);

  // Grid lines
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const [vx] = toCanvas(t, 0);
    ctx.beginPath(); ctx.moveTo(vx, PAD); ctx.lineTo(vx, PAD + GRAPH); ctx.stroke();
    const [, hy] = toCanvas(0, t);
    ctx.beginPath(); ctx.moveTo(PAD, hy); ctx.lineTo(PAD + GRAPH, hy); ctx.stroke();
  }

  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(ux0, uy0, ux1 - ux0, uy1 - uy0);

  // Diagonal reference
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const [lx0, ly0] = toCanvas(0, 0);
  const [lx1, ly1] = toCanvas(1, 1);
  ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.lineTo(lx1, ly1); ctx.stroke();
  ctx.setLineDash([]);

  const [sx, sy] = toCanvas(0, c.sy);
  const [c1x, c1y] = toCanvas(c.x1, c.y1);
  const [c2x, c2y] = toCanvas(c.x2, c.y2);
  const [ex, ey] = toCanvas(1, c.ey);

  // Control lines
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(c1x, c1y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(c2x, c2y); ctx.stroke();

  // Bezier curve
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
  ctx.stroke();

  // Start endpoint handle (red filled)
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#e04040';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(sx, sy, HANDLE_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // End endpoint handle (blue filled)
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#3070e0';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ex, ey, HANDLE_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // P1 control handle (red, smaller solid)
  ctx.fillStyle = '#e04040';
  ctx.beginPath(); ctx.arc(c1x, c1y, 5, 0, Math.PI * 2); ctx.fill();

  // P2 control handle (blue, smaller solid)
  ctx.fillStyle = '#3070e0';
  ctx.beginPath(); ctx.arc(c2x, c2y, 5, 0, Math.PI * 2); ctx.fill();
}

// ── Easing Editor Component ─────────────────────────────────────────

function EasingEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [curve, setCurve] = useState<CurveState>(() => curveFromBezier(parseBezier(value)));
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const internalChange = useRef(false);

  // Sync external value changes (only when not from our own drag)
  useEffect(() => {
    if (internalChange.current) { internalChange.current = false; return; }
    setCurve(curveFromBezier(parseBezier(value)));
  }, [value]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    drawCurve(canvas, curve, dpr);
  }, [curve, open, popoverPos]);

  // Position popover
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popoverW = CANVAS_W + 32 + 2;
    const popoverH = CANVAS_H + 130;
    const fitsAbove = rect.top > popoverH + 8;
    setPopoverPos({
      top: fitsAbove ? rect.top - popoverH - 8 : rect.bottom + 8,
      left: Math.max(8, rect.right - popoverW),
    });
  }, [open]);

  // Close on click outside or scroll
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const canvasXY = useCallback((e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (CANVAS_W / rect.width),
      (e.clientY - rect.top) * (CANVAS_H / rect.height),
    ];
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [cx, cy] = canvasXY(e);

    const targets: { id: DragTarget; dist: number }[] = [];
    const th = HANDLE_R + 8;

    // Endpoints (larger handles, check first for priority)
    const [sx, sy] = toCanvas(0, curve.sy);
    const [ex, ey] = toCanvas(1, curve.ey);
    const ds = Math.hypot(cx - sx, cy - sy);
    const de = Math.hypot(cx - ex, cy - ey);
    if (ds < th) targets.push({ id: 'start', dist: ds });
    if (de < th) targets.push({ id: 'end', dist: de });

    // Control handles
    const [h1x, h1y] = toCanvas(curve.x1, curve.y1);
    const [h2x, h2y] = toCanvas(curve.x2, curve.y2);
    const d1 = Math.hypot(cx - h1x, cy - h1y);
    const d2 = Math.hypot(cx - h2x, cy - h2y);
    if (d1 < th) targets.push({ id: 'p1', dist: d1 });
    if (d2 < th) targets.push({ id: 'p2', dist: d2 });

    if (targets.length > 0) {
      targets.sort((a, b) => a.dist - b.dist);
      setDragging(targets[0].id);
      canvas.setPointerCapture(e.pointerId);
    }
  }, [curve, canvasXY]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Hover cursor
    if (dragging === null) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const [cx, cy] = canvasXY(e);
      const th = HANDLE_R + 8;
      const [sx, sy] = toCanvas(0, curve.sy);
      const [ex, ey] = toCanvas(1, curve.ey);
      const [h1x, h1y] = toCanvas(curve.x1, curve.y1);
      const [h2x, h2y] = toCanvas(curve.x2, curve.y2);
      const near =
        Math.hypot(cx - sx, cy - sy) < th ||
        Math.hypot(cx - ex, cy - ey) < th ||
        Math.hypot(cx - h1x, cy - h1y) < th ||
        Math.hypot(cx - h2x, cy - h2y) < th;
      canvas.style.cursor = near ? 'grab' : 'default';
      return;
    }

    const [cx, cy] = canvasXY(e);
    const [bx, by] = fromCanvas(cx, cy);

    setCurve((prev) => {
      const next = { ...prev };
      switch (dragging) {
        case 'start': next.sy = by; break;            // x stays 0
        case 'p1':    next.x1 = bx; next.y1 = by; break;
        case 'p2':    next.x2 = bx; next.y2 = by; break;
        case 'end':   next.ey = by; break;            // x stays 1
      }
      internalChange.current = true;
      onChange(curveToCSS(next));
      return next;
    });
  }, [dragging, curve, canvasXY, onChange]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const applyPreset = useCallback((p: BezierPoints) => {
    const next = curveFromBezier(p);
    setCurve(next);
    internalChange.current = true;
    onChange(curveToCSS(next));
  }, [onChange]);

  const label = curveLabel(curve);
  const miniPts: BezierPoints = [curve.x1, curve.y1, curve.x2, curve.y2];

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          ...editorBtnStyle,
          background: open ? 'var(--accent)' : 'var(--surface)',
          color: open ? '#fff' : 'var(--text-secondary)',
        }}
        aria-label="Easing curve editor"
      >
        <MiniCurve pts={miniPts} />
        <span>{label}</span>
      </button>

      {open && popoverPos && (
        <div ref={popoverRef} style={{
          position: 'fixed',
          top: popoverPos.top,
          left: popoverPos.left,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          padding: 16,
          zIndex: 1000,
          width: CANVAS_W + 32,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Easing Curve
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              cursor: dragging !== null ? 'grabbing' : 'default',
              borderRadius: 8,
              display: 'block',
              marginBottom: 12,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          {/* Value display */}
          <div style={{
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'var(--text-tertiary)',
            marginBottom: 12,
            padding: '6px 8px',
            background: '#f5f5f5',
            borderRadius: 6,
            textAlign: 'center',
            userSelect: 'all',
          }}>
            {curveHasDefaultEndpoints(curve)
              ? formatBezier([curve.x1, curve.y1, curve.x2, curve.y2])
              : `start: ${curve.sy.toFixed(2)}  end: ${curve.ey.toFixed(2)}`
            }
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {EASING_PRESETS.map((p) => {
              const cp: BezierPoints = [curve.x1, curve.y1, curve.x2, curve.y2];
              const active = curveHasDefaultEndpoints(curve) && p.value.every((v, i) => Math.abs(v - cp[i]) < 0.01);
              return (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.value)}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontFamily: 'var(--font)',
                    border: '1px solid',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    borderRadius: 4,
                    background: active ? 'var(--accent)' : 'var(--surface)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// Small inline curve preview for the button
function MiniCurve({ pts }: { pts: BezierPoints }) {
  const w = 20;
  const h = 14;
  const p = 2;
  const sx = p;
  const sy = h - p;
  const ex = w - p;
  const ey = p;
  const c1x = p + pts[0] * (w - p * 2);
  const c1y = h - p - pts[1] * (h - p * 2);
  const c2x = p + pts[2] * (w - p * 2);
  const c2y = h - p - pts[3] * (h - p * 2);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ flexShrink: 0 }}>
      <path
        d={`M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ── Transport Bar ───────────────────────────────────────────────────

export function TransportBar({
  ctrl,
  onReplay,
}: {
  ctrl: AnimationControl;
  onReplay: () => void;
}) {
  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface-raised)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <button
        onClick={ctrl.togglePlay}
        aria-label={ctrl.playing ? 'Pause' : 'Play'}
        style={transportBtnStyle}
      >
        {ctrl.playing ? '⏸' : '▶'}
      </button>

      <input
        type="range"
        min={0}
        max={ctrl.totalDuration || 1}
        step={1}
        value={Math.min(ctrl.currentTime, ctrl.totalDuration)}
        onChange={(e) => ctrl.seek(Number(e.target.value))}
        style={{ flex: 1, minWidth: 120, cursor: 'pointer', accentColor: 'var(--accent)' }}
        aria-label="Seek animation"
      />

      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', minWidth: 80 }}>
        {formatTime(ctrl.currentTime)} / {formatTime(ctrl.totalDuration)}
      </span>

      <select
        value={ctrl.speed}
        onChange={(e) => ctrl.changeSpeed(Number(e.target.value))}
        style={selectStyle}
        aria-label="Playback speed"
      >
        {SPEED_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button onClick={onReplay} style={transportBtnStyle} aria-label="Replay">
        ↻
      </button>
    </div>
  );
}

// ── Helpers & Styles ────────────────────────────────────────────────

function formatTime(ms: number): string {
  const s = Math.max(0, ms / 1000);
  return `${s.toFixed(1)}s`;
}

const transportBtnStyle: React.CSSProperties = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 14, border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-primary)',
  flexShrink: 0, fontFamily: 'var(--font)', lineHeight: 1,
};

const selectStyle: React.CSSProperties = {
  padding: '4px 8px', fontSize: 12, fontFamily: 'var(--font)',
  border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-secondary)',
  outline: 'none',
};

const editorBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '4px 10px', fontSize: 12, fontFamily: 'var(--font)',
  border: '1px solid var(--border)', borderRadius: 6,
  cursor: 'pointer', flexShrink: 0,
};
