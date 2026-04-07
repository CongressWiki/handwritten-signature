'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import HandwrittenSignature from '../../src/HandwrittenSignature';
import {
  useAnimationControl,
  TransportBar,
  EASING_PRESETS,
  SIGNATURE_PRESETS,
  SPEED_OPTIONS,
  type CurveState,
  type DragTarget,
  type SignaturePreset,
  type BezierPoints,
  curveFromBezier,
  curveHasDefaultEndpoints,
  curveLabel,
  curveToCSS,
  parseBezier,
  formatBezier,
} from './transport';

interface ExampleItem {
  id: string;
  text: string;
  builtin?: boolean;
}

type GlyphViewMode = 'presets' | 'names' | 'alphabet' | 'pairs';

const DEFAULT_EXAMPLES: ExampleItem[] = [
  { id: 'e1', text: 'Signature', builtin: true },
  { id: 'e2', text: 'Nancy Pelosi', builtin: true },
  { id: 'e3', text: 'CONGRESS', builtin: true },
  { id: 'e4', text: 'The Quick Brown Fox', builtin: true },
  { id: 'e5', text: 'U.S.A.', builtin: true },
  { id: 'e6', text: 'Jane Smith', builtin: true },
  { id: 'e7', text: 'Thomas Jeb Hensarling', builtin: true },
];

// ── LocalStorage persistence ────────────────────────────────────────

const STORAGE_KEY = 'hws-playground-state';

interface SavedState {
  text: string;
  letterHeight: number;
  letterSpacing: number;
  durationPerLetterMs: number;
  initialDelayMs: number;
  strokeWidth: number;
  overlapRatio: number;
  color: string;
  tempoVariation: number;
  pressureVariation: number;
  curve: CurveState;
  looping: boolean;
  glyphView: GlyphViewMode;
  examples: ExampleItem[];
  pkgMgr: 'npm' | 'yarn' | 'pnpm';
}

function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Large curve editor (inline, not popover) ────────────────────────

const G = 220; // graph size
const PT = 24;  // padding top
const PR = 24;  // padding right
const PB = 36;  // padding bottom (room for x-axis label)
const PL = 40;  // padding left (room for y-axis label)
const CW = G + PL + PR;
const CH = G + PT + PB;
const HR = 7;  // handle radius
const Y_MIN = -0.4;
const Y_MAX = 1.4;
const Y_RANGE = Y_MAX - Y_MIN;

function toC(bx: number, by: number): [number, number] {
  return [PL + bx * G, PT + ((Y_MAX - by) / Y_RANGE) * G];
}
function fromC(cx: number, cy: number): [number, number] {
  return [
    Math.max(0, Math.min(1, (cx - PL) / G)),
    Y_MAX - ((cy - PT) / G) * Y_RANGE,
  ];
}

