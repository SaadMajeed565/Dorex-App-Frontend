<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';
import { useToast } from 'primevue/usetoast';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';

const toast = useToast();
const generalSettingsStore = useGeneralSettingsStore();
const loading = ref(true);

// Date range filter
const dateRange = ref<string>('Last 30 days');
const ranges = ['Today', 'Last 7 days', 'Last 30 days', 'This month', 'Last month', 'This year'];

// Dashboard data
const dashboardData = ref({
  customers: { total: 0, active: 0, suspended: 0, inactive: 0 },
  subscriptions: { total: 0, active: 0, cancelled: 0, paused: 0, totalRevenue: 0 },
  payments: { total: 0, totalAmount: 0, paid: 0, pending: 0, failed: 0 },
  areas: { total: 0, active: 0 },
  employees: { total: 0, active: 0 },
  complaints: { total: 0, open: 0, inProgress: 0, resolved: 0 },
  equipment: { total: 0, active: 0, maintenance: 0, offline: 0 },
  packages: { total: 0, active: 0 }
});

// Chart data
const paymentTrendData = ref<{ date: string; amount: number }[]>([]);
const subscriptionGrowthData = ref<{ month: string; count: number }[]>([]);
const complaintStatusData = ref<{ status: string; count: number; color: string }[]>([]);
const customerStatusData = ref<{ status: string; count: number; color: string }[]>([]);
const topAreasData = ref<{ area: string; customers: number }[]>([]);

// Recent activities
const recentPayments = ref<any[]>([]);
const recentComplaints = ref<any[]>([]);
const recentSubscriptions = ref<any[]>([]);
const recentCustomers = ref<any[]>([]);

const customerStatusColors: Record<string, string> = {
  active: 'bg-green-500',
  suspended: 'bg-yellow-500',
  inactive: 'bg-gray-500',
  other: 'bg-indigo-500',
};

const complaintStatusColors: Record<string, string> = {
  open: 'bg-red-500',
  'in progress': 'bg-yellow-500',
  in_progress: 'bg-yellow-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
  unknown: 'bg-gray-500',
};

