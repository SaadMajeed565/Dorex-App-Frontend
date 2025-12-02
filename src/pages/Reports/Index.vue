<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';
import { formatCurrency } from '../../utils/formatCurrency';

const generalSettingsStore = useGeneralSettingsStore();
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit);

const toast = useToast();
const loading = ref(true);
const activeTab = ref('dashboard');

// Dashboard data
const dashboardData = ref<any>(null);

// Revenue data
const revenueData = ref<any>(null);
const revenueStartDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
const revenueEndDate = ref(new Date().toISOString().split('T')[0]);

// Subscription data
const subscriptionData = ref<any>(null);

// Customer data
const customerData = ref<any>(null);

// Task data
const taskData = ref<any>(null);

// Complaint data
const complaintData = ref<any>(null);

// Fetch dashboard summary
const fetchDashboard = async () => {
  try {
    const res = await axiosClient.get('/reports/dashboard');
    dashboardData.value = res.data?.data || res.data;
  } catch (err: any) {
    console.error('Error fetching dashboard:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load dashboard data',
      life: 4000,
    });
  }
};

// Fetch revenue report
const fetchRevenue = async () => {
  try {
    const res = await axiosClient.get('/reports/revenue', {
      params: {
        start_date: revenueStartDate.value,
        end_date: revenueEndDate.value,
      },
    });
    revenueData.value = res.data?.data || res.data;
  } catch (err: any) {
    console.error('Error fetching revenue:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load revenue data',
      life: 4000,
    });
  }
};

// Fetch subscription analytics
const fetchSubscriptions = async () => {
  try {
    const res = await axiosClient.get('/reports/subscriptions');
    subscriptionData.value = res.data?.data || res.data;
  } catch (err: any) {
    console.error('Error fetching subscriptions:', err);
  }
};

// Fetch customer analytics
const fetchCustomers = async () => {
  try {
    const res = await axiosClient.get('/reports/customers');
    customerData.value = res.data?.data || res.data;
  } catch (err: any) {
    console.error('Error fetching customers:', err);
  }
};

// Fetch task analytics
const fetchTasks = async () => {
  try {
    const res = await axiosClient.get('/reports/tasks');
    taskData.value = res.data?.data || res.data;
  } catch (err: any) {
    console.error('Error fetching tasks:', err);
  }
};

// Fetch complaint analytics
const fetchComplaints = async () => {
  try {
    const res = await axiosClient.get('/reports/complaints');
    complaintData.value = res.data?.data || res.data;
  } catch (err: any) {
    console.error('Error fetching complaints:', err);
  }
};

const loadTabData = async (tab: string) => {
  activeTab.value = tab;
  if (tab === 'dashboard' && !dashboardData.value) await fetchDashboard();
  if (tab === 'revenue' && !revenueData.value) await fetchRevenue();
  if (tab === 'subscriptions' && !subscriptionData.value) await fetchSubscriptions();
  if (tab === 'customers' && !customerData.value) await fetchCustomers();
  if (tab === 'tasks' && !taskData.value) await fetchTasks();
  if (tab === 'complaints' && !complaintData.value) await fetchComplaints();
};

const formatCurrencyAmount = (amount: number) => {
  return formatCurrencyAmount(amount, tenantCurrency.value, true);
};

