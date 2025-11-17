<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';
import AddInventory from './AddInventory.vue';

// Toast
const toast = useToast();

// Reactive state
const inventory = ref<any[]>([]);
const loading = ref(true);
const showAddInventory = ref(false);

// Filters
const search = ref('');
const categoryFilter = ref('All');
const statusFilter = ref('All');
const locationFilter = ref('All');

// Filter options (computed from data, prefixed with "All")
const categoryOptions = computed(() => ['All', ...Array.from(new Set(inventory.value.map(i => i.category).filter(Boolean)))]);
const statusOptions = computed(() => ['All', ...Array.from(new Set(inventory.value.map(i => i.status).filter(Boolean)))]);
const locationOptions = computed(() => ['All', ...Array.from(new Set(inventory.value.map(i => i.location).filter(Boolean)))]);

// Pagination
const page = ref(1);
const pageSize = ref(10);

// Fetch inventory from backend
const fetchInventory = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/inventory');
    let raw: any[] = [];
    
    if (res.data?.status && Array.isArray(res.data.inventory)) {
      raw = res.data.inventory;
    } else if (Array.isArray(res.data?.data)) {
      raw = res.data.data;
    } else if (Array.isArray(res.data)) {
      raw = res.data;
    } else {
      raw = [];
    }
    
    inventory.value = raw;
  } catch (err: any) {
    console.error('Error fetching inventory:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Failed to load inventory data.',
      life: 4000
    });
    inventory.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchInventory);

// Computed filters
const filteredInventory = computed(() => {
  return inventory.value.filter(item => {
    const searchLower = search.value.toLowerCase();
    const matchesSearch =
      !search.value ||
      item.name?.toLowerCase().includes(searchLower) ||
      item.sku?.toLowerCase().includes(searchLower) ||
      item.barcode?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower);

    const matchesCategory = categoryFilter.value === 'All' || item.category === categoryFilter.value;
    const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value;
    const matchesLocation = locationFilter.value === 'All' || item.location === locationFilter.value;

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
  });
});

const hasInventory = computed(() => inventory.value.length > 0);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredInventory.value.length / pageSize.value)));
const paginatedInventory = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredInventory.value.slice(start, start + pageSize.value);
});

// Stats
const stats = computed(() => {
  const total = inventory.value.length;
  const inStock = inventory.value.filter(i => i.status === 'In Stock').length;
  const lowStock = inventory.value.filter(i => i.status === 'Low Stock').length;
  const outOfStock = inventory.value.filter(i => i.status === 'Out of Stock').length;
  
  // Calculate total value (quantity * unit_price)
  const totalValue = inventory.value.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity || '0');
    const price = typeof item.unit_price === 'number' ? item.unit_price : parseFloat(item.unit_price || '0');
    return sum + (qty * price);
  }, 0);
  
  return { total, inStock, lowStock, outOfStock, totalValue };
});

// UI helpers
const getStatusBadge = (status: string) => {
  if (status === 'In Stock') return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
  if (status === 'Low Stock') return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
  if (status === 'Out of Stock') return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
  return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10';
};

const getQuantityColor = (quantity: number, minStock: number) => {
  if (quantity <= 0) return 'text-red-600';
  if (minStock && quantity <= minStock) return 'text-yellow-600';
  return 'text-green-600';
};

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Handle new inventory created
const handleInventoryCreated = () => {
  // Refresh the list to show the new inventory
  fetchInventory();
};
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Inventory</h1>
        <p class="text-sm text-gray-500">Track and manage your inventory items</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="showAddInventory = true"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <i class="fa-light fa-plus"></i>
          Add Item
        </button>
        <button
          @click="fetchInventory"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <i class="fa-light fa-arrow-rotate-right"></i>
          Refresh
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

      <!-- Stats -->
      <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Total Items</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">In Stock</p>
          <p class="text-2xl font-bold text-green-600">{{ stats.inStock }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Low Stock</p>
          <p class="text-2xl font-bold text-yellow-600">{{ stats.lowStock }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Out of Stock</p>
          <p class="text-2xl font-bold text-red-600">{{ stats.outOfStock }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Total Value</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(stats.totalValue) }}</p>
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
                placeholder="Search inventory by name, SKU, barcode..."
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="categoryFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
            <select
              v-model="statusFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
            <select
              v-model="locationFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="location in locationOptions" :key="location" :value="location">{{ location }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div v-if="!hasInventory" class="flex items-center justify-center p-10 text-center">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">No inventory items yet</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding your first item.</p>
          </div>
        </div>
        <template v-else>
          <div>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quantity</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Unit Price</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="item in paginatedInventory" :key="item.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                    <div class="text-sm text-gray-500">{{ item.sku || item.barcode || '—' }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ item.category || '—' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ item.location || '—' }}</td>
                  <td class="px-4 py-3">
                    <span :class="`text-sm font-medium ${getQuantityColor(item.quantity || 0, item.min_stock || 0)}`">
                      {{ item.quantity != null ? item.quantity : '—' }}
                      <span v-if="item.min_stock" class="text-xs text-gray-400">/ min: {{ item.min_stock }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">
                    {{ item.unit_price != null ? formatCurrency(item.unit_price) : '—' }}
                  </td>
                  <td class="px-4 py-3">
                    <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', getStatusBadge(item.status)]">
                      {{ item.status || '—' }}
                    </span>
                  </td>
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
              Page {{ page }} of {{ totalPages }} — {{ filteredInventory.length }} results
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
      </template>
    <AddInventory v-model:visible="showAddInventory" @created="handleInventoryCreated" />
  </MasterLayout>
</template>