// Fetch dashboard data
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const response = await axiosClient.get('/dashboard/overview');
    const data = response.data?.data ?? {};

    const customers = data.customers ?? {};
    dashboardData.value.customers.total = customers.total ?? 0;
    dashboardData.value.customers.active = customers.active ?? 0;
    dashboardData.value.customers.suspended = customers.suspended ?? 0;
    dashboardData.value.customers.inactive = customers.inactive ?? 0;

    customerStatusData.value = (customers.status_breakdown ?? []).map((item: any) => {
      const key = (item.key || item.status || '').toString().toLowerCase();
      return {
        status: item.status ?? item.label ?? (key ? key.replace(/_/g, ' ') : 'Unknown'),
        count: item.count ?? 0,
        color: item.color ?? customerStatusColors[key] ?? 'bg-gray-500',
      };
    });

    topAreasData.value = (customers.top_areas ?? []).map((area: any) => ({
      area: area.area ?? 'Unknown',
      customers: area.customers ?? area.total ?? 0,
    }));

    recentCustomers.value = customers.recent ?? [];

    const subscriptions = data.subscriptions ?? {};
    dashboardData.value.subscriptions.total = subscriptions.total ?? 0;
    dashboardData.value.subscriptions.active = subscriptions.active ?? 0;
    dashboardData.value.subscriptions.cancelled = subscriptions.cancelled ?? 0;
    dashboardData.value.subscriptions.paused = subscriptions.paused ?? 0;
    dashboardData.value.subscriptions.totalRevenue = subscriptions.total_revenue ?? 0;

    subscriptionGrowthData.value = (subscriptions.growth ?? []).map((item: any) => ({
      month: item.month ?? item.label ?? '',
      count: item.count ?? 0,
    }));

    recentSubscriptions.value = (subscriptions.recent ?? []).map((item: any) => ({
      ...item,
      customer: item.customer ?? { name: item.customer_name ?? 'Unknown' },
      package: item.package ?? { name: item.package_name ?? 'N/A' },
    }));

    const payments = data.payments ?? {};
    dashboardData.value.payments.total = payments.total ?? 0;
    dashboardData.value.payments.paid = payments.paid ?? 0;
    dashboardData.value.payments.pending = payments.pending ?? 0;
    dashboardData.value.payments.failed = payments.failed ?? 0;
    dashboardData.value.payments.totalAmount = payments.total_amount ?? 0;

    paymentTrendData.value = (payments.trend ?? []).map((item: any) => ({
      date: item.date ?? '',
      amount: item.amount ?? 0,
    }));

    recentPayments.value = (payments.recent ?? []).map((item: any) => ({
      ...item,
      customer: item.customer ?? { name: item.customer_name ?? 'Unknown' },
      amount: item.amount ?? 0,
      amountCents: item.amountCents ?? Math.round((item.amount ?? 0) * 100),
    }));

    const complaints = data.complaints ?? {};
    dashboardData.value.complaints.total = complaints.total ?? 0;
    dashboardData.value.complaints.open = complaints.open ?? 0;
    dashboardData.value.complaints.inProgress = complaints.in_progress ?? complaints['in progress'] ?? 0;
    dashboardData.value.complaints.resolved = complaints.resolved ?? 0;

    complaintStatusData.value = (complaints.status_breakdown ?? []).map((item: any) => {
      const key = (item.key || item.status || '').toString().toLowerCase().replace(/\s+/g, '_');
      const label = item.status ?? item.label ?? key.replace(/_/g, ' ');
      return {
        status: label,
        count: item.count ?? 0,
        color: item.color ?? complaintStatusColors[key] ?? 'bg-gray-500',
      };
    });

    recentComplaints.value = (complaints.recent ?? []).map((item: any) => ({
      ...item,
      customer: item.customer ?? { name: item.customer_name ?? 'Unknown' },
    }));

    dashboardData.value.areas.total = data.areas?.total ?? 0;

    dashboardData.value.packages.total = data.packages?.total ?? 0;
    dashboardData.value.packages.active = data.packages?.active ?? 0;

    dashboardData.value.employees.total = data.employees?.total ?? 0;
    dashboardData.value.employees.active = data.employees?.active ?? 0;

    const equipment = data.equipment ?? {};
    dashboardData.value.equipment.total = equipment.total ?? 0;
    dashboardData.value.equipment.active = equipment.active ?? 0;
    dashboardData.value.equipment.maintenance = equipment.maintenance ?? 0;
    dashboardData.value.equipment.offline = equipment.offline ?? 0;

  } catch (err: any) {
    console.error('Error fetching dashboard data:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load dashboard data. Some statistics may be incomplete.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

// Overall KPIs
const overallKPIs = computed(() => {
  return [
    {
      key: 'customers',
      label: 'Total Customers',
      value: dashboardData.value.customers.total,
      icon: 'fa-light fa-users',
      color: 'bg-blue-50 text-blue-600',
      trend: '+12%'
    },
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: dashboardData.value.payments.totalAmount,
      icon: 'fa-light fa-dollar-sign',
      color: 'bg-emerald-50 text-emerald-600',
      suffix: 'currency',
      trend: '+8.5%'
    },
    {
      key: 'subscriptions',
      label: 'Active Subscriptions',
      value: dashboardData.value.subscriptions.active,
      icon: 'fa-light fa-badge-check',
      color: 'bg-green-50 text-green-600',
      trend: '+5.2%'
    },
    {
      key: 'complaints',
      label: 'Open Complaints',
      value: dashboardData.value.complaints.open,
      icon: 'fa-light fa-exclamation-circle',
      color: 'bg-red-50 text-red-600',
      trend: '-3.1%'
    }
  ];
});

// Chart helpers
const getMaxValue = (data: any[], key: string) => {
  if (data.length === 0) return 1;
  const values = data.map(d => d[key]).filter(v => v > 0);
  return values.length > 0 ? Math.max(...values) : 1;
};

const getBarHeight = (value: number, max: number, chartHeight: number = 200) => {
  if (value === 0 || max === 0) return '12px'; // Minimum visible bar for zero values
  const percentage = (value / max) * 100;
  // Ensure minimum 15% height for visibility, but keep proportional scaling
  const minHeight = Math.max(percentage, 15);
  // Don't exceed chart height
  const actualHeight = Math.min(minHeight, 100);
  return `${(actualHeight / 100) * chartHeight}px`;
};

const currencyUnit = computed(() => generalSettingsStore.currencyUnit || 'PKR');

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyUnit.value,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
  }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const formatCustomerName = (customer: any) => {
  if (typeof customer === 'string') return customer;
  return customer?.name || customer?.customer?.name || customer?.customerName || 'Unknown';
};

// Pie chart calculations
const getTotalCount = (data: { count: number }[]) => {
  return data.reduce((sum, item) => sum + item.count, 0);
};

