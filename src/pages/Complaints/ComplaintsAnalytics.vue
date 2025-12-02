<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Dialog from '../../volt/Dialog.vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const toast = useToast();

// Date range filter
const dateRange = ref('Last 7 days');
const dateRanges = ['Today', 'Yesterday', 'Last 7 days', 'Last 28 days', 'Last 90 days', 'This month', 'Last month'];

// Analytics data
const loading = ref(false);
const metrics = ref<any[]>([]);
const statusDistribution = ref<any[]>([]);
const categoryDistribution = ref<any[]>([]);

// Fetch analytics data from backend
const fetchAnalytics = async () => {
  if (!props.visible) return;
  
  loading.value = true;
  try {
    const response = await axiosClient.get('/complaints/analytics/overview', {
      params: {
        date_range: dateRange.value
      }
    });

    if (response.data.status) {
      metrics.value = response.data.data.metrics || [];
      statusDistribution.value = response.data.data.status_distribution || [];
      categoryDistribution.value = response.data.data.category_distribution || [];
    }
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load analytics data',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Watch for date range changes
watch(dateRange, () => {
  fetchAnalytics();
});

// Watch for modal visibility
watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchAnalytics();
  }
});

// Fetch on mount if visible
onMounted(() => {
  if (props.visible) {
    fetchAnalytics();
  }
});

const displayMetrics = computed(() => metrics.value.map(m => {
  // Determine if the change is positive (up) or negative (down)
  // For most metrics: higher is better (total, resolved) - up arrow for positive delta
  // For open tickets: lower is better - up arrow for negative delta
  // For resolution time: lower is better - up arrow for negative delta
  
  let isUp = false;
  const delta = m.delta || 0;
  
  if (m.key === 'resolution') {
    // Lower resolution time is better, so negative delta is good (up arrow)
    isUp = delta <= 0;
  } else if (m.key === 'open') {
    // Lower open tickets is better, so negative delta is good (up arrow)
    isUp = delta <= 0;
  } else {
    // For total and resolved: higher is better, so positive delta is good (up arrow)
    isUp = delta >= 0;
  }
  
  return {
    ...m,
    display: m.suffix ? `${m.value}${m.suffix}` : m.value.toLocaleString(),
    up: isUp,
    delta: delta // Keep the original delta value
  };
}));
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
            <select 
              v-model="dateRange" 
              :disabled="loading"
              class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option v-for="r in dateRanges" :key="r" :value="r">{{ r }}</option>
            </select>
            <i class="fa-light fa-calendar absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-gray-500">Loading analytics...</div>
      </div>

      <!-- Analytics Content -->
      <template v-else>

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
            <div v-if="m.delta !== 0" :class="m.up ? 'text-emerald-600' : 'text-rose-600'" class="text-sm font-medium">
              <i :class="m.up ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
              {{ Math.abs(m.delta).toFixed(1) }}%
            </div>
            <div v-else class="text-sm font-medium text-gray-500">
              No change
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
      </template>
    </div>
  </Dialog>
</template>
