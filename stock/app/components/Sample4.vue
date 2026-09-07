<script setup>
const count = ref(0)
</script>
<template><section class="sample-4"><h2>Sample 4</h2><button @click="count++">Count: {{ count }}</button></section></template>
<style scoped>
.sample-4 { padding: 1rem; border-bottom: 1px solid #ddd; }
</style>
