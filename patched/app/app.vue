<script setup>
const ready = ref(false)
onMounted(() => { ready.value = true; window.__appReady = true })
</script>
<template>
<main><h1>Nuxt lazy component reproduction</h1><p>A standard Nuxt production build with 48 lazy components.</p>
<LazySample0 />
<LazySample1 />
<LazySample2 />
<LazySample3 />
<LazySample4 />
<LazySample5 />
<LazySample6 />
<LazySample7 />
<LazySample8 />
<LazySample9 />
<LazySample10 />
<LazySample11 />
<LazySample12 />
<LazySample13 />
<LazySample14 />
<LazySample15 />
<LazySample16 />
<LazySample17 />
<LazySample18 />
<LazySample19 />
<LazySample20 />
<LazySample21 />
<LazySample22 />
<LazySample23 />
<LazySample24 />
<LazySample25 />
<LazySample26 />
<LazySample27 />
<LazySample28 />
<LazySample29 />
<LazySample30 />
<LazySample31 />
<LazySample32 />
<LazySample33 />
<LazySample34 />
<LazySample35 />
<LazySample36 />
<LazySample37 />
<LazySample38 />
<LazySample39 />
<LazySample40 />
<LazySample41 />
<LazySample42 />
<LazySample43 />
<LazySample44 />
<LazySample45 />
<LazySample46 />
<LazySample47 />
<p>{{ ready ? "Hydrated" : "Server rendered" }}</p></main>
</template>
