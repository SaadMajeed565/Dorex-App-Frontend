<script setup lang="ts">
import { ref, computed } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';

// Reactive data
const accounts = ref([
  {
    id: 1,
    accountName: 'Main Business Account',
    accountNumber: 'ACC-001-2024',
    accountType: 'Business',
    bankName: 'First National Bank',
    balance: 125000.50,
    currency: 'USD',
    status: 'Active',
    lastTransaction: '2024-01-15',
    transactions: 45,
    monthlyFee: 25.00
  },
  {
    id: 2,
    accountName: 'Operations Account',
    accountNumber: 'ACC-002-2024',
    accountType: 'Operations',
    bankName: 'City Bank',
    balance: 75000.25,
    currency: 'USD',
    status: 'Active',
    lastTransaction: '2024-01-16',
    transactions: 23,
    monthlyFee: 15.00
  },
  {
    id: 3,
    accountName: 'Emergency Fund',
    accountNumber: 'ACC-003-2024',
    accountType: 'Savings',
    bankName: 'Trust Bank',
    balance: 200000.00,
    currency: 'USD',
    status: 'Active',
    lastTransaction: '2024-01-10',
    transactions: 5,
    monthlyFee: 0.00
  },
  {
    id: 4,
    accountName: 'Equipment Financing',
    accountNumber: 'ACC-004-2024',
    accountType: 'Credit',
    bankName: 'Capital Bank',
    balance: -45000.00,
    currency: 'USD',
    status: 'Active',
    lastTransaction: '2024-01-12',
    transactions: 12,
    monthlyFee: 0.00
  }
]);

const search = ref('');
const typeFilter = ref('All');
const statusFilter = ref('All');
const bankFilter = ref('All');

const types = ['All', 'Business', 'Operations', 'Savings', 'Credit'];
const statuses = ['All', 'Active', 'Inactive', 'Suspended'];
const banks = ['All', 'First National Bank', 'City Bank', 'Trust Bank', 'Capital Bank'];

// Computed properties
const filteredAccounts = computed(() => {
  return accounts.value.filter(account => {
    const matchesSearch = !search.value || 
      account.accountName.toLowerCase().includes(search.value.toLowerCase()) ||
      account.accountNumber.toLowerCase().includes(search.value.toLowerCase()) ||
      account.bankName.toLowerCase().includes(search.value.toLowerCase());
    
    const matchesType = typeFilter.value === 'All' || account.accountType === typeFilter.value;
    const matchesStatus = statusFilter.value === 'All' || account.status === statusFilter.value;
    const matchesBank = bankFilter.value === 'All' || account.bankName === bankFilter.value;
    
    return matchesSearch && matchesType && matchesStatus && matchesBank;
  });
});

const stats = computed(() => {
  const total = accounts.value.length;
  const active = accounts.value.filter(a => a.status === 'Active').length;
  const totalBalance = accounts.value.reduce((sum, a) => sum + a.balance, 0);
  const totalTransactions = accounts.value.reduce((sum, a) => sum + a.transactions, 0);
  
  return { total, active, totalBalance, totalTransactions };
});

const getStatusColor = (status: string) => {
  const colors = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-gray-100 text-gray-800',
    'Suspended': 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getTypeColor = (type: string) => {
  const colors = {
    'Business': 'bg-blue-100 text-blue-800',
    'Operations': 'bg-green-100 text-green-800',
    'Savings': 'bg-purple-100 text-purple-800',
    'Credit': 'bg-orange-100 text-orange-800'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getBalanceColor = (balance: number) => {
  if (balance > 0) return 'text-green-600';
  if (balance < 0) return 'text-red-600';
  return 'text-gray-600';
};
</script>

<template>
  <MasterLayout>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Accounts</h1>
        <p class="text-sm text-gray-500">Manage your business accounts and financial overview</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          <i class="fa-light fa-plus"></i>
          Add Account
        </button>
        <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-chart-line"></i>
          Reports
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Accounts</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-building text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Active Accounts</p>
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
            <p class="text-sm font-medium text-gray-500">Total Balance</p>
            <p class="text-2xl font-bold text-gray-900">${{ stats.totalBalance.toLocaleString() }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <i class="fa-light fa-dollar-sign text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Transactions</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalTransactions }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <i class="fa-light fa-arrow-right-arrow-left text-lg"></i>
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
              placeholder="Search accounts..." 
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
            <option v-for="type in types" :key="type" :value="type">{{ type }}</option>
          </select>
          <select 
            v-model="statusFilter" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
          <select 
            v-model="bankFilter" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="bank in banks" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Accounts Table -->
    <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="account in filteredAccounts" :key="account.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0">
                    <div class="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <i class="fa-light fa-building text-indigo-600"></i>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ account.accountName }}</div>
                    <div class="text-sm text-gray-500">{{ account.accountNumber }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(account.accountType)}`">
                  {{ account.accountType }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ account.bankName }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div :class="`text-sm font-medium ${getBalanceColor(account.balance)}`">
                  ${{ account.balance.toLocaleString() }}
                </div>
                <div class="text-xs text-gray-500">{{ account.currency }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status)}`">
                  {{ account.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ account.transactions }}</div>
                <div class="text-xs text-gray-500">Last: {{ account.lastTransaction }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button class="text-indigo-600 hover:text-indigo-900">View</button>
                  <button class="text-gray-600 hover:text-gray-900">Edit</button>
                  <button class="text-green-600 hover:text-green-900">Transfer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MasterLayout>
</template>

