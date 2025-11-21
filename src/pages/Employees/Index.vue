<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import AddEmployee from './AddEmployee.vue';
import ShowEmployee from './Show.vue';
import EditEmployee from './Edit.vue';
import ImportDialog from '../../components/ImportDialog.vue';
import { useAuthStore } from '../../stores/authStore';

// Reactive data
const dummyEmployees = [
  {
    id: 1,
    name: 'Unknown',
    email: 'N/A',
    login_id: 'N/A',
    nic: 'N/A',
    phone: 'N/A',
    alternative_phone: 'N/A',
    profile_photo: null,
    area: 'N/A',
    address: 'N/A',
    status: 'Inactive',
    designation: 'N/A',
  }
];

const authStore = useAuthStore();

const employees = ref<any[]>(dummyEmployees);
const loading = ref(true);

// function to fetch data
const sendRequest = async () => {
  loading.value = true;
  try {
    const response = await axiosClient.get('/employees');
    if (response.data?.status && Array.isArray(response.data?.employees)) {
      // Transform the data to match our expected structure
      employees.value = response.data.employees.map((employee: any) => {
        const rawStatus = employee.status;
        const normalizedStatus =
          rawStatus === true || rawStatus === 1 || String(rawStatus).toLowerCase() === 'active'
            ? 'Active'
            : 'Inactive';

        return {
          id: employee.employee.id,
          name: employee.name || `Employee #${employee.id}`,
          email: employee.email || 'N/A',
          loginId: employee.login_id || 'N/A',
          nic: employee.nic || 'N/A',
          phone: employee.phone || employee.alternative_phone || 'N/A',
          profilePhoto: employee.profile_photo || null,
          area: employee.area || 'N/A',
          address: employee.address || 'N/A',
          status: normalizedStatus,
          designation: employee.designation || employee.employee?.designation || 'N/A',
          roles: Array.isArray(employee.roles) ? employee.roles : [],
        };
      });
    } else {
      employees.value = [];
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    // Keep dummy data as fallback
    employees.value = dummyEmployees;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  sendRequest();
});

const search = ref('');
const statusFilter = ref('All');
const areaFilter = ref('All');

const statuses = ['All', 'Active', 'Inactive'];
// areas will be derived from data

// Computed properties
const availableAreas = computed(() => {
  const set = new Set<string>();
  employees.value.forEach((e: any) => {
    if (e?.area && e.area !== 'N/A') set.add(e.area);
  });
  return ['All', ...Array.from(set)];
});

const filteredEmployees = computed(() => {
  const q = search.value.trim().toLowerCase();
  return employees.value.filter((employee: any) => {
    const name = (employee?.name || '').toLowerCase();
    const email = (employee?.email || '').toLowerCase();
    const nic = (employee?.nic || '').toLowerCase();
    const phone = (employee?.phone || '').toLowerCase();

    const matchesSearch = !q || name.includes(q) || email.includes(q) || nic.includes(q) || phone.includes(q);
    const matchesStatus = statusFilter.value === 'All' || employee.status === statusFilter.value;
    const matchesArea = areaFilter.value === 'All' || employee.area === areaFilter.value;

    return matchesSearch && matchesStatus && matchesArea;
  });
});

const stats = computed(() => {
  const total = employees.value.length;
  const active = employees.value.filter((e: any) => e.status === 'Active').length;
  const withPhone = employees.value.filter((e: any) => e.phone && e.phone !== 'N/A').length;
  return { total, active, withPhone };
});

const getStatusColor = (status: string) => {
  const colors = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const showAddEmployee = ref(false);
const showViewEmployee = ref(false);
const showEditEmployee = ref(false);
const showImportDialog = ref(false);
const viewEmployeeId = ref<number | string | null>(null);
const editEmployeeId = ref<number | string | null>(null);

const canCreateEmployee = computed(() => authStore.hasPermission('create-employee'));
const canUpdateEmployee = computed(() => authStore.hasPermission('update-employee'));
const canViewEmployee = computed(() => authStore.hasPermission('view-employee'));

const openAddEmployee = () => {
  if (canCreateEmployee.value) {
    showAddEmployee.value = true;
  }
};

const openViewEmployee = (employeeId: number | string) => {
  if (!canViewEmployee.value) return;
  viewEmployeeId.value = employeeId;
  showViewEmployee.value = true;
};

const openEditEmployee = (employeeId: number | string) => {
  if (!canUpdateEmployee.value) return;
  editEmployeeId.value = employeeId;
  showEditEmployee.value = true;
};

const goToEditEmployee = (employeeId: number | string) => {
  openEditEmployee(employeeId);
};

const handleEditFromView = (employeeId: number | string) => {
  showViewEmployee.value = false;
  openEditEmployee(employeeId);
};

</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Employees</h1>
        <p class="text-sm text-gray-500">Manage your team and workforce</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="canCreateEmployee"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          @click="openAddEmployee">
          <i class="fa-light fa-plus"></i>
          Add Employee
        </button>
        <button
          @click="sendRequest"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-arrow-rotate-right"></i>
          Refresh
        </button>
        <button
          @click="showImportDialog = true"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-file-import"></i>
          Import
        </button>
      </div>
    </div>
    <!-- Add Employee Dialog -->
    <AddEmployee v-if="canCreateEmployee" :visible="showAddEmployee" @close="showAddEmployee = false" />
    <ShowEmployee
      :visible="showViewEmployee"
      :employee-id="viewEmployeeId"
      @update:visible="v => { showViewEmployee = v; if (!v) viewEmployeeId = null }"
      @edit="handleEditFromView"
    />
    <EditEmployee
      v-if="canUpdateEmployee"
      :visible="showEditEmployee"
      :employee-id="editEmployeeId"
      @update:visible="v => { showEditEmployee = v; if (!v) editEmployeeId = null }"
      @updated="sendRequest"
    />
    <ImportDialog v-model="showImportDialog" module="employees" @imported="sendRequest" />

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Employees</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-users text-lg"></i>
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
            <p class="text-sm font-medium text-gray-500">With Phone</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.withPhone }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <i class="fa-light fa-phone text-lg"></i>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Area Count</p>
            <p class="text-2xl font-bold text-gray-900">{{ availableAreas.length - 1 }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <i class="fa-light fa-location-dot text-lg"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 sticky top-15">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex-1">
          <div class="relative">
            <input v-model="search" type="text" placeholder="Search employees..."
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select v-model="statusFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
          <select v-model="areaFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option v-for="area in availableAreas" :key="area" :value="area">{{ area }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Employees Table -->
    <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div
        v-if="!filteredEmployees.length"
        class="flex items-center justify-center p-10 text-center"
      >
        <div>
          <h3 class="text-sm font-semibold text-gray-900">No employees found</h3>
          <p
            class="mt-1 text-sm text-gray-500"
            v-if="employees.length === 0"
          >
            Get started by adding your first employee.
          </p>
          <p
            class="mt-1 text-sm text-gray-500"
            v-else
          >
            Try adjusting your search or filter criteria.
          </p>
        </div>
      </div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  v-if="canViewEmployee || canUpdateEmployee"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="employee in filteredEmployees"
                :key="employee.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <span class="text-sm font-medium text-indigo-600">
                          {{ (employee.name || 'U').charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ employee.name || 'Unknown' }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ employee.phone || 'N/A' }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ employee.email || 'N/A' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ employee.area || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ employee.designation || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(employee.status)}`"
                  >
                    {{ employee.status }}
                  </span>
                </td>
                <td
                  v-if="canViewEmployee || canUpdateEmployee"
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium"
                >
                  <div class="flex items-center gap-2">
                    <button
                      v-if="canViewEmployee"
                      class="text-indigo-600 hover:text-indigo-900"
                      @click="openViewEmployee(employee.id)"
                    >
                      View
                    </button>
                    <button
                      v-if="canUpdateEmployee"
                      class="text-gray-600 hover:text-gray-900"
                      @click="goToEditEmployee(employee.id)"
                    >
                      Edit
                    </button>
                    <button
                      v-if="canUpdateEmployee"
                      class="text-yellow-600 hover:text-yellow-900"
                    >
                      Schedule
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
    </template>
  </MasterLayout>
</template>
