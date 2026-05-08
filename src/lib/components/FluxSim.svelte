<!-- src/lib/components/FluxSim.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Zap, ZapOff, RotateCcw } from 'lucide-svelte';

  let { intensity = $bindable(50), isAC = $bindable(true) } = $props();

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number | null = null;
  let particles: Array<{ progress: number; offset: number; speed: number }> = [];
  let time = 0;
  let showCoils = $state(true);

  // Live metrics (updated each frame)
  let inputPhase = $state(0);
  let fluxValue  = $state(0);
  let inducedV   = $state(0);

  const CANVAS_W = 600;
  const CANVAS_H = 400;

  // Core rectangle (the iron core frame drawn as a thick stroked rect)
  const core = { x: 110, y: 90, w: 380, h: 220, thickness: 38 };

  // ── Particles ────────────────────────────────────────────────
  function initParticles() {
    particles = Array.from({ length: 90 }, () => ({
      progress: Math.random(),
      offset: (Math.random() - 0.5) * 26,
      speed: 0.6 + Math.random() * 0.8,
    }));
  }

  /** Maps progress 0–1 around the rectangular loop to (x,y) */
  function loopPos(t: number, offset: number): { x: number; y: number } {
    t = ((t % 1) + 1) % 1;
    const { x, y, w, h } = core;
    if (t < 0.25)      return { x: x + (t / 0.25) * w,       y: y + offset };
    if (t < 0.5)       return { x: x + w + offset,             y: y + ((t - 0.25) / 0.25) * h };
    if (t < 0.75)      return { x: x + w - ((t - 0.5) / 0.25) * w, y: y + h + offset };
    return               { x: x + offset,                      y: y + h - ((t - 0.75) / 0.25) * h };
  }

  // ── Coil drawing (helical look) ──────────────────────────────
  function drawHelix(
    c: CanvasRenderingContext2D,
    cx: number,      // center x of coil column
    y0: number,      // top y
    height: number,
    color: string,
    turns: number = 10
  ) {
    const stepY = height / (turns * 2);
    const rx = 22, ry = stepY * 0.85;

    c.save();
    c.strokeStyle = color;
    c.lineWidth = 2.2;
    c.shadowColor = color;
    c.shadowBlur = 6;

    for (let i = 0; i < turns; i++) {
      const yc = y0 + i * stepY * 2 + stepY;
      // front half (solid)
      c.globalAlpha = 0.9;
      c.beginPath();
      c.ellipse(cx, yc, rx, ry, 0, Math.PI, 0); // top arc (front)
      c.stroke();

      // back half (dimmer = behind core)
      c.globalAlpha = 0.28;
      c.beginPath();
      c.ellipse(cx, yc, rx, ry, 0, 0, Math.PI); // bottom arc (back)
      c.stroke();
    }
    c.restore();
  }

  // ── Arrow helper ─────────────────────────────────────────────
  function drawArrow(
    c: CanvasRenderingContext2D,
    x: number, y: number,
    dir: 'left' | 'right' | 'up' | 'down',
    color: string,
    alpha: number
  ) {
    const s = 9;
    c.save();
    c.fillStyle = color;
    c.globalAlpha = alpha;
    c.shadowColor = color;
    c.shadowBlur = 8;
    c.beginPath();
    switch (dir) {
      case 'right': c.moveTo(x-s,y-s/2); c.lineTo(x+s,y); c.lineTo(x-s,y+s/2); break;
      case 'left':  c.moveTo(x+s,y-s/2); c.lineTo(x-s,y); c.lineTo(x+s,y+s/2); break;
      case 'up':    c.moveTo(x-s/2,y+s); c.lineTo(x,y-s); c.lineTo(x+s/2,y+s); break;
      case 'down':  c.moveTo(x-s/2,y-s); c.lineTo(x,y+s); c.lineTo(x+s/2,y-s); break;
    }
    c.closePath();
    c.fill();
    c.restore();
  }

  // ── Pill label ───────────────────────────────────────────────
  function drawPill(
    c: CanvasRenderingContext2D,
    text: string,
    cx: number, cy: number,
    color: string
  ) {
    const pad = 10, h = 20;
    const w = c.measureText(text).width + pad * 2;
    c.save();
    c.fillStyle = '#0d1117';
    c.strokeStyle = color;
    c.lineWidth = 1.5;
    c.shadowColor = color;
    c.shadowBlur = 6;
    const r = h / 2;
    c.beginPath();
    c.roundRect(cx - w/2, cy - r, w, h, r);
    c.fill();
    c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = color;
    c.font = 'bold 10px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, cx, cy);
    c.restore();
  }

  // ── Main render loop ─────────────────────────────────────────
  function animate() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // ── Grid ──
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < CANVAS_W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CANVAS_H); ctx.stroke();
    }
    for (let gy = 0; gy < CANVAS_H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CANVAS_W, gy); ctx.stroke();
    }

    // ── Iron core (thick rounded rect stroke) ──
    ctx.save();
    ctx.strokeStyle = '#2d3a4a';
    ctx.lineWidth = core.thickness;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(100,130,180,0.2)';
    ctx.shadowBlur = 18;
    ctx.strokeRect(core.x, core.y, core.w, core.h);
    ctx.restore();

    // Core inner highlight glow
    const acColor = isAC ? '#67e8f9' : '#f472b6';
    ctx.save();
    ctx.strokeStyle = acColor;
    ctx.lineWidth = 5;
    ctx.globalAlpha = (intensity / 200) * 0.7;
    ctx.shadowColor = acColor;
    ctx.shadowBlur = 14;
    ctx.strokeRect(core.x + 14, core.y + 14, core.w - 28, core.h - 28);
    ctx.restore();

    // ── Flux dots along core horizontals ──
    time += 0.016;
    const omega = 2 * Math.PI * 60;
    const speedFactor = isAC
      ? Math.sin(time * 3) * (intensity / 600)
      : intensity / 800;

    const dotAlpha = 0.25 + Math.abs(speedFactor) * 4;
    const dotColor = isAC && speedFactor < 0 ? '#f87171' : '#67e8f9';
    const dotSpacing = 48;
    const dotY1 = core.y;
    const dotY2 = core.y + core.h;

    for (let dx = core.x + 30; dx < core.x + core.w - 10; dx += dotSpacing) {
      ctx.save();
      ctx.fillStyle = dotColor;
      ctx.globalAlpha = dotAlpha * 0.8;
      ctx.shadowColor = dotColor;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(dx, dotY1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(dx, dotY2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // ── Coils ──
    if (showCoils) {
      const coilTop  = core.y + core.thickness / 2 - 4;
      const coilH    = core.h - core.thickness + 8;
      const leftCX   = core.x;
      const rightCX  = core.x + core.w;

      drawHelix(ctx, leftCX,  coilTop, coilH, '#4dabf7', 10);
      drawHelix(ctx, rightCX, coilTop, coilH, '#69db7c', 10);
    }

    // ── Pill labels ──
    ctx.font = 'bold 10px monospace';
    if (showCoils) {
      drawPill(ctx, 'PRIMARY',   core.x,          core.y - core.thickness / 2 - 18, '#4dabf7');
      drawPill(ctx, 'SECONDARY', core.x + core.w, core.y - core.thickness / 2 - 18, '#69db7c');
    }

    // Core bottom label
    ctx.save();
    ctx.fillStyle = 'rgba(148,163,184,0.55)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Pill for MAGNETIC CORE
    drawPill(ctx, 'MAGNETIC CORE', CANVAS_W / 2, core.y + core.h + core.thickness / 2 + 18, 'rgba(148,163,184,0.5)');
    ctx.restore();

    // ── Particles ──
    ctx.shadowBlur = 10;
    for (const p of particles) {
      p.progress += (speedFactor + 0.007) * p.speed;
      const pos = loopPos(p.progress, p.offset);
      const pColor = isAC && speedFactor < 0 ? '#f87171' : '#67e8f9';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = pColor;
      ctx.shadowColor = pColor;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── Directional arrows ──
    const arrowAlpha = Math.min(0.9, 0.35 + Math.abs(speedFactor) * 6);
    const aColor = isAC && speedFactor < 0 ? '#f87171' : '#67e8f9';
    // top side: left arrow if reversing, right if forward
    drawArrow(ctx, core.x + 40, core.y - core.thickness / 2,
      isAC && speedFactor < 0 ? 'left' : 'right', aColor, arrowAlpha);
    // bottom side: opposite
    drawArrow(ctx, core.x + core.w - 40, core.y + core.h + core.thickness / 2,
      isAC && speedFactor < 0 ? 'right' : 'left', aColor, arrowAlpha);
    // right side: up or down
    drawArrow(ctx, core.x + core.w + core.thickness / 2, core.y + core.h / 2,
      isAC && speedFactor < 0 ? 'down' : 'up', aColor, arrowAlpha * 0.7);

    // ── Update live metrics ──
    inputPhase  = isAC ? ((time * omega) % (2 * Math.PI)) : 0;
    fluxValue   = isAC
      ? Math.sin(time * omega) * (intensity / 100)
      : intensity / 100;
    inducedV    = isAC
      ? Math.abs(Math.cos(time * omega) * fluxValue * 10)
      : 0;

    animationFrame = requestAnimationFrame(animate);
  }

  onMount(() => {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    initParticles();
    animate();
  });

  onDestroy(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });

  // Derived colours for note
  let noteAC = $derived(isAC);
</script>

<!-- ═══════════════════════════════════════════════════════ -->
<div class="flux-root">

  <!-- ── Top bar: title + inline metrics ─────────────────── -->
  <div class="top-bar">
    <div class="title-col">
      <h3 class="title">Transformer Flux &amp; Induction</h3>
      <p class="subtitle">
        {isAC
          ? 'AC: Changing flux induces alternating voltage in secondary coil.'
          : 'DC: Constant flux. No changing field → no induced voltage.'}
      </p>
    </div>
    <div class="metrics-row">
      <div class="metric">
        <span class="m-label">INPUT PHASE</span>
        <span class="m-val">{isAC ? inputPhase.toFixed(2) + ' rad' : 'Steady'}</span>
      </div>
      <div class="metric">
        <span class="m-label">FLUX (Φ)</span>
        <span class="m-val" class:neg={fluxValue < 0}>{fluxValue.toFixed(2)} Wb</span>
      </div>
      <div class="metric">
        <span class="m-label">INDUCED V</span>
        <span class="m-val green">{inducedV.toFixed(2)} V</span>
      </div>
    </div>
  </div>

  <!-- ── Canvas ───────────────────────────────────────────── -->
  <div class="canvas-wrap">
    <canvas bind:this={canvas} class="flux-canvas"></canvas>
  </div>

  <!-- ── Bottom controls bar ──────────────────────────────── -->
  <div class="bottom-bar">

    <!-- Left cluster: Current Type + Show Coils -->
    <div class="left-controls">

      <!-- Current Type: AC / DC pill toggle -->
      <div class="ctrl-item">
        <span class="ctrl-label">Current Type</span>
        <div class="pill-group">
          <button
            class="pill-btn"
            class:active={isAC}
            onclick={() => (isAC = true)}
          >
            <Zap size={13} /> AC
          </button>
          <button
            class="pill-btn"
            class:active={!isAC}
            onclick={() => (isAC = false)}
          >
            <ZapOff size={13} /> DC
          </button>
        </div>
      </div>

      <!-- Show Coils toggle switch -->
      <div class="ctrl-item">
        <span class="ctrl-label">Show Coils</span>
        <button
          class="toggle-switch"
          class:on={showCoils}
          onclick={() => (showCoils = !showCoils)}
          aria-label="Toggle coil visibility"
        >
          <span class="knob"></span>
        </button>
      </div>

    </div>

    <!-- Right cluster: Magnetic Intensity + Reset -->
    <div class="right-controls">
      <div class="ctrl-item">
        <span class="ctrl-label">Magnetic Intensity</span>
        <div class="slider-row">
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            bind:value={intensity}
            class="slider"
          />
          <span class="badge">{intensity}</span>
        </div>
      </div>

      <button
        class="reset-btn"
        onclick={() => initParticles()}
      >
        <RotateCcw size={14} /> Reset Particles
      </button>
    </div>

  </div>

</div>

<style>
  /* ── Root ── */
  .flux-root {
    background: #11151f;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.07);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0;
    font-family: 'Space Mono', monospace;
  }

  /* ── Top bar ── */
  .top-bar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem 0.85rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
  }

  .title-col { display: flex; flex-direction: column; gap: 0.25rem; }

  .title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
    font-family: inherit;
    letter-spacing: -0.01em;
  }

  .subtitle {
    font-size: 0.67rem;
    color: rgba(255,255,255,0.38);
    margin: 0;
    max-width: 340px;
    line-height: 1.4;
  }

  /* Inline metrics */
  .metrics-row {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .metric {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .m-label {
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.32);
    text-transform: uppercase;
  }

  .m-val {
    font-size: 1rem;
    font-weight: 700;
    color: #67e8f9;
    font-family: 'Space Mono', monospace;
    white-space: nowrap;
  }

  .m-val.neg  { color: #f87171; }
  .m-val.green { color: #69db7c; }

  /* ── Canvas ── */
  .canvas-wrap {
    background: #0d1117;
    line-height: 0;
  }

  .flux-canvas {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ── Bottom bar ── */
  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
    padding: 0.9rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
  }

  .left-controls, .right-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .ctrl-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .ctrl-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    white-space: nowrap;
    font-family: inherit;
  }

  /* ── AC / DC pill group ── */
  .pill-group {
    display: flex;
    background: rgba(255,255,255,0.06);
    border-radius: 999px;
    padding: 3px;
    gap: 2px;
  }

  .pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0.3rem 0.85rem;
    border-radius: 999px;
    border: none;
    font-size: 0.75rem;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
    cursor: pointer;
    color: rgba(255,255,255,0.45);
    background: transparent;
    transition: background 0.18s ease, color 0.18s ease;
    white-space: nowrap;
  }

  .pill-btn.active {
    background: #3b82f6;
    color: #fff;
    box-shadow: 0 0 10px rgba(59,130,246,0.5);
  }

  .pill-btn:hover:not(.active) {
    color: rgba(255,255,255,0.75);
    background: rgba(255,255,255,0.08);
  }

  /* ── Toggle switch ── */
  .toggle-switch {
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: rgba(255,255,255,0.12);
    border: none;
    cursor: pointer;
    position: relative;
    transition: background 0.2s ease;
    flex-shrink: 0;
    padding: 0;
  }

  .toggle-switch.on {
    background: #3b82f6;
    box-shadow: 0 0 10px rgba(59,130,246,0.4);
  }

  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
    pointer-events: none;
  }

  .toggle-switch.on .knob {
    transform: translateX(20px);
  }

  /* ── Slider row ── */
  .slider-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .slider {
    width: 130px;
    height: 4px;
    border-radius: 4px;
    background: rgba(255,255,255,0.12);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #67e8f9;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(103,232,249,0.6);
    border: none;
  }

  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #67e8f9;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(103,232,249,0.6);
    border: none;
  }

  .badge {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    padding: 0.15rem 0.55rem;
    border-radius: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: #f1f5f9;
    min-width: 38px;
    text-align: center;
    flex-shrink: 0;
  }

  /* ── Reset button ── */
  .reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 1.1rem;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.65);
    font-family: 'Space Mono', monospace;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease;
    white-space: nowrap;
  }

  .reset-btn:hover {
    background: rgba(255,255,255,0.12);
    color: #fff;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .top-bar { flex-direction: column; }
    .metrics-row { flex-direction: row; align-items: flex-start; justify-content: flex-start; gap: 1rem; }
    .metric { align-items: flex-start; }
    .bottom-bar { flex-direction: column; align-items: flex-start; }
    .left-controls, .right-controls { gap: 1rem; }
    .slider { width: 100px; }
  }

  @media (max-width: 480px) {
    .top-bar, .bottom-bar { padding: 0.85rem 1rem; }
    .left-controls { flex-direction: column; align-items: flex-start; }
    .right-controls { flex-direction: column; align-items: flex-start; width: 100%; }
    .slider { width: 100%; }
    .reset-btn { width: 100%; justify-content: center; }
  }
</style>