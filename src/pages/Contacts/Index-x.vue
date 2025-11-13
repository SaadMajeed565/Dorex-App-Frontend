<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';

interface Contact {
  id: number;
  type: 'customer' | 'employee';
  name: string;
  email: string | null;
  phone: string | null;
  alternative_phone: string | null;
  address: string | null;
  area: string | null;
  designation?: string | null;
  status: string;
  created_at: string;
}

const toast = useToast();
const loading = ref(true);
const contacts = ref<Contact[]>([]);
const search = ref('');
const typeFilter = ref<'all' | 'customers' | 'employees'>('all');
const page = ref(1);
const perPage = ref(20);
const total = ref(0);
const lastPage = ref(1);

// Fetch contacts
const fetchContacts = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/contacts', {
      params: {
        type: typeFilter.value,
        search: search.value || undefined,
        page: page.value,
        per_page: perPage.value,
      },
    });
    
    if (res.data?.status && Array.isArray(res.data.data)) {
      contacts.value = res.data.data;
      if (res.data.meta) {
        total.value = res.data.meta.total || 0;
        lastPage.value = res.data.meta.last_page || 1;
      }
    } else {
      contacts.value = [];
    }
  } catch (err: any) {
    console.error('Error fetching contacts:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Failed to load contacts.',
      life: 4000,
    });
    contacts.value = [];
  } finally {
    loading.value = false;
  }
};

// Filtered contacts
const filteredContacts = computed(() => {
  if (!search.value) return contacts.value;
  const query = search.value.toLowerCase();
  return contacts.value.filter(contact => 
    contact.name?.toLowerCase().includes(query) ||
    contact.email?.toLowerCase().includes(query) ||
    contact.phone?.toLowerCase().includes(query)
  );
});

// Stats
const stats = computed(() => {
  const all = contacts.value.length;
  const customers = contacts.value.filter(c => c.type === 'customer').length;
  const employees = contacts.value.filter(c => c.type === 'employee').length;
  return { all, customers, employees };
});

const getTypeColor = (type: string) => {
  return type === 'customer' 
    ? 'bg-blue-100 text-blue-800' 
    : 'bg-purple-100 text-purple-800';
};

const getStatusColor = (status: string) => {
  return status === 'active'
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';
};

// Watch for filter changes
const handleFilterChange = () => {
  page.value = 1;
  fetchContacts();
};

onMounted(() => {
  fetchContacts();
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contacts</h1>
          <p class="text-sm text-gray-500">View all customers and employees</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">Total Contacts</p>
          <p class="text-2xl font-bold text-gray-900">{{ total || stats.all }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">Customers</p>
          <p class="text-2xl font-bold text-blue-600">{{ stats.customers }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">Employees</p>
          <p class="text-2xl font-bold text-purple-600">{{ stats.employees }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="flex-1">
            <div class="relative">
              <input
                v-model="search"
                @input="handleFilterChange"
                type="text"
                placeholder="Search contacts by name, email, or phone..."
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="typeFilter"
              @change="handleFilterChange"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="customers">Customers</option>
              <option value="employees">Employees</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Contacts Table -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div v-if="filteredContacts.length === 0" class="flex items-center justify-center p-10 text-center">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">No contacts found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        </div>
        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Area</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="contact in filteredContacts" :key="`${contact.type}-${contact.id}`" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ contact.name }}</div>
                  <div v-if="contact.designation" class="text-xs text-gray-500">{{ contact.designation }}</div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize', getTypeColor(contact.type)]">
                  {{ contact.type }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                <div v-if="contact.phone">{{ contact.phone }}</div>
                <div v-if="contact.alternative_phone" class="text-xs text-gray-500">{{ contact.alternative_phone }}</div>
                <div v-else class="text-gray-400">—</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ contact.email || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ contact.area || '—' }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize', getStatusColor(contact.status)]">
                  {{ contact.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="lastPage > 1" class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-sm text-gray-500">
            Page {{ page }} of {{ lastPage }} — {{ total }} results
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="page = Math.max(1, page - 1); fetchContacts();"
              :disabled="page <= 1"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              @click="page = Math.min(lastPage, page + 1); fetchContacts();"
              :disabled="page >= lastPage"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </template>
  </MasterLayout>
</template>

