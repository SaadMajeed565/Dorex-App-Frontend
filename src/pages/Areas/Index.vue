<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import axiosClient from '../../axios';
import AreasOrgChart from './AreasOrgChart.vue';
import AddArea from './AddArea.vue';
import AreaDetails from './AreaDetails.vue';
import EditAreaDialog from './EditAreaDialog.vue';
import AreasIndexSkeleton from '../../components/AreasIndexSkeleton.vue';
import Menu from '../../volt/Menu.vue';
import ConfirmDialog from '../../volt/ConfirmDialog.vue';
import Dialog from '../../volt/Dialog.vue';

// Reactive data
const dummyAreas = [
  {
    id: 1,
    name: "Unknown",
    parent_id: null,
    coverage_map: "N/A",
    children: [],
    parent: null,
    created_at: "2025-10-10 07:20:53",
    updated_at: "2025-10-10 07:20:53"
  }
]

const areas = ref<any[]>(dummyAreas);
const loading = ref(true);
const showDeleteConfirm = ref(false);
const areaToDelete = ref<any>(null);


// function to fetch data
const sendRequest = async () => {
  loading.value = true;
  try {
    const response = await axiosClient.get('/areas');
    if (response.data?.status && Array.isArray(response.data?.areas)) {
      // Use the areas directly from the API - they already have the hierarchical structure
      areas.value = response.data.areas;
    } else {
      areas.value = [];
    }
  } catch (error) {
    console.error("Error fetching areas:", error);
    // Keep dummy data as fallback
    areas.value = dummyAreas;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  sendRequest();
});

// Delete area function
const deleteArea = async (area: any) => {
  try {
    await axiosClient.delete(`/areas/${area.id}`);
    // Remove the area from the local array
    areas.value = areas.value.filter(a => a.id !== area.id);
  } catch (error) {
    console.error("Error deleting area:", error);
    // You could add a toast notification here for error feedback
  }
};

// Handle delete confirmation
const handleDeleteArea = (area: any) => {
  areaToDelete.value = area;
  showDeleteConfirm.value = true;
};

// Confirm delete
const confirmDelete = () => {
  if (areaToDelete.value) {
    deleteArea(areaToDelete.value);
    showDeleteConfirm.value = false;
    areaToDelete.value = null;
  }
};

// Cancel delete
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  areaToDelete.value = null;
};


const search = ref('');
const statusFilter = ref('All');
const infrastructureFilter = ref('All');
const showOrgChart = ref(false);
const showAddArea = ref(false);
const showAreaDetails = ref(false);
const showEditArea = ref(false);
const selectedArea = ref<any | null>(null);
const areaToEdit = ref<any | null>(null);
const menuRefs = ref<Record<string, any>>({});

const buildMenuItems = (area: any) => [
  { 
    label: 'Edit', 
    icon: 'fa-light fa-pen-to-square',
    command: () => {
      areaToEdit.value = area;
      showEditArea.value = true;
    }
  },
  { 
    label: 'Delete', 
    icon: 'fa-light fa-trash-can',
    command: () => {
      handleDeleteArea(area);
    }
  }
];

const statuses = ['All', 'Active', 'Maintenance', 'Planned'];
const infrastructures = ['All', 'Fiber Optic', 'Wireless', 'Copper'];

// Computed properties
const filteredAreas = computed(() => {
  return areas.value.filter(area => {
    const matchesSearch = !search.value ||
      area.name.toLowerCase().includes(search.value.toLowerCase()) ||
      area.code.toLowerCase().includes(search.value.toLowerCase()) ||
      area.manager.toLowerCase().includes(search.value.toLowerCase());

    const matchesStatus = statusFilter.value === 'All' || area.status === statusFilter.value;
    const matchesInfrastructure = infrastructureFilter.value === 'All' || area.infrastructure === infrastructureFilter.value;

    return matchesSearch && matchesStatus && matchesInfrastructure;
  });
});

const stats = computed(() => {
  const total = areas.value.length;
  const active = areas.value.filter(a => a.status === 'Active').length;
  const totalCustomers = areas.value.reduce((sum, a) => sum + a.customers, 0);
  const avgCoverage = areas.value.reduce((sum, a) => sum + a.coverage, 0) / areas.value.length;

  return { total, active, totalCustomers, avgCoverage: avgCoverage.toFixed(1) };
});

