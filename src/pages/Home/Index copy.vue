<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

// Filters (GA-style)
const dateRange = ref<string>('Last 7 days');
const compare = ref<boolean>(false);
const segment = ref<string>('All Users');

const ranges = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 28 days',
  'Last 90 days',
  'This month',
  'Last month'
];

const segments = [
  'All Users',
  'Mobile',
  'Desktop',
  'Returning',
  'New'
];

// KPI sample data (wire to API later)
const metrics = ref([
  { key: 'users', label: 'Users', value: 12458, delta: 8.4 },
  { key: 'sessions', label: 'Sessions', value: 18240, delta: 3.1 },
  { key: 'engagement', label: 'Avg. Engagement Time', value: 312, delta: -1.2, suffix: 's' },
  { key: 'conversions', label: 'Conversions', value: 956, delta: 5.7 }
]);

const formattedMetrics = computed(() => metrics.value.map(m => ({
  ...m,
  display: m.suffix ? `${m.value}${m.suffix}` : m.value.toLocaleString(),
  up: m.delta >= 0
})));

// Example fetch
onMounted(async () => {
  try {
    await axiosClient.get('/analytics/summary');
  } catch (e) {
    // surface later via toast
  }
});
</script>

<template>
    <MasterLayout>
    <!-- Filters / Controls -->
    <section class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2">
        <div class="hidden md:block text-sm text-gray-500">Overview</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <select v-model="dateRange" class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option v-for="r in ranges" :key="r" :value="r">{{ r }}</option>
          </select>
          <i class="fa-light fa-calendar absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        <div class="relative">
          <select v-model="segment" class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option v-for="s in segments" :key="s" :value="s">{{ s }}</option>
          </select>
          <i class="fa-light fa-users absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        <label class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" v-model="compare" class="accent-gray-600">
          Compare
        </label>
      </div>
    </section>

    <!-- KPI Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="m in formattedMetrics" :key="m.key" class="rounded-xl border border-gray-200 bg-white shadow-md shadow-blue-100 p-4">
        <div class="flex items-start justify-between">
          <div class="text-sm text-gray-500">{{ m.label }}</div>
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--p-primary-50)] text-[var(--p-primary-600)]">
            <i v-if="m.key === 'users'" class="fa-light fa-user"></i>
            <i v-else-if="m.key === 'sessions'" class="fa-light fa-chart-line"></i>
            <i v-else-if="m.key === 'engagement'" class="fa-light fa-timer"></i>
            <i v-else class="fa-light fa-badge-check"></i>
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
    <section class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Users over time</h3>
          <button class="text-xs text-gray-500 hover:text-gray-700">Export</button>
        </div>
        <div class="mt-4 h-56 rounded-md bg-[var(--p-content-hover-background)]"></div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Top channels</h3>
          <button class="text-xs text-gray-500 hover:text-gray-700">View all</button>
        </div>
        <ul class="mt-3 space-y-2 text-sm">
          <li class="flex items-center justify-between">
            <span class="text-gray-700">Organic Search</span>
            <span class="text-gray-900 font-medium">48%</span>
          </li>
          <li class="flex items-center justify-between">
            <span class="text-gray-700">Direct</span>
            <span class="text-gray-900 font-medium">28%</span>
          </li>
          <li class="flex items-center justify-between">
            <span class="text-gray-700">Referral</span>
            <span class="text-gray-900 font-medium">16%</span>
          </li>
          <li class="flex items-center justify-between">
            <span class="text-gray-700">Social</span>
            <span class="text-gray-900 font-medium">8%</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Table / Recent Activity -->
    <section class="mt-6 rounded-xl border border-gray-200 bg-white">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700">Recent events</h3>
        <div class="text-xs text-gray-500">Last updated just now</div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[var(--p-content-hover-background)] text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Event</th>
              <th class="px-4 py-3 text-left font-medium">Category</th>
              <th class="px-4 py-3 text-left font-medium">Users</th>
              <th class="px-4 py-3 text-left font-medium">Conversions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr>
              <td class="px-4 py-3 text-gray-800">Page view</td>
              <td class="px-4 py-3 text-gray-500">Engagement</td>
              <td class="px-4 py-3 text-gray-900">9,842</td>
              <td class="px-4 py-3 text-gray-900">328</td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-800">Sign up</td>
              <td class="px-4 py-3 text-gray-500">Acquisition</td>
              <td class="px-4 py-3 text-gray-900">1,204</td>
              <td class="px-4 py-3 text-gray-900">956</td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-800">Purchase</td>
              <td class="px-4 py-3 text-gray-500">Monetization</td>
              <td class="px-4 py-3 text-gray-900">842</td>
              <td class="px-4 py-3 text-gray-900">612</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </MasterLayout>
  
</template>