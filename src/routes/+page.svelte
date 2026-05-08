<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { Zap, Magnet, Radio, BookOpen, Users } from 'lucide-svelte';
  import TransformerSim from '$lib/components/TransformerSim.svelte';
  import FluxSim from '$lib/components/FluxSim.svelte';
  import TechnicalBrief from '$lib/components/TechnicalBrief.svelte';
  import TeamFooter from '$lib/components/TeamFooter.svelte';

  let currentView = $state<'main' | 'flux' | 'brief'>('main');

  // Shared simulation state
  let primaryTurns = $state(400);
  let secondaryTurns = $state(80);
  let primaryVoltage = $state(12000);
  let frequency = $state(60);
  let running = $state(true);
  let fluxIntensity = $state(80);
  
  // Derived values for Technical Brief
  let turnsRatio = $derived(secondaryTurns / primaryTurns);
  let secondaryVoltage = $derived(primaryVoltage * turnsRatio);

   // Additional derived values for Technical Brief
  let inducedEMF = $derived(secondaryTurns * 2 * Math.PI * frequency * (primaryVoltage / (2 * Math.PI * frequency * primaryTurns)));
  let instantaneousFlux = $derived((primaryVoltage / (2 * Math.PI * frequency * primaryTurns)) * 0.5);
</script>

<div class="page">

  <!-- ─── Hero Header ─────────────────────────────────── -->
  <header class="hero">
    <div class="hero-inner">
      <div class="hero-badge">
        <Zap size={20} class="hero-icon" />
        <span class="badge-text">PHY122 — Electromagnetic Induction</span>
      </div>
      <h1 class="hero-title">
        Electromagnetism<br/>
        <span class="hero-gradient">in the Wild</span>
      </h1>
      <p class="hero-sub">
        Real-time Step-Down Transformer Simulation · COLPAS Group
      </p>
    </div>
  </header>

  <!-- ─── Navigation Tabs ──────────────────────────────── -->
  <nav class="tab-nav">
    <div class="tab-track">
      <button
        class="tab-btn"
        class:active={currentView === 'main'}
        onclick={() => (currentView = 'main')}
      >
        <Magnet size={16} />
        <span>Transformer Sim</span>
      </button>
      <button
        class="tab-btn"
        class:active={currentView === 'flux'}
        onclick={() => (currentView = 'flux')}
      >
        <Radio size={16} />
        <span>Flux Visualizer</span>
      </button>
      <button
        class="tab-btn"
        class:active={currentView === 'brief'}
        onclick={() => (currentView = 'brief')}
      >
        <BookOpen size={16} />
        <span>Technical Brief</span>
      </button>
    </div>
  </nav>

  <!-- ─── Content ──────────────────────────────────────── -->
  <main class="content">
    {#if currentView === 'main'}
      <TransformerSim
        bind:primaryTurns
        bind:secondaryTurns
        bind:primaryVoltage
        bind:frequency
        bind:running
      />
    {:else if currentView === 'flux'}
      <FluxSim bind:intensity={fluxIntensity} isAC={true} />
    {:else}
     {#if currentView === 'brief'}
  <TechnicalBrief
    turnsRatio={turnsRatio}
    primaryTurns={primaryTurns}
    secondaryTurns={secondaryTurns}
    primaryVoltage={primaryVoltage}
    secondaryVoltage={secondaryVoltage}
    frequency={frequency}
    inducedEMF={inducedEMF}
    instantaneousFlux={instantaneousFlux}
  />
{/if}
    {/if}
  </main>

  <!-- ─── Team Footer (Visible on all pages) ──────────────── -->
  <TeamFooter />

  <!-- ─── Footer ───────────────────────────────────────── -->
  <footer class="footer">
    <Zap size={12} class="footer-icon" />
    COLPAS Group &nbsp;·&nbsp; PHY122 Presentation &nbsp;·&nbsp; Real-time Electromagnetic Induction
  </footer>
</div>

<style>
  /* ── Layout ── */
  .page {
    min-height: 100svh;
    background: #09090b;
    color: #f4f4f5;
    display: flex;
    flex-direction: column;
  }

  /* ── Hero ── */
  .hero {
    border-bottom: 1px solid #27272a;
    padding: 3rem 1.5rem 2.5rem;
    text-align: center;
  }

  .hero-inner {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #18181b;
    border: 1px solid #3f3f46;
    border-radius: 999px;
    padding: 0.35rem 1rem;
  }

  :global(.hero-icon) { color: #facc15; }

  .badge-text {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #a1a1aa;
    text-transform: uppercase;
  }

  .hero-title {
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin: 0;
  }

  .hero-gradient {
    background: linear-gradient(90deg, #60a5fa, #a78bfa, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 0.9rem;
    color: #71717a;
    margin: 0;
  }

  /* ── Tabs ── */
  .tab-nav {
    border-bottom: 1px solid #27272a;
    padding: 0 1.5rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-track {
    max-width: 1152px;
    margin: 0 auto;
    display: flex;
    gap: 0.25rem;
    padding: 0.75rem 0 0;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.2rem;
    border-radius: 10px 10px 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #71717a;
    background: transparent;
    border: 1px solid transparent;
    border-bottom: none;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }

  .tab-btn:hover {
    color: #e4e4e7;
    background: #18181b;
  }

  .tab-btn.active {
    color: #f4f4f5;
    background: #18181b;
    border-color: #3b82f6;
    border-bottom-color: #18181b;
    position: relative;
    bottom: -1px;
  }

  /* ── Main Content ── */
  .content {
    flex: 1;
    max-width: 1152px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  /* ── Footer ── */
  .footer {
    border-top: 1px solid #27272a;
    padding: 1.25rem;
    text-align: center;
    font-size: 0.72rem;
    color: #52525b;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }

  :global(.footer-icon) { color: #3f3f46; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .hero { padding: 2rem 1rem 1.75rem; }
    .tab-nav { padding: 0 1rem; }
    .content { padding: 1.25rem 1rem; }
    .tab-btn span { font-size: 0; }
    .tab-btn { padding: 0.6rem 1rem; }
  }
</style>