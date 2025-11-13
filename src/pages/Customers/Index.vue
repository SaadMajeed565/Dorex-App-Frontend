<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import ConfirmDialog from '../../volt/ConfirmDialog.vue';
import { useCustomerStore } from '../../stores/customerStore';
import AddCustomer from './AddCustomer.vue';
import Edit from './Edit.vue';
import Show from './Show.vue';

// Store
const customerStore = useCustomerStore();
const { loading, stats, filteredCustomers, statusOptions, areas, searchQuery, statusFilter, areaFilter } = storeToRefs(customerStore);
const toast = useToast();
const confirm = useConfirm();

// UI State
const showAddCustomer = ref(false);
const showViewCustomer = ref(false);
const showEditCustomer = ref(false);
const selectedCustomerId = ref<string | number | null>(null);

// Fetch data on mount
onMounted(() => {
  customerStore.fetchCustomers();
  
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.altKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      showAddCustomer.value = true;
    }
  };
  window.addEventListener('keydown', handleKeydown);
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
});

// Modal handlers
const openShowModal = (customerId: string | number) => {
  selectedCustomerId.value = customerId;
  showViewCustomer.value = true;
};

const openEditModal = (customerId: string | number) => {
  selectedCustomerId.value = customerId;
  showEditCustomer.value = true;
};

const handleRefresh = () => {
  customerStore.fetchCustomers();
};

const handleEditFromView = (customerId: string | number) => {
  showViewCustomer.value = false;
  openEditModal(customerId);
};

// Suspend/Unsuspend customer
const handleSuspend = (customer: any) => {
  const isSuspended = customer.status === 'Suspended';
  const action = isSuspended ? 'unsuspend' : 'suspend';
  const newStatus = isSuspended ? 'active' : 'suspended';
  
  confirm.require({
    message: `Are you sure you want to ${action} "${customer.name}"?`,
    header: isSuspended ? 'Unsuspend Customer' : 'Suspend Customer',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: isSuspended ? 'Unsuspend' : 'Suspend',
      severity: 'danger'
    },
    accept: async () => {
      try {
        const data = new FormData();
        data.append('status', newStatus);
        data.append('_method', 'PUT');
        
        await axiosClient.post(`/customers/${customer.id}`, data);
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Customer ${action}ed successfully!`,
          life: 3000,
        });
        
        await customerStore.fetchCustomers();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || `Failed to ${action} customer`,
          life: 4000,
        });
      }
    }
  });
};

// Helper functions using store
const getStatusColor = (status: string) => {
  const colors = {
    'Active': 'bg-green-100 text-green-800',
    'Suspended': 'bg-yellow-100 text-yellow-800',
    'Inactive': 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

</script>

<template>
  <MasterLayout>
    <ConfirmDialog />
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Customers</h1>
          <p class="text-sm text-gray-500">Manage your customer base and subscriptions</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="showAddCustomer = true"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <i class="fa-light fa-plus"></i>
            <span class="truncate font-medium text-sm">Add Customer</span>
          </button>
          <button @click="handleRefresh"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-file-import"></i>
            Import
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-download"></i>
            Export
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Customers</p>
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
              <p class="text-sm font-medium text-gray-500">Suspended</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.suspended }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
              <i class="fa-light fa-exclamation-triangle text-lg"></i>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Outstanding Balance</p>
              <p class="text-2xl font-bold text-gray-900">${{ stats.totalRevenue.toFixed(2) }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <i class="fa-light fa-dollar-sign text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 sticky top-15">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="flex-1">
            <div class="relative">
              <input v-model="searchQuery" type="text" placeholder="Search customers..."
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <select v-model="statusFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option>
            </select>
            <select v-model="areaFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div v-if="!filteredCustomers.length" class="flex items-center justify-center p-10 text-center">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">No customers found</h3>
            <p class="mt-1 text-sm text-gray-500" v-if="customerStore.customers.length === 0">Get started by adding your first customer.</p>
            <p class="mt-1 text-sm text-gray-500" v-else>Try adjusting your search or filter criteria.</p>
          </div>
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="customer in filteredCustomers" :key="customer.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 flex-shrink-0">
                        <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span class="text-sm font-medium text-indigo-600">{{ customer.name?.charAt(0) || '?' }}</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ customer.name || 'Unknown' }}</div>
                        <div class="text-sm text-gray-500">{{ customer.area || 'N/A' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ customer.email || 'N/A' }}</div>
                    <div class="text-sm text-gray-500">{{ customer.phone || 'N/A' }}</div>
                    <div class="text-xs text-gray-400" v-if="customer.nic !== 'N/A'">NIC: {{ customer.nic }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ customer.plan || 'N/A' }}</div>
                    <div class="text-xs text-gray-500" v-if="customer.panelId !== 'N/A'">Panel ID: {{ customer.panelId }}</div>
                    <div class="text-xs text-gray-500" v-if="customer.panelPass !== 'N/A'">Panel Pass: {{ customer.panelPass }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`">
                      {{ customer.status || 'Unknown' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="`text-sm font-medium ${customerStore.getBalanceColor(customer.balance)}`">
                      ${{ (customer.balance || 0).toFixed(2) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button @click="openShowModal(customer.id)" class="text-indigo-600 hover:text-indigo-900">View</button>
                      <button @click="openEditModal(customer.id)" class="text-gray-600 hover:text-gray-900">Edit</button>
                      <button 
                        @click="handleSuspend(customer)" 
                        :class="customer.status === 'Suspended' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'">
                        {{ customer.status === 'Suspended' ? 'Unsuspend' : 'Suspend' }}
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
    <AddCustomer v-model:visible="showAddCustomer" @created="handleRefresh" />
    <Show 
      :visible="showViewCustomer" 
      :customerId="selectedCustomerId" 
      @update:visible="showViewCustomer = $event" 
      @updated="handleRefresh"
      @edit="handleEditFromView"
    />
    <Edit 
      :visible="showEditCustomer" 
      :customerId="selectedCustomerId" 
      @update:visible="showEditCustomer = $event" 
      @updated="handleRefresh" 
    />
  </MasterLayout>
</template>
