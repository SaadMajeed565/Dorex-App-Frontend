<script setup lang="ts">
import Dialog from '../../volt/Dialog.vue';
import { computed, ref, watch, nextTick } from 'vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps<{
  visible: boolean;
  complaint: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const loading = ref(false);
const complaintDetails = ref<any>(null);
const customerDetails = ref<any>(null);
const complaintStats = ref<any>(null);
const activeTab = ref<'details' | 'other-complaints'>('details');

// Other complaints pagination
const otherComplaints = ref<any[]>([]);
const loadingOtherComplaints = ref(false);
const otherComplaintsPage = ref(1);
const otherComplaintsPerPage = ref(10);
const otherComplaintsTotal = ref(0);
const otherComplaintsLastPage = ref(1);

// Expanded complaint details
const expandedComplaintId = ref<number | null>(null);
const expandedComplaintDetails = ref<Record<number, any>>({});
const loadingExpandedComplaint = ref<Record<number, boolean>>({});

// Employee details popover
const showEmployeePopover = ref(false);
const employeePopoverRef = ref<HTMLElement | null>(null);
const employeeButtonRef = ref<HTMLElement | null>(null);

const fetchComplaintDetails = async () => {
  if (!props.complaint?.id) return;
  
  loading.value = true;
  try {
    const res = await axiosClient.get(`/complaints/${props.complaint.id}`);
    if (res.data?.complaint) {
      complaintDetails.value = res.data.complaint;
      complaintStats.value = res.data.customer_complaint_stats || {};
      
      // Extract customer details
      if (res.data.complaint.customer) {
        customerDetails.value = res.data.complaint.customer;
      }
    }
  } catch (error) {
    console.error('Error fetching complaint details:', error);
  } finally {
    loading.value = false;
  }
};

const fetchOtherComplaints = async (page: number = 1) => {
  if (!props.complaint?.id) return;
  
  loadingOtherComplaints.value = true;
  try {
    const res = await axiosClient.get(`/complaints/${props.complaint.id}/customer-complaints`, {
      params: {
        page,
        per_page: otherComplaintsPerPage.value
      }
    });
    
    if (res.data?.data) {
      if (page === 1) {
        otherComplaints.value = res.data.data;
      } else {
        otherComplaints.value = [...otherComplaints.value, ...res.data.data];
      }
      
      if (res.data.meta) {
        otherComplaintsTotal.value = res.data.meta.total || 0;
        otherComplaintsLastPage.value = res.data.meta.last_page || 1;
        otherComplaintsPage.value = res.data.meta.current_page || 1;
      }
    }
  } catch (error) {
    console.error('Error fetching other complaints:', error);
  } finally {
    loadingOtherComplaints.value = false;
  }
};

watch(() => props.visible, (newVal) => {
  if (newVal && props.complaint?.id) {
    activeTab.value = 'details';
    fetchComplaintDetails();
    // Reset other complaints
    otherComplaints.value = [];
    otherComplaintsPage.value = 1;
  }
});

watch(() => props.complaint, (newComplaint) => {
  if (props.visible && newComplaint?.id) {
    activeTab.value = 'details';
    fetchComplaintDetails();
    // Reset other complaints
    otherComplaints.value = [];
    otherComplaintsPage.value = 1;
  }
}, { deep: true });

watch(() => activeTab.value, (newTab) => {
  if (newTab === 'other-complaints' && otherComplaints.value.length === 0) {
    fetchOtherComplaints(1);
  }
});

const loadMoreComplaints = () => {
  if (otherComplaintsPage.value < otherComplaintsLastPage.value && !loadingOtherComplaints.value) {
    fetchOtherComplaints(otherComplaintsPage.value + 1);
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return dateStr;
  }
};

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
};

