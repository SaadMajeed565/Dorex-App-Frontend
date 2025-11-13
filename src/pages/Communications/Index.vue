<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import AddCommunication from './AddCommunication.vue';
import ViewCommunication from './ViewCommunication.vue';

const toast = useToast();
const confirm = useConfirm();

// UI State
const showAddCommunication = ref(false);
const showViewCommunication = ref(false);
const editingCommunication = ref<any>(null);
const viewingCommunicationId = ref<number | null>(null);

// Reactive data
const communications = ref<any[]>([]);
const loading = ref(true);
const search = ref('');
const typeFilter = ref('All');
const statusFilter = ref('All');
const recipientFilter = ref('All');

// Filter options (computed from data)
const types = computed(() => {
  const uniqueTypes = Array.from(new Set(communications.value.map(c => c.type).filter(Boolean)));
  return ['All', ...uniqueTypes];
});

const statuses = computed(() => {
  const uniqueStatuses = Array.from(new Set(communications.value.map(c => c.status).filter(Boolean)));
  return ['All', ...uniqueStatuses];
});

const recipients = computed(() => {
  const uniqueRecipients = Array.from(new Set(communications.value.map(c => c.recipient).filter(Boolean)));
  return ['All', ...uniqueRecipients];
});

// Fetch communications from API
const fetchCommunications = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/communications');
    let raw: any[] = [];
    
    if (res.data?.status && Array.isArray(res.data.communications)) {
      raw = res.data.communications;
    } else if (Array.isArray(res.data?.data)) {
      raw = res.data.data;
    } else if (Array.isArray(res.data)) {
      raw = res.data;
    } else {
      raw = [];
    }
    
    communications.value = raw;
  } catch (err: any) {
    console.error('Error fetching communications:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Failed to load communications data.',
      life: 4000
    });
    communications.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCommunications);

// Computed properties
const filteredCommunications = computed(() => {
  return communications.value.filter(comm => {
    const matchesSearch = !search.value || 
      comm.subject?.toLowerCase().includes(search.value.toLowerCase()) ||
      comm.recipient?.toLowerCase().includes(search.value.toLowerCase());
    
    const matchesType = typeFilter.value === 'All' || comm.type === typeFilter.value;
    const matchesStatus = statusFilter.value === 'All' || comm.status === statusFilter.value;
    const matchesRecipient = recipientFilter.value === 'All' || comm.recipient === recipientFilter.value;
    
    return matchesSearch && matchesType && matchesStatus && matchesRecipient;
  });
});

const stats = computed(() => {
  const total = communications.value.length;
  const sent = communications.value.filter(c => c.status === 'Sent').length;
  const scheduled = communications.value.filter(c => c.status === 'Scheduled').length;
  const draft = communications.value.filter(c => c.status === 'Draft').length;
  
  const communicationsWithOpenRate = communications.value.filter(c => c.openRate !== null);
  const avgOpenRate = communicationsWithOpenRate.length > 0
    ? communicationsWithOpenRate.reduce((sum, c) => sum + (c.openRate || 0), 0) / communicationsWithOpenRate.length
    : 0;
  
  return { total, sent, scheduled, draft, avgOpenRate: avgOpenRate.toFixed(1) };
});

const getStatusColor = (status: string) => {
  const colors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Scheduled': 'bg-blue-100 text-blue-800',
    'Sent': 'bg-green-100 text-green-800',
    'Failed': 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getTypeColor = (type: string) => {
  const colors = {
    'Email': 'bg-blue-100 text-blue-800',
    'WhatsApp': 'bg-green-100 text-green-800',
    'SMS': 'bg-green-100 text-green-800',
    'Push Notification': 'bg-purple-100 text-purple-800',
    'Phone Call': 'bg-orange-100 text-orange-800'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getTypeIcon = (type: string) => {
  const icons = {
    'Email': 'fa-envelope',
    'WhatsApp': 'fa-whatsapp',
    'SMS': 'fa-message',
    'Push Notification': 'fa-bell',
    'Phone Call': 'fa-phone'
  };
  return icons[type as keyof typeof icons] || 'fa-envelope';
};

const handleRefresh = () => {
  fetchCommunications();
};

// View communication details
const viewCommunication = (comm: any) => {
  viewingCommunicationId.value = comm.id;
  showViewCommunication.value = true;
};

// Edit communication
const editCommunication = (comm: any) => {
  editingCommunication.value = comm;
  showAddCommunication.value = true;
};

// Send communication
const sendCommunication = async (comm: any) => {
  confirm.require({
    message: `Are you sure you want to send this communication "${comm.subject}"?`,
    header: 'Confirm Send',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await axiosClient.post(`/communications/${comm.id}/send`);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Communication sent successfully!',
          life: 3000,
        });
        fetchCommunications();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to send communication.',
          life: 4000,
        });
      }
    },
  });
};

