<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OrganizationChartNode } from 'primevue/organizationchart'
import OrganizationChart from '../../volt/OrganizationChart.vue'
import Button from '../../volt/Button.vue'

// Sample mock data to visualize structure quickly
const root = ref<OrganizationChartNode>({
  key: 'hq',
  label: 'Headquarters',
  children: [
    {
      key: 'ops',
      label: 'Operations',
      children: [
        { key: 'ops-north', label: 'North Region' },
        { key: 'ops-south', label: 'South Region' },
      ],
    },
    {
      key: 'sales',
      label: 'Sales',
      children: [
        { key: 'sales-enterprise', label: 'Enterprise' },
        { key: 'sales-smb', label: 'SMB' },
      ],
    },
    {
      key: 'it',
      label: 'IT',
      children: [
        { key: 'it-infra', label: 'Infrastructure' },
        { key: 'it-apps', label: 'Applications' },
      ],
    },
  ],
})

// Simple zoom controls
const scale = ref(1)
const minScale = 0.6
const maxScale = 1.6
const step = 0.1

const zoomOut = () => (scale.value = Math.max(minScale, +(scale.value - step).toFixed(2)))
const zoomIn = () => (scale.value = Math.min(maxScale, +(scale.value + step).toFixed(2)))
const resetZoom = () => (scale.value = 1)

const transformStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: '0 0',
}))

// PrimeVue OrganizationChart expects a single root node
const rootNode = computed(() => root.value)
</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Org Chart Demo</h2>
      <div class="flex items-center gap-2">
        <Button label="-" size="small" @click="zoomOut" />
        <Button :label="`${Math.round(scale * 100)}%`" size="small" variant="outlined" @click="resetZoom" />
        <Button label="+" size="small" @click="zoomIn" />
      </div>
    </div>

    <div class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 overflow-auto" style="height: calc(100vh - 160px);">
      <div class="p-6" :style="transformStyle">
        <OrganizationChart :value="rootNode">
          <template #default="slotProps">
            <div class="flex items-center gap-2">
              <i class="fa-light fa-building text-primary-600"></i>
              <span class="font-medium">{{ slotProps.node.label }}</span>
            </div>
          </template>
        </OrganizationChart>
      </div>
    </div>
  </div>
  
</template>


