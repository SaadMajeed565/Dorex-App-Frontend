<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import ViewComplaint from './ViewComplaint.vue';
import EditComplaint from './EditComplaint.vue';
import ResolveComplaint from './ResolveComplaint.vue';
import AddComplaint from './AddComplaint.vue';
import ComplaintsAnalytics from './ComplaintsAnalytics.vue';

const route = useRoute();
const router = useRouter();

// Interface for Complaint
interface Complaint {
  id: number | string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerArea: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
  resolution: string | null;
  area: string;
}

// Reactive data
const complaints = ref<Complaint[]>([]);
const loading = ref<boolean>(true);

// Modal states
const showViewModal = ref(false);
const showEditModal = ref(false);
const showResolveModal = ref(false);
const showAddModal = ref(false);
const showAnalyticsModal = ref(false);
const selectedComplaint = ref<Complaint | null>(null);

const search = ref('');
const statusFilter = ref('All');
const priorityFilter = ref('All');
const categoryFilter = ref('All');
const assignedFilter = ref('All');

const statuses = computed(() => {
  const uniqueStatuses = [...new Set(complaints.value.map(c => c.status))].filter(Boolean);
  return ['All', ...uniqueStatuses.sort()];
});

const priorities = computed(() => {
  const uniquePriorities = [...new Set(complaints.value.map(c => c.priority))].filter(Boolean);
  return ['All', ...uniquePriorities.sort()];
});

const categories = computed(() => {
  const uniqueCategories = [...new Set(complaints.value.map(c => c.category))].filter(Boolean);
  return ['All', ...uniqueCategories.sort()];
});

const assignees = computed(() => {
  const uniqueAssignees = [...new Set(complaints.value.map(c => c.assignedTo))].filter(a => Boolean(a) && a !== 'Unassigned');
  return ['All', ...uniqueAssignees.sort()];
});

// Computed properties
const filteredComplaints = computed(() => {
  return complaints.value.filter(complaint => {
    const matchesSearch = !search.value || 
      complaint.customerName.toLowerCase().includes(search.value.toLowerCase()) ||
      complaint.subject.toLowerCase().includes(search.value.toLowerCase()) ||
      complaint.ticketNumber.toLowerCase().includes(search.value.toLowerCase());
    
    const matchesStatus = statusFilter.value === 'All' || complaint.status === statusFilter.value;
    const matchesPriority = priorityFilter.value === 'All' || complaint.priority === priorityFilter.value;
    const matchesCategory = categoryFilter.value === 'All' || complaint.category === categoryFilter.value;
    const matchesAssigned = assignedFilter.value === 'All' || complaint.assignedTo === assignedFilter.value;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned;
  });
});

const stats = computed(() => {
  const total = complaints.value.length;
  const open = complaints.value.filter(c => c.status === 'Open').length;
  const inProgress = complaints.value.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.value.filter(c => c.status === 'Resolved').length;
  
  return { total, open, inProgress, resolved };
});

