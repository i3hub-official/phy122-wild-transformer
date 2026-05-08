<!-- src/lib/components/TransformerSim.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Zap,
    ZapOff,
    TrendingUp,
    TrendingDown,
    Play,
    Pause,
    Gauge,
    Battery,
    Wifi,
    ArrowRight,
    Clock,
    Activity,
    Magnet
  } from 'lucide-svelte';

  let {
    primaryTurns = $bindable(200),
    secondaryTurns = $bindable(20),
    primaryVoltage = $bindable(11000),
    frequency = $bindable(50),
    running = $bindable(true),
    speed = $bindable(1.0)
  } = $props();

  let time = $state(0);
  let animFrame: number | null = null;
  let lastTs: number | null = null;
  let activeLaw = $state<'faraday' | 'lenz'>('faraday');

  // ── Simulation ──────────────────────────────────────────────
  let sim = $derived((() => {
    const turnsRatio = secondaryTurns / primaryTurns;
    const angularFreq = 2 * Math.PI * frequency;
    const instantaneousPrimary = primaryVoltage * Math.sin(angularFreq * time);
    const instantaneousSecondary = instantaneousPrimary * turnsRatio;
    const fluxAmplitude = primaryVoltage / (angularFreq * primaryTurns);
    const instantaneousFlux = fluxAmplitude * Math.sin(angularFreq * time);
    const inducedEMF = -secondaryTurns * (angularFreq * fluxAmplitude) * Math.cos(angularFreq * time);
    return {
      turnsRatio,
      instantaneousPrimary,
      instantaneousSecondary,
      fluxAmplitude,
      instantaneousFlux,
      inducedEMF,
      secondaryVoltage: Math.abs(instantaneousSecondary),
      secondaryRMS: Math.abs(instantaneousSecondary) * 0.707,
      primaryRMS: Math.abs(instantaneousPrimary) * 0.707,
    };
  })());

  let acPhase    = $derived(Math.sin(2 * Math.PI * frequency * time));
  let fluxNorm   = $derived(sim.instantaneousFlux / (sim.fluxAmplitude || 1));
  let glowI      = $derived(Math.abs(fluxNorm));
  let opposition = $derived(Math.sin(2 * Math.PI * frequency * time + Math.PI));
  let emfGlow    = $derived(Math.abs(opposition));

  // ── Animation ───────────────────────────────────────────────
  function animate(ts: number) {
    if (running && lastTs !== null) {
      const dt = Math.min((ts - lastTs) / 1000, 0.05) * speed;
      time += dt;
    }
    lastTs = running ? ts : null;
    animFrame = requestAnimationFrame(animate);
  }

  onMount(() => { animFrame = requestAnimationFrame(animate); });
  onDestroy(() => { if (animFrame !== null) cancelAnimationFrame(animFrame); });

  // ── Helpers ─────────────────────────────────────────────────
  function formatVoltage(v: number) {
    return v >= 1000 ? `${(v / 1000).toFixed(1)}kV` : `${v.toFixed(0)}V`;
  }

  function getSpeedLabel(s: number) {
    if (s === 0) return 'Paused';
    if (s < 0.1) return 'Super Slow-Mo';
    if (s < 0.3) return 'Extreme Slow-Mo';
    if (s < 0.6) return 'Slow Motion';
    if (s === 1) return 'Normal Speed';
    if (s < 1.5) return 'Fast';
    if (s < 2) return 'Turbo';
    return 'Ludicrous Speed';
  }

  let SpeedIcon = $derived(
    speed === 0 ? ZapOff :
    speed < 0.6 ? Clock :
    speed === 1 ? Activity :
    speed < 2 ? Gauge : Zap
  );

  // ── Coil path generators ─────────────────────────────────────
  function primaryCoilPath(turns: number): string {
    const n = Math.min(Math.max(Math.round(turns / 10), 3), 20);
    const startX = 60, endX = 240, centerY = 200, h = 60;
    const w = (endX - startX) / n;
    let d = `M ${startX} ${centerY}`;
    for (let i = 0; i < n; i++) {
      const x1 = startX + i * w, x2 = x1 + w, mid = (x1 + x2) / 2;
      d += ` C ${mid} ${centerY - h},${mid} ${centerY - h},${x2} ${centerY}`;
      d += ` C ${mid} ${centerY + h},${mid} ${centerY + h},${x2} ${centerY}`;
    }
    return d;
  }

  function secondaryCoilPath(turns: number): string {
    const n = Math.min(Math.max(Math.round(turns / 2), 2), 12);
    const startX = 360, endX = 540, centerY = 200, h = 60;
    const w = (endX - startX) / n;
    let d = `M ${startX} ${centerY}`;
    for (let i = 0; i < n; i++) {
      const x1 = startX + i * w, x2 = x1 + w, mid = (x1 + x2) / 2;
      d += ` C ${mid} ${centerY - h},${mid} ${centerY - h},${x2} ${centerY}`;
      d += ` C ${mid} ${centerY + h},${mid} ${centerY + h},${x2} ${centerY}`;
    }
    return d;
  }

  // ── Flux lines ───────────────────────────────────────────────
  const FLUX_LINES = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    y: 155 + (i / 5) * 90,
  }));

  // ── Waveform polyline ────────────────────────────────────────
  function wavePoints(wave: 'primary' | 'secondary', samples = 80): string {
    const W = 200, H = 40;
    const ratio = secondaryTurns / primaryTurns;
    return Array.from({ length: samples + 1 }, (_, i) => {
      const t = (i / samples) * (2 / frequency) + (time - 1 / frequency);
      const val = wave === 'primary'
        ? Math.sin(2 * Math.PI * frequency * t)
        : Math.sin(2 * Math.PI * frequency * t) * ratio;
      const amp = wave === 'primary' ? H / 2.5 : (H / 2.5) * Math.min(1, ratio * 5);
      return `${(i / samples) * W},${H / 2 - val * amp}`;
    }).join(' ');
  }
