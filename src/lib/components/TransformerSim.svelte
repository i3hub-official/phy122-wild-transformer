<!-- src/lib/components/TransformerSim.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import SpeedControl from './SpeedControl.svelte';
  import {
    Zap,
    TrendingUp,
    TrendingDown,
    Play,
    Pause,
    Activity,
    Wifi,
    Battery,
    Home
  } from 'lucide-svelte';

  // Bindable props from parent
  let {
    primaryTurns = $bindable(400),
    secondaryTurns = $bindable(80),
    primaryVoltage = $bindable(12000),
    frequency = $bindable(60),
    running = $bindable(true),
    speed = $bindable(1.0)
  } = $props();

  let time = $state(0);
  let animationFrame: number | null = null;
  let lastTs: number | null = null;

  function formatVoltage(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)} kV`;
    return `${v.toFixed(0)} V`;
  }

  // Simulation derived values
  let sim = $derived((() => {
    const turnsRatio = secondaryTurns / primaryTurns;
    const angularFreq = 2 * Math.PI * frequency;
    const instPrimary = primaryVoltage * Math.sin(angularFreq * time);
    const instSecondary = instPrimary * turnsRatio;
    const fluxAmplitude = primaryVoltage / (angularFreq * primaryTurns);
    const instFlux = fluxAmplitude * Math.sin(angularFreq * time);
    const inducedEMF = -secondaryTurns * (angularFreq * fluxAmplitude) * Math.cos(angularFreq * time);
    return {
      turnsRatio,
      instantaneousPrimary: instPrimary,
      instantaneousSecondary: instSecondary,
      fluxAmplitude,
      instantaneousFlux: instFlux,
      inducedEMF: Math.abs(inducedEMF),
      secondaryVoltage: Math.abs(instSecondary),
    };
  })());

  let acPhase = $derived(Math.sin(2 * Math.PI * frequency * time));
  let fluxIntensity = $derived(Math.abs(sim.instantaneousFlux / (sim.fluxAmplitude || 1)));

  // Animation loop
  function animate(ts: number) {
    if (running && lastTs !== null) {
      const dt = Math.min((ts - lastTs) / 1000, 0.05) * speed;
      time += dt;
    }
    if (!running) lastTs = null;
    else lastTs = ts;
    animationFrame = requestAnimationFrame(animate);
  }

  onMount(() => { animationFrame = requestAnimationFrame(animate); });
  onDestroy(() => { if (animationFrame) cancelAnimationFrame(animationFrame); });

  // Waveform path builder
  function waveformPath(scale: number): string {
    return Array.from({ length: 100 }, (_, i) => {
      const t = (i / 100) * (2 / frequency) + time;
      const val = Math.sin(2 * Math.PI * frequency * t) * scale;
      const x = (i / 100) * 400;
      const y = 30 - val * 25;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }
</script>

<div class="space-y-6">

  <!-- ─── SVG Visualization ─────────────────────────────── -->
  <div class="viz-card">
    <svg viewBox="0 0 600 400" class="w-full h-auto rounded-2xl" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-p" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-s" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-f" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
        </pattern>
      </defs>

      <rect width="600" height="400" fill="url(#grid)"/>

      <!-- Iron Core -->
      <rect x="230" y="120" width="140" height="160" rx="12" fill="#1e2937" stroke="#64748b" stroke-width="18"/>
      <rect x="250" y="140" width="100" height="120" rx="8" fill="#334155"/>
      <text x="300" y="208" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="monospace" letter-spacing="2">IRON CORE</text>

      <!-- Flux lines inside core -->
      {#each Array(7) as _, i}
        <line
          x1="255" y1="{145 + i * 18}"
          x2="345" y2="{145 + i * 18}"
          stroke="#67e8f9"
          stroke-width="{1.5 + Math.abs(Math.sin(time * 8)) * 4 * fluxIntensity}"
          opacity="{0.3 + fluxIntensity * 0.7}"
          filter="url(#glow-f)"
        />
        {#if fluxIntensity > 0.3}
          <circle
            cx="{255 + (((time * frequency * 2) % 1) * 90)}"
            cy="{145 + i * 18}"
            r="{2 + fluxIntensity * 2}"
            fill="#67e8f9"
            opacity="0.85"
            filter="url(#glow-f)"
          />
        {/if}
      {/each}

      <!-- Primary Coil -->
      <path
        d="M120 160 Q200 130 120 200 Q200 230 120 260"
        fill="none"
        stroke="#f59e0b"
        stroke-width="28"
        stroke-linecap="round"
        opacity="{0.7 + Math.abs(acPhase) * 0.3}"
        filter="url(#glow-p)"
      />
      <text x="78" y="190" fill="#fbbf24" font-size="13" font-weight="600" text-anchor="middle">Np = {primaryTurns}</text>
      <text x="78" y="207" fill="#fbbf24" font-size="9" font-family="monospace" opacity="0.7" text-anchor="middle">Vp = {formatVoltage(primaryVoltage)}</text>

      <!-- Input power line + animated dot -->
      <line x1="40" y1="200" x2="115" y2="200" stroke="#f59e0b" stroke-width="3" opacity="0.6"/>
      <circle cx="40" cy="200" r="5" fill="#f59e0b" opacity="0.9">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite"/>
      </circle>
      <text x="20" y="180" fill="#f59e0b" font-size="9" font-family="monospace" opacity="0.6" text-anchor="middle">HV IN</text>

      <!-- Secondary Coil -->
      <path
        d="M480 165 Q540 145 480 200 Q540 225 480 255"
        fill="none"
        stroke="#22d3ee"
        stroke-width="24"
        stroke-linecap="round"
        opacity="{0.5 + fluxIntensity * 0.5}"
        filter="url(#glow-s)"
      />
      <text x="524" y="190" fill="#67e8f9" font-size="13" font-weight="600" text-anchor="middle">Ns = {secondaryTurns}</text>
      <text x="524" y="207" fill="#67e8f9" font-size="9" font-family="monospace" opacity="0.7" text-anchor="middle">Vs = {sim.secondaryVoltage.toFixed(0)} V</text>

      <!-- Output line -->
      <line x1="485" y1="200" x2="555" y2="200" stroke="#22d3ee" stroke-width="3" opacity="0.6"/>

      <!-- House icon (SVG paths, no emoji) -->
      <g transform="translate(548, 188)" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-linejoin="round" opacity="0.85">
        <polyline points="0,12 6,4 12,12"/>
        <rect x="2" y="12" width="8" height="8" rx="1"/>
        <rect x="4.5" y="15" width="3" height="5"/>
      </g>
      <text x="554" y="215" fill="#22d3ee" font-size="7" font-family="monospace" opacity="0.5" text-anchor="middle">LV OUT</text>

      <!-- Primary current particles -->
      {#each Array(3) as _, i}
        {@const progress = ((time * frequency * 2 + i * 0.33) % 1)}
        {@const px = 42 + progress * 75}
        <circle
          cx="{px}"
          cy="{200 + Math.sin(progress * Math.PI * 4) * 5}"
          r="3"
          fill="#fbbf24"
          opacity="{Math.abs(acPhase) * 0.9}"
          filter="url(#glow-p)"
        />
      {/each}

      <!-- Labels top/bottom -->
      <text x="300" y="100" text-anchor="middle" fill="#a855f7" font-size="10" font-family="monospace" font-weight="600">
        ε = {sim.inducedEMF.toFixed(1)} V  |  Turns Ratio = {sim.turnsRatio.toFixed(3)}
      </text>
      <text x="300" y="375" text-anchor="middle" fill="#67e8f9" font-size="9" font-family="monospace" opacity="0.6">
        ΦB = {sim.instantaneousFlux.toExponential(2)} Wb
      </text>
    </svg>
  </div>

  <!-- ─── Live Data Cards ───────────────────────────────── -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="data-card">
      <div class="data-label"><Battery size={13} /> Output Voltage</div>
      <div class="data-value text-cyan-400">{sim.secondaryVoltage.toFixed(0)}<span class="data-unit">V</span></div>
    </div>
    <div class="data-card">
      <div class="data-label"><TrendingUp size={13} /> Turns Ratio</div>
      <div class="data-value text-violet-400">{sim.turnsRatio.toFixed(3)}</div>
    </div>
    <div class="data-card">
      <div class="data-label"><Zap size={13} /> Induced EMF</div>
      <div class="data-value text-fuchsia-400">{sim.inducedEMF.toFixed(1)}<span class="data-unit">V</span></div>
    </div>
    <div class="data-card">
      <div class="data-label"><Wifi size={13} /> Frequency</div>
      <div class="data-value text-amber-400">{frequency}<span class="data-unit">Hz</span></div>
    </div>
  </div>

  <!-- ─── Controls Panel ────────────────────────────────── -->
  <div class="ctrl-panel">
    <div class="ctrl-grid">

      <!-- Primary Turns -->
      <div class="ctrl-item">
        <label class="ctrl-label">
          <TrendingUp size={13} /> Primary Turns (Np)
        </label>
        <input type="range" min="50" max="600" step="10" bind:value={primaryTurns} class="w-full accent-orange-500"/>
        <div class="ctrl-value text-orange-400">{primaryTurns}</div>
      </div>

      <!-- Secondary Turns -->
      <div class="ctrl-item">
        <label class="ctrl-label">
          <TrendingDown size={13} /> Secondary Turns (Ns)
        </label>
        <input type="range" min="10" max="150" step="5" bind:value={secondaryTurns} class="w-full accent-cyan-500"/>
        <div class="ctrl-value text-cyan-400">{secondaryTurns}</div>
      </div>

      <!-- Input Voltage -->
      <div class="ctrl-item">
        <label class="ctrl-label">
          <Zap size={13} /> Input Voltage
        </label>
        <input type="range" min="2000" max="33000" step="500" bind:value={primaryVoltage} class="w-full accent-yellow-500"/>
        <div class="ctrl-value text-yellow-400">{(primaryVoltage / 1000).toFixed(1)} kV</div>
      </div>

      <!-- Frequency -->
      <div class="ctrl-item">
        <label class="ctrl-label">
          <Wifi size={13} /> Frequency (Hz)
        </label>
        <input type="range" min="50" max="70" step="1" bind:value={frequency} class="w-full accent-purple-500"/>
        <div class="ctrl-value text-purple-400">{frequency} Hz</div>
      </div>

      <!-- Speed Control -->
      <div class="ctrl-item">
        <SpeedControl bind:speed />
      </div>

      <!-- Play / Pause -->
      <div class="ctrl-item flex items-end">
        <button
          onclick={() => (running = !running)}
          class="play-btn {running ? 'pause' : 'play'}"
        >
          {#if running}
            <Pause size={18} /> Pause Simulation
          {:else}
            <Play size={18} /> Resume Simulation
          {/if}
        </button>
      </div>

    </div>

    <!-- ─── Waveforms ──────────────────────────────────── -->
    <div class="waveform-section">
      <div class="waveform-grid">
        <!-- Primary -->
        <div>
          <div class="wave-label">
            <span class="dot bg-orange-500"></span>
            Primary Voltage Waveform
          </div>
          <svg viewBox="0 0 400 60" class="wave-svg">
            <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path
              d="{waveformPath(1)}"
              fill="none"
              stroke="#f59e0b"
              stroke-width="2"
              opacity="0.85"
            />
          </svg>
        </div>
        <!-- Secondary -->
        <div>
          <div class="wave-label">
            <span class="dot bg-cyan-500"></span>
            Secondary Voltage Waveform
          </div>
          <svg viewBox="0 0 400 60" class="wave-svg">
            <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <path
              d="{waveformPath(secondaryTurns / primaryTurns)}"
              fill="none"
              stroke="#22d3ee"
              stroke-width="2"
              opacity="0.85"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>

</div>

<style>
  .viz-card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 24px;
    padding: 1.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  }

  /* Data cards */
  .data-card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 16px;
    padding: 1rem 1.1rem;
  }

  .data-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: #71717a;
    margin-bottom: 0.4rem;
  }

  .data-value {
    font-size: 1.85rem;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
    line-height: 1;
  }

  .data-unit {
    font-size: 0.75rem;
    font-weight: 400;
    opacity: 0.6;
    margin-left: 2px;
  }

  /* Controls panel */
  .ctrl-panel {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 24px;
    padding: 1.75rem;
  }

  .ctrl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem 2rem;
  }

  .ctrl-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ctrl-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: #a1a1aa;
    font-weight: 500;
  }

  .ctrl-value {
    text-align: right;
    font-family: 'Space Mono', monospace;
    font-size: 0.82rem;
    font-weight: 600;
  }

  /* Play/Pause button */
  .play-btn {
    width: 100%;
    padding: 0.85rem 1rem;
    border-radius: 14px;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease;
    border: none;
  }

  .play-btn:hover { transform: translateY(-1px); }
  .play-btn:active { transform: translateY(0); }

  .play-btn.pause {
    background: #dc2626;
    color: white;
  }
  .play-btn.pause:hover { background: #b91c1c; }

  .play-btn.play {
    background: #059669;
    color: white;
  }
  .play-btn.play:hover { background: #047857; }

  /* Waveforms */
  .waveform-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #27272a;
  }

  .waveform-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .wave-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: #52525b;
    margin-bottom: 6px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .wave-svg {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid #27272a;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .viz-card { padding: 0.75rem; }
    .ctrl-panel { padding: 1.1rem; }
    .ctrl-grid { grid-template-columns: 1fr; gap: 1.25rem; }
    .data-value { font-size: 1.5rem; }
    .waveform-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 480px) {
    .data-value { font-size: 1.25rem; }
  }
</style>