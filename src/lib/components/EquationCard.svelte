<!-- src/lib/components/EquationCard.svelte -->
<script lang="ts">
  interface Props {
    title: string;
    equation: string;
    description: string;
    value?: string;
    unit?: string;
    color?: string;
    glowing?: boolean;
  }

  let {
    title,
    equation,
    description,
    value,
    unit = '',
    color = '#00d4ff',
    glowing = false
  }: Props = $props();
</script>

<div class="equation-card" class:glowing style="--accent: {color}">
  <div class="card-header">
    <span class="card-title">{title}</span>
    {#if value !== undefined}
      <span class="live-value">
        <span class="val">{value}</span>
        {#if unit}<span class="unit">{unit}</span>{/if}
      </span>
    {/if}
  </div>

  <div class="eq-display">
    <code class="equation">{equation}</code>
  </div>

  <p class="card-desc">{description}</p>
</div>

<style>
  .equation-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-left: 3px solid var(--accent);
    border-radius: 12px;
    padding: 1rem 1.2rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .equation-card.glowing {
    border-color: var(--accent);
    box-shadow:
      0 0 20px color-mix(in srgb, var(--accent) 15%, transparent),
      inset 0 0 20px color-mix(in srgb, var(--accent) 5%, transparent);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.6rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .card-title {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    opacity: 0.9;
  }

  .live-value {
    display: flex;
    align-items: baseline;
    gap: 0.2rem;
  }

  .val {
    font-family: 'Space Mono', monospace;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--accent);
    text-shadow: 0 0 10px var(--accent);
  }

  .unit {
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .eq-display {
    margin: 0.5rem 0;
  }

  .equation {
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.3);
    padding: 0.4rem 0.7rem;
    border-radius: 6px;
    display: inline-block;
    word-break: break-all;
  }

  .card-desc {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0;
    line-height: 1.5;
  }
</style>