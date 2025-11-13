<script setup lang="ts">
defineProps<{ label: string; value: string | number; delta?: number; icon?: string }>();
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4">
    <div class="flex items-start justify-between">
      <div class="text-sm text-gray-500">{{ label }}</div>
      <span v-if="icon" class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--p-primary-50)] text-[var(--p-primary-600)]">
        <i :class="icon"></i>
      </span>
    </div>
    <div class="mt-3 flex items-end justify-between">
      <div class="text-2xl font-semibold text-gray-900">{{ value }}</div>
      <div v-if="delta !== undefined" :class="delta >= 0 ? 'text-emerald-600' : 'text-rose-600'" class="text-sm font-medium">
        <i :class="delta >= 0 ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
        {{ Math.abs(delta).toFixed(1) }}%
      </div>
    </div>
    <div v-if="delta !== undefined" class="mt-1 text-xs text-gray-500">vs previous period</div>
  </div>
</template>