const getStatusConfig = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'open':
      return { 
        color: 'bg-rose-50 text-rose-700 ring-rose-600/20 border-rose-200',
        dot: 'bg-rose-500',
        icon: 'fa-circle-exclamation'
      };
    case 'in_progress':
    case 'in progress':
      return { 
        color: 'bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200',
        dot: 'bg-amber-500',
        icon: 'fa-clock'
      };
    case 'resolved':
      return { 
        color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: 'fa-circle-check'
      };
    case 'closed':
      return { 
        color: 'bg-gray-50 text-gray-700 ring-gray-600/20 border-gray-200',
        dot: 'bg-gray-500',
        icon: 'fa-circle-xmark'
      };
    default:
      return { 
        color: 'bg-gray-50 text-gray-700 ring-gray-600/20 border-gray-200',
        dot: 'bg-gray-500',
        icon: 'fa-circle'
      };
  }
};

const getPriorityConfig = (priority: string) => {
  const priorityLower = priority?.toLowerCase() || '';
  switch (priorityLower) {
    case 'low':
      return { 
        color: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        dot: 'bg-blue-500',
        label: 'Low'
      };
    case 'medium':
      return { 
        color: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        dot: 'bg-amber-500',
        label: 'Medium'
      };
    case 'high':
      return { 
        color: 'bg-orange-50 text-orange-700 ring-orange-600/20',
        dot: 'bg-orange-500',
        label: 'High'
      };
    case 'critical':
      return { 
        color: 'bg-rose-50 text-rose-700 ring-rose-600/20',
        dot: 'bg-rose-500',
        label: 'Critical'
      };
    default:
      return { 
        color: 'bg-gray-50 text-gray-700 ring-gray-600/20',
        dot: 'bg-gray-500',
        label: priority
      };
  }
};

const currentComplaint = computed(() => complaintDetails.value || props.complaint);
const statusConfig = computed(() => currentComplaint.value ? getStatusConfig(currentComplaint.value.status) : null);
const priorityConfig = computed(() => currentComplaint.value ? getPriorityConfig(currentComplaint.value.priority) : null);

// Calculate status progress (0-100%)
const statusProgress = computed(() => {
  if (!currentComplaint.value?.status) return 0;
  const status = currentComplaint.value.status.toLowerCase();
  switch (status) {
    case 'open':
      return 25;
    case 'in_progress':
    case 'in progress':
      return 50;
    case 'resolved':
      return 75;
    case 'closed':
      return 100;
    default:
      return 0;
  }
});

// Get progress bar color based on status
const progressBarColor = computed(() => {
  if (!currentComplaint.value?.status) return 'bg-gray-300';
  const status = currentComplaint.value.status.toLowerCase();
  switch (status) {
    case 'open':
      return 'bg-rose-500';
    case 'in_progress':
    case 'in progress':
      return 'bg-amber-500';
    case 'resolved':
      return 'bg-emerald-500';
    case 'closed':
      return 'bg-gray-500';
    default:
      return 'bg-gray-300';
  }
});

// Extract customer info from various possible structures
const customerName = computed(() => {
  if (customerDetails.value?.name) return customerDetails.value.name;
  if (currentComplaint.value?.customer?.name) return currentComplaint.value.customer.name;
  if (currentComplaint.value?.customerName) return currentComplaint.value.customerName;
  return '—';
});

const customerEmail = computed(() => {
  if (customerDetails.value?.email) return customerDetails.value.email;
  if (currentComplaint.value?.customer?.email) return currentComplaint.value.customer.email;
  if (currentComplaint.value?.customerEmail) return currentComplaint.value.customerEmail;
  return null;
});

const customerPhone = computed(() => {
  if (customerDetails.value?.phone) return customerDetails.value.phone;
  if (currentComplaint.value?.customer?.phone) return currentComplaint.value.customer.phone;
  if (currentComplaint.value?.customerPhone) return currentComplaint.value.customerPhone;
  return null;
});

const customerArea = computed(() => {
  if (customerDetails.value?.area) return customerDetails.value.area;
  if (currentComplaint.value?.customer?.area) return currentComplaint.value.customer.area;
  if (currentComplaint.value?.customerArea) return currentComplaint.value.customerArea;
  return null;
});