const getStatusColor = (status: string) => {
  const colors = {
    'Active': 'bg-green-100 text-green-800',
    'Maintenance': 'bg-yellow-100 text-yellow-800',
    'Planned': 'bg-blue-100 text-blue-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getCoverageColor = (coverage: number) => {
  if (coverage >= 90) return 'text-green-600';
  if (coverage >= 70) return 'text-yellow-600';
  return 'text-red-600';
};
</script>

<template>
  <MasterLayout>
    <!-- Show skeleton while loading -->
    <AreasIndexSkeleton v-if="loading" />
    
    <!-- Show actual content when loaded -->
    <div v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Service Areas</h1>
          <p class="text-sm text-gray-500">Manage network coverage and service areas</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="showAddArea = true"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <i class="fa-light fa-plus"></i>
            Add Area
          </button>
          <button
            @click="sendRequest"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
          <button
            @click="showOrgChart = true"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-sitemap"></i>
            View Org Chart
          </button>
        </div>
      </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Areas</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-map-location-dot text-lg"></i>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Active Areas</p>
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
            <p class="text-sm font-medium text-gray-500">Total Customers</p>
            <!-- <p class="text-2xl font-bold text-gray-900">{{ stats.totalCustomers.toLocaleString() }}</p> -->
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <i class="fa-light fa-users text-lg"></i>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Avg Coverage</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.avgCoverage }}%</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <i class="fa-light fa-signal text-lg"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex-1">
          <div class="relative">
            <input v-model="search" type="text" placeholder="Search areas..."
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select v-model="statusFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
          <select v-model="infrastructureFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option v-for="infra in infrastructures" :key="infra" :value="infra">{{ infra }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Areas Grid -->
    <div v-if="!filteredAreas.length" class="flex items-center justify-center p-10 text-center bg-white rounded-xl border border-gray-200">
      <div>
            <h3 class="text-sm font-semibold text-gray-900">No area yet</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding your first area.</p>
          </div>
    </div>
    
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <div v-for="area in filteredAreas" :key="area.id"
        class="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">{{ area.name }}</h3>
            <p class="text-sm text-gray-500">{{ area.code }}</p>
          </div>
          <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(area.status)}`">
            {{ area.status }}
          </span>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Coverage</span>
            <span :class="`text-sm font-medium ${getCoverageColor(area.coverage)}`">
              {{ area.coverage }}%
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Customers</span>
            <!-- <span class="text-sm font-medium text-gray-900">{{ area.customers.toLocaleString() }}</span> -->
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Infrastructure</span>
            <span class="text-sm font-medium text-gray-900">{{ area.infrastructure }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Manager</span>
            <span class="text-sm font-medium text-gray-900">{{ area.manager }}</span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">Last Maintenance</span>
            <span class="text-xs text-gray-900">{{ area.lastMaintenance }}</span>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button
            @click="selectedArea = area; showAreaDetails = true"
            class="flex-1 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
            View Details
          </button>
          <button
            @click="(e) => menuRefs[area.id]?.toggle(e)"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-ellipsis-h"></i>
          </button>
          <Menu :ref="(el: any) => (menuRefs[area.id] = el)" :model="buildMenuItems(area)" popup appendTo="body" />
        </div>
      </div>
    </div>

    </div>

    <!-- Add Area Dialog -->
    <AddArea v-model:visible="showAddArea" @created="() => sendRequest()" />

    <!-- Area Details Dialog -->
    <AreaDetails v-model:visible="showAreaDetails" :area="selectedArea" />

    <!-- Edit Area Dialog -->
    <EditAreaDialog 
      v-model:visible="showEditArea" 
      :area="areaToEdit" 
      @updated="() => { showEditArea = false; sendRequest(); }" 
    />

    <!-- Areas OrgChart Dialog -->
    <AreasOrgChart :visible="showOrgChart" :areas="areas" @update:visible="(v) => showOrgChart = v" />

    <!-- Confirm Dialog -->
    <ConfirmDialog />

    <!-- Custom Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="showDeleteConfirm" 
      modal 
      header="Delete Area" 
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-4 mb-4">
        <i class="fa-light fa-exclamation-triangle text-red-500 text-2xl"></i>
        <div>
          <p class="text-gray-900 font-medium">Are you sure you want to delete this area?</p>
          <p class="text-gray-600 text-sm mt-1">
            This will permanently delete "{{ areaToDelete?.name }}" and cannot be undone.
          </p>
          <p class="text-gray-600 text-sm mt-1">
            All the subareas in "{{ areaToDelete?.name }}" will also be deleted.
          </p>
        </div>
      </div>
      
      <div class="flex justify-end gap-2 pt-4">
        <button 
          @click="cancelDelete"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button 
          @click="confirmDelete"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Delete
        </button>
      </div>
    </Dialog>
  </MasterLayout>
</template>
