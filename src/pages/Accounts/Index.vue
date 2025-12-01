<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from '../../volt/ConfirmDialog.vue';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import Button from '../../volt/Button.vue';
import Select from '../../volt/Select.vue';

const toast = useToast();
const confirm = useConfirm();
const generalSettingsStore = useGeneralSettingsStore();

const accounts = ref<any[]>([]);
const availableEmployees = ref<any[]>([]);
const loading = ref(true);
const loadingEmployees = ref(false);
const searchQuery = ref('');
const selectedAccountId = ref<number | null>(null);
const showAccountDetails = ref(false);
const showCreateAccount = ref(false);
const showEditAccount = ref(false);
const accountDetails = ref<any>(null);
const accountCollections = ref<any[]>([]);
const loadingCollections = ref(false);
const currency = computed(() => generalSettingsStore.currencyUnit || 'PKR');

const accountForm = ref<{
  employee_id: string | number | null;
  account_number: string;
  opening_balance: string;
  status: 'active' | 'suspended' | 'closed';
  notes: string;
}>({
  employee_id: null,
  account_number: '',
  opening_balance: '0',
  status: 'active',
  notes: '',
});

const editAccountForm = ref<{
  account_number: string;
  opening_balance: string;
  status: 'active' | 'suspended' | 'closed';
  notes: string;
}>({
  account_number: '',
  opening_balance: '0',
  status: 'active',
  notes: '',
});

