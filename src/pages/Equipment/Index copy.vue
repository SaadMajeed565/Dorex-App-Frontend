<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';
import AddEquipment from './AddEquipment.vue';

// Toast
const toast = useToast();

// Reactive state
const equipment = ref<any[]>([]);
const loading = ref(true);
const showAddEquipment = ref(false);

// Filters
const search = ref('');
const typeFilter = ref('All');
const statusFilter = ref('All');
const locationFilter = ref('All');

// Filter options (computed from data, prefixed with "All")
const typeOptions = computed(() => ['All', ...Array.from(new Set(equipment.value.map(e => e.type).filter(Boolean)))]);
const statusOptions = computed(() => ['All', ...Array.from(new Set(equipment.value.map(e => e.status).filter(Boolean)))]);
const locationOptions = computed(() => ['All', ...Array.from(new Set(equipment.value.map(e => e.location).filter(Boolean)))]);

// Pagination
const page = ref(1);
const pageSize = ref(10);

// Fetch equipment from backend
const fetchEquipment = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/equipments');
    let raw: any[] = [];
    
    if (res.data?.status && Array.isArray(res.data.equipments)) {
      raw = res.data.equipments;
    } else if (Array.isArray(res.data?.data)) {
      raw = res.data.data;
    } else if (Array.isArray(res.data)) {
      raw = res.data;
    } else {
      raw = [];
    }
    
    equipment.value = raw;
  } catch (err: any) {
    console.error('Error fetching equipment:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Failed to load equipment data.',
      life: 4000
    });
    equipment.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchEquipment);

// Computed filters
const filteredEquipment = computed(() => {
  return equipment.value.filter(item => {
    const searchLower = search.value.toLowerCase();
    const matchesSearch =
      !search.value ||
      item.name?.toLowerCase().includes(searchLower) ||
      item.model?.toLowerCase().includes(searchLower) ||
      item.serial_number?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower);

    const matchesType = typeFilter.value === 'All' || item.type === typeFilter.value;
    const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value;
    const matchesLocation = locationFilter.value === 'All' || item.location === locationFilter.value;

    return matchesSearch && matchesType && matchesStatus && matchesLocation;
  });
});

const hasEquipment = computed(() => equipment.value.length > 0);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredEquipment.value.length / pageSize.value)));
const paginatedEquipment = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredEquipment.value.slice(start, start + pageSize.value);
});

// Stats
const stats = computed(() => {
  const total = equipment.value.length;
  const active = equipment.value.filter(e => e.status === 'Active').length;
  const maintenance = equipment.value.filter(e => e.status === 'Maintenance').length;
  
  // Calculate average uptime from equipment with valid uptime values
  const equipmentWithUptime = equipment.value.filter(e => {
    const uptime = typeof e.uptime === 'number' ? e.uptime : parseFloat(e.uptime || '0');
    return !isNaN(uptime) && uptime > 0;
  });
  
  const avgUptime = equipmentWithUptime.length > 0
    ? equipmentWithUptime.reduce((sum, e) => {
        const uptime = typeof e.uptime === 'number' ? e.uptime : parseFloat(e.uptime || '0');
        return sum + uptime;
      }, 0) / equipmentWithUptime.length
    : 0;
  
  return { total, active, maintenance, avgUptime: avgUptime.toFixed(1) };
});

// UI helpers
const getStatusBadge = (status: string) => {
  if (status === 'Active') return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
  if (status === 'Maintenance') return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
  if (status === 'Planned') return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
  if (status === 'Offline') return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10';
  return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10';
};

const getUtilizationColor = (utilization: number | undefined) => {
  if (utilization === undefined || utilization === null || isNaN(utilization)) return 'text-gray-600';
  if (utilization >= 80) return 'text-red-600';
  if (utilization >= 60) return 'text-yellow-600';
  return 'text-green-600';
};

const getUptimeColor = (uptime: string | number | undefined) => {
  const value = typeof uptime === 'number' ? uptime : parseFloat(uptime || '0');
  if (isNaN(value) || value === 0) return 'text-gray-600';
  if (value >= 99.5) return 'text-green-600';
  if (value >= 95) return 'text-yellow-600';
  return 'text-red-600';
};

// Handle new equipment created
const handleEquipmentCreated = () => {
  // Refresh the list to show the new equipment
  fetchEquipment();
};
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Network Equipment</h1>
        <p class="text-sm text-gray-500">Monitor and manage your network infrastructure</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="showAddEquipment = true"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <i class="fa-light fa-plus"></i>
          Add Equipment
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
      <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Total Equipment</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Active</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.active }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Maintenance</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.maintenance }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <p class="text-sm font-medium text-gray-500">Avg Uptime</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.avgUptime }}%</p>
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
                placeholder="Search equipment..."
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="typeFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="type in typeOptions" :key="type" :value="type">{{ type }}</option>
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
        <div v-if="!hasEquipment" class="flex items-center justify-center p-10 text-center">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">No equipment yet</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding your first device.</p>
          </div>
        </div>
        <template v-else>
          <div>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Equipment</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uptime</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Utilization</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="item in paginatedEquipment" :key="item.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                    <div class="text-sm text-gray-500">{{ item.serial_number }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">{{ item.type }}</div>
                    <div class="text-sm text-gray-500">{{ item.model }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ item.location }}</td>
                  <td class="px-4 py-3">
                    <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', getStatusBadge(item.status)]">{{ item.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="`text-sm font-medium ${getUptimeColor(item.uptime)}`">
                      {{ item.uptime != null && item.uptime !== '' ? `${item.uptime}%` : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="`text-sm font-medium ${getUtilizationColor(item.utilization)}`">
                      {{ item.utilization != null && item.utilization !== '' ? `${item.utilization}%` : '—' }}
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
              Page {{ page }} of {{ totalPages }} — {{ filteredEquipment.length }} results
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
    <AddEquipment v-model:visible="showAddEquipment" @created="handleEquipmentCreated" />
  </MasterLayout>
</template>