</script>

<div class="sim-root">

  <!-- ── SVG Visualization ──────────────────────────────────── -->
  <div class="svg-wrap">
    <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="t-svg">
      <defs>
        <filter id="gp" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="gs" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="gf" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="{2 + glowI * 4}" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="gc" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="{glowI * 8}" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <linearGradient id="core-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2a2a3a"/>
          <stop offset="100%" stop-color="#1a1a28"/>
        </linearGradient>
        <marker id="arr-p" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,170,0,0.8)"/>
        </marker>
        <marker id="arr-s" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(68,170,255,{emfGlow})"/>
        </marker>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
        </pattern>
      </defs>

      <rect width="600" height="400" fill="url(#grid)"/>

      <!-- Iron Core -->
      <rect x="250" y="135" width="100" height="130" rx="4"
        fill="url(#core-grad)"
        stroke="rgba(180,160,255,{0.3 + glowI * 0.5})"
        stroke-width="2"
        filter="url(#gc)"
      />
      {#each Array(6) as _, i}
        <line x1="255" y1="{150 + i * 18}" x2="345" y2="{150 + i * 18}"
          stroke="rgba(120,100,200,{0.15 + glowI * 0.2})" stroke-width="1"/>
      {/each}
      <text x="300" y="208" text-anchor="middle" class="lbl-core">IRON CORE</text>

      <!-- Flux lines + particles -->
      {#each FLUX_LINES as fl}
        <line x1="255" y1="{fl.y}" x2="345" y2="{fl.y}"
          stroke="rgba(0,212,255,{0.08 + glowI * 0.55})"
          stroke-width="{1 + glowI * 2.5}"
          filter="url(#gf)"
        />
        {#if glowI > 0.15}
          <circle
            cx="{255 + (fluxNorm > 0 ? 1 : -1) * (((time * frequency * 2) % 1) * 90)}"
            cy="{fl.y}"
            r="{1.5 + glowI}"
            fill="rgba(0,212,255,{glowI * 0.8})"
          />
        {/if}
      {/each}

      <!-- Primary Coil -->
      <path d="{primaryCoilPath(primaryTurns)}"
        fill="none"
        stroke="rgba(255,170,0,{0.7 + Math.abs(acPhase) * 0.3})"
        stroke-width="3" stroke-linecap="round"
        filter="url(#gp)"
      />

      <!-- Secondary Coil -->
      <path d="{secondaryCoilPath(secondaryTurns)}"
        fill="none"
        stroke="rgba(68,170,255,{0.4 + emfGlow * 0.6})"
        stroke-width="3" stroke-linecap="round"
        filter="url(#gs)"
      />

      <!-- Input leads -->
      <line x1="30" y1="200" x2="60" y2="200"
        stroke="rgba(255,170,0,0.6)" stroke-width="2" marker-end="url(#arr-p)"/>
      <line x1="240" y1="200" x2="250" y2="200"
        stroke="rgba(255,170,0,0.4)" stroke-width="2"/>
      <text x="20" y="193" class="lbl-volt lbl-volt-p">{formatVoltage(primaryVoltage)}</text>
      <text x="20" y="207" class="lbl-sub">AC {frequency}Hz</text>

      <!-- Output leads -->
      <line x1="350" y1="200" x2="360" y2="200"
        stroke="rgba(68,170,255,{0.4 + emfGlow * 0.3})" stroke-width="2"/>
      <line x1="540" y1="200" x2="570" y2="200"
        stroke="rgba(68,170,255,{0.4 + emfGlow * 0.3})" stroke-width="2"
        marker-end="url(#arr-s)"/>

      <!-- House icon — SVG geometry, no emoji -->
      <g transform="translate(564, 187)" stroke="rgba(68,170,255,0.85)" stroke-width="1.5"
         fill="none" stroke-linejoin="round">
        <polyline points="0,13 7,4 14,13"/>
        <rect x="2" y="13" width="10" height="9" rx="1"/>
        <rect x="5" y="16" width="4" height="6"/>
      </g>
      <text x="571" y="212" class="lbl-sub lbl-sub-s">{sim.secondaryVoltage.toFixed(0)}V</text>

      <!-- Coil labels -->
      <text x="150" y="128" text-anchor="middle" class="lbl-coil lbl-coil-p">PRIMARY</text>
      <text x="150" y="143" text-anchor="middle" class="lbl-coil-sub">Np = {primaryTurns} turns</text>
      <text x="450" y="128" text-anchor="middle" class="lbl-coil lbl-coil-s">SECONDARY</text>
      <text x="450" y="143" text-anchor="middle" class="lbl-coil-sub">Ns = {secondaryTurns} turns</text>

      <!-- Flux & EMF readouts -->
      <text x="300" y="380" text-anchor="middle" class="lbl-flux">
        ΦB = {sim.instantaneousFlux.toExponential(2)} Wb
      </text>
      <text x="300" y="112" text-anchor="middle" class="lbl-emf">
        ε = {sim.inducedEMF.toFixed(1)} V  |  Turns Ratio = {sim.turnsRatio.toFixed(3)}
      </text>

      <!-- Primary current particles -->
      {#each Array(4) as _, i}
        {@const p = ((time * frequency * 2 + i * 0.25) % 1)}
        <circle
          cx="{60 + p * 180}"
          cy="{200 + Math.sin(p * Math.PI * 2 * (primaryTurns / 10)) * 40 * Math.abs(acPhase)}"
          r="3"
          fill="rgba(255,200,0,{Math.abs(acPhase) * 0.9})"
          filter="url(#gp)"
        />
      {/each}

      <!-- Secondary current particles -->
      {#each Array(3) as _, i}
        {@const p = ((time * frequency * 2 + i * 0.33 + 0.5) % 1)}
        <circle
          cx="{360 + p * 180}"
          cy="{200 + Math.sin(p * Math.PI * 2 * (secondaryTurns / 2)) * 40 * emfGlow}"
          r="3"
          fill="rgba(68,170,255,{emfGlow * 0.9})"
          filter="url(#gs)"
        />
      {/each}
    </svg>
  </div>

  <!-- ── Waveforms ───────────────────────────────────────────── -->
  <div class="waveforms">
    <div class="wave-panel">
      <div class="wave-title wave-title-p">
        <Zap size={12} />
        PRIMARY VOLTAGE
      </div>
      <svg viewBox="0 0 200 40" class="wave-svg wave-svg-p">
        <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
        <polyline points="{wavePoints('primary')}" fill="none" stroke="rgba(255,170,0,0.85)" stroke-width="1.5"/>
      </svg>
      <div class="wave-val">{sim.primaryRMS.toFixed(0)} V RMS</div>
    </div>

    <div class="wave-sep"><ArrowRight size={16} /></div>

    <div class="wave-panel">
      <div class="wave-title wave-title-s">
        <Battery size={12} />
        SECONDARY VOLTAGE
      </div>
      <svg viewBox="0 0 200 40" class="wave-svg wave-svg-s">
        <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
        <polyline points="{wavePoints('secondary')}" fill="none" stroke="rgba(68,170,255,0.85)" stroke-width="1.5"/>
      </svg>
      <div class="wave-val">{sim.secondaryRMS.toFixed(1)} V RMS</div>
    </div>
  </div>

  <!-- ── Controls ────────────────────────────────────────────── -->
  <div class="ctrl-panel">

    <div class="ctrl-group">
      <div class="ctrl-header">
        <label class="ctrl-label"><TrendingUp size={12}/> Primary Turns (Np)</label>
        <span class="ctrl-val">{primaryTurns}</span>
      </div>
      <input type="range" min="20" max="500" step="10" bind:value={primaryTurns} class="slider s-primary"/>
      <div class="ctrl-hint">Vp ∝ Np · dΦ/dt</div>
    </div>

    <div class="ctrl-group">
      <div class="ctrl-header">
        <label class="ctrl-label"><TrendingDown size={12}/> Secondary Turns (Ns)</label>
        <span class="ctrl-val">{secondaryTurns}</span>
      </div>
      <input type="range" min="5" max="100" step="5" bind:value={secondaryTurns} class="slider s-secondary"/>
      <div class="ctrl-hint">Step-Down: {secondaryTurns}/{primaryTurns} = {(secondaryTurns / primaryTurns * 100).toFixed(1)}%</div>
    </div>

    <div class="ctrl-group">
      <div class="ctrl-header">
        <label class="ctrl-label"><Zap size={12}/> Input Voltage</label>
        <span class="ctrl-val">{formatVoltage(primaryVoltage)}</span>
      </div>
      <input type="range" min="1000" max="33000" step="1000" bind:value={primaryVoltage} class="slider s-voltage"/>
      <div class="ctrl-hint">High Voltage Transmission</div>
    </div>

    <div class="ctrl-group">
      <div class="ctrl-header">
        <label class="ctrl-label"><Wifi size={12}/> AC Frequency</label>
        <span class="ctrl-val">{frequency} Hz</span>
      </div>
      <input type="range" min="50" max="120" step="5" bind:value={frequency} class="slider s-freq"/>
      <div class="ctrl-hint">ω = {(2 * Math.PI * frequency).toFixed(1)} rad/s</div>
    </div>

    <div class="ctrl-group">
      <div class="ctrl-header">
        <label class="ctrl-label"><SpeedIcon size={12}/> Simulation Speed</label>
        <span class="ctrl-val">{speed.toFixed(2)}x</span>
      </div>
      <input type="range" min="0" max="3" step="0.01" bind:value={speed} class="slider s-speed"/>
      <div class="ctrl-hint speed-hint">{getSpeedLabel(speed)}</div>
    </div>

    <div class="ctrl-group">
      <div class="ctrl-header">
        <label class="ctrl-label"><Activity size={12}/> Animation</label>
        <button class="toggle-btn" class:running onclick={() => (running = !running)}>
          {#if running}<Pause size={14}/> Pause{:else}<Play size={14}/> Run{/if}
        </button>
      </div>
      <div class="ratio-row">
        <span class="ratio-label">Turns Ratio:</span>
        <span class="ratio-val">{(secondaryTurns / primaryTurns).toFixed(3)}</span>
        <span class="ratio-label">Voltage Ratio:</span>
        <span class="ratio-val">{sim.primaryRMS > 0 ? (sim.secondaryRMS / sim.primaryRMS).toFixed(3) : '0.000'}</span>
      </div>
    </div>

  </div>

  <!-- ── Law Explainer ───────────────────────────────────────── -->
  <div class="law-box">
    <div class="law-tabs">
      <button class="law-tab" class:active={activeLaw === 'faraday'} onclick={() => (activeLaw = 'faraday')}>
        <Magnet size={14}/> Faraday's Law
      </button>
      <button class="law-tab" class:active={activeLaw === 'lenz'} onclick={() => (activeLaw = 'lenz')}>
        <Zap size={14}/> Lenz's Law
      </button>
    </div>

    <div class="law-body">
      {#if activeLaw === 'faraday'}
        <div class="law-eq">ε = −N · dΦ/dt</div>
        <p class="law-text">
          <strong>Electromotive Force</strong> = <strong>Turns</strong> × <strong>Rate of change of magnetic flux.</strong><br/>
          The induced voltage is proportional to how fast the magnetic field changes through the coil.
        </p>
        <div class="law-live">
          Currently: ε = {sim.inducedEMF.toFixed(1)} V = {secondaryTurns} × {sim.instantaneousFlux.toExponential(2)} Wb/s
        </div>
      {:else}
        <div class="law-eq">The minus sign: Nature says "No!"</div>
        <p class="law-text">
          <strong>Lenz's Law</strong> explains the <strong>negative sign</strong> in Faraday's equation.
          The induced current creates a magnetic field that <strong>opposes</strong> the original change.
        </p>
        <div class="law-live">
          Opposition direction: {opposition > 0 ? '↺ Counter-Clockwise' : '↻ Clockwise'}
        </div>
      {/if}
    </div>
  </div>

</div>

<style>
  /* ── Layout ── */
  .sim-root {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }

  /* ── SVG ── */
  .svg-wrap {
    width: 100%;
    background: rgba(0,0,0,0.4);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.07);
    overflow: hidden;
  }
  .t-svg { width: 100%; height: auto; display: block; }

  /* SVG text */
  .lbl-core {
    font-size: 8px; fill: rgba(180,160,255,0.5);
    font-family: 'Space Mono', monospace; letter-spacing: 0.1em;
  }
  .lbl-coil { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; }
  .lbl-coil-p { fill: rgba(255,170,0,0.9); }
  .lbl-coil-s { fill: rgba(68,170,255,0.9); }
  .lbl-coil-sub { font-size: 8px; font-family: 'Space Mono', monospace; fill: rgba(255,255,255,0.4); }
  .lbl-volt { font-size: 9px; font-family: 'Space Mono', monospace; font-weight: 700; }
  .lbl-volt-p { fill: rgba(255,200,0,0.9); }
  .lbl-sub { font-size: 7px; font-family: 'Space Mono', monospace; fill: rgba(255,255,255,0.3); }
  .lbl-sub-s { fill: rgba(68,170,255,0.9); font-size: 8px; }
  .lbl-flux { font-size: 9px; font-family: 'Space Mono', monospace; fill: rgba(0,212,255,0.6); }
  .lbl-emf  { font-size: 9px; font-family: 'Space Mono', monospace; fill: rgba(170,68,255,0.8); }

  /* ── Waveforms ── */
  .waveforms {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0,0,0,0.3);
    border-radius: 12px;
    padding: 0.8rem 1rem;
    border: 1px solid rgba(255,255,255,0.06);
    overflow: hidden;
  }
  .wave-panel { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3rem; }
  .wave-title {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em;
    display: flex; align-items: center; gap: 0.3rem;
  }
  .wave-title-p { color: rgba(255,170,0,0.75); }
  .wave-title-s { color: rgba(68,170,255,0.75); }
  .wave-svg { width: 100%; height: 40px; background: rgba(0,0,0,0.2); border-radius: 4px; }
  .wave-svg-p { filter: drop-shadow(0 0 3px rgba(255,170,0,0.4)); }
  .wave-svg-s { filter: drop-shadow(0 0 3px rgba(68,170,255,0.4)); }
  .wave-val { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: rgba(255,255,255,0.55); }
  .wave-sep {
    color: rgba(255,255,255,0.2); flex-shrink: 0;
    padding: 0 0.25rem; display: flex; align-items: center;
  }

  /* ── Controls ── */
  .ctrl-panel {
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 1.1rem;
    border: 1px solid rgba(255,255,255,0.1);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.9rem;
  }
  .ctrl-group {
    background: rgba(255,255,255,0.03);
    border-radius: 12px; padding: 0.75rem;
    transition: background 0.2s ease;
  }
  .ctrl-group:hover { background: rgba(255,255,255,0.06); }
  .ctrl-header {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 0.45rem; gap: 0.4rem;
  }
  .ctrl-label {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em;
    color: rgba(255,255,255,0.5); text-transform: uppercase;
    display: flex; align-items: center; gap: 0.35rem;
  }
  .ctrl-val {
    font-family: 'Space Mono', monospace; font-size: 0.88rem;
    font-weight: 700; color: #60A5FA; flex-shrink: 0;
  }
  .ctrl-hint {
    font-size: 0.63rem; color: rgba(255,255,255,0.28);
    font-family: 'Space Mono', monospace; margin-top: 0.3rem;
  }
  .speed-hint { color: #00FFAA; font-weight: 600; }

  /* Replace the existing slider styles with these */

/* Slider base styles */
.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  margin: 0.6rem 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider:hover {
  height: 8px;
}

/* WebKit (Chrome, Safari, Edge) */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: transform 0.1s ease;
  box-shadow: 0 0 8px currentColor;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Firefox */
.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: transform 0.1s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

/* Track styles for Firefox */
.slider::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.15);
}

/* Individual slider thumb colors */
.s-primary::-webkit-slider-thumb { background: #FFAA00; box-shadow: 0 0 8px #FFAA00; }
.s-primary::-moz-range-thumb { background: #FFAA00; }

.s-secondary::-webkit-slider-thumb { background: #44AAFF; box-shadow: 0 0 8px #44AAFF; }
.s-secondary::-moz-range-thumb { background: #44AAFF; }

.s-voltage::-webkit-slider-thumb { background: #FF4466; box-shadow: 0 0 8px #FF4466; }
.s-voltage::-moz-range-thumb { background: #FF4466; }

.s-freq::-webkit-slider-thumb { background: #AA44FF; box-shadow: 0 0 8px #AA44FF; }
.s-freq::-moz-range-thumb { background: #AA44FF; }

.s-speed::-webkit-slider-thumb { background: #00FFAA; box-shadow: 0 0 8px #00FFAA; }
.s-speed::-moz-range-thumb { background: #00FFAA; }

/* Focus styles for accessibility */
.slider:focus {
  outline: none;
}

.slider:focus::-webkit-slider-thumb {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}
  /* Ratio */
  .ratio-row {
    display: flex; gap: 0.45rem; font-size: 0.68rem;
    margin-top: 0.5rem; font-family: 'Space Mono', monospace; flex-wrap: wrap;
  }
  .ratio-label { color: rgba(255,255,255,0.35); }
  .ratio-val   { color: #60A5FA; font-weight: 700; }

  /* Toggle */
  .toggle-btn {
    background: rgba(96,165,250,0.15);
    border: 1px solid rgba(96,165,250,0.35);
    color: #60A5FA;
    padding: 0.25rem 0.7rem; border-radius: 20px;
    font-size: 0.7rem; font-weight: 700; cursor: pointer;
    transition: background 0.2s ease;
    display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;
  }
  .toggle-btn.running { background: rgba(96,165,250,0.35); border-color: #60A5FA; }
  .toggle-btn:hover   { background: rgba(96,165,250,0.5); }

  /* ── Law Explainer ── */
  .law-box {
    background: linear-gradient(135deg, rgba(0,0,0,0.6), rgba(20,20,40,0.8));
    border-radius: 16px; border: 1px solid rgba(96,165,250,0.2); overflow: hidden;
  }
  .law-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .law-tab {
    flex: 1; background: transparent; border: none;
    color: rgba(255,255,255,0.45); padding: 0.7rem;
    font-size: 0.8rem; font-weight: 700; cursor: pointer;
    transition: all 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  }
  .law-tab.active { color: #60A5FA; border-bottom: 2px solid #60A5FA; background: rgba(96,165,250,0.1); }
  .law-tab:hover:not(.active) { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
  .law-body { padding: 1rem; }
  .law-eq {
    font-family: 'Space Mono', monospace; font-size: 1.05rem;
    text-align: center; color: #60A5FA; margin-bottom: 0.65rem;
  }
  .law-text {
    font-size: 0.79rem; line-height: 1.55;
    color: rgba(255,255,255,0.65); text-align: center; margin: 0.4rem 0;
  }
  .law-text strong { color: rgba(255,255,255,0.9); }
  .law-live {
    font-family: 'Space Mono', monospace; font-size: 0.68rem;
    text-align: center; color: rgba(96,165,250,0.85);
    background: rgba(0,0,0,0.3); padding: 0.5rem;
    border-radius: 8px; margin-top: 0.7rem;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .ctrl-panel { grid-template-columns: 1fr; }
    .waveforms { flex-direction: column; align-items: stretch; }
    .wave-sep { display: none; }
    .ctrl-val { font-size: 0.8rem; }
    .law-eq { font-size: 0.9rem; }
  }
</style>