function drawLargeCurve(canvas: HTMLCanvasElement, c: CurveState, dpr: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CW, CH);

  // Grid background
  ctx.fillStyle = '#f8f8f8';
  const [gx0, gy0] = toC(0, Y_MAX);
  const [gx1, gy1] = toC(1, Y_MIN);
  ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);

  // Unit square
  ctx.fillStyle = '#fff';
  const [ux0, uy0] = toC(0, 1);
  const [ux1, uy1] = toC(1, 0);
  ctx.fillRect(ux0, uy0, ux1 - ux0, uy1 - uy0);

  // Grid lines
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const [vx] = toC(t, 0);
    ctx.beginPath(); ctx.moveTo(vx, PT); ctx.lineTo(vx, PT + G); ctx.stroke();
    const [, hy] = toC(0, t);
    ctx.beginPath(); ctx.moveTo(PL, hy); ctx.lineTo(PL + G, hy); ctx.stroke();
  }
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(ux0, uy0, ux1 - ux0, uy1 - uy0);

  // Axis tick labels
  ctx.fillStyle = '#aaa';
  ctx.font = '10px system-ui, sans-serif';
  // Y-axis: 0% and 100%
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const [, y0pos] = toC(0, 0);
  const [, y1pos] = toC(0, 1);
  ctx.fillText('0%', PL - 6, y0pos);
  ctx.fillText('100%', PL - 6, y1pos);
  // X-axis: 0% and 100%
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const [x0pos] = toC(0, 0);
  const [x1pos] = toC(1, 0);
  ctx.fillText('0%', x0pos, y0pos + 6);
  ctx.fillText('100%', x1pos, y0pos + 6);

  // Axis titles
  ctx.fillStyle = '#999';
  ctx.font = '11px system-ui, sans-serif';
  // X-axis title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Time →', PL + G / 2, y0pos + 20);
  // Y-axis title (rotated)
  ctx.save();
  ctx.translate(12, PT + G / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Progress →', 0, 0);
  ctx.restore();

  // Diagonal
  ctx.strokeStyle = '#e0e0e0';
  ctx.setLineDash([4, 4]);
  const [lx0, ly0] = toC(0, 0);
  const [lx1, ly1] = toC(1, 1);
  ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.lineTo(lx1, ly1); ctx.stroke();
  ctx.setLineDash([]);

  // Fixed endpoints at (0,0) and (1,1)
  const [sx, sy] = toC(0, 0);
  const [c1x, c1y] = toC(c.x1, c.y1);
  const [c2x, c2y] = toC(c.x2, c.y2);
  const [ex, ey] = toC(1, 1);

  // Control lines
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(c1x, c1y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(c2x, c2y); ctx.stroke();

  // Curve
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
  ctx.stroke();

  // Fixed endpoints (small dots, not draggable)
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill();

  // P1 control handle (red)
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e04040'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(c1x, c1y, HR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // P2 control handle (blue)
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3070e0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(c2x, c2y, HR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function InlineCurveEditor({
  curve, onChange,
}: {
  curve: CurveState;
  onChange: (c: CurveState) => void;
}) {
  const [dragging, setDragging] = useState<DragTarget>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    drawLargeCurve(canvas, curve, dpr);
  }, [curve]);

  const canvasXY = useCallback((e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (CW / rect.width),
      (e.clientY - rect.top) * (CH / rect.height),
    ];
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [cx, cy] = canvasXY(e);
    const th = HR + 10;
    const [h1x, h1y] = toC(curve.x1, curve.y1);
    const [h2x, h2y] = toC(curve.x2, curve.y2);
    const d1 = Math.hypot(cx - h1x, cy - h1y);
    const d2 = Math.hypot(cx - h2x, cy - h2y);
    if (d1 < th && d1 <= d2) {
      setDragging('p1');
      canvas.setPointerCapture(e.pointerId);
    } else if (d2 < th) {
      setDragging('p2');
      canvas.setPointerCapture(e.pointerId);
    }
  }, [curve, canvasXY]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging === null) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const [cx, cy] = canvasXY(e);
      const th = HR + 10;
      const [h1x, h1y] = toC(curve.x1, curve.y1);
      const [h2x, h2y] = toC(curve.x2, curve.y2);
      const near = Math.hypot(cx - h1x, cy - h1y) < th || Math.hypot(cx - h2x, cy - h2y) < th;
      canvas.style.cursor = near ? 'grab' : 'default';
      return;
    }
    const [cx, cy] = canvasXY(e);
    const [bx, by] = fromC(cx, cy);
    const next = { ...curve };
    if (dragging === 'p1') { next.x1 = bx; next.y1 = by; }
    else if (dragging === 'p2') { next.x2 = bx; next.y2 = by; }
    onChange(next);
  }, [dragging, curve, canvasXY, onChange]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      style={{
        width: '100%',
        maxWidth: CW,
        height: 'auto',
        aspectRatio: `${CW} / ${CH}`,
        cursor: dragging !== null ? 'grabbing' : 'default',
        borderRadius: 8,
        display: 'block',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const defaultPreset = SIGNATURE_PRESETS[0]; // Natural

  // Load saved state once on mount
  const [saved] = useState(() => loadSavedState());

  const [text, setText] = useState(saved?.text ?? '');
  const [inputText, setInputText] = useState(saved?.text ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [letterHeight, setLetterHeight] = useState(saved?.letterHeight ?? 68);
  const [letterSpacing, setLetterSpacing] = useState(saved?.letterSpacing ?? 0);
  const [durationPerLetterMs, setDurationPerLetterMs] = useState(saved?.durationPerLetterMs ?? 320);
  const [initialDelayMs, setInitialDelayMs] = useState(saved?.initialDelayMs ?? 300);
  const [strokeWidth, setStrokeWidth] = useState(saved?.strokeWidth ?? 2);
  const [overlapRatio, setOverlapRatio] = useState(saved?.overlapRatio ?? 0.58);
  const [color, setColor] = useState(saved?.color ?? '#1a1a2e');
  const [tempoVariation, setTempoVariation] = useState(saved?.tempoVariation ?? defaultPreset.tempo);
  const [pressureVariation, setPressureVariation] = useState(saved?.pressureVariation ?? defaultPreset.pressure);
  const [animKey, setAnimKey] = useState(0);
  const [looping, setLooping] = useState(saved?.looping ?? false);
  const [curve, setCurve] = useState<CurveState>(() => saved?.curve ?? curveFromBezier(defaultPreset.easing));
  const [glyphView, setGlyphView] = useState<GlyphViewMode>(saved?.glyphView ?? 'presets');
  const [examples, setExamples] = useState<ExampleItem[]>(saved?.examples ?? DEFAULT_EXAMPLES);
  const [pkgMgr, setPkgMgr] = useState<'npm' | 'yarn' | 'pnpm'>(saved?.pkgMgr ?? 'npm');
  const nextIdRef = useRef(100);

  const playgroundRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const replay = useCallback(() => setAnimKey((k) => k + 1), []);

  // Show toast if state was restored
  useEffect(() => {
    if (saved) {
      toast.success('Settings restored from last session');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to localStorage on state changes
  useEffect(() => {
    saveState({
      text, letterHeight, letterSpacing, durationPerLetterMs, initialDelayMs,
      strokeWidth, overlapRatio, color, tempoVariation, pressureVariation,
      curve, looping, glyphView, examples, pkgMgr,
    });
  }, [text, letterHeight, letterSpacing, durationPerLetterMs, initialDelayMs,
      strokeWidth, overlapRatio, color, tempoVariation, pressureVariation,
      curve, looping, glyphView, examples, pkgMgr]);

  const resetAll = useCallback(() => {
    const dp = SIGNATURE_PRESETS[0];
    clearSavedState();
    setText('');
    setInputText('');
    setLetterHeight(68);
    setLetterSpacing(0);
    setDurationPerLetterMs(320);
    setInitialDelayMs(300);
    setStrokeWidth(2);
    setOverlapRatio(0.58);
    setColor('#1a1a2e');
    setTempoVariation(dp.tempo);
    setPressureVariation(dp.pressure);
    setLooping(false);
    setCurve(curveFromBezier(dp.easing));
    setGlyphView('presets');
    setExamples(DEFAULT_EXAMPLES);
    setPkgMgr('npm');
    replay();
    toast.success('Reset to defaults');
  }, [replay]);

  const playgroundCtrl = useAnimationControl(playgroundRef, animKey);
  const examplesCtrl = useAnimationControl(examplesRef, animKey);

  // Apply curve changes — easing is set via prop, so just update state + replay
  const handleCurveChange = useCallback((c: CurveState) => {
    setCurve({ ...c, sy: 0, ey: 1 });
    replay();
  }, [replay]);

  const applyEasingPreset = useCallback((p: BezierPoints) => {
    setCurve(curveFromBezier(p));
    replay();
  }, [replay]);

  const applySignaturePreset = useCallback((p: SignaturePreset) => {
    setCurve(curveFromBezier(p.easing));
    setTempoVariation(p.tempo);
    setPressureVariation(p.pressure);
    replay();
  }, [replay]);

  // Loop mode: poll for animations finished in both sections, then replay
  useEffect(() => {
    if (!looping) return;
    const id = setInterval(() => {
      const checkFinished = (el: HTMLElement | null) => {
        if (!el) return true;
        const anims = Array.from(el.querySelectorAll('.hws-path'))
          .flatMap((p) => p.getAnimations());
        return anims.length === 0 || anims.every((a) => a.playState === 'finished');
      };
      if (checkFinished(playgroundRef.current) && checkFinished(examplesRef.current)) {
        replay();
      }
    }, 300);
    return () => clearInterval(id);
  }, [looping, replay]);

  const label = curveLabel(curve);

  return (
    <div style={{ paddingTop: 40 }}>
      {/* Install command */}
      <InstallBlock pkgMgr={pkgMgr} setPkgMgr={setPkgMgr} />

      {/* Hero input */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <label
          htmlFor="sig-input"
          style={{ display: 'block', fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          Type anything
        </label>
        <input
          id="sig-input"
          type="text"
          value={inputText}
          onChange={(e) => {
            const v = e.target.value;
            setInputText(v);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => { setText(v); replay(); }, 300);
          }}
          placeholder="Your name here..."
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          autoFocus
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '14px 20px',
            fontSize: 18,
            fontFamily: 'var(--font)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            outline: 'none',
            textAlign: 'center',
            background: 'var(--surface-input)',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#bbb'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = ''; }}
        />
      </div>

      {/* Preview + transport */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
        <div ref={playgroundRef} style={{
          padding: '56px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 180,
        }}>
          <HandwrittenSignature
            key={animKey}
            text={text}
            letterHeight={letterHeight}
            letterSpacing={letterSpacing}
            durationPerLetterMs={durationPerLetterMs}
            initialDelayMs={initialDelayMs}
            strokeWidth={strokeWidth}
            overlapRatio={overlapRatio}
            easing={formatBezier([curve.x1, curve.y1, curve.x2, curve.y2])}
            tempoVariation={tempoVariation}
            pressureVariation={pressureVariation}
            style={{ color }}
          />
        </div>
        <TransportBar ctrl={playgroundCtrl} onReplay={replay} />
      </div>

      {/* All controls — collapsible */}
      <details style={{ marginBottom: 32 }} className="controls-panel">
        <summary style={{
          cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
          letterSpacing: '0.02em', userSelect: 'none', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          listStyle: 'none',
        }}>
          <svg className="controls-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s' }}>
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Controls
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
            {label} · {formatBezier([curve.x1, curve.y1, curve.x2, curve.y2])}
          </span>
        </summary>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 24,
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          alignItems: 'start',
        }}>
          {/* Curve graph */}
          <div>
            <InlineCurveEditor curve={curve} onChange={handleCurveChange} />
          </div>

          {/* All controls in one column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Timing</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={resetAll}
                  style={{
                    padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    background: 'var(--surface)',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={() => { setLooping((l) => !l); if (!looping) replay(); }}
                  style={{
                    padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font)',
                    border: '1px solid',
                    borderColor: looping ? 'var(--accent)' : 'var(--border)',
                    borderRadius: 20,
                    background: looping ? 'var(--accent)' : 'var(--surface)',
                    color: looping ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {looping ? '⟳ Looping' : '⟳ Loop'}
                </button>
              </div>
            </div>

            {/* Signature style presets */}
            <div>
              <div style={sectionLabelStyle}>Style</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SIGNATURE_PRESETS.map((p) => {
                  const cp: BezierPoints = [curve.x1, curve.y1, curve.x2, curve.y2];
                  const easingMatch = p.easing.every((v, i) => Math.abs(v - cp[i]) < 0.01);
                  const active = easingMatch
                    && Math.abs(tempoVariation - p.tempo) < 0.02
                    && Math.abs(pressureVariation - p.pressure) < 0.02;
                  return (
                    <button
                      key={p.label}
                      onClick={() => applySignaturePreset(p)}
                      title={p.description}
                      style={{
                        padding: '5px 12px', fontSize: 12, fontFamily: 'var(--font)',
                        border: '1px solid',
                        borderColor: active ? 'var(--accent)' : 'var(--border)',
                        borderRadius: 6,
                        background: active ? 'var(--accent)' : 'var(--surface)',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders — 2-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              <SliderControl label="Overlap" value={overlapRatio} min={0} max={0.9} step={0.01} onChange={(v) => { setOverlapRatio(v); replay(); }} />
              <SliderControl label="Tempo" value={tempoVariation} min={0} max={1} step={0.05} onChange={(v) => { setTempoVariation(v); replay(); }} />
              <SliderControl label="Pressure" value={pressureVariation} min={0} max={1} step={0.05} onChange={(v) => { setPressureVariation(v); replay(); }} />
              <SliderControl label="Duration / Letter" value={durationPerLetterMs} min={50} max={1000} step={10} suffix="ms" onChange={(v) => { setDurationPerLetterMs(v); replay(); }} />
              <SliderControl label="Stroke Width" value={strokeWidth} min={0.5} max={6} step={0.5} onChange={(v) => { setStrokeWidth(v); replay(); }} />
              <SliderControl label="Letter Height" value={letterHeight} min={20} max={200} suffix="px" onChange={(v) => { setLetterHeight(v); replay(); }} />
              <SliderControl label="Letter Spacing" value={letterSpacing} min={-10} max={20} suffix="px" onChange={(v) => { setLetterSpacing(v); replay(); }} />
              <SliderControl label="Initial Delay" value={initialDelayMs} min={0} max={2000} step={50} suffix="ms" onChange={(v) => { setInitialDelayMs(v); replay(); }} />
            </div>

            {/* Color + easing-only presets */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <div style={sectionLabelStyle}>Color</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={color} onChange={(e) => { setColor(e.target.value); replay(); }} style={{ width: 32, height: 28, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
                  <input type="text" value={color} onChange={(e) => { setColor(e.target.value); replay(); }} style={{ ...textInputStyle, width: 80, fontFamily: 'monospace', fontSize: 11, padding: '4px 8px' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={sectionLabelStyle}>Easing Only</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {EASING_PRESETS.map((p) => {
                    const cp: BezierPoints = [curve.x1, curve.y1, curve.x2, curve.y2];
                    const active = p.value.every((v, i) => Math.abs(v - cp[i]) < 0.01);
                    return (
                      <button
                        key={p.label}
                        onClick={() => applyEasingPreset(p.value)}
                        style={{
                          padding: '3px 8px', fontSize: 10, fontFamily: 'var(--font)',
                          border: '1px solid',
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                          borderRadius: 4,
                          background: active ? 'var(--accent)' : 'var(--surface)',
                          color: active ? '#fff' : 'var(--text-tertiary)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={sectionLabelStyle}>Speed</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {SPEED_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => playgroundCtrl.changeSpeed(o.value)}
                      style={{
                        padding: '3px 8px', fontSize: 10, fontFamily: 'var(--font)',
                        border: '1px solid',
                        borderColor: playgroundCtrl.speed === o.value ? 'var(--accent)' : 'var(--border)',
                        borderRadius: 4,
                        background: playgroundCtrl.speed === o.value ? 'var(--accent)' : 'var(--surface)',
                        color: playgroundCtrl.speed === o.value ? '#fff' : 'var(--text-tertiary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* Examples */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ ...sectionHeadingStyle, marginBottom: 0 }}>Examples</h2>
          <SegmentedControl
            options={[
              { value: 'presets', label: 'Presets' },
              { value: 'names', label: 'Names' },
              { value: 'alphabet', label: 'Alphabet' },
              { value: 'pairs', label: 'Pairs' },
            ]}
            value={glyphView}
            onChange={(v) => { setGlyphView(v as GlyphViewMode); replay(); }}
          />
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <TransportBar ctrl={examplesCtrl} onReplay={replay} />
          <div ref={examplesRef}>
            {glyphView === 'presets' && (
              <ExamplesGrid
                examples={examples}
                setExamples={setExamples}
                nextIdRef={nextIdRef}
                animKey={animKey}
                letterHeight={letterHeight}
                durationPerLetterMs={durationPerLetterMs}
                initialDelayMs={initialDelayMs}
                strokeWidth={strokeWidth}
                overlapRatio={overlapRatio}
                easing={formatBezier([curve.x1, curve.y1, curve.x2, curve.y2])}
                tempoVariation={tempoVariation}
                pressureVariation={pressureVariation}
                color={color}
              />
            )}
            {glyphView === 'names' && <NamesGrid animKey={animKey} />}
            {glyphView === 'alphabet' && <AlphabetGrid animKey={animKey} />}
            {glyphView === 'pairs' && <PairsGrid animKey={animKey} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function SliderControl({
  label, value, min, max, step = 1, suffix = '', onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void;
}) {
  const display = step < 1 ? value.toFixed(2) : value;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={controlLabelStyle}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{display}{suffix}</div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }} />
    </div>
  );
}

// ── Draggable Examples Grid ─────────────────────────────────────────

function ExamplesGrid({
  examples, setExamples, nextIdRef, animKey,
  letterHeight, durationPerLetterMs, initialDelayMs, strokeWidth,
  overlapRatio, easing, tempoVariation, pressureVariation, color,
}: {
  examples: ExampleItem[];
  setExamples: React.Dispatch<React.SetStateAction<ExampleItem[]>>;
  nextIdRef: React.MutableRefObject<number>;
  animKey: number;
  letterHeight: number; durationPerLetterMs: number; initialDelayMs: number;
  strokeWidth: number; overlapRatio: number; easing: string;
  tempoVariation: number; pressureVariation: number; color: string;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [newText, setNewText] = useState('');

  const addExample = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    nextIdRef.current++;
    setExamples((prev) => [...prev, { id: `custom-${nextIdRef.current}`, text: trimmed }]);
    setNewText('');
  };

  const removeExample = (id: string) => {
    setExamples((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  };

  const handleDrop = (targetIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    setExamples((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, background: 'var(--border)' }}>
        {examples.map((ex, idx) => (
          <div
            key={`${ex.id}-${animKey}`}
            draggable
            onDragStart={handleDragStart(idx)}
            onDragOver={handleDragOver(idx)}
            onDrop={handleDrop(idx)}
            onDragEnd={handleDragEnd}
            style={{
              background: 'var(--surface)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flex: '1 0 auto',
              minWidth: 0,
              cursor: 'grab',
              opacity: dragIdx === idx ? 0.4 : 1,
              outline: overIdx === idx && dragIdx !== idx ? '2px solid var(--accent)' : 'none',
              outlineOffset: -2,
              transition: 'opacity 0.15s',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--border)', cursor: 'grab', fontSize: 14, lineHeight: 1 }}>&#x2630;</span>
                {ex.text}
              </div>
              <button
                onClick={() => removeExample(ex.id)}
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1,
                  padding: '2px 4px', borderRadius: 4, opacity: 0.5,
                }}
                title="Remove"
              >
                &times;
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <HandwrittenSignature
                text={ex.text}
                letterHeight={letterHeight}
                durationPerLetterMs={durationPerLetterMs}
                initialDelayMs={initialDelayMs}
                strokeWidth={strokeWidth}
                overlapRatio={overlapRatio}
                easing={easing}
                tempoVariation={tempoVariation}
                pressureVariation={pressureVariation}
                style={{ color }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Add new example */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface-raised)',
      }}>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addExample(); }}
          placeholder="Add a name..."
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          style={{
            flex: 1, padding: '6px 12px', fontSize: 13,
            fontFamily: 'var(--font)', border: '1px solid var(--border)',
            borderRadius: 6, outline: 'none', background: 'var(--surface-input)',
          }}
        />
        <button
          onClick={addExample}
          disabled={!newText.trim()}
          style={{
            padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font)',
            border: '1px solid var(--border)', borderRadius: 6,
            background: newText.trim() ? 'var(--accent)' : 'var(--surface)',
            color: newText.trim() ? '#fff' : 'var(--text-tertiary)',
            cursor: newText.trim() ? 'pointer' : 'default',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Install Block ───────────────────────────────────────────────────

const INSTALL_COMMANDS = {
  npm: 'npm install @congresswiki/handwritten-signature',
  yarn: 'yarn add @congresswiki/handwritten-signature',
  pnpm: 'pnpm add @congresswiki/handwritten-signature',
} as const;

function InstallBlock({
  pkgMgr, setPkgMgr,
}: {
  pkgMgr: 'npm' | 'yarn' | 'pnpm';
  setPkgMgr: (v: 'npm' | 'yarn' | 'pnpm') => void;
}) {
  const [copied, setCopied] = useState(false);
  const cmd = INSTALL_COMMANDS[pkgMgr];

  const copy = useCallback(() => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [cmd]);

  return (
    <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'stretch',
        border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
        fontSize: 13, maxWidth: '100%',
      }}>
        {(['npm', 'yarn', 'pnpm'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setPkgMgr(m)}
            style={{
              padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font)',
              border: 'none', borderRight: '1px solid var(--border)',
              background: pkgMgr === m ? 'var(--accent)' : 'var(--surface-raised)',
              color: pkgMgr === m ? '#fff' : 'var(--text-tertiary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {m}
          </button>
        ))}
        <code
          style={{
            padding: '6px 14px', fontFamily: 'monospace', fontSize: 12,
            color: 'var(--text-primary)', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
            userSelect: 'all',
          }}
        >
          {cmd}
        </code>
        <button
          onClick={copy}
          style={{
            padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font)',
            border: 'none', borderLeft: '1px solid var(--border)',
            background: 'var(--surface-raised)', color: 'var(--text-tertiary)',
            cursor: 'pointer', minWidth: 56,
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ── Glyph Test ──────────────────────────────────────────────────────

const TEST_NAMES = [
  'Adam Schiff', 'Alexandria Ocasio-Cortez', 'Barbara Boxer', 'Byron Donalds',
  'Chuck Grassley', 'Cynthia Lummis', 'Dan Crenshaw', 'Debbie Dingell',
  'Ed Markey', 'Elizabeth Warren', 'Frank Pallone', 'Frederica Wilson',
  'Greg Pence', 'Gwen Moore', 'Hakeem Jeffries', 'Henry Cuellar',
  'Ilhan Omar', 'Issa Rae', 'Jim Jordan', 'Jake Auchincloss',
  'Kevin McCarthy', 'Katie Porter', 'Lloyd Doggett', 'Liz Cheney',
  'Mitch McConnell', 'Mike Quigley', 'Nancy Pelosi', 'Nydia Velazquez',
  'Olympia Snowe', 'Omar Navarro', 'Pete Buttigieg', 'Pramila Jayapal',
  'Quincy Adams', 'Ralph Waldo', 'Ro Khanna', 'Steve Scalise',
  'Suzan DelBene', 'Tim Kaine', 'Thomas Jeb Hensarling', 'Ted Cruz',
  'Ulysses Grant', 'Val Demings', 'Veronica Escobar', 'Xavier Becerra',
  'Yvette Clarke', 'Zachary Taylor', 'Zoe Lofgren', 'Whitney Fox',
];
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const SYMBOLS = ".-'";

function NamesGrid({ animKey }: { animKey: number }) {
  return (
    <div style={gridStyle('320px')}>
      {TEST_NAMES.map((name) => (
        <div key={`${name}-${animKey}`} style={{ background: 'var(--surface)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{name}</div>
          <HandwrittenSignature text={name} letterHeight={44} durationPerLetterMs={200} initialDelayMs={100} strokeWidth={1.8} />
        </div>
      ))}
    </div>
  );
}

function AlphabetGrid({ animKey }: { animKey: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={glyphSectionLabel}>Uppercase</div>
        <div style={gridStyle('80px')}>
          {Array.from(ALPHA_UPPER).map((ch) => (
            <div key={`${ch}-${animKey}`} style={glyphCellStyle}>
              <div style={glyphCharLabel}>{ch}</div>
              <HandwrittenSignature text={ch} letterHeight={48} durationPerLetterMs={400} initialDelayMs={100} strokeWidth={2} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={glyphSectionLabel}>Lowercase</div>
        <div style={gridStyle('60px')}>
          {Array.from(ALPHA_LOWER).map((ch) => (
            <div key={`${ch}-${animKey}`} style={glyphCellStyle}>
              <div style={glyphCharLabel}>{ch}</div>
              <HandwrittenSignature text={ch} letterHeight={48} durationPerLetterMs={400} initialDelayMs={100} strokeWidth={2} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={glyphSectionLabel}>Symbols</div>
        <div style={{ ...gridStyle('80px'), maxWidth: 320 }}>
          {Array.from(SYMBOLS).map((ch) => (
            <div key={`${ch}-${animKey}`} style={glyphCellStyle}>
              <div style={glyphCharLabel}>{ch}</div>
              <HandwrittenSignature text={ch === "'" ? "it's" : `A${ch}B`} letterHeight={48} durationPerLetterMs={400} initialDelayMs={100} strokeWidth={2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PairsGrid({ animKey }: { animKey: number }) {
  const pairs = useMemo(() => {
    const result: string[] = [];
    const testLower = ['a', 'e', 'o', 'i', 'l'];
    for (const upper of Array.from(ALPHA_UPPER)) {
      for (const lower of testLower) result.push(`${upper}${lower}`);
    }
    return result;
  }, []);
  return (
    <div>
      <div style={glyphSectionLabel}>Uppercase + lowercase pairs — check kerning</div>
      <div style={gridStyle('110px')}>
        {pairs.map((pair) => (
          <div key={`${pair}-${animKey}`} style={{ ...glyphCellStyle, padding: '14px 10px', gap: 4 }}>
            <div style={glyphCharLabel}>{pair}</div>
            <HandwrittenSignature text={pair} letterHeight={36} durationPerLetterMs={250} initialDelayMs={0} strokeWidth={1.8} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font)',
            border: 'none', borderRight: '1px solid var(--border)',
            background: value === opt.value ? 'var(--accent)' : 'var(--surface)',
            color: value === opt.value ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function gridStyle(minCol: string): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}, 1fr))`,
    gap: 1,
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    background: 'var(--border)',
  };
}

const glyphSectionLabel: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.04em',
  textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
};

const glyphCellStyle: React.CSSProperties = {
  background: 'var(--surface)', padding: '16px 8px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
};

const glyphCharLabel: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace',
};

// ── Styles ──────────────────────────────────────────────────────────

const controlLabelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6,
};

const textInputStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 14, border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', outline: 'none', background: 'var(--surface-input)',
};

const sectionSummaryStyle: React.CSSProperties = {
  cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)',
  letterSpacing: '0.04em', textTransform: 'uppercase', userSelect: 'none', marginBottom: 20,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.04em',
  textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.04em',
  textTransform: 'uppercase', marginBottom: 8, fontWeight: 500,
};
