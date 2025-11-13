<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; icon?: string }>();
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-gray-300 bg-white p-8">
    <div class="h-12 w-12 rounded-full bg-[var(--p-primary-50)] text-[var(--p-primary-600)] flex items-center justify-center">
      <i :class="icon || 'fa-light fa-folder-open'" class="text-xl"></i>
    </div>
    <h4 class="mt-3 text-sm font-semibold text-gray-800">{{ title }}</h4>
    <p v-if="subtitle" class="mt-1 text-sm text-gray-500">{{ subtitle }}</p>
    <div class="mt-3">
      <slot />
    </div>
  </div>
</template>

