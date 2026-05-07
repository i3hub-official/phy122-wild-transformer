<script lang="ts">
  import TransformerSim from '$lib/components/TransformerSim.svelte';
</script>

<div class="min-h-screen bg-zinc-950 text-white">
  <div class="pt-16 pb-12 px-6 text-center">
    <h1 class="text-5xl md:text-6xl font-bold mb-4 bg-linear-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
      Electromagnetism in the Wild
    </h1>
    <p class="text-xl md:text-2xl text-zinc-400">Step-Down Transformer • Real-Time Simulation</p>
  </div>

  <div class="max-w-6xl mx-auto px-4 md:px-6 pb-20">
    <TransformerSim />
  </div>
</div>