<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
const searchQuery = ref(''); // This will be used for API calls (debounced)
const typeFilter = ref<'all' | 'customers' | 'employees'>('all');
const page = ref(1);
const perPage = ref(20);
const total = ref(0);
const lastPage = ref(1);

// Debounce timer
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Fetch contacts
const fetchContacts = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/contacts', {
      params: {
        type: typeFilter.value,
        search: searchQuery.value || undefined,
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

// Filtered contacts (API handles filtering, so we just return the results)
const filteredContacts = computed(() => {
  return contacts.value;
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

// Get initials for avatar
const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Get avatar background color based on name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Group contacts by first letter
const groupedContacts = computed(() => {
  const grouped: Record<string, Contact[]> = {};
  filteredContacts.value.forEach(contact => {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!grouped[letter]) {
      grouped[letter] = [];
    }
    grouped[letter].push(contact);
  });
  return Object.keys(grouped).sort().reduce((acc, key) => {
    acc[key] = grouped[key];
    return acc;
  }, {} as Record<string, Contact[]>);
});

// Debounced search handler
const handleSearchInput = () => {
  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Set new timeout - wait 500ms after user stops typing
  searchTimeout = setTimeout(() => {
    searchQuery.value = search.value;
    page.value = 1;
    fetchContacts();
  }, 500);
};

// Handle type filter change (immediate)
const handleTypeFilterChange = () => {
  page.value = 1;
  fetchContacts();
};

// Watch for search query changes to update filtered contacts
watch(search, () => {
  handleSearchInput();
});

onMounted(() => {
  fetchContacts();
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Compact Header -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contacts</h1>
          <p class="text-sm text-gray-500 mt-1">{{ total || stats.all }} total contacts</p>
        </div>
        
        <!-- Quick Stats Pills -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span class="text-xs font-medium text-blue-700">{{ stats.customers }} Customers</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
            <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span class="text-xs font-medium text-purple-700">{{ stats.employees }} Employees</span>
          </div>
        </div>
      </div>

      <!-- Search and Filter Bar -->
      <div class="mb-6 flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Search contacts..."
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pl-10 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
        <select
          v-model="typeFilter"
          @change="handleTypeFilterChange"
          class="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="customers">Customers</option>
          <option value="employees">Employees</option>
        </select>
      </div>

      <!-- Contacts List -->
      <div v-if="filteredContacts.length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg border border-gray-200">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <i class="fa-light fa-address-book text-3xl text-gray-400"></i>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">No contacts found</h3>
        <p class="text-sm text-gray-500">Try adjusting your search or filters.</p>
      </div>

      <!-- List View Contacts -->
      <div v-else class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        <div v-for="(group, letter) in groupedContacts" :key="letter">
          <!-- Letter Divider -->
          <div class="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h2 class="text-xs font-bold text-gray-600 uppercase tracking-wider">{{ letter }}</h2>
          </div>
          
          <!-- Contact Items -->
          <div
            v-for="contact in group"
            :key="`${contact.type}-${contact.id}`"
            class="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0', getAvatarColor(contact.name)]">
                {{ getInitials(contact.name) }}
              </div>
              
              <!-- Contact Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {{ contact.name }}
                  </h3>
                  <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', getTypeColor(contact.type)]">
                    {{ contact.type }}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-500">
                  <div v-if="contact.phone" class="flex items-center gap-1.5">
                    <i class="fa-light fa-phone text-gray-400"></i>
                    <span class="truncate">{{ contact.phone }}</span>
                  </div>
                  <div v-if="contact.email" class="flex items-center gap-1.5 min-w-0">
                    <i class="fa-light fa-envelope text-gray-400"></i>
                    <span class="truncate">{{ contact.email }}</span>
                  </div>
                  <div v-if="contact.area" class="flex items-center gap-1.5">
                    <i class="fa-light fa-location-dot text-gray-400"></i>
                    <span class="truncate">{{ contact.area }}</span>
                  </div>
                </div>
                <div v-if="contact.designation" class="text-xs text-gray-400 mt-0.5">
                  {{ contact.designation }}
                </div>
              </div>
              
              <!-- Status Badge -->
              <div class="flex-shrink-0">
                <span :class="['inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(contact.status)]">
                  <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', contact.status === 'active' ? 'bg-green-500' : 'bg-gray-400']"></span>
                  {{ contact.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-xs text-gray-500">
          Page <span class="font-semibold text-gray-700">{{ page }}</span> of <span class="font-semibold text-gray-700">{{ lastPage }}</span>
          <span class="mx-1.5">•</span>
          <span class="font-semibold text-gray-700">{{ total }}</span> contacts
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="page = Math.max(1, page - 1); fetchContacts();"
            :disabled="page <= 1"
            class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <i class="fa-light fa-chevron-left text-xs"></i>
            Prev
          </button>
          <button
            @click="page = Math.min(lastPage, page + 1); fetchContacts();"
            :disabled="page >= lastPage"
            class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            Next
            <i class="fa-light fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
    </template>
  </MasterLayout>
</template>