const toggleComplaintDetails = async (complaintId: number) => {
  // If already expanded, collapse it
  if (expandedComplaintId.value === complaintId) {
    expandedComplaintId.value = null;
    return;
  }

  // Expand the clicked complaint
  expandedComplaintId.value = complaintId;

  // If details already loaded, don't fetch again
  if (expandedComplaintDetails.value[complaintId]) {
    return;
  }

  // Fetch complaint details
  loadingExpandedComplaint.value[complaintId] = true;
  try {
    const res = await axiosClient.get(`/complaints/${complaintId}`);
    if (res.data?.complaint) {
      expandedComplaintDetails.value[complaintId] = res.data.complaint;
    }
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load complaint details', life: 3000 });
  } finally {
    loadingExpandedComplaint.value[complaintId] = false;
  }
};

// Get expanded complaint data
const getExpandedComplaint = (complaintId: number) => {
  return expandedComplaintDetails.value[complaintId] || null;
};

// Check if complaint is expanded
const isComplaintExpanded = (complaintId: number) => {
  return expandedComplaintId.value === complaintId;
};

// Employee details helpers
const assignedEmployee = computed(() => {
  return currentComplaint.value?.assigned_employee || null;
});

const showEmployeeDetails = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  const employee = assignedEmployee.value;
  if (!employee || !employee.name) {
    return;
  }
  
  showEmployeePopover.value = true;
  
  // Position popover after it's shown
  nextTick(() => {
    if (employeeButtonRef.value && employeePopoverRef.value) {
      const rect = employeeButtonRef.value.getBoundingClientRect();
      employeePopoverRef.value.style.top = `${rect.bottom + 8}px`;
      employeePopoverRef.value.style.left = `${rect.left}px`;
    }
  });
};

const hideEmployeePopover = () => {
  showEmployeePopover.value = false;
};


