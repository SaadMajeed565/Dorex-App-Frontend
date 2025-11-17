<script setup lang="ts">
import { ref } from 'vue';
// import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

// Report builder filters
const dateRange = ref<string>('Last 28 days');
const reportType = ref<string>('Network');
const types = ['Network','Subscribers','Billing','Tickets'];

// async function exportReport() {
//   await axiosClient.get('/reports/export');
// }
</script>

<template>
    <MasterLayout>
    <!-- Builder Header -->
    <section class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-sm text-gray-700 font-semibold">Reports</div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <select v-model="reportType" class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
          </select>
          <i class="fa-light fa-diagram-project absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        <div class="relative">
          <select v-model="dateRange" class="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 28 days</option>
            <option>Last 90 days</option>
            <option>This month</option>
            <option>Last month</option>
          </select>
          <i class="fa-light fa-calendar absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>
        <!-- <button @click="exportReport" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <i class="fa-light fa-file-arrow-down"></i>
          Export
        </button> -->
      </div>
    </section>

    <!-- Report Sections -->
    <section class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Summary</h3>
        </div>
        <div class="mt-4 h-56 rounded-md bg-[var(--p-content-hover-background)]"></div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <h3 class="text-sm font-semibold text-gray-700">Highlights</h3>
        <ul class="mt-3 space-y-2 text-sm">
          <li class="flex items-start gap-2"><i class="fa-solid fa-circle-small text-[var(--p-primary-500)] mt-1"></i><span>Peak bandwidth increased by 6%.</span></li>
          <li class="flex items-start gap-2"><i class="fa-solid fa-circle-small text-[var(--p-primary-500)] mt-1"></i><span>Latency improved across North region.</span></li>
          <li class="flex items-start gap-2"><i class="fa-solid fa-circle-small text-[var(--p-primary-500)] mt-1"></i><span>Subscriber churn decreased to 1.2%.</span></li>
        </ul>
      </div>
    </section>

    <section class="mt-6 rounded-xl border border-gray-200 bg-white">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700">Detailed data</h3>
        <div class="text-xs text-gray-500">Generated on demand</div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[var(--p-content-hover-background)] text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Metric</th>
              <th class="px-4 py-3 text-left font-medium">Current</th>
              <th class="px-4 py-3 text-left font-medium">Previous</th>
              <th class="px-4 py-3 text-left font-medium">Change</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr>
              <td class="px-4 py-3 text-gray-800">Network uptime</td>
              <td class="px-4 py-3 text-gray-900">99.93%</td>
              <td class="px-4 py-3 text-gray-500">99.91%</td>
              <td class="px-4 py-3 text-emerald-600">+0.02%</td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-800">Avg latency</td>
              <td class="px-4 py-3 text-gray-900">24ms</td>
              <td class="px-4 py-3 text-gray-500">25ms</td>
              <td class="px-4 py-3 text-emerald-600">-3.1%</td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-800">Active subscribers</td>
              <td class="px-4 py-3 text-gray-900">48,214</td>
              <td class="px-4 py-3 text-gray-500">47,358</td>
              <td class="px-4 py-3 text-emerald-600">+1.8%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </MasterLayout>
</template>