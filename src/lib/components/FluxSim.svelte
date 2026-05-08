<!-- src/lib/components/FluxSim.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Zap, ZapOff, Info } from 'lucide-svelte';

  let { intensity = $bindable(50), isAC = $bindable(true) } = $props();

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number | null = null;
  let particles: Array<{ progress: number; offset: number }> = [];
  let time = 0;

  // Fixed internal canvas dimensions (drawing space)
  const CANVAS_W = 600;
  const CANVAS_H = 400;
  const core = { x: 100, y: 100, w: 400, h: 200, thickness: 40 };

  function initParticles() {
    particles = Array.from({ length: 80 }, () => ({
      progress: Math.random(),
      offset: (Math.random() - 0.5) * 30
    }));
  }

  /** Maps progress 0–1 to (x,y) along the rectangular loop */
  function getPathPos(t: number, offset: number): { x: number; y: number } {
    t = ((t % 1) + 1) % 1;
    let x: number, y: number;

    if (t < 0.25) {
      x = core.x + (t / 0.25) * core.w;
      y = core.y + offset;
    } else if (t < 0.5) {
      x = core.x + core.w + offset;
      y = core.y + ((t - 0.25) / 0.25) * core.h;
    } else if (t < 0.75) {
      x = core.x + core.w - ((t - 0.5) / 0.25) * core.w;
      y = core.y + core.h + offset;
    } else {
      x = core.x + offset;
      y = core.y + core.h - ((t - 0.75) / 0.25) * core.h;
    }
    return { x, y };
  }

  function animate() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Iron core frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = core.thickness;
    ctx.lineJoin = 'round';
    ctx.strokeRect(core.x, core.y, core.w, core.h);

    // Inner glow
    ctx.strokeStyle = isAC ? '#67e8f9' : '#f472b6';
    ctx.lineWidth = 8;
    ctx.globalAlpha = intensity / 200;
    ctx.strokeRect(core.x + 15, core.y + 15, core.w - 30, core.h - 30);
    ctx.globalAlpha = 1;

    // Core label
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('IRON CORE', CANVAS_W / 2, CANVAS_H / 2 + 5);

    // Time & velocity
    time += 0.016;
    const speedFactor = isAC
      ? Math.sin(time * 3) * (intensity / 600)
      : intensity / 800;

    // Particles
    ctx.shadowBlur = 12;
    for (const p of particles) {
      p.progress += speedFactor + 0.008;
      const pos = getPathPos(p.progress, p.offset);
      const color = isAC && speedFactor < 0 ? '#f87171' : '#67e8f9';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Direction arrows on core sides
    const arrowColor = isAC && speedFactor < 0 ? '#f87171' : '#67e8f9';
    ctx.fillStyle = arrowColor;
    ctx.globalAlpha = 0.5 + Math.abs(speedFactor) * 3;
    drawArrow(ctx, core.x + core.w / 2, core.y - core.thickness / 2, isAC && speedFactor < 0 ? 'left' : 'right');
    drawArrow(ctx, core.x + core.w / 2, core.y + core.h + core.thickness / 2, isAC && speedFactor < 0 ? 'right' : 'left');
    ctx.globalAlpha = 1;

    animationFrame = requestAnimationFrame(animate);
  }

  function drawArrow(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: 'left' | 'right'
  ) {
    const size = 8;
    c.beginPath();
    if (dir === 'right') {
      c.moveTo(x - size, y - size / 2);
      c.lineTo(x + size, y);
      c.lineTo(x - size, y + size / 2);
    } else {
      c.moveTo(x + size, y - size / 2);
      c.lineTo(x - size, y);
      c.lineTo(x + size, y + size / 2);
    }
    c.closePath();
    c.fill();
  }

  onMount(() => {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    initParticles();
    animate();
  });

  onDestroy(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });
</script>

