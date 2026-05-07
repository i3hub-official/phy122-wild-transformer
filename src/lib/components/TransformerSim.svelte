<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Props with bindable values for two-way binding
  let {
    primaryTurns = $bindable(200),
    secondaryTurns = $bindable(20),
    primaryVoltage = $bindable(11000),
    frequency = $bindable(50),
    running = $bindable(true),
    speed = $bindable(1.0)  // Simulation speed multiplier
  } = $props();

  // State
  let time = $state(0);
  let animFrame: number | null = null;
  let lastTs: number | null = null;
  let isBrowser = $state(false);
  let activeLaw = $state<'faraday' | 'lenz'>('faraday');

  // Helper function to safely use requestAnimationFrame
  let requestAnimFrame: typeof requestAnimationFrame;
  let cancelAnimFrame: typeof cancelAnimationFrame;

  // Simulation logic
  function simulateTransformer(params: {
    primaryTurns: number;
    secondaryTurns: number;
    primaryVoltage: number;
    frequency: number;
    time: number;
  }) {
    const turnsRatio = params.secondaryTurns / params.primaryTurns;
    const angularFreq = 2 * Math.PI * params.frequency;
    const instantaneousPrimary = params.primaryVoltage * Math.sin(angularFreq * params.time);
    const instantaneousSecondary = instantaneousPrimary * turnsRatio;
    const fluxAmplitude = params.primaryVoltage / (angularFreq * params.primaryTurns);
    const instantaneousFlux = fluxAmplitude * Math.sin(angularFreq * params.time);
    const inducedEMF = -params.secondaryTurns * (angularFreq * fluxAmplitude) * Math.cos(angularFreq * params.time);
    
    return {
      turnsRatio,
      instantaneousPrimary,
      instantaneousSecondary,
      fluxAmplitude,
      instantaneousFlux,
      inducedEMF,
      secondaryVoltage: Math.abs(instantaneousSecondary),
      secondaryRMS: Math.abs(instantaneousSecondary) * 0.707,
      primaryRMS: Math.abs(instantaneousPrimary) * 0.707
    };
  }

  function lenzOpposition(angularFreq: number, time: number) {
    return Math.sin(angularFreq * time + Math.PI);
  }

  // Derived simulation output
  let sim = $derived(simulateTransformer({
    primaryTurns,
    secondaryTurns,
    primaryVoltage,
    frequency,
    time
  }));

  // Normalized AC signal (-1 to 1)
  let acPhase = $derived(Math.sin(2 * Math.PI * frequency * time));
  let fluxNorm = $derived(sim.instantaneousFlux / (sim.fluxAmplitude || 1));
  let opposition = $derived(lenzOpposition(2 * Math.PI * frequency, time));

  // Flux line glow intensity (0..1)
  let glowIntensity = $derived(Math.abs(fluxNorm));
  
  // Secondary glow based on induced EMF
  let emfGlow = $derived(Math.abs(opposition));

  // Animation loop with speed control
  function animate(ts: number) {
    if (!isBrowser) return;
    if (!running) { lastTs = null; return; }
    if (lastTs !== null) {
      let dt = Math.min((ts - lastTs) / 1000, 0.05);
      // Apply speed multiplier (extended range: 0.05 to 3x)
      dt = dt * speed;
      time += dt;
    }
    lastTs = ts;
    if (requestAnimFrame) {
      animFrame = requestAnimFrame(animate);
    }
  }

  onMount(() => {
    isBrowser = true;
    // Safely get browser APIs
    requestAnimFrame = window.requestAnimationFrame.bind(window);
    cancelAnimFrame = window.cancelAnimationFrame.bind(window);
    
    animFrame = requestAnimFrame(animate);
  });

  onDestroy(() => {
    if (isBrowser && animFrame !== null && cancelAnimFrame) {
      cancelAnimFrame(animFrame);
    }
  });

  $effect(() => {
    if (!isBrowser) return;
    if (running) {
      if (animFrame !== null && cancelAnimFrame) {
        cancelAnimFrame(animFrame);
      }
      lastTs = null;
      if (requestAnimFrame) {
        animFrame = requestAnimFrame(animate);
      }
    } else {
      if (animFrame !== null && cancelAnimFrame) {
        cancelAnimFrame(animFrame);
        animFrame = null;
      }
      lastTs = null;
    }
  });

  // Helper functions for formatting
  function formatVoltage(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}kV`;
    return `${v.toFixed(0)}V`;
  }

  function getSpeedLabel(speed: number): string {
    if (speed === 0) return '⏸ Paused';
    if (speed < 0.1) return '🐌 Super Slow-Mo';
    if (speed < 0.3) return '🐢 Extreme Slow-Mo';
    if (speed < 0.6) return '🦥 Slow Motion';
    if (speed === 1) return '▶ Normal Speed';
    if (speed < 1.5) return '⚡ Fast';
    if (speed < 2) return '🚀 Turbo';
    return '💥 Ludicrous Speed';
  }

  // Generate coil path segments
  function primaryCoilPath(turns: number): string {
    const clampedTurns = Math.min(Math.max(turns / 10, 3), 20);
    const startX = 60, endX = 240;
    const centerY = 200;
    const width = (endX - startX) / clampedTurns;
    const height = 60;
    let d = `M ${startX} ${centerY}`;
    for (let i = 0; i < clampedTurns; i++) {
      const x1 = startX + i * width;
      const x2 = x1 + width;
      const mid = (x1 + x2) / 2;
      d += ` C ${mid} ${centerY - height}, ${mid} ${centerY - height}, ${x2} ${centerY}`;
      d += ` C ${mid} ${centerY + height}, ${mid} ${centerY + height}, ${x2} ${centerY}`;
    }
    return d;
  }

  function secondaryCoilPath(turns: number): string {
    const clampedTurns = Math.min(Math.max(turns / 2, 2), 12);
    const startX = 360, endX = 540;
    const centerY = 200;
    const width = (endX - startX) / clampedTurns;
    const height = 60;
    let d = `M ${startX} ${centerY}`;
    for (let i = 0; i < clampedTurns; i++) {
      const x1 = startX + i * width;
      const x2 = x1 + width;
      const mid = (x1 + x2) / 2;
      d += ` C ${mid} ${centerY - height}, ${mid} ${centerY - height}, ${x2} ${centerY}`;
      d += ` C ${mid} ${centerY + height}, ${mid} ${centerY + height}, ${x2} ${centerY}`;
    }
    return d;
  }

  // Flux field lines (arcs through core)
  function fluxLines(count: number = 5) {
    const lines = [];
    for (let i = 0; i < count; i++) {
      const y = 155 + (i / (count - 1)) * 90;
      lines.push({ id: i, y });
    }
    return lines;
  }

  const FLUX_LINES = fluxLines(6);

  // Waveform points for mini chart
  function wavePoints(wave: 'primary' | 'secondary', samples = 80): string {
    const w = 200, h = 40;
    const points: string[] = [];
    const ratio = secondaryTurns / primaryTurns;
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * 2 / frequency + (time - 1 / frequency);
      const val = wave === 'primary'
        ? Math.sin(2 * Math.PI * frequency * t)
        : Math.sin(2 * Math.PI * frequency * t) * ratio;
      const x = (i / samples) * w;
      const y = h / 2 - val * (wave === 'primary' ? h / 2.5 : (h / 2.5) * Math.min(1, ratio * 5));
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }
</script>

<div class="sim-container">
  <!-- Main SVG Transformer Visualization -->
  <div class="svg-wrap">
    <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" class="transformer-svg">
      <defs>
        <!-- Glow filters -->
        <filter id="glow-primary" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="glow-secondary" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="glow-flux" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="{2 + glowIntensity * 4}" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="core-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="{glowIntensity * 8}" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>

        <!-- Gradients -->
        <linearGradient id="core-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2a2a3a"/>
          <stop offset="100%" stop-color="#1a1a28"/>
        </linearGradient>

        <marker id="arrow-primary" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,170,0,0.8)"/>
        </marker>
        <marker id="arrow-secondary" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(68,170,255,{emfGlow})"/>
        </marker>
      </defs>

      <!-- Background grid -->
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      </pattern>
      <rect width="600" height="400" fill="url(#grid)"/>

      <!-- Iron Core -->
      <rect x="250" y="135" width="100" height="130"
        fill="url(#core-grad)"
        stroke="rgba(180,160,255,{0.3 + glowIntensity * 0.5})"
        stroke-width="2"
        rx="4"
        filter="url(#core-glow)"
      />
      
      <!-- Core lamination lines -->
      {#each Array(6) as _, i}
        <line
          x1="250" y1="{150 + i * 18}"
          x2="350" y2="{150 + i * 18}"
          stroke="rgba(120,100,200,{0.15 + glowIntensity * 0.2})"
          stroke-width="1"
        />
      {/each}
      
      <text x="300" y="208" text-anchor="middle" class="core-label">IRON CORE</text>

      <!-- Flux field lines through core -->
      {#each FLUX_LINES as fl}
        <line
          x1="255" y1="{fl.y}"
          x2="345" y2="{fl.y}"
          stroke="rgba(0,212,255,{0.08 + glowIntensity * 0.55})"
          stroke-width="{1 + glowIntensity * 2.5}"
          filter="url(#glow-flux)"
        />
        <!-- Flux direction arrows -->
        {#if glowIntensity > 0.15}
          <circle
            cx="{255 + (fluxNorm > 0 ? 1 : -1) * (((time * frequency * 2) % 1) * 90)}"
            cy="{fl.y}"
            r="{1.5 + glowIntensity}"
            fill="rgba(0,212,255,{glowIntensity * 0.8})"
          />
        {/if}
      {/each}

      <!-- Primary Coil -->
      <path
        d="{primaryCoilPath(primaryTurns)}"
        fill="none"
        stroke="rgba(255,170,0,{0.7 + Math.abs(acPhase) * 0.3})"
        stroke-width="3"
        stroke-linecap="round"
        filter="url(#glow-primary)"
      />

      <!-- Secondary Coil -->
      <path
        d="{secondaryCoilPath(secondaryTurns)}"
        fill="none"
        stroke="rgba(68,170,255,{0.4 + emfGlow * 0.6})"
        stroke-width="3"
        stroke-linecap="round"
        filter="url(#glow-secondary)"
      />

      <!-- Lead lines -->
      <line x1="30" y1="200" x2="60" y2="200"
        stroke="rgba(255,170,0,0.6)" stroke-width="2"
        marker-end="url(#arrow-primary)"/>
      <line x1="240" y1="200" x2="250" y2="200"
        stroke="rgba(255,170,0,0.4)" stroke-width="2"/>
      
      <text x="20" y="195" class="volt-label primary-volt">⚡ {formatVoltage(primaryVoltage)}</text>
      <text x="20" y="212" class="volt-sublabel">AC {frequency}Hz</text>

      <!-- Secondary connections -->
      <line x1="350" y1="200" x2="360" y2="200"
        stroke="rgba(68,170,255,{0.4 + emfGlow * 0.3})" stroke-width="2"/>
      <line x1="540" y1="200" x2="570" y2="200"
        stroke="rgba(68,170,255,{0.4 + emfGlow * 0.3})" stroke-width="2"
        marker-end="url(#arrow-secondary)"/>
      
      <text x="568" y="196" class="volt-label secondary-volt">🏠</text>
      <text x="560" y="212" class="volt-sublabel secondary-val">{sim.secondaryVoltage.toFixed(0)}V</text>

      <!-- Labels -->
      <text x="150" y="130" text-anchor="middle" class="coil-label primary-label">PRIMARY</text>
      <text x="150" y="145" text-anchor="middle" class="coil-sublabel">Np = {primaryTurns} turns</text>
      <text x="450" y="130" text-anchor="middle" class="coil-label secondary-label">SECONDARY</text>
      <text x="450" y="145" text-anchor="middle" class="coil-sublabel">Ns = {secondaryTurns} turns</text>

      <!-- Flux label -->
      <text x="300" y="380" text-anchor="middle" class="flux-label">
        ΦB = {sim.instantaneousFlux.toExponential(2)} Wb
      </text>

      <!-- EMF indicator -->
      <text x="300" y="115" text-anchor="middle" class="emf-label">
        ε = {sim.inducedEMF.toFixed(1)} V  |  Turns Ratio = {(sim.turnsRatio).toFixed(3)}
      </text>

      <!-- Animated current particles -->
      {#each Array(4) as _, i}
        {@const progress = ((time * frequency * 2 + i * 0.25) % 1)}
        {@const px = 60 + progress * 180}
        <circle
          cx="{px}"
          cy="{200 + Math.sin(progress * Math.PI * 2 * (primaryTurns / 10)) * 40 * Math.abs(acPhase)}"
          r="3"
          fill="rgba(255,200,0,{Math.abs(acPhase) * 0.9})"
          filter="url(#glow-primary)"
        />
      {/each}

      {#each Array(3) as _, i}
        {@const progress = ((time * frequency * 2 + i * 0.33 + 0.5) % 1)}
        {@const px = 360 + progress * 180}
        <circle
          cx="{px}"
          cy="{200 + Math.sin(progress * Math.PI * 2 * (secondaryTurns / 2)) * 40 * emfGlow}"
          r="3"
          fill="rgba(68,170,255,{emfGlow * 0.9})"
          filter="url(#glow-secondary)"
        />
      {/each}
    </svg>
  </div>

  <!-- Waveform Display -->
  <div class="waveforms">
    <div class="wave-panel">
      <div class="wave-title">PRIMARY VOLTAGE</div>
      <svg viewBox="0 0 200 40" class="wave-svg primary-wave">
        <polyline points="{wavePoints('primary')}" fill="none" stroke="rgba(255,170,0,0.8)" stroke-width="1.5"/>
        <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
      </svg>
      <div class="wave-value">{sim.primaryRMS.toFixed(0)} V RMS</div>
    </div>

    <div class="wave-divider">→</div>

    <div class="wave-panel">
      <div class="wave-title">SECONDARY VOLTAGE</div>
      <svg viewBox="0 0 200 40" class="wave-svg secondary-wave">
        <polyline points="{wavePoints('secondary')}" fill="none" stroke="rgba(68,170,255,0.8)" stroke-width="1.5"/>
        <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
      </svg>
      <div class="wave-value">{sim.secondaryRMS.toFixed(1)} V RMS</div>
    </div>
  </div>

  <!-- Slide Bars Panel - NOW BELOW THE SIMULATION -->
  <div class="controls-panel">
    <div class="control-group">
      <div class="control-header">
        <label class="control-label">Primary Turns (Np)</label>
        <span class="control-value">{primaryTurns}</span>
      </div>
      <input 
        type="range" 
        min="20" 
        max="500" 
        step="10" 
        bind:value={primaryTurns}
        class="slider primary-slider"
      />
      <div class="formula-hint">Vp ∝ Np • dΦ/dt</div>
    </div>

    <div class="control-group">
      <div class="control-header">
        <label class="control-label">Secondary Turns (Ns)</label>
        <span class="control-value">{secondaryTurns}</span>
      </div>
      <input 
        type="range" 
        min="5" 
        max="100" 
        step="5" 
        bind:value={secondaryTurns}
        class="slider secondary-slider"
      />
      <div class="formula-hint">Step-Down Ratio: {secondaryTurns}/{primaryTurns} = {(secondaryTurns/primaryTurns * 100).toFixed(1)}%</div>
    </div>

    <div class="control-group">
      <div class="control-header">
        <label class="control-label">Input Voltage</label>
        <span class="control-value">{formatVoltage(primaryVoltage)}</span>
      </div>
      <input 
        type="range" 
        min="1000" 
        max="33000" 
        step="1000" 
        bind:value={primaryVoltage}
        class="slider voltage-slider"
      />
      <div class="formula-hint">High Voltage Transmission Line</div>
    </div>

    <div class="control-group">
      <div class="control-header">
        <label class="control-label">AC Frequency</label>
        <span class="control-value">{frequency} Hz</span>
      </div>
      <input 
        type="range" 
        min="50" 
        max="120" 
        step="5" 
        bind:value={frequency}
        class="slider frequency-slider"
      />
      <div class="formula-hint">ω = 2πf = {(2 * Math.PI * frequency).toFixed(1)} rad/s</div>
    </div>

    <div class="control-group">
      <div class="control-header">
        <label class="control-label">⚡ Simulation Speed</label>
        <span class="control-value">{speed.toFixed(2)}x</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="3" 
        step="0.01" 
        bind:value={speed}
        class="slider speed-slider"
      />
      <div class="formula-hint speed-hint">{getSpeedLabel(speed)}</div>
    </div>

    <div class="control-group">
      <div class="control-header">
        <label class="control-label">Animation</label>
        <button 
          class="toggle-btn {running ? 'running' : 'paused'}"
          onclick={() => running = !running}
        >
          {running ? '⏸ Pause' : '▶ Run'}
        </button>
      </div>
      <div class="ratio-display">
        <span class="ratio-label">Turns Ratio:</span>
        <span class="ratio-value">{(secondaryTurns/primaryTurns).toFixed(3)}</span>
        <span class="ratio-label">Voltage Ratio:</span>
        <span class="ratio-value">{(sim.secondaryRMS / sim.primaryRMS).toFixed(3)}</span>
      </div>
    </div>
  </div>

  <!-- Faraday's Law Explainer -->
  <div class="law-explainer">
    <div class="law-header">
      <button 
        class="law-tab {activeLaw === 'faraday' ? 'active' : ''}"
        onclick={() => activeLaw = 'faraday'}
      >
        Faraday's Law
      </button>
      <button 
        class="law-tab {activeLaw === 'lenz' ? 'active' : ''}"
        onclick={() => activeLaw = 'lenz'}
      >
        Lenz's Law
      </button>
    </div>
    <div class="law-content">
      {#if activeLaw === 'faraday'}
        <div class="faraday-content">
          <div class="law-equation">ε = -N • dΦ/dt</div>
          <p class="law-text">
            <strong>Electromotive Force</strong> = <strong>Turns</strong> × <strong>Rate of change of magnetic flux</strong><br/>
            The induced voltage is proportional to how FAST the magnetic field changes through the coil.
          </p>
          <div class="interactive-math">
            Currently: ε = {sim.inducedEMF.toFixed(1)}V = {secondaryTurns} × {sim.instantaneousFlux.toExponential(2)} Wb/s
          </div>
        </div>
      {:else}
        <div class="lenz-content">
          <div class="law-equation">The minus sign: Nature says "No!"</div>
          <p class="law-text">
            <strong>Lenz's Law</strong> explains the <strong>negative sign</strong> in Faraday's equation. 
            The induced current creates a magnetic field that <strong>OPPOSES</strong> the original change.
          </p>
          <div class="interactive-math">
            Opposition direction: {opposition > 0 ? '↺ Counter-Clockwise' : '↻ Clockwise'}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sim-container {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }

  /* SVG Styles */
  .svg-wrap {
    width: 100%;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    overflow: hidden;
  }

  .transformer-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Slide Bars Panel - Now at the bottom */
  .controls-panel {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .control-group {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    padding: 0.8rem;
    transition: all 0.2s ease;
  }

  .control-group:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .control-label {
    font-family: 'Syne', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
  }

  .control-value {
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
    font-weight: 700;
    color: #60A5FA;
  }

  .slider {
    width: 100%;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    outline: none;
    -webkit-appearance: none;
    margin: 0.5rem 0;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #60A5FA;
    cursor: pointer;
    box-shadow: 0 0 8px #60A5FA;
    border: none;
  }

  .primary-slider::-webkit-slider-thumb { background: #FFAA00; box-shadow: 0 0 8px #FFAA00; }
  .secondary-slider::-webkit-slider-thumb { background: #44AAFF; box-shadow: 0 0 8px #44AAFF; }
  .voltage-slider::-webkit-slider-thumb { background: #FF4466; box-shadow: 0 0 8px #FF4466; }
  .frequency-slider::-webkit-slider-thumb { background: #AA44FF; box-shadow: 0 0 8px #AA44FF; }
  .speed-slider::-webkit-slider-thumb { background: #00FFAA; box-shadow: 0 0 8px #00FFAA; }

  .formula-hint {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.3);
    font-family: 'Space Mono', monospace;
    margin-top: 0.3rem;
  }

  .speed-hint {
    color: #00FFAA;
    font-weight: 600;
  }

  .ratio-display {
    display: flex;
    gap: 0.5rem;
    font-size: 0.7rem;
    margin-top: 0.5rem;
    font-family: 'Space Mono', monospace;
    flex-wrap: wrap;
  }

  .ratio-label {
    color: rgba(255, 255, 255, 0.4);
  }

  .ratio-value {
    color: #60A5FA;
    font-weight: 700;
  }

  .toggle-btn {
    background: rgba(96, 165, 250, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.4);
    color: #60A5FA;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .toggle-btn.running {
    background: rgba(96, 165, 250, 0.4);
    border-color: #60A5FA;
  }

  .toggle-btn:hover {
    background: rgba(96, 165, 250, 0.6);
  }

  /* Waveforms */
  .waveforms {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 0.8rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .wave-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .wave-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.35);
  }

  .wave-svg {
    width: 100%;
    height: 40px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .wave-value {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .wave-divider {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
    padding: 0 0.3rem;
  }

  .primary-wave { filter: drop-shadow(0 0 3px rgba(255,170,0,0.4)); }
  .secondary-wave { filter: drop-shadow(0 0 3px rgba(68,170,255,0.4)); }

  /* Law Explainer */
  .law-explainer {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 40, 0.8));
    border-radius: 16px;
    border: 1px solid rgba(96, 165, 250, 0.2);
    overflow: hidden;
  }

  .law-header {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .law-tab {
    flex: 1;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    padding: 0.75rem;
    font-family: 'Syne', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .law-tab.active {
    color: #60A5FA;
    border-bottom: 2px solid #60A5FA;
    background: rgba(96, 165, 250, 0.1);
  }

  .law-content {
    padding: 1rem;
  }

  .law-equation {
    font-family: 'Space Mono', monospace;
    font-size: 1.1rem;
    text-align: center;
    color: #60A5FA;
    margin-bottom: 0.75rem;
  }

  .law-text {
    font-size: 0.8rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    margin: 0.5rem 0;
  }

  .interactive-math {
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    text-align: center;
    color: rgba(96, 165, 250, 0.8);
    background: rgba(0, 0, 0, 0.3);
    padding: 0.5rem;
    border-radius: 8px;
    margin-top: 0.75rem;
  }

  @media (max-width: 640px) {
    .controls-panel {
      grid-template-columns: 1fr;
    }
    
    .control-value {
      font-size: 0.8rem;
    }
  }
</style>