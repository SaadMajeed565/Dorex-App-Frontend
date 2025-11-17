<script setup lang="ts">
import { ref, computed } from 'vue';
import Dialog from '../../volt/Dialog.vue';

const props = defineProps<{
  visible: boolean;
  complaints: any[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

// Date range filter
const dateRange = ref('Last 7 days');
const dateRanges = ['Today', 'Yesterday', 'Last 7 days', 'Last 28 days', 'Last 90 days', 'This month', 'Last month'];

// Filter complaints by date range
const filteredComplaints = computed(() => {
  if (!props.complaints || props.complaints.length === 0) return [];
  
  const now = new Date();
  let cutoffDate: Date | null = null;

  switch (dateRange.value) {
    case 'Today':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'Yesterday':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return props.complaints.filter(c => {
        const created = new Date(c.createdAt);
        return created >= cutoffDate! && created < endOfYesterday;
      });
    case 'Last 7 days':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 28 days':
      cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 90 days':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'This month':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'Last month':
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return props.complaints.filter(c => {
        const created = new Date(c.createdAt);
        return created >= cutoffDate! && created <= lastDayOfLastMonth;
      });
  }

  if (cutoffDate) {
    return props.complaints.filter(c => {
      const created = new Date(c.createdAt);
      return created >= cutoffDate!;
    });
  }

  return props.complaints;
});

// Calculate previous period metrics for comparison
const previousPeriodComplaints = computed(() => {
  const complaints = props.complaints || [];
  if (!complaints.length) return [];
  
  const now = new Date();
  let cutoffStart: Date;
  let cutoffEnd: Date;
  
  switch (dateRange.value) {
    case 'Today':
      cutoffStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      cutoffEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'Yesterday':
      cutoffStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      cutoffEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case 'Last 7 days':
      cutoffStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      cutoffEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 28 days':
      cutoffStart = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
      cutoffEnd = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      break;
    default:
      return [];
  }
  
  return complaints.filter(c => {
    const created = new Date(c.createdAt);
    return created >= cutoffStart && created < cutoffEnd;
  });
});

// Key Metrics with delta comparison
const metrics = computed(() => {
  const complaints = filteredComplaints.value;
  const prev = previousPeriodComplaints.value;
  
  const total = complaints.length;
  const prevTotal = prev.length;
  const totalDelta = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100) : 0;
  
  const open = complaints.filter(c => c.status === 'Open').length;
  const prevOpen = prev.filter(c => c.status === 'Open').length;
  const openDelta = prevOpen > 0 ? ((open - prevOpen) / prevOpen * 100) : 0;
  
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const prevResolved = prev.filter(c => c.status === 'Resolved').length;
  const resolvedDelta = prevResolved > 0 ? ((resolved - prevResolved) / prevResolved * 100) : 0;
  
  // Calculate average resolution time (days)
  const resolvedComplaints = complaints.filter(c => 
    c.status === 'Resolved' || c.status === 'Closed'
  );
  let totalResolutionDays = 0;
  resolvedComplaints.forEach(c => {
    if (c.lastUpdated && c.createdAt) {
      const created = new Date(c.createdAt);
      const resolved = new Date(c.lastUpdated);
      const days = Math.max(0, Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      totalResolutionDays += days;
    }
  });
  const avgResolutionDays = resolvedComplaints.length > 0 
    ? parseFloat((totalResolutionDays / resolvedComplaints.length).toFixed(1))
    : 0;

  return [
    { key: 'total', label: 'Total Complaints', value: total, delta: totalDelta, suffix: '', icon: 'fa-ticket' },
    { key: 'open', label: 'Open Tickets', value: open, delta: openDelta, suffix: '', icon: 'fa-exclamation-circle' },
    { key: 'resolved', label: 'Resolved', value: resolved, delta: resolvedDelta, suffix: '', icon: 'fa-check-circle' },
    { key: 'resolution', label: 'Avg Resolution', value: avgResolutionDays, delta: -2.1, suffix: ' days', icon: 'fa-clock' },
  ];
});

const displayMetrics = computed(() => metrics.value.map(m => ({
  ...m,
  display: m.suffix ? `${m.value}${m.suffix}` : m.value.toLocaleString(),
  up: m.delta >= 0
})));

// Status Distribution
const statusDistribution = computed(() => {
  const complaints = filteredComplaints.value;
  return [
    { status: 'Open', count: complaints.filter(c => c.status === 'Open').length, color: 'text-rose-600' },
    { status: 'In Progress', count: complaints.filter(c => c.status === 'In Progress').length, color: 'text-amber-600' },
    { status: 'Resolved', count: complaints.filter(c => c.status === 'Resolved').length, color: 'text-emerald-600' },
  ].filter(s => s.count > 0);
});

// Category Distribution
const categoryDistribution = computed(() => {
  const complaints = filteredComplaints.value;
  const categoryMap = new Map<string, number>();
  
  complaints.forEach(c => {
    const cat = c.category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });

  const total = complaints.length;
  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(0)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
});
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Complaints Analytics"
    :closable="true"
    :breakpoints="{ '960px': '95vw', '640px': '98vw' }"
    :style="{ width: '1200px', maxWidth: '98vw' }"
  >
    <div class="space-y-6">
      <!-- Filters -->
      <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-sm text-gray-500">Complaints Overview</div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <select v-model="dateRange" class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
              <option v-for="r in dateRanges" :key="r" :value="r">{{ r }}</option>
            </select>
            <i class="fa-light fa-calendar absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
          </div>
        </div>
      </section>

      <!-- KPI Cards -->
      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div v-for="m in displayMetrics" :key="m.key" class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="flex items-start justify-between">
            <div class="text-sm text-gray-500">{{ m.label }}</div>
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--p-primary-50)] text-[var(--p-primary-600)]">
              <i :class="`fa-light ${m.icon}`"></i>
            </span>
          </div>
          <div class="mt-3 flex items-end justify-between">
            <div class="text-2xl font-semibold text-gray-900">{{ m.display }}</div>
            <div :class="m.up ? 'text-emerald-600' : 'text-rose-600'" class="text-sm font-medium">
              <i :class="m.up ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
              {{ Math.abs(m.delta).toFixed(1) }}%
            </div>
          </div>
          <div class="mt-1 text-xs text-gray-500">vs previous period</div>
        </div>
      </section>

      <!-- Charts Row -->
      <section class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Complaints over time</h3>
            <!-- <button class="text-xs text-gray-500 hover:text-gray-700">Export</button> -->
          </div>
          <div class="mt-4 h-56 rounded-md bg-[var(--p-content-hover-background)]"></div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Complaint status</h3>
            <button class="text-xs text-gray-500 hover:text-gray-700">View all</button>
          </div>
          <ul class="mt-3 space-y-2 text-sm">
            <li v-for="item in statusDistribution" :key="item.status" class="flex items-center justify-between">
              <span class="text-gray-700">{{ item.status }}</span>
              <span :class="item.color" class="font-medium">{{ item.count }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Categories & Breakdown -->
      <section class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Resolution trends</h3>
            <button class="text-xs text-gray-500 hover:text-gray-700">Download CSV</button>
          </div>
          <div class="mt-4 h-56 rounded-md bg-[var(--p-content-hover-background)]"></div>
        </div>
        <div class="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Top categories</h3>
            <button class="text-xs text-gray-500 hover:text-gray-700">View all</button>
          </div>
          <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <li v-for="item in categoryDistribution" :key="item.category" class="rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <span class="text-gray-700">{{ item.category }}</span>
              <span class="text-gray-900 font-medium">{{ item.percentage }}%</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </Dialog>
</template>
