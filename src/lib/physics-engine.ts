/**
 * PHY122 Transformer Physics Engine
 * Implements Vp/Vs = Np/Ns (transformer turns ratio law)
 * and Faraday's Law: ε = -N dΦB/dt
 */

export interface TransformerState {
  primaryTurns: number;
  secondaryTurns: number;
  primaryVoltage: number;
  frequency: number;
  time: number;
}

export interface TransformerOutput {
  secondaryVoltage: number;
  turnsRatio: number;
  primaryCurrent: number;
  secondaryCurrent: number;
  fluxAmplitude: number;
  instantaneousFlux: number;
  inducedEMF: number;
  stepDownFactor: number;
}

const LOAD_RESISTANCE = 100; // Ohms, simulated residential load
const PRIMARY_RESISTANCE = 10; // Ohms

/**
 * Core transformer equation: Vp/Vs = Np/Ns
 */
export function calculateSecondaryVoltage(
  primaryVoltage: number,
  primaryTurns: number,
  secondaryTurns: number
): number {
  return (primaryVoltage * secondaryTurns) / primaryTurns;
}

/**
 * Faraday's Law: ε = -N * dΦB/dt
 * For a sinusoidal flux: ΦB = Φmax * sin(ωt)
 * dΦB/dt = Φmax * ω * cos(ωt)
 * ε = -N * Φmax * ω * cos(ωt)
 */
export function calculateFaradayEMF(
  turns: number,
  fluxAmplitude: number,
  angularFrequency: number,
  time: number
): number {
  const dFluxDt = fluxAmplitude * angularFrequency * Math.cos(angularFrequency * time);
  return -turns * dFluxDt;
}

/**
 * Instantaneous flux through core: ΦB(t) = Φmax * sin(ωt)
 */
export function instantaneousFlux(
  amplitude: number,
  angularFrequency: number,
  time: number
): number {
  return amplitude * Math.sin(angularFrequency * time);
}

/**
 * Full transformer simulation output
 */
export function simulateTransformer(state: TransformerState): TransformerOutput {
  const { primaryTurns, secondaryTurns, primaryVoltage, frequency, time } = state;

  const omega = 2 * Math.PI * frequency; // angular frequency rad/s
  const turnsRatio = primaryTurns / secondaryTurns;

  // Secondary voltage from turns ratio
  const secondaryVoltage = calculateSecondaryVoltage(primaryVoltage, primaryTurns, secondaryTurns);

  // Flux amplitude proportional to primary voltage / (N * ω)
  const fluxAmplitude = primaryVoltage / (primaryTurns * omega);

  // Instantaneous flux value
  const instFlux = instantaneousFlux(fluxAmplitude, omega, time);

  // Induced EMF in secondary via Faraday
  const inducedEMF = Math.abs(
    calculateFaradayEMF(secondaryTurns, fluxAmplitude, omega, time)
  );

  // Currents (ideal transformer: Vp*Ip = Vs*Is)
  const secondaryCurrent = secondaryVoltage / LOAD_RESISTANCE;
  const primaryCurrent = (secondaryVoltage * secondaryCurrent) / primaryVoltage;

  return {
    secondaryVoltage,
    turnsRatio,
    primaryCurrent,
    secondaryCurrent,
    fluxAmplitude,
    instantaneousFlux: instFlux,
    inducedEMF,
    stepDownFactor: primaryVoltage / secondaryVoltage,
  };
}

/**
 * Lenz's Law: Opposition direction of induced current
 * Returns normalized opposition factor (-1 to 1)
 */
export function lenzOpposition(angularFrequency: number, time: number): number {
  // Induced current opposes change in flux (derivative)
  return -Math.cos(angularFrequency * time);
}

/**
 * Explanation steps for the presentation
 */
export const explanationSteps = [
  {
    id: 1,
    title: "High-Voltage Street Lines",
    emoji: "⚡",
    description:
      "Your neighborhood gets power from transmission lines carrying 11,000V+ AC. That voltage would literally vaporize your phone charger. We need to step it down.",
    physics: "AC voltage oscillates as V(t) = Vmax · sin(2πft)",
    color: "#ff4444",
  },
  {
    id: 2,
    title: "Primary Coil & Changing Flux",
    emoji: "🌀",
    description:
      "The primary coil wrapped around an iron core acts like an electromagnet that's constantly changing direction. This creates an ever-shifting magnetic field — a 'flux' — through the core.",
    physics: "ΦB(t) = Φmax · sin(ωt)",
    color: "#ffaa00",
  },
  {
    id: 3,
    title: "Faraday's Law Kicks In",
    emoji: "🔬",
    description:
      "Faraday discovered: a changing magnetic field FORCES electrons to move in any nearby wire. The faster the flux changes, the bigger the kick (EMF). This is electromagnetic induction.",
    physics: "ε = −N · dΦB/dt",
    color: "#00d4ff",
  },
  {
    id: 4,
    title: "Lenz's Law: Nature Pushes Back",
    emoji: "🔄",
    description:
      "The induced current always fights the change that created it. Think of it as nature's resistance to change — the secondary coil generates a field opposing the primary. This is Lenz's Law.",
    physics: "Direction: opposes dΦB/dt",
    color: "#aa44ff",
  },
  {
    id: 5,
    title: "Turns Ratio = Voltage Ratio",
    emoji: "📐",
    description:
      "The magic formula: fewer turns on the secondary = less voltage out. 100 turns in, 10 turns out = 10× voltage reduction. The iron core efficiently transfers energy between coils.",
    physics: "Vp/Vs = Np/Ns",
    color: "#00ff88",
  },
  {
    id: 6,
    title: "Safe Residential Power",
    emoji: "🏠",
    description:
      "After the step-down transformer, you get the safe 220V (or 120V in US) that powers your home. The current increases as voltage drops — energy is conserved throughout.",
    physics: "Vp·Ip = Vs·Is (ideal)",
    color: "#44aaff",
  },
];