<div class="flux-container">
  <!-- Canvas -->
  <div class="canvas-wrap">
    <canvas bind:this={canvas} class="flux-canvas"></canvas>
  </div>

  <!-- Controls -->
  <div class="controls">
    <div class="control-group">
      <label class="ctrl-label">Flux Intensity</label>
      <div class="slider-row">
        <input
          type="range"
          bind:value={intensity}
          min="0"
          max="200"
          class="slider"
        />
        <span class="badge">{intensity}</span>
      </div>
      <span class="hint">Higher intensity = stronger magnetic flux</span>
    </div>

    <button
      class="mode-btn"
      class:ac={isAC}
      class:dc={!isAC}
      onclick={() => (isAC = !isAC)}
    >
      {#if isAC}
        <Zap size={16} />
        Alternating Current (AC)
      {:else}
        <ZapOff size={16} />
        Direct Current (DC)
      {/if}
    </button>
  </div>

  <!-- Info note -->
  <div class="note" class:note-dc={!isAC}>
    <Info size={16} class="note-icon" />
    <p class="note-text">
      {#if isAC}
        <strong>AC Mode:</strong> Particles oscillate back and forth, changing direction with the alternating current — mirroring real transformer flux behaviour.
      {:else}
        <strong>DC Mode:</strong> Particles flow in a single direction, showing constant magnetic flux. Note: DC cannot induce a changing EMF, so transformers require AC.
      {/if}
    </p>
  </div>
</div>

<style>
  .flux-container {
    background: linear-gradient(135deg, #0a0f1a 0%, #0a0a0f 100%);
    border-radius: 24px;
    padding: 1.5rem;
    border: 1px solid rgba(103, 232, 249, 0.12);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Canvas */
  .canvas-wrap {
    width: 100%;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid rgba(103, 232, 249, 0.15);
    background: #0d1117;
    box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.5);
  }

  .flux-canvas {
    display: block;
    width: 100%;
    height: auto;
  }

  /* Controls row */
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    align-items: flex-end;
  }

  .control-group {
    flex: 1;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .ctrl-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(103, 232, 249, 0.75);
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .slider {
    flex: 1;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
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
    box-shadow: 0 0 8px #67e8f9;
    border: none;
  }

  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #67e8f9;
    cursor: pointer;
    box-shadow: 0 0 8px #67e8f9;
    border: none;
  }

  .badge {
    background: rgba(103, 232, 249, 0.12);
    padding: 0.2rem 0.55rem;
    border-radius: 20px;
    font-family: 'Space Mono', monospace;
    font-size: 0.78rem;
    font-weight: 600;
    color: #67e8f9;
    min-width: 42px;
    text-align: center;
    flex-shrink: 0;
  }

  .hint {
    font-size: 0.63rem;
    color: rgba(255, 255, 255, 0.28);
    font-family: 'Space Mono', monospace;
  }

  /* Mode toggle */
  .mode-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.4rem;
    border-radius: 40px;
    font-weight: 600;
    font-size: 0.82rem;
    border: 1px solid rgba(103, 232, 249, 0.3);
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease;
    white-space: nowrap;
  }

  .mode-btn.ac {
    background: rgba(103, 232, 249, 0.1);
    color: #67e8f9;
    border-color: rgba(103, 232, 249, 0.3);
  }

  .mode-btn.dc {
    background: rgba(244, 114, 182, 0.1);
    color: #f472b6;
    border-color: rgba(244, 114, 182, 0.3);
  }

  .mode-btn:hover {
    transform: translateY(-2px);
  }

  .mode-btn.ac:hover { background: rgba(103, 232, 249, 0.2); }
  .mode-btn.dc:hover { background: rgba(244, 114, 182, 0.2); }

  /* Info note */
  .note {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    background: rgba(103, 232, 249, 0.05);
    border-left: 3px solid #67e8f9;
    border-radius: 0 10px 10px 0;
  }

  .note.note-dc {
    background: rgba(244, 114, 182, 0.05);
    border-left-color: #f472b6;
  }

  :global(.note-icon) {
    color: #67e8f9;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .note.note-dc :global(.note-icon) {
    color: #f472b6;
  }

  .note-text {
    font-size: 0.73rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.55);
    margin: 0;
  }

  .note-text strong {
    color: #67e8f9;
  }

  .note.note-dc .note-text strong {
    color: #f472b6;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .flux-container { padding: 1rem; border-radius: 16px; }
    .controls { flex-direction: column; align-items: stretch; }
    .control-group { min-width: unset; }
    .mode-btn { justify-content: center; width: 100%; }
  }
</style>