<!-- src/lib/components/SpeedControl.svelte -->
<script lang="ts">
  import { Zap, Clock, Activity, Gauge, ZapOff } from 'lucide-svelte';

  let { speed = $bindable(1.0) } = $props();

  function getSpeedLabel(s: number): string {
    if (s === 0) return 'Paused';
    if (s < 0.1) return 'Super Slow-Mo';
    if (s < 0.3) return 'Extreme Slow-Mo';
    if (s < 0.6) return 'Slow Motion';
    if (s === 1) return 'Normal Speed';
    if (s < 1.5) return 'Fast';
    if (s < 2) return 'Turbo';
    return 'Ludicrous Speed';
  }

  // Derived reactive icon — recalculated whenever speed changes
  let SpeedIcon = $derived(
    speed === 0 ? ZapOff :
    speed < 0.6 ? Clock :
    speed === 1 ? Activity :
    speed < 2 ? Gauge :
    Zap
  );
</script>

<div>
  <label class="block text-sm text-zinc-400 mb-3 flex items-center gap-2">
    <SpeedIcon size={14} />
    Speed Control
  </label>
  <input
    type="range"
    min="0"
    max="3"
    step="0.01"
    bind:value={speed}
    class="w-full accent-emerald-500"
  />
  <div class="flex justify-between font-mono mt-1 text-sm">
    <span class="text-emerald-400">{speed.toFixed(2)}x</span>
    <span class="text-zinc-500">{getSpeedLabel(speed)}</span>
  </div>
</div>