<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MasterLayout from '../../layouts/MasterLayout.vue'
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue'
import axiosClient from '../../axios'
import AddSubscription from './AddSubscription.vue'
import ImportDialog from '../../components/ImportDialog.vue'
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore'

const generalSettingsStore = useGeneralSettingsStore()
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit)

const showAddSubscription = ref(false)
const showImportDialog = ref(false)
const addSubscriptionRef = ref()

type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled' | string

interface SubscriptionItem {
  id: number | string
  customerName?: string
  customerEmail?: string
  planName?: string
  speed?: string
  status?: SubscriptionStatus
  priceMonthly?: number
  salePrice?: number
  startDate?: string
  endDate?: string
  nextBillingDate?: string
  companyName?: string
}

const subscriptions = ref<SubscriptionItem[]>([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref<'All' | SubscriptionStatus>('All')
const planFilter = ref<'All' | string>('All')
const companyFilter = ref<'All' | string>('All')
const page = ref(1)
const pageSize = ref(10)

const normalizeStatus = (status?: string): SubscriptionStatus => {
  if (!status) return ''
  const lower = status.toLowerCase()
  if (lower === 'active') return 'Active'
  if (lower === 'paused') return 'Paused'
  if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const mapSubscription = (item: any): SubscriptionItem => {
  const customer = item?.customer || {}
  const pkg = item?.package || {}
  const snapshot = item?.package_snapshot || {}
  const salePriceNum = Number(pkg?.sale_price ?? snapshot?.sale_price ?? 0)
  
  return {
    id: item?.id,
    customerName: customer?.name,
    customerEmail: customer?.email,
    planName: pkg?.name ?? snapshot?.name,
    speed: pkg?.speed ?? snapshot?.speed,
    status: normalizeStatus(item?.status),
    salePrice: isNaN(salePriceNum) ? 0 : salePriceNum,
    startDate: item?.start_date,
    endDate: item?.end_date,
    nextBillingDate: undefined,
    companyName: snapshot?.company_name,
  }
}

const fetchSubscriptions = async () => {
  loading.value = true
  try {
    const res = await axiosClient.get('/subscriptions')
    if (res?.data?.status === true && Array.isArray(res?.data?.data)) {
      subscriptions.value = res.data.data.map(mapSubscription)
    } else if (Array.isArray(res?.data)) {
      subscriptions.value = res.data
    } else if (Array.isArray(res?.data?.subscriptions)) {
      subscriptions.value = res.data.subscriptions
    } else {
      subscriptions.value = []
    }
  } catch (err) {
    console.error('Error fetching subscriptions:', err)
    subscriptions.value = []
  } finally {
    loading.value = false
  }
}

const handleSubscriptionCreated = (newSubscription: any) => {
  subscriptions.value.unshift(mapSubscription(newSubscription))
}

const statusOptions = computed(() => ['All', ...Array.from(new Set(subscriptions.value.map(s => s.status).filter(Boolean)))])
const planOptions = computed(() => ['All', ...Array.from(new Set(subscriptions.value.map(s => s.planName).filter(Boolean)))])
const companyOptions = computed(() => ['All', ...Array.from(new Set(subscriptions.value.map(s => s.companyName).filter(Boolean)))])

const filteredSubscriptions = computed(() => {
  const term = search.value.trim().toLowerCase()
  return subscriptions.value.filter(s => {
    const matchesSearch = !term || [s.customerName, s.customerEmail, s.planName, s.companyName].some(v => (v || '').toLowerCase().includes(term))
    const matchesStatus = statusFilter.value === 'All' || s.status === statusFilter.value
    const matchesPlan = planFilter.value === 'All' || s.planName === planFilter.value
    const matchesCompany = companyFilter.value === 'All' || s.companyName === companyFilter.value
    return matchesSearch && matchesStatus && matchesPlan && matchesCompany
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSubscriptions.value.length / pageSize.value)))
const paginatedSubscriptions = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredSubscriptions.value.slice(start, start + pageSize.value)
})

const stats = computed(() => {
  const total = subscriptions.value.length
  const active = subscriptions.value.filter(s => s.status === 'Active').length
  const cancelled = subscriptions.value.filter(s => s.status === 'Cancelled').length
  const avgMrr = total ? (subscriptions.value.reduce((sum, s) => sum + (s.salePrice ?? s.priceMonthly ?? 0), 0) / total).toFixed(0) : '0'
  return { total, active, cancelled, avgMrr }
})

const getStatusBadge = (status?: SubscriptionStatus) => {
  const badges = {
    'Active': 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
    'Paused': 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
    'Cancelled': 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
  }
  return badges[status as keyof typeof badges] || 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
}

const formatCurrency = (amount?: number) => {
  const value = typeof amount === 'number' ? amount : 0
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: tenantCurrency.value, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${value.toFixed(0)} ${tenantCurrency.value}`
  }
}

onMounted(async () => {
  await generalSettingsStore.fetchSettings()
  fetchSubscriptions()
})
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p class="text-sm text-gray-500">Manage customer plans and billing</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="showAddSubscription = true" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <i class="fa-light fa-plus"></i>
            Add Subscription
          </button>
          <button @click="fetchSubscriptions" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
          <button @click="showImportDialog = true" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-file-import"></i>
            Import
          </button>
          <!-- <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <i class="fa-light fa-file-import"></i>
            Import
          </button>
          <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <i class="fa-light fa-arrow-down-to-line"></i>
            Export
          </button> -->
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Subscriptions</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <i class="fa-light fa-list-check text-lg"></i>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Active</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.active }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <i class="fa-light fa-badge-check text-lg"></i>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Cancelled</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.cancelled }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <i class="fa-light fa-xmark-circle text-lg"></i>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Avg MRR</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(Number(stats.avgMrr)) }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <i class="fa-light fa-dollar-sign text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="flex-1">
            <div class="relative">
              <input v-model="search" type="text" placeholder="Search customers, emails, plans..." class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <select v-model="statusFilter" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
            <select v-model="planFilter" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option v-for="p in planOptions" :key="p" :value="p">{{ p }}</option>
            </select>
            <select v-model="companyFilter" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option v-for="c in companyOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div v-if="!subscriptions.length" class="flex items-center justify-center p-10 text-center">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">No subscriptions yet</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding your first subscription.</p>
          </div>
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Next Billing</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="s in paginatedSubscriptions" :key="s.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ s.customerName || '—' }}</div>
                    <div class="text-sm text-gray-500">{{ s.customerEmail || '' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">{{ s.planName || '—' }}</div>
                    <div class="text-sm text-gray-500">{{ s.speed || '' }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ s.companyName || '—' }}</td>
                  <td class="px-4 py-3">
                    <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', getStatusBadge(s.status)]">{{ s.status || '—' }}</span>
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ formatCurrency(s.salePrice ?? s.priceMonthly) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ s.startDate ? new Date(s.startDate).toLocaleDateString() : '—' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString() : '—' }}</td>
                  <td class="px-4 py-3 text-right text-sm">
                    <button class="text-indigo-600 hover:text-indigo-500">Manage</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div class="text-sm text-gray-500">
              Page {{ page }} of {{ totalPages }} — {{ filteredSubscriptions.length }} results
            </div>
            <div class="flex items-center gap-2">
              <button class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">
                Previous
              </button>
              <button class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1)">
                Next
              </button>
            </div>
          </div>
        </template>
      </div>
    </template>
    <AddSubscription ref="addSubscriptionRef" v-model:visible="showAddSubscription" @created="(data: any) => handleSubscriptionCreated(data)" />
    <ImportDialog v-model="showImportDialog" module="subscriptions" @imported="fetchSubscriptions" />
  </MasterLayout>
</template>