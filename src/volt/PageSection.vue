<script setup lang="ts">
defineProps<{ padded?: boolean }>();
</script>

<template>
  <section :class="padded ? 'rounded-xl border border-gray-200 bg-white p-4' : ''">
    <slot />
  </section>
</template>

