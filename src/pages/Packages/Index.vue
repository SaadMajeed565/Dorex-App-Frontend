<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import axiosClient from '../../axios';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import AddPackage from './AddPackage.vue';
import Show from './Show.vue';
import ImportDialog from '../../components/ImportDialog.vue';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';

const generalSettingsStore = useGeneralSettingsStore();
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit);

type PackageStatus = 'Active' | 'Inactive';

interface ServicePackage {
  id: number | string;
  name: string;
  description: string;
  priceMonthly: number; // derived from salePrice for display
  salePrice?: number;
  purchasePrice?: number;
  companyName?: string;
  speed?: string;
  status: PackageStatus;
  createdAt: string;
}

const packages = ref<ServicePackage[]>([]);
const loading = ref(true);
const showAddPackage = ref(false);
const showImportDialog = ref(false);
const showPackageDetails = ref(false);
const selectedPackageId = ref<number | string | null>(null);

const search = ref('');
const statusFilter = ref<'All' | PackageStatus>('All');
const priceFilter = ref<'All' | '<10' | '10-25' | '>25'>('All');
const companyFilter = ref<'All' | string>('All');
const speedFilter = ref<'All' | string>('All');

const statuses: Array<'All' | PackageStatus> = ['All', 'Active', 'Inactive'];
const priceRanges: Array<'All' | '<10' | '10-25' | '>25'> = ['All', '<10', '10-25', '>25'];
const companies = computed(() => ['All', ...Array.from(new Set(packages.value.map(p => p.companyName).filter(Boolean))) as string[]]);
const speeds = computed(() => ['All', ...Array.from(new Set(packages.value.map(p => p.speed).filter(Boolean))) as string[]]);

const page = ref(1);
const pageSize = ref(10);

const hasPackages = computed(() => packages.value.length > 0);

const filteredPackages = computed(() => {
  const term = search.value.trim().toLowerCase();
  return packages.value.filter((pkg) => {
    const matchesSearch = !term || [pkg.name, pkg.description].some((v) => (v || '').toLowerCase().includes(term));
    const matchesStatus = statusFilter.value === 'All' || pkg.status === statusFilter.value;
    const matchesCompany = companyFilter.value === 'All' || pkg.companyName === companyFilter.value;
    const matchesSpeed = speedFilter.value === 'All' || pkg.speed === speedFilter.value;
    const matchesPrice = (() => {
      if (priceFilter.value === 'All') return true;
      const price = pkg.salePrice ?? pkg.priceMonthly;
      if (priceFilter.value === '<10') return price < 10;
      if (priceFilter.value === '10-25') return price >= 10 && price <= 25;
      return price > 25;
    })();
    return matchesSearch && matchesStatus && matchesCompany && matchesSpeed && matchesPrice;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPackages.value.length / pageSize.value)));
const paginatedPackages = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredPackages.value.slice(start, start + pageSize.value);
});

const stats = computed(() => {
  const total = packages.value.length;
  const active = packages.value.filter((p) => p.status === 'Active').length;
  const inactive = total - active;
  const avgPrice = total ? (packages.value.reduce((s, p) => s + (p.salePrice ?? p.priceMonthly), 0) / total).toFixed(0) : '0';
  return { total, active, inactive, avgPrice };
});

const getStatusBadge = (status: PackageStatus) => {
  return status === 'Active'
    ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
    : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10';
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: tenantCurrency.value, maximumFractionDigits: 0 }).format(amount);
}

async function sendRequest() {
  try {
    const response = await axiosClient.get('/packages');
    const list = Array.isArray(response.data?.packages) ? response.data.packages : response.data;
    if (Array.isArray(list)) {
      packages.value = list.map((item: any) => {
        const rawStatus = item.status ?? item.is_active;
        const normalizedStatus: PackageStatus = (rawStatus === true || rawStatus === 1 || String(rawStatus).toLowerCase() === 'active') ? 'Active' : 'Inactive';
        const salePrice = Number(item.sale_price ?? item.salePrice ?? item.priceMonthly ?? item.price_monthly ?? item.price ?? 0);
        const purchasePrice = Number(item.purchase_price ?? item.purchasePrice ?? 0);
        return {
          id: item.id,
          name: item.name ?? `Package #${item.id}`,
          description: item.description ?? '',
          priceMonthly: salePrice,
          salePrice,
          purchasePrice,
          companyName: item.company_name ?? item.companyName ?? '',
          speed: item.speed ?? '',
          status: normalizedStatus,
          createdAt: item.createdAt ?? item.created_at ?? ''
        } as ServicePackage;
      });
    } else {
      packages.value = [];
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    packages.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await generalSettingsStore.fetchSettings();
  sendRequest();
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Packages</h1>
        <p class="text-sm text-gray-500">Create and manage subscription packages</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="showAddPackage = true"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <i class="fa-light fa-plus"></i>
          Add Package
        </button>
        <button
          @click="sendRequest"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-arrow-rotate-right"></i>
          Refresh
        </button>
        <button @click="showImportDialog = true" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-file-import"></i>
          Import
        </button>
      </div>
    </div>
    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Packages</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-boxes-packing text-lg"></i>
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
            <p class="text-sm font-medium text-gray-500">Inactive</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.inactive }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
            <i class="fa-light fa-pause text-lg"></i>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Avg. Price</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(Number(stats.avgPrice)) }}/mo</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <i class="fa-light fa-sack-dollar text-lg"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="search"
              type="text"
              placeholder="Search packages..."
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="statusFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
          <select
            v-model="priceFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="r in priceRanges" :key="r" :value="r">Price {{ r }}</option>
          </select>
          <select
            v-model="companyFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
          <select
            v-model="speedFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="s in speeds" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Packages Table -->
    <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div v-if="!hasPackages" class="flex items-center justify-center p-10 text-center">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">No packages yet</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating your first package.</p>
        </div>
      </div>
      <template v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Speed</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sale Price</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Purchase Price</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="pkg in paginatedPackages" :key="pkg.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ pkg.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ pkg.companyName || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ pkg.speed || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ pkg.description || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ formatCurrency(pkg.salePrice ?? pkg.priceMonthly) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ pkg.purchasePrice != null ? formatCurrency(pkg.purchasePrice) : '—' }}</td>
              <td class="px-4 py-3 text-sm">
                <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', getStatusBadge(pkg.status)]">
                  {{ pkg.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ pkg.createdAt || '—' }}</td>
              <td class="px-4 py-3 text-right text-sm">
                <button
                  @click="selectedPackageId = pkg.id; showPackageDetails = true"
                  class="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Manage
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-sm text-gray-500">
            Page {{ page }} of {{ totalPages }} — {{ filteredPackages.length }} results
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              :disabled="page <= 1"
              @click="page = Math.max(1, page - 1)"
            >
              Previous
            </button>
            <button
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              :disabled="page >= totalPages"
              @click="page = Math.min(totalPages, page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Add Package Dialog -->
    <AddPackage v-model:visible="showAddPackage" @created="() => sendRequest()" />
    <ImportDialog v-model="showImportDialog" module="packages" @imported="sendRequest" />
    
    <!-- Package Details Dialog -->
    <Show 
      v-model:visible="showPackageDetails" 
      :package-id="selectedPackageId"
      @update:visible="(v) => { showPackageDetails = v; if (!v) selectedPackageId = null; }"
      @deleted="() => { showPackageDetails = false; selectedPackageId = null; sendRequest(); }"
    />
    </template>
  </MasterLayout>
</template>