const getPiePath = (startAngle: number, endAngle: number, radius: number) => {
  const start = {
    x: 50 + radius * Math.cos(startAngle),
    y: 50 + radius * Math.sin(startAngle)
  };
  const end = {
    x: 50 + radius * Math.cos(endAngle),
    y: 50 + radius * Math.sin(endAngle)
  };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const getPieChartData = (data: { count: number; color: string }[]) => {
  const total = getTotalCount(data);
  if (total === 0) return [];
  
  // Filter out items with zero count to avoid cluttering the chart
  const validData = data.filter(item => item.count > 0);
  if (validData.length === 0) return [];
  
  let currentAngle = -Math.PI / 2;
  return validData.map(item => {
    const angle = (item.count / total) * 2 * Math.PI;
    // Ensure minimum angle for very small slices (at least 1 degree)
    const minAngle = (Math.PI / 180) * 1; // 1 degree in radians
    const actualAngle = Math.max(angle, minAngle);
    const startAngle = currentAngle;
    const endAngle = currentAngle + actualAngle;
    currentAngle = endAngle;
    return {
      ...item,
      startAngle,
      endAngle,
      percentage: ((item.count / total) * 100).toFixed(1),
      path: getPiePath(startAngle, endAngle, 35)
    };
  });
};

const customerPieData = computed(() => getPieChartData(customerStatusData.value));
const complaintPieData = computed(() => getPieChartData(complaintStatusData.value));

onMounted(async () => {
  if (!generalSettingsStore.loaded) {
    await generalSettingsStore.fetchSettings().catch(() => null);
  }
  fetchDashboardData();
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-sm text-gray-500">Comprehensive overview of your ISP operations</p>
        </div>
        <div class="flex items-center gap-2">
          <select 
            v-model="dateRange" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="r in ranges" :key="r" :value="r">{{ r }}</option>
          </select>
          <button
            @click="fetchDashboardData"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Overall KPIs -->
      <section class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div 
          v-for="kpi in overallKPIs" 
          :key="kpi.key" 
          class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-500">{{ kpi.label }}</p>
            <div :class="['inline-flex h-10 w-10 items-center justify-center rounded-lg', kpi.color]">
              <i :class="[kpi.icon, 'text-lg']"></i>
            </div>
          </div>
          <div class="flex items-baseline justify-between">
            <p class="text-3xl font-bold text-gray-900">
              <template v-if="kpi.suffix === 'currency'">
                {{ formatCurrency(kpi.value) }}
              </template>
              <template v-else>
                {{ kpi.value.toLocaleString() }}
              </template>
            </p>
            <span class="text-xs font-medium text-green-600 flex items-center gap-1">
              <i class="fa-solid fa-arrow-trend-up"></i>
              {{ kpi.trend }}
            </span>
          </div>
        </div>
      </section>

            <!-- Module Stats Grid -->
            <section class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-2">
            <i class="fa-light fa-users text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Customers</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.customers.total }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 mb-2">
            <i class="fa-light fa-badge-check text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Subscriptions</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.subscriptions.active }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-2">
            <i class="fa-light fa-credit-card text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Payments</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.payments.total }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 mb-2">
            <i class="fa-light fa-message-exclamation text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Complaints</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.complaints.total }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 mb-2">
            <i class="fa-light fa-map-location-dot text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Areas</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.areas.total }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-2">
            <i class="fa-light fa-id-badge text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Employees</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.employees.total }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 mb-2">
            <i class="fa-light fa-router text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Equipment</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.equipment.total }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 mb-2">
            <i class="fa-light fa-boxes-stacked text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 mb-1">Packages</p>
          <p class="text-lg font-bold text-gray-900">{{ dashboardData.packages.total }}</p>
        </div>
      </section>

      <!-- Charts Row 1 -->
      <section class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Payment Trend Chart -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-700">Payment Revenue Trend</h3>
              <p class="text-xs text-gray-500 mt-0.5">Last 7 days</p>
            </div>
            <!-- <button class="text-xs text-gray-500 hover:text-gray-700">
              <i class="fa-light fa-download"></i>
            </button> -->
          </div>
          <div class="h-64">
            <template v-if="paymentTrendData.length > 0">
              <div class="flex items-end justify-between gap-3 h-full pb-8">
                <div 
                  v-for="(item, index) in paymentTrendData" 
                  :key="index"
                  class="flex-1 flex flex-col items-center gap-2 h-full"
                >
                  <div class="relative w-full flex items-end justify-center flex-1" style="max-height: 200px;">
                    <div 
                      class="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md relative group"
                      :style="{ 
                        height: getBarHeight(item.amount, getMaxValue(paymentTrendData, 'amount'), 180)
                      }"
                      :title="`${formatCurrency(item.amount)}`"
                    >
                      <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                        {{ formatCurrency(item.amount) }}
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-0.5 mt-auto">
                    <span class="text-xs text-gray-600 font-medium">{{ item.date }}</span>
                    <span class="text-xs text-gray-500 font-semibold">{{ formatCurrency(item.amount) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              <div class="text-center">
                <i class="fa-light fa-chart-line text-3xl mb-2"></i>
                <p class="text-sm">No payment data available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscription Growth Chart -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-700">Subscription Growth</h3>
              <p class="text-xs text-gray-500 mt-0.5">Last 6 months</p>
            </div>
            <!-- <button class="text-xs text-gray-500 hover:text-gray-700">
              <i class="fa-light fa-download"></i>
            </button> -->
          </div>
          <div class="h-64">
            <template v-if="subscriptionGrowthData.length > 0">
              <div class="flex items-end justify-between gap-3 h-full pb-8">
                <div 
                  v-for="(item, index) in subscriptionGrowthData" 
                  :key="index"
                  class="flex-1 flex flex-col items-center gap-2 h-full"
                >
                  <div class="relative w-full flex items-end justify-center flex-1" style="max-height: 200px;">
                    <div 
                      class="w-full rounded-t-md bg-gradient-to-t from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 transition-all cursor-pointer shadow-sm hover:shadow-md relative group"
                      :style="{ 
                        height: getBarHeight(item.count, getMaxValue(subscriptionGrowthData, 'count'), 180)
                      }"
                      :title="`${item.count} subscriptions`"
                    >
                      <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                        {{ item.count }} {{ item.count === 1 ? 'subscription' : 'subscriptions' }}
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-0.5 mt-auto">
                    <span class="text-xs text-gray-600 font-medium">{{ item.month }}</span>
                    <span class="text-xs text-gray-500 font-semibold">{{ item.count }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              <div class="text-center">
                <i class="fa-light fa-chart-line text-3xl mb-2"></i>
                <p class="text-sm">No subscription data available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Row 2 - Pie Charts -->
      <section class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Customer Status Distribution -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-700">Customer Status</h3>
              <p class="text-xs text-gray-500 mt-0.5">Distribution breakdown</p>
            </div>
          </div>
          <div class="flex items-center gap-8">
            <div class="flex-shrink-0">
              <svg viewBox="0 0 100 100" class="w-32 h-32" v-if="customerPieData.length > 0">
                <g v-for="(item, index) in customerPieData" :key="index">
                  <path
                    :d="item.path"
                    :fill="item.color.includes('green') ? '#10b981' : item.color.includes('yellow') ? '#eab308' : '#6b7280'"
                    stroke="white"
                    stroke-width="2"
                  />
                </g>
              </svg>
              <div v-else class="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                <i class="fa-light fa-chart-pie text-gray-400 text-2xl"></i>
              </div>
            </div>
            <div class="flex-1 space-y-3">
              <div v-for="(item, index) in customerStatusData" :key="index" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div :class="['w-3 h-3 rounded-full', item.color]"></div>
                  <span class="text-sm text-gray-700">{{ item.status }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-semibold text-gray-900">{{ item.count }}</span>
                  <span class="text-xs text-gray-500 w-12 text-right">
                    {{ customerPieData[index]?.percentage || '0' }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Complaint Status Distribution -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-700">Complaint Status</h3>
              <p class="text-xs text-gray-500 mt-0.5">Current ticket breakdown</p>
            </div>
          </div>
          <div class="flex items-center gap-8">
            <div class="flex-shrink-0">
              <svg viewBox="0 0 100 100" class="w-32 h-32" v-if="complaintPieData.length > 0">
                <g v-for="(item, index) in complaintPieData" :key="index">
                  <path
                    :d="item.path"
                    :fill="item.color.includes('green') ? '#10b981' : item.color.includes('yellow') ? '#eab308' : '#ef4444'"
                    stroke="white"
                    stroke-width="2"
                  />
                </g>
              </svg>
              <div v-else class="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                <i class="fa-light fa-chart-pie text-gray-400 text-2xl"></i>
              </div>
            </div>
            <div class="flex-1 space-y-3">
              <div v-for="(item, index) in complaintStatusData" :key="index" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div :class="['w-3 h-3 rounded-full', item.color]"></div>
                  <span class="text-sm text-gray-700">{{ item.status }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-semibold text-gray-900">{{ item.count }}</span>
                  <span class="text-xs text-gray-500 w-12 text-right">
                    {{ complaintPieData[index]?.percentage || '0' }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tables Row -->
      <section class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Top Areas by Customers -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-700">Top Areas by Customers</h3>
          </div>
          <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-100">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr v-if="topAreasData.length === 0">
                  <td colspan="3" class="px-6 py-8 text-center text-sm text-gray-500">No area data available</td>
                </tr>
                <tr 
                  v-for="(area, index) in topAreasData" 
                  :key="index"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-semibold mr-3">
                        {{ index + 1 }}
                      </div>
                      <span class="text-sm font-medium text-gray-900">{{ area.area }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">{{ area.customers }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-1 h-2 bg-gray-200 rounded-full mr-2" style="max-width: 100px;">
                        <div 
                          class="h-2 bg-purple-500 rounded-full"
                          :style="{ width: `${(area.customers / (dashboardData.customers.total || 1)) * 100}%` }"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-500">
                        {{ ((area.customers / (dashboardData.customers.total || 1)) * 100).toFixed(1) }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Equipment Status Table -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-700">Equipment Status</h3>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-3 w-3 rounded-full bg-green-500"></div>
                  <span class="text-sm text-gray-700">Active</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm font-semibold text-gray-900">{{ dashboardData.equipment.active }}</span>
                  <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-green-500"
                      :style="{ width: `${(dashboardData.equipment.active / (dashboardData.equipment.total || 1)) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span class="text-sm text-gray-700">Maintenance</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm font-semibold text-gray-900">{{ dashboardData.equipment.maintenance }}</span>
                  <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-yellow-500"
                      :style="{ width: `${(dashboardData.equipment.maintenance / (dashboardData.equipment.total || 1)) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-3 w-3 rounded-full bg-red-500"></div>
                  <span class="text-sm text-gray-700">Offline</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm font-semibold text-gray-900">{{ dashboardData.equipment.offline }}</span>
                  <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-red-500"
                      :style="{ width: `${(dashboardData.equipment.offline / (dashboardData.equipment.total || 1)) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="pt-4 border-t border-gray-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-900">Total Equipment</span>
                  <span class="text-lg font-bold text-gray-900">{{ dashboardData.equipment.total }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activities -->
      <section class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Recent Payments -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Recent Payments</h3>
            <router-link to="/payments" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</router-link>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-if="recentPayments.length === 0" class="px-6 py-8 text-center text-sm text-gray-500">
              No recent payments
            </div>
            <div 
              v-for="payment in recentPayments" 
              :key="payment.id"
              class="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ formatCustomerName(payment.customer) }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ formatDate(payment.created_at || payment.createdAt) }}
                  </p>
                </div>
                <div class="ml-4 text-right">
                  <p class="text-sm font-semibold text-gray-900">
                    {{ formatCurrency(payment.amountCents ? payment.amountCents / 100 : (payment.amount || 0)) }}
                  </p>
                  <span 
                    :class="[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1',
                      (payment.status || '').toLowerCase() === 'paid' 
                        ? 'bg-green-50 text-green-700' 
                        : (payment.status || '').toLowerCase() === 'pending'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-gray-50 text-gray-700'
                    ]"
                  >
                    {{ payment.status || 'Unknown' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Complaints -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Recent Complaints</h3>
            <router-link to="/complaints" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</router-link>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-if="recentComplaints.length === 0" class="px-6 py-8 text-center text-sm text-gray-500">
              No recent complaints
            </div>
            <div 
              v-for="complaint in recentComplaints" 
              :key="complaint.id"
              class="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ complaint.subject || complaint.ticketNumber || 'No subject' }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ formatCustomerName(complaint.customer || complaint) }} • {{ formatDate(complaint.created_at || complaint.createdAt) }}
                  </p>
                </div>
                <span 
                  :class="[
                    'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                    (complaint.status || '').toLowerCase() === 'open' 
                      ? 'bg-red-50 text-red-700' 
                      : (complaint.status || '').toLowerCase() === 'in progress'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-green-50 text-green-700'
                  ]"
                >
                  {{ complaint.status || 'Unknown' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Subscriptions -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Recent Subscriptions</h3>
            <router-link to="/subscriptions" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</router-link>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-if="recentSubscriptions.length === 0" class="px-6 py-8 text-center text-sm text-gray-500">
              No recent subscriptions
            </div>
            <div 
              v-for="subscription in recentSubscriptions" 
              :key="subscription.id"
              class="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ formatCustomerName(subscription.customer || subscription) }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ (subscription.package || subscription.package_snapshot || {}).name || 'N/A' }} • {{ formatDate(subscription.created_at || subscription.start_date) }}
                  </p>
                </div>
                <span 
                  :class="[
                    'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                    (subscription.status || '').toLowerCase() === 'active' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-gray-50 text-gray-700'
                  ]"
                >
                  {{ subscription.status || 'Unknown' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </MasterLayout>
</template>