onMounted(async () => {
  loading.value = true;
  await generalSettingsStore.fetchSettings();
  await Promise.all([
    fetchDashboard(),
    fetchSubscriptions(),
    fetchCustomers(),
    fetchTasks(),
    fetchComplaints(),
  ]);
  loading.value = false;
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <div class="space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p class="text-sm text-gray-500">View comprehensive reports and analytics</p>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="loadTabData('dashboard')"
              :class="[
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              Dashboard
            </button>
            <button
              @click="loadTabData('revenue')"
              :class="[
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === 'revenue'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              Revenue
            </button>
            <button
              @click="loadTabData('subscriptions')"
              :class="[
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === 'subscriptions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              Subscriptions
            </button>
            <button
              @click="loadTabData('customers')"
              :class="[
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === 'customers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              Customers
            </button>
            <button
              @click="loadTabData('tasks')"
              :class="[
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === 'tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              Tasks
            </button>
            <button
              @click="loadTabData('complaints')"
              :class="[
                'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                activeTab === 'complaints'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              ]"
            >
              Complaints
            </button>
          </nav>
        </div>

        <!-- Dashboard Tab -->
        <div v-if="activeTab === 'dashboard' && dashboardData" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <p class="text-sm font-medium text-gray-500">Monthly Revenue</p>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ formatCurrencyAmount(dashboardData.monthly_revenue || 0) }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <p class="text-sm font-medium text-gray-500">Active Subscriptions</p>
            <p class="text-2xl font-bold text-blue-600 mt-2">{{ dashboardData.active_subscriptions || 0 }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <p class="text-sm font-medium text-gray-500">Pending Tasks</p>
            <p class="text-2xl font-bold text-yellow-600 mt-2">{{ dashboardData.pending_tasks || 0 }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <p class="text-sm font-medium text-gray-500">Open Complaints</p>
            <p class="text-2xl font-bold text-red-600 mt-2">{{ dashboardData.open_complaints || 0 }}</p>
          </div>
        </div>

        <!-- Revenue Tab -->
        <div v-if="activeTab === 'revenue'">
          <div class="mb-4 flex items-center gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input v-model="revenueStartDate" type="date" class="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input v-model="revenueEndDate" type="date" class="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div class="flex items-end">
              <button @click="fetchRevenue" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Update
              </button>
            </div>
          </div>
          <div v-if="revenueData" class="rounded-xl border border-gray-200 bg-white p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-gray-500">Total Revenue</p>
                <p class="text-xl font-bold text-gray-900">{{ formatCurrencyAmount(revenueData.summary?.total_revenue || 0) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Discounts</p>
                <p class="text-xl font-bold text-red-600">{{ formatCurrencyAmount(revenueData.summary?.total_discounts || 0) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Late Fees</p>
                <p class="text-xl font-bold text-green-600">{{ formatCurrencyAmount(revenueData.summary?.total_late_fees || 0) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Net Revenue</p>
                <p class="text-xl font-bold text-indigo-600">{{ formatCurrencyAmount(revenueData.summary?.net_revenue || 0) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscriptions Tab -->
        <div v-if="activeTab === 'subscriptions' && subscriptionData" class="rounded-xl border border-gray-200 bg-white p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Subscription Analytics</h3>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <p class="text-sm text-gray-500">Total</p>
              <p class="text-2xl font-bold text-gray-900">{{ subscriptionData.summary?.total || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Active</p>
              <p class="text-2xl font-bold text-green-600">{{ subscriptionData.summary?.active || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Paused</p>
              <p class="text-2xl font-bold text-yellow-600">{{ subscriptionData.summary?.paused || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Cancelled</p>
              <p class="text-2xl font-bold text-red-600">{{ subscriptionData.summary?.cancelled || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Expired</p>
              <p class="text-2xl font-bold text-gray-600">{{ subscriptionData.summary?.expired || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Customers Tab -->
        <div v-if="activeTab === 'customers' && customerData" class="rounded-xl border border-gray-200 bg-white p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Customer Analytics</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-gray-500">Total Customers</p>
              <p class="text-2xl font-bold text-gray-900">{{ customerData.total_customers || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">With Active Subscriptions</p>
              <p class="text-2xl font-bold text-green-600">{{ customerData.with_active_subscriptions || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">With Outstanding Balance</p>
              <p class="text-2xl font-bold text-red-600">{{ customerData.with_outstanding_balance || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Without Subscriptions</p>
              <p class="text-2xl font-bold text-yellow-600">{{ customerData.without_subscriptions || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Tasks Tab -->
        <div v-if="activeTab === 'tasks' && taskData" class="rounded-xl border border-gray-200 bg-white p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Task Analytics</h3>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p class="text-sm text-gray-500">Total</p>
              <p class="text-2xl font-bold text-gray-900">{{ taskData.summary?.total || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Pending</p>
              <p class="text-2xl font-bold text-yellow-600">{{ taskData.summary?.pending || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">In Progress</p>
              <p class="text-2xl font-bold text-blue-600">{{ taskData.summary?.in_progress || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Completed</p>
              <p class="text-2xl font-bold text-green-600">{{ taskData.summary?.completed || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Overdue</p>
              <p class="text-2xl font-bold text-red-600">{{ taskData.summary?.overdue || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Complaints Tab -->
        <div v-if="activeTab === 'complaints' && complaintData" class="rounded-xl border border-gray-200 bg-white p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Complaint Analytics</h3>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p class="text-sm text-gray-500">Total</p>
              <p class="text-2xl font-bold text-gray-900">{{ complaintData.summary?.total || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Open</p>
              <p class="text-2xl font-bold text-red-600">{{ complaintData.summary?.open || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">In Progress</p>
              <p class="text-2xl font-bold text-yellow-600">{{ complaintData.summary?.in_progress || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Resolved</p>
              <p class="text-2xl font-bold text-green-600">{{ complaintData.summary?.resolved || 0 }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Closed</p>
              <p class="text-2xl font-bold text-gray-600">{{ complaintData.summary?.closed || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </MasterLayout>
</template>