const getPriorityColor = (priority: string) => {
  const colors = {
    'Low': 'bg-gray-100 text-gray-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800'
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusColor = (status: string) => {
  const colors = {
    'Open': 'bg-red-100 text-red-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// Normalize status from API
const normalizeStatus = (status?: string): string => {
  if (!status) return 'Open';
  const s = status.toLowerCase();
  if (s === 'open' || s === 'new' || s === 'pending') return 'Open';
  if (s === 'in progress' || s === 'in_progress' || s === 'processing' || s === 'assigned') return 'In Progress';
  if (s === 'resolved' || s === 'closed' || s === 'completed') return 'Resolved';
  if (s === 'closed' || s === 'cancelled') return 'Closed';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Normalize priority from API
const normalizePriority = (priority?: string): string => {
  if (!priority) return 'Medium';
  const p = priority.toLowerCase();
  if (p === 'low' || p === 'minor') return 'Low';
  if (p === 'medium' || p === 'normal') return 'Medium';
  if (p === 'high' || p === 'urgent') return 'High';
  if (p === 'critical' || p === 'emergency') return 'Critical';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

// Fetch complaints from API
const fetchComplaints = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/complaints');
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.complaints)) raw = res.data.complaints;
    else raw = [];

    complaints.value = (raw as any[]).map((item) => {
      // Extract customer information (handle nested customer object)
      const customerName = item?.customer_name ?? item?.customerName ?? item?.customer?.name ?? item?.customer?.user?.name ?? (typeof item?.customer === 'string' ? item?.customer : '—');
      const customerEmail = item?.customer_email ?? item?.customerEmail ?? item?.customer?.email ?? item?.customer?.user?.email ?? '';
      const customerPhone = item?.customer_phone ?? item?.customerPhone ?? item?.customer?.phone ?? item?.customer?.user?.phone ?? '';
      const customerArea = item?.customer_area ?? item?.customerArea ?? item?.customer?.area ?? item?.customer?.user?.area ?? '';
      
      // Extract ticket/subject information
      const ticketNumber = item?.ticket_number ?? item?.ticketNumber ?? item?.ticket ?? item?.id ?? `TKT-${item?.id ?? 'N/A'}`;
      const subject = item?.subject ?? item?.title ?? item?.topic ?? 'No Subject';
      const description = item?.description ?? item?.details ?? item?.message ?? item?.body ?? '';
      
      // Extract status, priority, category
      const status = normalizeStatus(item?.status);
      const priority = normalizePriority(item?.priority);
      const category = item?.category ?? item?.type ?? 'Technical';
      
      // Extract assignment info
      const assignedTo = item?.assigned_to ?? item?.assignedTo ?? item?.assigned_employee?.name ?? item?.assigned_employee?.user?.name ?? item?.employee?.name ?? item?.assignee ?? 'Unassigned';
      const area = item?.area ?? item?.customer?.area ?? item?.location ?? '';
      
      // Extract dates
      const createdAt = item?.created_at ?? item?.createdAt ?? item?.date ?? new Date().toISOString().split('T')[0];
      const lastUpdated = item?.updated_at ?? item?.updatedAt ?? item?.last_updated ?? item?.lastUpdated ?? createdAt;
      const resolution = item?.resolution ?? item?.resolution_notes ?? item?.notes ?? null;

      return {
        id: item?.id ?? Math.random().toString(36).slice(2),
        customerName: String(customerName),
        customerEmail: String(customerEmail),
        customerPhone: String(customerPhone),
        customerArea: String(customerArea),
        ticketNumber: String(ticketNumber),
        subject: String(subject),
        description: String(description),
        priority,
        status,
        category,
        assignedTo: String(assignedTo),
        createdAt: String(createdAt),
        lastUpdated: String(lastUpdated),
        resolution,
        area: String(area),
      } as Complaint;
    });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    complaints.value = [];
  } finally {
    loading.value = false;
  }
};

// Function to handle query parameter
const handleShowQuery = () => {
  if (route.query.show) {
    // Handle both string and array cases
    const showValue = Array.isArray(route.query.show) ? route.query.show[0] : route.query.show;
    const id = Number(showValue);
    if (!isNaN(id) && id > 0) {
      // Find the complaint in the list
      const complaint = complaints.value.find(c => Number(c.id) === id);
      if (complaint) {
        selectedComplaint.value = complaint;
        showViewModal.value = true;
      } else {
        // If complaint not in list, fetch it directly
        fetchComplaintById(id);
      }
      // Clean up query param
      const newQuery = { ...route.query };
      delete newQuery.show;
      router.replace({ query: newQuery });
    }
  }
};

// Fetch a single complaint by ID
const fetchComplaintById = async (id: number) => {
  try {
    const res = await axiosClient.get(`/complaints/${id}`);
    if (res.data?.complaint) {
      const complaintData = res.data.complaint;
      // Map the API response to our Complaint interface
      const complaint: Complaint = {
        id: complaintData.id,
        customerName: complaintData.customer?.name || complaintData.customer?.user?.name || '—',
        customerEmail: complaintData.customer?.email || complaintData.customer?.user?.email || '',
        customerPhone: complaintData.customer?.phone || complaintData.customer?.user?.phone || '',
        customerArea: complaintData.customer?.area || complaintData.customer?.user?.area || '',
        ticketNumber: `TKT-${complaintData.id}`,
        subject: complaintData.subject || 'No Subject',
        description: complaintData.description || '',
        priority: normalizePriority(complaintData.priority),
        status: normalizeStatus(complaintData.status),
        category: complaintData.category || 'Technical',
        assignedTo: complaintData.assigned_employee?.name || complaintData.assigned_employee?.user?.name || 'Unassigned',
        createdAt: complaintData.created_at || '',
        lastUpdated: complaintData.updated_at || '',
        resolution: complaintData.resolution || null,
        area: complaintData.customer?.area || complaintData.customer?.user?.area || '',
      };
      selectedComplaint.value = complaint;
      showViewModal.value = true;
    }
  } catch (error) {
    console.error('Error fetching complaint:', error);
  }
};

// Watch for query parameter changes
watch(() => route.query.show, (showValue) => {
  if (showValue) {
    handleShowQuery();
  }
});

// Modal handlers
const openViewModal = (complaint: Complaint) => {
  selectedComplaint.value = complaint;
  showViewModal.value = true;
};

// Watch for modal close to clean up query
watch(showViewModal, (isVisible) => {
  if (!isVisible && route.query.show) {
    // Clean up query param when modal closes
    const newQuery = { ...route.query };
    delete newQuery.show;
    router.replace({ query: newQuery });
  }
});

const openEditModal = (complaint: Complaint) => {
  selectedComplaint.value = complaint;
  showEditModal.value = true;
};

const openResolveModal = (complaint: Complaint) => {
  selectedComplaint.value = complaint;
  showResolveModal.value = true;
};

const handleComplaintUpdated = () => {
  fetchComplaints();
};

const handleComplaintResolved = () => {
  fetchComplaints();
};

const handleComplaintCreated = () => {
  fetchComplaints();
};

onMounted(() => {
  fetchComplaints();
  handleShowQuery();
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Customer Complaints</h1>
        <p class="text-sm text-gray-500">Track and manage customer support tickets</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="showAddModal = true" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          <i class="fa-light fa-plus"></i>
          New Ticket
        </button>
        <button @click="fetchComplaints" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-arrow-rotate-right"></i>
          Refresh
        </button>
        <button @click="showAnalyticsModal = true" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-chart-line"></i>
          Analytics
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Tickets</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-ticket text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Open</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.open }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <i class="fa-light fa-exclamation-circle text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">In Progress</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.inProgress }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <i class="fa-light fa-clock text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Resolved</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.resolved }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <i class="fa-light fa-check-circle text-lg"></i>
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
              placeholder="Search complaints..." 
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select 
            v-model="statusFilter" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
          <select 
            v-model="priorityFilter" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="priority in priorities" :key="priority" :value="priority">{{ priority }}</option>
          </select>
          <select 
            v-model="categoryFilter" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
          </select>
          <select 
            v-model="assignedFilter" 
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="assignee in assignees" :key="assignee" :value="assignee">{{ assignee }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Complaints Table -->
    <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div v-if="!complaints.length" class="flex items-center justify-center p-10 text-center">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">No complaints yet</h3>
          <p class="mt-1 text-sm text-gray-500">All clear! No customer complaints at the moment.</p>
        </div>
      </div>
      <template v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="complaint in filteredComplaints" :key="complaint.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ complaint.ticketNumber }}</div>
                <div class="text-sm text-gray-500">{{ complaint.createdAt }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ complaint.customerName }}</div>
                  <div class="text-sm text-gray-500">{{ complaint.customerPhone || '—' }}</div>
                  <div class="text-sm text-gray-500">{{ complaint.customerArea || '—' }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ complaint.subject }}</div>
                  <div class="text-sm text-gray-500">{{ complaint.description ? (complaint.description.length > 50 ? complaint.description.substring(0, 50) + '...' : complaint.description) : '—' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`">
                  {{ complaint.priority }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`">
                  {{ complaint.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ complaint.assignedTo }}</div>
                  <div class="text-sm text-gray-500">{{ complaint.area || '—' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <button @click="openViewModal(complaint)" class="text-indigo-600 hover:text-indigo-900 transition-colors">View</button>
                    <button @click="openEditModal(complaint)" class="text-gray-600 hover:text-gray-900 transition-colors">Edit</button>
                    <button v-if="complaint.status !== 'Resolved' && complaint.status !== 'Closed'" @click="openResolveModal(complaint)" class="text-green-600 hover:text-green-900 transition-colors">Resolve</button>
                  </div>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
      </template>
    </div>
    </template>

    <!-- Modals -->
    <AddComplaint
      v-model:visible="showAddModal"
      @created="handleComplaintCreated"
    />
    <ViewComplaint
      v-model:visible="showViewModal"
      :complaint="selectedComplaint"
    />
    <EditComplaint
      v-model:visible="showEditModal"
      :complaint="selectedComplaint"
      @updated="handleComplaintUpdated"
    />
    <ResolveComplaint
      v-model:visible="showResolveModal"
      :complaint="selectedComplaint"
      @resolved="handleComplaintResolved"
    />
    <ComplaintsAnalytics
      v-model:visible="showAnalyticsModal"
    />
  </MasterLayout>
</template>

