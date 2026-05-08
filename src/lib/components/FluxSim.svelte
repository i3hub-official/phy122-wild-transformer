<!-- src/lib/components/FluxSim.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Zap, ZapOff, Info, Eye, EyeOff, RotateCcw } from 'lucide-svelte';

  let { intensity = $bindable(50), isAC = $bindable(true) } = $props();

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number | null = null;
  let particles: Array<{ progress: number; offset: number }> = [];
  let time = 0;
  let showCoils = $state(true);
  let inputPhase = $state(0);
  let fluxValue = $state(0);
  let inducedVoltage = $state(0);

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

  function resetParticles() {
    initParticles();
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

  function drawCoil(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    isLeft: boolean
  ) {
    c.save();
    c.globalAlpha = 0.8;
    const turns = 8;
    const stepY = height / (turns * 2);
    
    for (let i = 0; i < turns; i++) {
      const yPos = y + i * stepY * 2 + stepY;
      c.beginPath();
      
      if (isLeft) {
        // Left coil (primary) - wraps around core left side, positioned closer
        c.ellipse(x + width, yPos, width, stepY * 0.8, 0, 0, Math.PI * 2);
      } else {
        // Right coil (secondary) - wraps around core right side, positioned closer
        c.ellipse(x, yPos, width, stepY * 0.8, 0, 0, Math.PI * 2);
      }
      c.strokeStyle = color;
      c.lineWidth = 2.5;
      c.stroke();
    }
    c.restore();
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
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MAGNETIC CORE', CANVAS_W / 2, CANVAS_H / 2 + 5);

    // Draw coils if enabled - MOVED CLOSER TO CORE
    if (showCoils) {
      // Primary coil (left) - moved from -50 to -30 (closer to core)
      drawCoil(ctx, core.x - 30, core.y + 15, 25, core.h - 30, '#f59e0b', true);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRIMARY', core.x - 18, core.y + core.h / 2);
      
      // Secondary coil (right) - moved from +10 to -5 (closer to core)
      drawCoil(ctx, core.x + core.w - 5, core.y + 15, 25, core.h - 30, '#22d3ee', false);
      ctx.fillStyle = '#22d3ee';
      ctx.fillText('SECONDARY', core.x + core.w + 18, core.y + core.h / 2);
    } else {
      // Just text labels
      ctx.fillStyle = 'rgba(245,158,11,0.5)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('PRIMARY', core.x - 18, core.y + core.h / 2);
      ctx.fillStyle = 'rgba(34,211,238,0.5)';
      ctx.fillText('SECONDARY', core.x + core.w + 18, core.y + core.h / 2);
    }

    // Time & velocity
    time += 0.016;
    const speedFactor = isAC
      ? Math.sin(time * 3) * (intensity / 600)
      : intensity / 800;

    // Update live metrics
    inputPhase = isAC ? ((time * 2 * Math.PI * 60) % (2 * Math.PI)) : 0;
    fluxValue = isAC ? Math.sin(time * 2 * Math.PI * 60) * (intensity / 100) : intensity / 100;
    inducedVoltage = isAC ? Math.abs(Math.cos(time * 2 * Math.PI * 60) * fluxValue * 10) : 0;

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
  <!-- Header -->
  <div class="flux-header">
    <h3 class="flux-title">
      {isAC ? 'Transformer Flux & Induction (AC)' : 'Transformer Flux & Induction (DC)'}
    </h3>
    <p class="flux-subtitle">
      {isAC 
        ? 'AC: Changing flux induces alternating voltage in secondary coil.'
        : 'DC: Constant flux. Magnetic field is stationary. No voltage induced in secondary.'}
    </p>
  </div>

  <!-- Canvas & Metrics Row -->
  <div class="visualization-row">
    <!-- Canvas -->
    <div class="canvas-wrap">
      <canvas bind:this={canvas} class="flux-canvas"></canvas>
    </div>

    <!-- Metrics Panel -->
    <div class="metrics-panel">
      <div class="metric-card">
        <div class="metric-label">INPUT PHASE</div>
        <div class="metric-value">
          {isAC ? inputPhase.toFixed(2) + ' rad' : 'Steady'}
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">FLUX (Φ)</div>
        <div class="metric-value" class:ac-value={isAC && fluxValue > 0} class:dc-value={!isAC}>
          {fluxValue.toFixed(2)} Wb
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">INDUCED V</div>
        <div class="metric-value" class:ac-value={inducedVoltage > 0}>
          {inducedVoltage.toFixed(2)} V
        </div>
      </div>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <div class="control-group">
      <label class="ctrl-label">Magnetic Intensity</label>
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
    </div>

    <div class="button-group">
      <button
        class="mode-btn"
        class:ac={isAC}
        class:dc={!isAC}
        onclick={() => (isAC = !isAC)}
      >
        {#if isAC}
          <Zap size={16} />
          AC
        {:else}
          <ZapOff size={16} />
          DC
        {/if}
      </button>

      <button
        class="action-btn"
        onclick={() => (showCoils = !showCoils)}
      >
        {#if showCoils}
          <Eye size={16} />
          Hide Coils
        {:else}
          <EyeOff size={16} />
          Show Coils
        {/if}
      </button>

      <button
        class="action-btn"
        onclick={resetParticles}
      >
        <RotateCcw size={16} />
        Reset Particles
      </button>
    </div>
  </div>

  <!-- Info note -->
  <div class="note" class:note-dc={!isAC}>
    <Info size={16} class="note-icon" />
    <p class="note-text">
      {#if isAC}
        <strong>AC Mode:</strong> Changing magnetic flux induces alternating voltage in the secondary coil. The particles oscillate back and forth, mirroring real transformer behaviour.
      {:else}
        <strong>DC Mode:</strong> Constant magnetic field means no changing flux → no induced voltage. Transformers require AC to function!
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

  /* Header */
  .flux-header {
    text-align: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(103, 232, 249, 0.15);
  }

  .flux-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.3rem 0;
    background: linear-gradient(135deg, #67e8f9, #a855f7);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .flux-subtitle {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0;
  }

  /* Visualization Row */
  .visualization-row {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  /* Canvas */
  .canvas-wrap {
    flex: 2;
    min-width: 300px;
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

  /* Metrics Panel */
  .metrics-panel {
    flex: 1;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .metric-card {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    padding: 0.75rem;
    border: 1px solid rgba(103, 232, 249, 0.1);
    text-align: center;
  }

  .metric-label {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 0.4rem;
  }

  .metric-value {
    font-size: 1.1rem;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
    color: #67e8f9;
  }

  .metric-value.ac-value {
    color: #67e8f9;
    text-shadow: 0 0 8px rgba(103, 232, 249, 0.3);
  }

  .metric-value.dc-value {
    color: #f472b6;
  }

  /* Controls */
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    align-items: flex-end;
    justify-content: space-between;
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

  .button-group {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Mode toggle */
  .mode-btn, .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    border-radius: 40px;
    font-weight: 600;
    font-size: 0.78rem;
    border: 1px solid rgba(103, 232, 249, 0.3);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    background: rgba(103, 232, 249, 0.08);
    color: #67e8f9;
  }

  .mode-btn.ac {
    background: rgba(103, 232, 249, 0.12);
    color: #67e8f9;
    border-color: rgba(103, 232, 249, 0.4);
  }

  .mode-btn.dc {
    background: rgba(244, 114, 182, 0.12);
    color: #f472b6;
    border-color: rgba(244, 114, 182, 0.4);
  }

  .action-btn {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
  }

  .mode-btn:hover, .action-btn:hover {
    transform: translateY(-2px);
  }

  .mode-btn.ac:hover { background: rgba(103, 232, 249, 0.2); }
  .mode-btn.dc:hover { background: rgba(244, 114, 182, 0.2); }
  .action-btn:hover { background: rgba(255, 255, 255, 0.1); }

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

  .note-icon {
    flex-shrink: 0;
    margin-top: 1px;
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
  @media (max-width: 768px) {
    .visualization-row {
      flex-direction: column;
    }
    
    .metrics-panel {
      flex-direction: row;
      min-width: auto;
    }
    
    .metric-card {
      flex: 1;
    }
  }

  @media (max-width: 640px) {
    .flux-container { padding: 1rem; border-radius: 16px; }
    .controls { flex-direction: column; align-items: stretch; }
    .control-group { min-width: unset; }
    .button-group { justify-content: center; }
    .mode-btn, .action-btn { justify-content: center; flex: 1; }
    .metrics-panel { flex-direction: column; }
  }
</style>