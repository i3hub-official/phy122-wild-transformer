<!-- src/lib/components/TechnicalBrief.svelte -->
<script lang="ts">
  import { Calculator, Zap, TrendingUp, TrendingDown, Info, BookOpen, Battery, Activity, Shield, Users } from 'lucide-svelte';
  
  // Use $props() instead of export let in runes mode
  let {
    turnsRatio,
    primaryTurns,
    secondaryTurns,
    primaryVoltage,
    secondaryVoltage,
    frequency,
    inducedEMF,
    instantaneousFlux
  }: {
    turnsRatio: number;
    primaryTurns: number;
    secondaryTurns: number;
    primaryVoltage: number;
    secondaryVoltage: number;
    frequency: number;
    inducedEMF: number;
    instantaneousFlux: number;
  } = $props();
</script>

<div class="brief-container">
  <div class="brief-header">
    <BookOpen size={20} />
    <h2>Technical Brief: Electromagnetic Induction</h2>
  </div>

  <div class="brief-content">
    <!-- Faraday's Law Section -->
    <div class="law-section faraday">
      <h3>
        <Zap size={16} />
        Faraday's Law of Induction
      </h3>
      <div class="equation">ε = -N · dΦ/dt</div>
      <p>
        The induced electromotive force (ε) in a coil is equal to the negative rate of change of magnetic flux (Φ) 
        multiplied by the number of turns (N). This principle explains how changing magnetic fields create electric current.
      </p>
      <div class="math-breakdown">
        <strong>Mathematical Breakdown:</strong>
        <ul>
          <li>ε = Induced EMF (Volts)</li>
          <li>N = Number of turns in the coil</li>
          <li>dΦ/dt = Rate of change of magnetic flux (Webers/second)</li>
          <li>The negative sign indicates Lenz's Law (opposition)</li>
        </ul>
      </div>
      <div class="live-values">
        <Activity size={12} />
        <span>Current ε = {inducedEMF.toFixed(1)} V</span>
        <span>| dΦ/dt = {instantaneousFlux.toExponential(2)} Wb/s</span>
      </div>
    </div>

    <!-- Transformer Equation Section -->
    <div class="law-section transformer">
      <h3>
        <TrendingUp size={16} />
        <TrendingDown size={16} />
        Transformer Voltage Ratio
      </h3>
      <div class="equation">Vp / Vs = Np / Ns</div>
      <p>
        The ratio of primary voltage (Vp) to secondary voltage (Vs) equals the ratio of primary turns (Np) 
        to secondary turns (Ns). This fundamental equation governs step-up and step-down transformer operation.
      </p>
      <div class="math-breakdown">
        <strong>Current Transformer Values:</strong>
        <ul>
          <li>Primary Turns (Np) = {primaryTurns}</li>
          <li>Secondary Turns (Ns) = {secondaryTurns}</li>
          <li>Turns Ratio (Np/Ns) = {turnsRatio.toFixed(3)}</li>
          <li>Primary Voltage = {(primaryVoltage / 1000).toFixed(1)} kV</li>
          <li>Secondary Voltage = {secondaryVoltage.toFixed(1)} V</li>
          <li>Frequency = {frequency} Hz</li>
        </ul>
      </div>
      <div class="live-values">
        <Battery size={12} />
        <span>Step-Down Factor: {(1 / turnsRatio).toFixed(1)}x</span>
      </div>
    </div>

    <!-- Mutual Induction Section -->
    <div class="law-section mutual">
      <h3>
        <Shield size={16} />
        Mutual Induction
      </h3>
      <p>
        <strong>Why the wires don't touch:</strong> The iron core directs magnetic flux from the primary coil to the secondary coil 
        through <strong>mutual induction</strong>. The changing magnetic field in the primary induces voltage in the secondary 
        without any physical connection. This provides electrical isolation while enabling power transfer.
      </p>
      <div class="key-point">
        <Info size={12} />
        <span>The iron core concentrates and guides the magnetic field, making induction efficient and directional.</span>
      </div>
    </div>
  </div>

  <!-- Footer with team accountability -->
  <div class="brief-footer">
    <Users size={14} />
    <span>COLPAS Group • All members accountable for Q&A session</span>
    <Shield size={14} />
    <span>Mutual Induction verified by Lead Physicist</span>
  </div>
</div>

<style>
  .brief-container {
    background: linear-gradient(135deg, #0a0f1a 0%, #0a0a0f 100%);
    border-radius: 24px;
    border: 1px solid rgba(103, 232, 249, 0.15);
    overflow: hidden;
    margin-top: 2rem;
  }

  .brief-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    background: rgba(103, 232, 249, 0.05);
    border-bottom: 1px solid rgba(103, 232, 249, 0.1);
  }

  .brief-header h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #67e8f9, #a855f7);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .brief-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .law-section {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 16px;
    padding: 1.25rem;
    border: 1px solid rgba(103, 232, 249, 0.1);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .law-section:hover {
    transform: translateY(-2px);
    border-color: rgba(103, 232, 249, 0.3);
  }

  .law-section h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: #67e8f9;
  }

  .equation {
    font-family: 'Space Mono', monospace;
    font-size: 1rem;
    text-align: center;
    background: rgba(103, 232, 249, 0.1);
    padding: 0.5rem;
    border-radius: 8px;
    margin: 0.75rem 0;
    color: #67e8f9;
  }

  .law-section p {
    font-size: 0.8rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.7);
    margin: 0.75rem 0;
  }

  .math-breakdown {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.75rem;
  }

  .math-breakdown strong {
    color: #a855f7;
    font-size: 0.75rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .math-breakdown ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  .math-breakdown li {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0.25rem 0;
  }

  .live-values {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(103, 232, 249, 0.05);
    border-radius: 8px;
    font-size: 0.7rem;
    font-family: 'Space Mono', monospace;
    color: #67e8f9;
    flex-wrap: wrap;
  }

  .key-point {
    background: rgba(103, 232, 249, 0.1);
    border-left: 3px solid #67e8f9;
    padding: 0.75rem;
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .brief-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba(103, 232, 249, 0.03);
    border-top: 1px solid rgba(103, 232, 249, 0.1);
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .brief-content {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1rem;
    }
    
    .brief-header {
      padding: 1rem;
    }
    
    .brief-footer {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
    
    .live-values {
      flex-direction: column;
      text-align: center;
    }
  }
</style>