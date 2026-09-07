<script setup>
const count = ref(0)
</script>
<template><section class="sample-5"><h2>Sample 5</h2><button @click="count++">Count: {{ count }}</button></section></template>
<style scoped>
.sample-5 { padding: 1rem; border-bottom: 1px solid #ddd; }
</style>
