<template>
    <OrganizationChart
      unstyled
      :pt="theme"
      :ptOptions="{ mergeProps: ptViewMerge }"
      v-bind="$attrs"
    >
      <!-- Toggle Icon -->
      <template #toggleicon="{ expanded }">
        <ChevronUpIcon v-if="expanded" class="w-3 h-3 text-slate-500 dark:text-slate-400" />
        <ChevronDownIcon v-else class="w-3 h-3 text-slate-500 dark:text-slate-400" />
      </template>
  
      <!-- Forward all custom slots -->
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps ?? {}" />
      </template>
    </OrganizationChart>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import ChevronDownIcon from '@primevue/icons/chevrondown'
  import ChevronUpIcon from '@primevue/icons/chevronup'
  import OrganizationChart, {
    type OrganizationChartPassThroughOptions,
    type OrganizationChartProps
  } from 'primevue/organizationchart'
  import { ptViewMerge } from './utils'
  
  interface Props extends /* @vue-ignore */ OrganizationChartProps {}
  defineProps<Props>()
  
  /**
   * Aura-Inspired Custom OrgChart Theme (Tailwind-Only)
   * - Uses slate palette to match Aura's neutral, modern look
   * - 1px connectors for subtlety
   * - Perfect alignment, no gaps
   * - Full dark mode support
   */
  const theme = ref<OrganizationChartPassThroughOptions>({
    root: `
      overflow-x-auto overflow-y-hidden
      bg-white dark:bg-slate-950
      p-6 rounded-lg
    `,
  
    table: `
      border-collapse separate border-spacing-0
      text-center mx-auto
    `,
  
    cell: `align-top p-2 relative`,
  
    /* ──────────────── NODE ──────────────── */
    node: `
      relative inline-flex flex-col items-center justify-center
      min-w-[12rem] px-5 py-3
      bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-700
      rounded-md shadow-sm
      text-slate-700 dark:text-slate-200
      hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600
      transition-all duration-200 ease-in-out
      cursor-pointer select-none font-medium text-sm
    `,
  
    nodeToggleButton: `
      absolute -bottom-3 left-1/2 -translate-x-1/2
      flex items-center justify-center
      w-6 h-6 rounded-full
      border border-slate-300 dark:border-slate-600
      bg-white dark:bg-slate-900
      text-slate-500 dark:text-slate-400
      hover:bg-slate-50 dark:hover:bg-slate-800
      hover:border-slate-400 dark:hover:border-slate-500
      transition-all duration-200 z-10
    `,
  
    /* ──────────────── CONNECTORS ──────────────── */
    connectors: `relative z-0`,
    lineCell: `relative p-0 h-6`,
  
    // Vertical line from parent to child group center
    connectorDown: `
      absolute left-1/2 top-0 -translate-x-1/2
      w-px h-full bg-slate-300 dark:bg-slate-600
    `,
  
    // Horizontal line connecting siblings
    connectorLeft: `
      absolute top-1/2 left-0
      w-full h-px bg-slate-300 dark:bg-slate-600
    `,
  
    // Children container with precise spacing
    nodeChildren: `
      flex justify-center items-start gap-x-12 pt-8 relative
    `
  })
  </script>
  
  <style scoped>
  /* Optional: Fine-tune connector alignment if needed */
  .nodeChildrenConnector,
  .nodeChildren::before {
    content: '';
    @apply pointer-events-none;
  }
  </style>