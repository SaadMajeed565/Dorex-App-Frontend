<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

// Filters
const dateRange = ref<string>('Last 7 days');
const region = ref<string>('All Regions');
const ranges = ['Today','Yesterday','Last 7 days','Last 28 days','Last 90 days','This month','Last month'];
const regions = ['All Regions','North','South','East','West'];

// ISP Core KPIs
const kpis = ref([
  { key: 'uptime', label: 'Network Uptime', value: 99.93, suffix: '%', delta: 0.02 },
  { key: 'latency', label: 'Avg Latency', value: 24, suffix: 'ms', delta: -3.1 },
  { key: 'bandwidth', label: 'Bandwidth Peak', value: 9.2, suffix: 'Gbps', delta: 6.4 },
  { key: 'subs', label: 'Active Subscribers', value: 48214, delta: 1.8 }
]);

const displayKpis = computed(() => kpis.value.map(k => ({
  ...k,
  display: k.suffix ? `${k.value}${k.suffix}` : k.value.toLocaleString(),
  up: k.delta >= 0
})));

onMounted(async () => {
  try {
    await axiosClient.get('/isp/stats');
  } catch {}
});
</script>

<template>
  <MasterLayout>
    <!-- Filters -->
    <section class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-sm text-gray-500">Network Overview</div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <select v-model="dateRange" class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option v-for="r in ranges" :key="r" :value="r">{{ r }}</option>
          </select>
          <i class="fa-light fa-calendar absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        <div class="relative">
          <select v-model="region" class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
          </select>
          <i class="fa-light fa-map absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
      </div>
    </section>

    <!-- KPI Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="k in displayKpis" :key="k.key" class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-start justify-between">
          <div class="text-sm text-gray-500">{{ k.label }}</div>
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--p-primary-50)] text-[var(--p-primary-600)]">
            <i v-if="k.key==='uptime'" class="fa-light fa-signal-bars"></i>
            <i v-else-if="k.key==='latency'" class="fa-light fa-gauge"></i>
            <i v-else-if="k.key==='bandwidth'" class="fa-light fa-waveform"></i>
            <i v-else class="fa-light fa-users"></i>
          </span>
        </div>
        <div class="mt-3 flex items-end justify-between">
          <div class="text-2xl font-semibold text-gray-900">{{ k.display }}</div>
          <div :class="k.up ? 'text-emerald-600' : 'text-rose-600'" class="text-sm font-medium">
            <i :class="k.up ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
            {{ Math.abs(k.delta).toFixed(1) }}%
          </div>
        </div>
        <div class="mt-1 text-xs text-gray-500">vs previous period</div>
      </div>
    </section>

    <!-- Charts Row -->
    <section class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Bandwidth usage (Gbps)</h3>
          <!-- <button class="text-xs text-gray-500 hover:text-gray-700">Export</button> -->
        </div>
        <div class="mt-4 h-56 rounded-md bg-[var(--p-content-hover-background)]"></div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Incident status</h3>
          <button class="text-xs text-gray-500 hover:text-gray-700">View all</button>
        </div>
        <ul class="mt-3 space-y-2 text-sm">
          <li class="flex items-center justify-between"><span class="text-gray-700">Open</span><span class="font-medium text-rose-600">3</span></li>
          <li class="flex items-center justify-between"><span class="text-gray-700">Monitoring</span><span class="font-medium text-amber-600">5</span></li>
          <li class="flex items-center justify-between"><span class="text-gray-700">Resolved</span><span class="font-medium text-emerald-600">28</span></li>
        </ul>
      </div>
    </section>

    <!-- Subscribers & Plans -->
    <section class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Subscriber growth</h3>
          <button class="text-xs text-gray-500 hover:text-gray-700">Download CSV</button>
        </div>
        <div class="mt-4 h-56 rounded-md bg-[var(--p-content-hover-background)]"></div>
      </div>
      <div class="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Top plans</h3>
          <button class="text-xs text-gray-500 hover:text-gray-700">Manage Plans</button>
        </div>
        <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <li class="rounded-lg border border-gray-200 p-3 flex items-center justify-between"><span class="text-gray-700">Fiber 200 Mbps</span><span class="text-gray-900 font-medium">38%</span></li>
          <li class="rounded-lg border border-gray-200 p-3 flex items-center justify-between"><span class="text-gray-700">Fiber 100 Mbps</span><span class="text-gray-900 font-medium">27%</span></li>
          <li class="rounded-lg border border-gray-200 p-3 flex items-center justify-between"><span class="text-gray-700">Wireless 50 Mbps</span><span class="text-gray-900 font-medium">21%</span></li>
          <li class="rounded-lg border border-gray-200 p-3 flex items-center justify-between"><span class="text-gray-700">Legacy ADSL</span><span class="text-gray-900 font-medium">14%</span></li>
        </ul>
      </div>
    </section>
  </MasterLayout>
</template>