const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.value,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.value}`;
  }
};

const fetchAccounts = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/accounts');
    if (res.data?.status && Array.isArray(res.data?.data)) {
      accounts.value = res.data.data.map((acc: any) => ({
        ...acc,
        account: {
          ...acc,
          total_collections: acc.total_collections || 0,
          total_collections_count: acc.total_collections_count || 0,
        },
      }));
    }
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load accounts',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const fetchAvailableEmployees = async () => {
  loadingEmployees.value = true;
  try {
    const res = await axiosClient.get('/accounts/available-employees');
    if (res.data?.status && Array.isArray(res.data?.data)) {
      availableEmployees.value = res.data.data;
    } else {
      availableEmployees.value = [];
      console.warn('No employees data returned:', res.data);
    }
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load available employees',
      life: 3000,
    });
    availableEmployees.value = [];
  } finally {
    loadingEmployees.value = false;
  }
};

const filteredAccounts = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return accounts.value;
  return accounts.value.filter((acc) =>
    acc.employee?.name?.toLowerCase().includes(query) ||
    acc.employee?.email?.toLowerCase().includes(query) ||
    acc.account_number?.toLowerCase().includes(query) ||
    acc.employee?.designation?.toLowerCase().includes(query)
  );
});

const openAccountDetails = async (accountId: number) => {
  selectedAccountId.value = accountId;
  showAccountDetails.value = true;
  loadingCollections.value = true;
  
  try {
    // Fetch account summary
    const accountRes = await axiosClient.get(`/accounts/${accountId}/summary`);
    if (accountRes.data?.status) {
      accountDetails.value = accountRes.data.data;
    }
    
    // Fetch recent collections
    const collectionsRes = await axiosClient.get(`/accounts/${accountId}/collections?per_page=10`);
    if (collectionsRes.data?.status) {
      if (collectionsRes.data.data?.data) {
        accountCollections.value = collectionsRes.data.data.data;
      } else if (Array.isArray(collectionsRes.data.data)) {
        accountCollections.value = collectionsRes.data.data;
      }
    }
  } catch (error: any) {
    console.error('Error fetching account details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load account details',
      life: 3000,
    });
  } finally {
    loadingCollections.value = false;
  }
};

const openCreateAccount = async () => {
  // Reset form first
  accountForm.value = {
    employee_id: null,
    account_number: '',
    opening_balance: '0',
    status: 'active',
    notes: '',
  };
  
  // Fetch employees before showing dialog
  await fetchAvailableEmployees();
  
  // Show dialog after employees are loaded
  showCreateAccount.value = true;
};

const handleCreateAccount = async () => {
  if (!accountForm.value.employee_id) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please select an employee',
      life: 3000,
    });
    return;
  }

  try {
    const payload = {
      ...accountForm.value,
      employee_id: typeof accountForm.value.employee_id === 'string' 
        ? parseInt(accountForm.value.employee_id) 
        : accountForm.value.employee_id,
      opening_balance: parseFloat(accountForm.value.opening_balance) || 0,
    };
    const res = await axiosClient.post('/accounts', payload);
    if (res.data?.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Account created successfully',
        life: 3000,
      });
      showCreateAccount.value = false;
      await fetchAccounts();
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create account',
      life: 3000,
    });
  }
};

const openEditAccount = () => {
  if (!accountDetails.value) return;
  
  editAccountForm.value = {
    account_number: accountDetails.value.account_number || '',
    opening_balance: String(accountDetails.value.opening_balance || 0),
    status: accountDetails.value.status || 'active',
    notes: accountDetails.value.notes || '',
  };
  
  showEditAccount.value = true;
};

const handleUpdateAccount = async () => {
  if (!selectedAccountId.value) return;

  // Check if status is being changed to suspend or close
  const originalStatus = accountDetails.value?.status;
  const newStatus = editAccountForm.value.status;
  
  if ((newStatus === 'suspended' || newStatus === 'closed') && originalStatus !== newStatus) {
    const actionLabel = newStatus === 'suspended' ? 'suspend' : 'close';
    const actionMessage = newStatus === 'suspended' 
      ? 'Are you sure you want to suspend this account? The account will be temporarily disabled and cannot receive new payments.'
      : 'Are you sure you want to close this account? This action is permanent and the account cannot receive new payments.';
    
    confirm.require({
      message: actionMessage,
      header: `Confirm ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} Account`,
      icon: 'pi pi-exclamation-triangle',
      acceptClass: newStatus === 'closed' ? 'p-button-danger' : 'p-button-warning',
      accept: async () => {
        await performUpdateAccount();
      },
    });
  } else {
    await performUpdateAccount();
  }
};

const performUpdateAccount = async () => {
  if (!selectedAccountId.value) return;

  try {
    const payload = {
      account_number: editAccountForm.value.account_number || null,
      opening_balance: parseFloat(editAccountForm.value.opening_balance) || 0,
      status: editAccountForm.value.status,
      notes: editAccountForm.value.notes || null,
    };

    const res = await axiosClient.put(`/accounts/${selectedAccountId.value}`, payload);
    if (res.data?.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: res.data.message || 'Account updated successfully',
        life: 3000,
      });
      showEditAccount.value = false;
      await fetchAccounts();
      if (selectedAccountId.value) {
        await openAccountDetails(selectedAccountId.value);
      }
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to update account',
      life: 3000,
    });
  }
};

const handleSuspendAccount = (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('handleSuspendAccount called', { selectedAccountId: selectedAccountId.value, accountDetails: accountDetails.value });
  
  if (!selectedAccountId.value || !accountDetails.value) {
    console.error('Cannot suspend: missing account ID or details');
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Account information is missing. Please try again.',
      life: 3000,
    });
    return;
  }
  
  console.log('Showing confirm dialog for suspend');
  confirm.require({
    message: 'Are you sure you want to suspend this account? The account will be temporarily disabled and cannot receive new payments.',
    header: 'Confirm Suspend Account',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-warning',
    accept: async () => {
      try {
        const res = await axiosClient.post(`/accounts/${selectedAccountId.value}/suspend`);
        if (res.data?.status) {
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: res.data.message || 'Account suspended successfully',
            life: 3000,
          });
          await fetchAccounts();
          if (selectedAccountId.value) {
            await openAccountDetails(selectedAccountId.value);
          }
        }
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to suspend account',
          life: 3000,
        });
      }
    },
  });
};

const handleCloseAccount = (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('handleCloseAccount called', { selectedAccountId: selectedAccountId.value, accountDetails: accountDetails.value });
  
  if (!selectedAccountId.value || !accountDetails.value) {
    console.error('Cannot close: missing account ID or details');
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Account information is missing. Please try again.',
      life: 3000,
    });
    return;
  }
  
  console.log('Showing confirm dialog for close');
  confirm.require({
    message: 'Are you sure you want to close this account? This action is permanent and the account cannot receive new payments.',
    header: 'Confirm Close Account',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const res = await axiosClient.post(`/accounts/${selectedAccountId.value}/close`);
        if (res.data?.status) {
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: res.data.message || 'Account closed successfully',
            life: 3000,
          });
          await fetchAccounts();
          if (selectedAccountId.value) {
            await openAccountDetails(selectedAccountId.value);
          }
        }
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to close account',
          life: 3000,
        });
      }
    },
  });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status: string) => {
  const badges = {
    'active': 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
    'suspended': 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
    'closed': 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10',
  };
  return badges[status as keyof typeof badges] || 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10';
};

// Watch for dialog opening to reload employees
watch(showCreateAccount, async (newValue) => {
  if (newValue) {
    // Reload employees when dialog opens
    await fetchAvailableEmployees();
  }
});

onMounted(async () => {
  if (!generalSettingsStore.loaded) {
    await generalSettingsStore.fetchSettings().catch(() => null);
  }
  await fetchAccounts();
});
</script>

<template>
  <MasterLayout>
    <ConfirmDialog />
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Collector Accounts</h1>
          <p class="text-sm text-gray-500">Manage accounts for employees who collect payments</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="openCreateAccount"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <i class="fa-light fa-plus"></i>
            Create Account
          </button>
          <button
            @click="fetchAccounts"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search accounts by employee name, email, account number, or designation..."
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <!-- Accounts Grid -->
      <div v-if="!filteredAccounts.length" class="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <h3 class="text-sm font-semibold text-gray-900">No accounts found</h3>
        <p class="mt-1 text-sm text-gray-500">Create an account for an employee to start tracking collections.</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="account in filteredAccounts"
          :key="account.id"
          class="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ account.employee?.name || 'N/A' }}</h3>
              <p class="text-sm text-gray-500">{{ account.employee?.email }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ account.employee?.designation }}</p>
              <p v-if="account.account_number" class="text-xs text-indigo-600 mt-1 font-medium">
                Account #{{ account.account_number }}
              </p>
            </div>
            <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span class="text-lg font-medium text-indigo-600">{{ account.employee?.name?.charAt(0) || '?' }}</span>
            </div>
          </div>

          <div class="space-y-3 mb-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Status</span>
              <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', getStatusBadge(account.status)]">
                {{ account.status.charAt(0).toUpperCase() + account.status.slice(1) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Current Balance</span>
              <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(account.current_balance || 0) }}</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
              <span class="text-sm text-gray-500">Total Collections</span>
              <span class="text-sm font-semibold text-indigo-600">{{ formatCurrency(account.total_collections || 0) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Total Count</span>
              <span class="text-sm font-medium text-gray-700">{{ account.total_collections_count || 0 }}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="openAccountDetails(account.id)"
              class="flex-1 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Create Account Dialog -->
      <Dialog
        v-model:visible="showCreateAccount"
        modal
        header="Create Account"
        :style="{ width: '500px' }">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <Select
              v-model="accountForm.employee_id"
              :options="availableEmployees"
              optionLabel="name"
              optionValue="id"
              :placeholder="loadingEmployees ? 'Loading employees...' : (availableEmployees.length === 0 ? 'No employees available' : 'Select an employee')"
              class="w-full"
              :loading="loadingEmployees"
              :disabled="loadingEmployees || availableEmployees.length === 0"
            >
              <template #option="slotProps">
                <div>
                  <div class="font-medium">{{ slotProps.option.name }}</div>
                  <div class="text-xs text-gray-500">{{ slotProps.option.email }} - {{ slotProps.option.designation }}</div>
                </div>
              </template>
            </Select>
            <p v-if="!loadingEmployees && availableEmployees.length === 0" class="text-xs text-gray-500 mt-1">
              All employees already have accounts. Please create a new employee first.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <InputText v-model="accountForm.account_number" class="w-full" placeholder="Auto-generated if left empty" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
            <InputText v-model="accountForm.opening_balance" type="number" step="0.01" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              v-model="accountForm.status"
              :options="[
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Closed', value: 'closed' },
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Textarea v-model="accountForm.notes" rows="3" class="w-full" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" @click="showCreateAccount = false" severity="secondary" outlined />
          <Button label="Create Account" @click="handleCreateAccount" />
        </template>
      </Dialog>

      <!-- Account Details Dialog -->
      <Dialog
        v-model:visible="showAccountDetails"
        modal
        header="Account Details"
        :style="{ width: '800px', maxHeight: '90vh' }"
        class="overflow-y-auto">
        <div v-if="accountDetails" class="space-y-6">
          <!-- Action Buttons Header -->
          <div class="flex items-center justify-end gap-2 pb-4 border-b border-gray-200">
            <button
              v-if="accountDetails.status !== 'closed'"
              type="button"
              @click="openEditAccount"
              class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100">
              <i class="fa-light fa-pen-to-square text-sm"></i>
              Edit
            </button>
            <button
              v-if="accountDetails.status === 'active'"
              type="button"
              @click="handleSuspendAccount"
              class="inline-flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-100">
              <i class="fa-light fa-pause text-sm"></i>
              Suspend
            </button>
            <button
              v-if="accountDetails.status !== 'closed'"
              type="button"
              @click="handleCloseAccount"
              class="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
              <i class="fa-light fa-lock text-sm"></i>
              Close
            </button>
          </div>
          <!-- Account Summary Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Collections</p>
              <p class="text-xl font-bold text-gray-900">{{ formatCurrency(accountDetails.total_collections || 0) }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ accountDetails.total_collections_count || 0 }} payments</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Today</p>
              <p class="text-xl font-bold text-indigo-600">{{ formatCurrency(accountDetails.today_collections || 0) }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">This Month</p>
              <p class="text-xl font-bold text-indigo-600">{{ formatCurrency(accountDetails.current_month_collections || 0) }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last 30 Days</p>
              <p class="text-xl font-bold text-indigo-600">{{ formatCurrency(accountDetails.last_30_days_collections || 0) }}</p>
            </div>
          </div>

          <!-- Account Info -->
          <div class="rounded-lg border border-gray-200 bg-white p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Account Information</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Employee:</span>
                <span class="ml-2 font-medium text-gray-900">{{ accountDetails.employee_name }}</span>
              </div>
              <div>
                <span class="text-gray-500">Email:</span>
                <span class="ml-2 font-medium text-gray-900">{{ accountDetails.employee_email }}</span>
              </div>
              <div>
                <span class="text-gray-500">Account Number:</span>
                <span class="ml-2 font-medium text-gray-900">{{ accountDetails.account_number || 'N/A' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Status:</span>
                <span :class="['ml-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', getStatusBadge(accountDetails.status)]">
                  {{ accountDetails.status.charAt(0).toUpperCase() + accountDetails.status.slice(1) }}
                </span>
              </div>
              <div>
                <span class="text-gray-500">Opening Balance:</span>
                <span class="ml-2 font-medium text-gray-900">{{ formatCurrency(accountDetails.opening_balance || 0) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Current Balance:</span>
                <span class="ml-2 font-medium text-indigo-600">{{ formatCurrency(accountDetails.current_balance || 0) }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Collections -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Recent Collections</h3>
            <div v-if="loadingCollections" class="text-center py-8 text-gray-500">
              <i class="fa-light fa-spinner fa-spin text-2xl mb-2"></i>
              <p>Loading collections...</p>
            </div>
            <div v-else-if="!accountCollections.length" class="text-center py-8 text-gray-400">
              No collections found
            </div>
            <div v-else class="rounded-lg border border-gray-200 overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slip No</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="collection in accountCollections" :key="collection.id" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(collection.pay_date || collection.payDate) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">
                      {{ collection.customer?.user?.name || collection.customer?.name || 'N/A' }}
                    </td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">
                      {{ formatCurrency(collection.amount || 0) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">
                      {{ collection.slip_no || collection.slipNo || 'N/A' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </Dialog>

      <!-- Edit Account Dialog -->
      <Dialog
        v-model:visible="showEditAccount"
        modal
        header="Edit Account"
        :style="{ width: '500px' }">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <InputText v-model="editAccountForm.account_number" class="w-full" placeholder="Auto-generated if left empty" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
            <InputText v-model="editAccountForm.opening_balance" type="number" step="0.01" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              v-model="editAccountForm.status"
              :options="[
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Closed', value: 'closed' },
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <p v-if="editAccountForm.status === 'suspended'" class="text-xs text-yellow-600 mt-1">
              Suspended accounts cannot receive new payments.
            </p>
            <p v-if="editAccountForm.status === 'closed'" class="text-xs text-red-600 mt-1">
              Closing an account is permanent and cannot be undone.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Textarea v-model="editAccountForm.notes" rows="3" class="w-full" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" @click="showEditAccount = false" severity="secondary" outlined />
          <Button label="Update Account" @click="handleUpdateAccount" />
        </template>
      </Dialog>
    </template>
  </MasterLayout>
</template>