// Delete communication
const deleteCommunication = async (comm: any) => {
  confirm.require({
    message: `Are you sure you want to delete this communication "${comm.subject}"? This action cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await axiosClient.delete(`/communications/${comm.id}`);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Communication deleted successfully!',
          life: 3000,
        });
        fetchCommunications();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to delete communication.',
          life: 4000,
        });
      }
    },
  });
};
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Communications</h1>
          <p class="text-sm text-gray-500">Manage customer communications and messaging campaigns</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="showAddCommunication = true" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            <i class="fa-light fa-plus"></i>
            New Campaign
          </button>
          <button @click="handleRefresh" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
          <button @click="() => {}" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fa-light fa-chart-line"></i>
            Analytics
          </button>
        </div>
      </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Campaigns</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-bullhorn text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Sent</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.sent }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <i class="fa-light fa-paper-plane text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Scheduled</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.scheduled }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <i class="fa-light fa-clock text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Drafts</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.draft }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
            <i class="fa-light fa-edit text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Avg Open Rate</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.avgOpenRate }}%</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <i class="fa-light fa-chart-bar text-lg"></i>
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
              placeholder="Search communications..." 
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
            v-model="recipientFilter" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="recipient in recipients" :key="recipient" :value="recipient">{{ recipient }}</option>
          </select>
        </div>
      </div>
    </div>

      <!-- Communications Table -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div v-if="!filteredCommunications.length" class="flex items-center justify-center p-10 text-center">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">No communications found</h3>
            <p class="mt-1 text-sm text-gray-500" v-if="communications.length === 0">Get started by creating your first communication campaign.</p>
            <p class="mt-1 text-sm text-gray-500" v-else>Try adjusting your search or filter criteria.</p>
          </div>
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="comm in filteredCommunications" :key="comm.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-start">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">{{ comm.subject || 'N/A' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <i :class="`fa-light ${getTypeIcon(comm.type)} text-sm`"></i>
                      <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(comm.type)}`">
                        {{ comm.type || 'N/A' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ comm.recipient || 'N/A' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(comm.status)}`">
                      {{ comm.status || 'Unknown' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div v-if="comm.openRate !== null && comm.openRate !== undefined" class="text-sm">
                      <div class="text-gray-900">Open: {{ comm.openRate }}%</div>
                      <div class="text-gray-500">Click: {{ comm.clickRate || 0 }}%</div>
                    </div>
                    <div v-else class="text-sm text-gray-500">-</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {{ comm.sentDate || comm.scheduledDate || 'Not scheduled' }}
                    </div>
                    <div v-if="comm.status === 'Sent'" class="text-xs text-gray-500">Sent</div>
                    <div v-else-if="comm.status === 'Scheduled'" class="text-xs text-gray-500">Scheduled</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <button @click="viewCommunication(comm)" class="text-indigo-600 hover:text-indigo-900">View</button>
                      <button v-if="comm.status !== 'Sent'" @click="editCommunication(comm)" class="text-gray-600 hover:text-gray-900">Edit</button>
                      <button v-if="comm.status === 'Draft' || comm.status === 'Scheduled'" @click="sendCommunication(comm)" class="text-green-600 hover:text-green-900">Send</button>
                      <button v-if="comm.status !== 'Sent'" @click="deleteCommunication(comm)" class="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>
    <AddCommunication 
      v-model:visible="showAddCommunication" 
      :communication="editingCommunication"
      @created="handleRefresh"
      @updated="() => { editingCommunication = null; handleRefresh(); }"
      @closed="() => { editingCommunication = null; }"
    />
    <ViewCommunication 
      v-model:visible="showViewCommunication"
      :communication-id="viewingCommunicationId"
      @closed="() => { viewingCommunicationId = null; }"
    />
  </MasterLayout>
</template>