</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    :header="currentComplaint ? `Ticket #${currentComplaint.ticketNumber || currentComplaint.id}` : 'Complaint Details'"
    :closable="true"
    :breakpoints="{ '960px': '95vw', '640px': '98vw' }"
    :style="{ width: '1200px', maxWidth: '98vw', maxHeight: '90vh' }"
  >
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600"></div>
      <p class="text-sm text-gray-500 mt-4">Loading complaint details...</p>
    </div>
    <div v-else-if="currentComplaint" class="py-2">
      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button
            @click="activeTab = 'details'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fa-light fa-info-circle mr-2"></i>
            Details
          </button>
          <button
            @click="activeTab = 'other-complaints'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'other-complaints'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fa-light fa-list mr-2"></i>
            Other Complaints
            <span v-if="complaintStats?.total" class="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {{ complaintStats.total - 1 }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="max-h-[calc(90vh-200px)] overflow-y-auto">
        <!-- Details Tab -->
        <div v-show="activeTab === 'details'" class="space-y-6">
          <!-- Header Section with Status -->
          <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <!-- Status Banner with Progress Bar -->
            <div v-if="statusConfig" class="relative">
              <!-- Progress Bar Background -->
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                <div 
                  :class="`h-full transition-all duration-500 ${progressBarColor}`"
                  :style="{ width: `${statusProgress}%` }"
                ></div>
              </div>
              
              <div :class="`px-6 py-4 border-b relative ${statusConfig.color}`">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div :class="`h-10 w-10 rounded-full flex items-center justify-center ${statusConfig.color}`">
                      <i :class="`fa-light ${statusConfig.icon} text-lg`"></i>
                    </div>
            <div>
                      <h2 class="text-xl font-bold text-gray-900">{{ currentComplaint.subject }}</h2>
                      <p class="text-sm text-gray-600 mt-0.5">Ticket #{{ currentComplaint.ticketNumber || currentComplaint.id }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span 
                      v-if="priorityConfig"
                      :class="`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${priorityConfig.color}`"
                    >
                      <span :class="`inline-block h-2 w-2 rounded-full ${priorityConfig.dot}`"></span>
                      {{ priorityConfig.label }} Priority
                    </span>
                    <span 
                      v-if="statusConfig"
                      :class="`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${statusConfig.color}`"
                    >
                      <span :class="`inline-block h-2 w-2 rounded-full ${statusConfig.dot}`"></span>
                      {{ currentComplaint.status?.charAt(0).toUpperCase() + currentComplaint.status?.slice(1).replace('_', ' ') }}
                    </span>
              </div>
            </div>
            </div>
          </div>

            <!-- Quick Info Grid -->
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <i class="fa-light fa-calendar text-xs"></i>
                    <span>Created</span>
                  </div>
                  <p class="text-sm font-semibold text-gray-900">{{ formatDate(currentComplaint.created_at || currentComplaint.createdAt) }}</p>
            </div>
            <div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <i class="fa-light fa-clock-rotate-left text-xs"></i>
                    <span>Last Updated</span>
                  </div>
                  <p class="text-sm font-semibold text-gray-900">{{ formatDate(currentComplaint.updated_at || currentComplaint.updatedAt || currentComplaint.lastUpdated) }}</p>
            </div>
            <div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <i class="fa-light fa-tag text-xs"></i>
                    <span>Category</span>
                  </div>
                  <p class="text-sm font-semibold text-gray-900">{{ currentComplaint.category || '—' }}</p>
            </div>
            <div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <i class="fa-light fa-user-tie text-xs"></i>
                    <span>Assigned To</span>
                  </div>
                  <div v-if="assignedEmployee || (currentComplaint.assignedTo && currentComplaint.assignedTo !== 'Unassigned')">
                    <button 
                      ref="employeeButtonRef"
                      @click="showEmployeeDetails"
                      type="button"
                      class="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1.5 group"
                    >
                      {{ assignedEmployee?.name || currentComplaint.assignedTo }}
                      <i v-if="assignedEmployee" class="fa-light fa-info-circle text-xs text-gray-400 group-hover:text-indigo-600"></i>
                    </button>
                  </div>
                  <p v-else class="text-sm text-gray-500 italic">Unassigned</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column - Main Details -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Description -->
              <div class="rounded-xl border border-gray-200 bg-white p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <i class="fa-light fa-file-lines text-indigo-600"></i>
                  </div>
                  <h3 class="text-base font-semibold text-gray-900">Description</h3>
                </div>
                <div class="prose prose-sm max-w-none">
                  <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ currentComplaint.description || 'No description provided.' }}</p>
                </div>
              </div>

              <!-- Resolution -->
              <div v-if="currentComplaint.resolution || currentComplaint.status?.toLowerCase() === 'resolved' || currentComplaint.status?.toLowerCase() === 'closed'" 
                   class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <i class="fa-light fa-circle-check text-emerald-600"></i>
                  </div>
                  <h3 class="text-base font-semibold text-gray-900">Resolution</h3>
                </div>
                <div class="prose prose-sm max-w-none">
                  <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ currentComplaint.resolution || 'No resolution notes provided.' }}</p>
                </div>
            </div>
            </div>

            <!-- Right Column - Sidebar -->
            <div class="space-y-6">
              <!-- Customer Information with Statistics -->
              <div class="rounded-xl border border-gray-200 bg-white p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <i class="fa-light fa-user text-blue-600"></i>
                  </div>
                  <h3 class="text-base font-semibold text-gray-900">Customer</h3>
                </div>
          <div class="space-y-4">
            <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name</p>
                    <p class="text-sm font-semibold text-gray-900">{{ customerName }}</p>
                  </div>
                  <div v-if="customerEmail">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <a :href="`mailto:${customerEmail}`" class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline break-all">
                      {{ customerEmail }}
                    </a>
                  </div>
                  <div v-if="customerPhone">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                    <a :href="`tel:${customerPhone}`" class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                      {{ customerPhone }}
                    </a>
                  </div>
                  <div v-if="customerArea">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Area</p>
                    <p class="text-sm text-gray-900">{{ customerArea }}</p>
                  </div>
                  <div v-if="customerDetails?.customer?.panel_id">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Panel ID</p>
                    <p class="text-sm text-gray-900">{{ customerDetails.customer.panel_id }}</p>
                  </div>

                  <!-- Complaint Statistics -->
                  <div v-if="complaintStats" class="pt-4 border-t border-gray-200">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Complaint Statistics</p>
                    
                    <div class="space-y-3">
                      <div class="p-2 rounded bg-gray-100">
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-gray-600">Total</span>
                          <span class="text-sm font-semibold text-gray-900">{{ complaintStats.total || 0 }}</span>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">Open</span>
                          <span class="text-sm font-semibold text-rose-600">{{ complaintStats.open || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="complaintStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-rose-500 transition-all duration-500"
                            :style="{ width: `${((complaintStats.open || 0) / complaintStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">In Progress</span>
                          <span class="text-sm font-semibold text-amber-600">{{ complaintStats.in_progress || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="complaintStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-amber-500 transition-all duration-500"
                            :style="{ width: `${((complaintStats.in_progress || 0) / complaintStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">Resolved</span>
                          <span class="text-sm font-semibold text-emerald-600">{{ complaintStats.resolved || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="complaintStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500"
                            :style="{ width: `${((complaintStats.resolved || 0) / complaintStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">Closed</span>
                          <span class="text-sm font-semibold text-gray-600">{{ complaintStats.closed || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="complaintStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-gray-500 transition-all duration-500"
                            :style="{ width: `${((complaintStats.closed || 0) / complaintStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
            </div>
          </div>

            </div>
          </div>
        </div>

        <!-- Other Complaints Tab -->
        <div v-show="activeTab === 'other-complaints'" class="space-y-4">
          <div v-if="loadingOtherComplaints && otherComplaints.length === 0" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-indigo-600"></div>
            <p class="text-sm text-gray-500 mt-4">Loading complaints...</p>
          </div>
          <div v-else-if="otherComplaints.length === 0" class="flex flex-col items-center justify-center py-12">
            <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <i class="fa-light fa-inbox text-2xl text-gray-400"></i>
            </div>
            <p class="text-sm text-gray-500">No other complaints found</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="complaint in otherComplaints" 
              :key="complaint.id"
              class="rounded-lg border border-gray-200 overflow-hidden transition-all"
              :class="isComplaintExpanded(complaint.id) ? 'border-indigo-300 shadow-md' : 'hover:border-indigo-300'"
            >
              <!-- Complaint Header (Clickable) -->
              <div 
                @click="toggleComplaintDetails(complaint.id)"
                class="p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-semibold text-gray-900 truncate">{{ complaint.subject }}</h4>
                      <i 
                        :class="`fa-light transition-transform duration-200 ${isComplaintExpanded(complaint.id) ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400`"
                      ></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Ticket #{{ complaint.id }}</p>
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      <span :class="`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusConfig(complaint.status).color}`">
                        <span :class="`inline-block h-1.5 w-1.5 rounded-full ${getStatusConfig(complaint.status).dot}`"></span>
                        {{ complaint.status?.charAt(0).toUpperCase() + complaint.status?.slice(1).replace('_', ' ') }}
                      </span>
                      <span :class="`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityConfig(complaint.priority).color}`">
                        {{ getPriorityConfig(complaint.priority).label }}
                      </span>
                      <span class="text-xs text-gray-500">{{ complaint.category }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500">{{ formatShortDate(complaint.created_at || complaint.createdAt) }}</p>
                  </div>
                </div>
              </div>

              <!-- Expanded Details -->
              <div 
                v-if="isComplaintExpanded(complaint.id)"
                class="border-t border-gray-200 bg-gray-50/50"
              >
                <!-- Loading State -->
                <div v-if="loadingExpandedComplaint[complaint.id]" class="p-6 flex items-center justify-center">
                  <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600"></div>
                  <span class="ml-2 text-sm text-gray-500">Loading details...</span>
                </div>

                <!-- Details Content -->
                <div v-else-if="getExpandedComplaint(complaint.id)" class="p-4 space-y-4">
                  <!-- Meta Information -->
                  <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 pb-3 border-b border-gray-100">
                    <div class="flex items-center gap-1.5">
                      <i class="fa-light fa-calendar"></i>
                      <span>{{ formatDate(getExpandedComplaint(complaint.id).created_at) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <i class="fa-light fa-clock-rotate-left"></i>
                      <span>{{ formatDate(getExpandedComplaint(complaint.id).updated_at) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <i class="fa-light fa-tag"></i>
                      <span>{{ getExpandedComplaint(complaint.id).category || '—' }}</span>
                    </div>
                    <div v-if="getExpandedComplaint(complaint.id).assigned_employee?.name" class="flex items-center gap-1.5">
                      <i class="fa-light fa-user-tie"></i>
                      <span>{{ getExpandedComplaint(complaint.id).assigned_employee.name }}</span>
                    </div>
                    <div v-else class="flex items-center gap-1.5 text-gray-400">
                      <i class="fa-light fa-user-tie"></i>
                      <span>Unassigned</span>
            </div>
          </div>

                  <!-- Description -->
            <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Description</p>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ getExpandedComplaint(complaint.id).description || 'No description provided.' }}</p>
            </div>

      <!-- Resolution -->
                  <div v-if="getExpandedComplaint(complaint.id).resolution || getExpandedComplaint(complaint.id).status?.toLowerCase() === 'resolved' || getExpandedComplaint(complaint.id).status?.toLowerCase() === 'closed'">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Resolution</p>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ getExpandedComplaint(complaint.id).resolution || 'No resolution notes provided.' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Load More Button -->
            <div v-if="otherComplaintsPage < otherComplaintsLastPage" class="pt-4 text-center">
              <button
                @click="loadMoreComplaints"
                :disabled="loadingOtherComplaints"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="loadingOtherComplaints" class="fa-light fa-spinner fa-spin"></i>
                <i v-else class="fa-light fa-arrow-down"></i>
                {{ loadingOtherComplaints ? 'Loading...' : 'Load More' }}
              </button>
            </div>
            <div v-else-if="otherComplaints.length > 0" class="pt-4 text-center">
              <p class="text-xs text-gray-500">All complaints loaded ({{ otherComplaints.length }} of {{ otherComplaintsTotal }})</p>
            </div>
          </div>
        </div>
      </div>
          </div>
    <div v-else-if="!loading" class="flex flex-col items-center justify-center py-12">
      <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <i class="fa-light fa-file-circle-exclamation text-2xl text-gray-400"></i>
    </div>
      <p class="text-sm text-gray-500">No complaint data available</p>
    </div>
  </Dialog>
  
  <!-- Employee Details Popover - Fixed Position -->
  <Teleport to="body">
    <div 
      v-if="showEmployeePopover && assignedEmployee"
      ref="employeePopoverRef"
      @click.stop
      class="fixed z-[9999] w-64 rounded-lg border border-gray-200 bg-white shadow-xl p-4"
    >
      <div class="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
        <div>
          <h4 class="text-sm font-semibold text-gray-900">{{ assignedEmployee.name }}</h4>
          <p v-if="assignedEmployee.designation || assignedEmployee.employee?.designation" class="text-xs text-gray-500 mt-0.5">
            {{ assignedEmployee.designation || assignedEmployee.employee?.designation }}
          </p>
        </div>
        <button @click="hideEmployeePopover" class="text-gray-400 hover:text-gray-600">
          <i class="fa-light fa-times text-xs"></i>
        </button>
      </div>
      <div class="space-y-2">
        <div v-if="assignedEmployee.email" class="flex items-center gap-2">
          <i class="fa-light fa-envelope text-xs text-gray-400 w-4"></i>
          <a :href="`mailto:${assignedEmployee.email}`" class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline break-all">
            {{ assignedEmployee.email }}
          </a>
        </div>
        <div v-if="assignedEmployee.phone" class="flex items-center gap-2">
          <i class="fa-light fa-phone text-xs text-gray-400 w-4"></i>
          <a :href="`tel:${assignedEmployee.phone}`" class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
            {{ assignedEmployee.phone }}
          </a>
        </div>
        <div v-if="assignedEmployee.area" class="flex items-center gap-2">
          <i class="fa-light fa-map-marker-alt text-xs text-gray-400 w-4"></i>
          <span class="text-xs text-gray-600">{{ assignedEmployee.area }}</span>
        </div>
        <div v-if="assignedEmployee.roles && assignedEmployee.roles.length > 0" class="flex items-center gap-2">
          <i class="fa-light fa-user-shield text-xs text-gray-400 w-4"></i>
          <span class="text-xs text-gray-600">{{ assignedEmployee.roles.join(', ') }}</span>
        </div>
      </div>
    </div>
    
    <!-- Click outside to close popover -->
    <div 
      v-if="showEmployeePopover" 
      @click="hideEmployeePopover"
      class="fixed inset-0 z-[9998]"
    ></div>
  </Teleport>
</template>
