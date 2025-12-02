<script setup lang="ts">
import Dialog from '../../volt/Dialog.vue';
import { computed, ref, watch, nextTick } from 'vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps<{
  visible: boolean;
  task: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const loading = ref(false);
const taskDetails = ref<any>(null);
const employeeDetails = ref<any>(null);
const employeeTaskStats = ref<any>(null);
const activeTab = ref<'details' | 'other-tasks'>('details');

// Other tasks pagination
const otherTasks = ref<any[]>([]);
const loadingOtherTasks = ref(false);
const otherTasksPage = ref(1);
const otherTasksPerPage = ref(5);
const otherTasksTotal = ref(0);
const otherTasksLastPage = ref(1);

// Expanded task details
const expandedTaskId = ref<number | null>(null);
const expandedTaskDetails = ref<Record<number, any>>({});
const loadingExpandedTask = ref<Record<number, boolean>>({});

// Employee details popover
const showEmployeePopover = ref(false);
const employeePopoverRef = ref<HTMLElement | null>(null);
const employeeButtonRef = ref<HTMLElement | null>(null);
const employeeSidebarButtonRef = ref<HTMLElement | null>(null);

const fetchTaskDetails = async () => {
  if (!props.task?.id) return;
  
  loading.value = true;
  try {
    const res = await axiosClient.get(`/tasks/${props.task.id}`);
    if (res.data?.data) {
      taskDetails.value = res.data.data;
      employeeTaskStats.value = res.data.employee_task_stats || null;
      
      // Extract employee details
      if (res.data.data.assigned_employee) {
        employeeDetails.value = res.data.data.assigned_employee;
      }
    }
  } catch (error) {
    console.error('Error fetching task details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load task details',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const fetchOtherTasks = async (page: number = 1) => {
  if (!props.task?.id) return;
  
  loadingOtherTasks.value = true;
  try {
    const res = await axiosClient.get(`/tasks/${props.task.id}/employee-tasks`, {
      params: {
        page,
        per_page: otherTasksPerPage.value
      }
    });
    
    if (res.data?.data) {
      if (page === 1) {
        otherTasks.value = res.data.data;
      } else {
        otherTasks.value = [...otherTasks.value, ...res.data.data];
      }
      
      if (res.data.meta) {
        otherTasksTotal.value = res.data.meta.total || 0;
        otherTasksLastPage.value = res.data.meta.last_page || 1;
        otherTasksPage.value = res.data.meta.current_page || 1;
      }
    }
  } catch (error) {
    console.error('Error fetching other tasks:', error);
  } finally {
    loadingOtherTasks.value = false;
  }
};

watch(() => props.visible, (newVal) => {
  if (newVal && props.task?.id) {
    activeTab.value = 'details';
    fetchTaskDetails();
    // Reset other tasks
    otherTasks.value = [];
    otherTasksPage.value = 1;
  }
});

watch(() => props.task, (newTask) => {
  if (props.visible && newTask?.id) {
    activeTab.value = 'details';
    fetchTaskDetails();
    // Reset other tasks
    otherTasks.value = [];
    otherTasksPage.value = 1;
  }
}, { deep: true });

watch(() => activeTab.value, (newTab) => {
  if (newTab === 'other-tasks' && otherTasks.value.length === 0 && props.task?.assigned_employee?.id) {
    fetchOtherTasks(1);
  }
});

const loadMoreTasks = () => {
  if (otherTasksPage.value < otherTasksLastPage.value && !loadingOtherTasks.value) {
    fetchOtherTasks(otherTasksPage.value + 1);
  }
};

const toggleTaskDetails = async (taskId: number) => {
  if (expandedTaskId.value === taskId) {
    expandedTaskId.value = null;
    return;
  }
  
  expandedTaskId.value = taskId;
  
  if (!expandedTaskDetails.value[taskId]) {
    loadingExpandedTask.value[taskId] = true;
    try {
      const res = await axiosClient.get(`/tasks/${taskId}`);
      if (res.data?.data) {
        expandedTaskDetails.value[taskId] = res.data.data;
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      loadingExpandedTask.value[taskId] = false;
    }
  }
};

const isTaskExpanded = (taskId: number) => expandedTaskId.value === taskId;
const getExpandedTask = (taskId: number) => expandedTaskDetails.value[taskId];

// Employee details helpers
const assignedEmployee = computed(() => {
  const employee = currentTask.value?.assigned_employee || employeeDetails.value;
  if (!employee) return null;
  
  // Handle nested employee structure (employee.employee)
  if (employee.employee) {
    return {
      ...employee.employee,
      // Keep top-level properties if they exist
      name: employee.name || employee.employee.name,
      email: employee.email || employee.employee.email,
      phone: employee.phone || employee.employee.phone,
      area: employee.area || employee.employee.area,
      designation: employee.designation || employee.employee.designation,
      roles: employee.roles || employee.employee.roles,
    };
  }
  
  return employee;
});

const showEmployeeDetails = (event: MouseEvent, useSidebarRef = false) => {
  event.preventDefault();
  event.stopPropagation();
  
  const employee = assignedEmployee.value;
  if (!employee || !employee.name) {
    return;
  }
  
  showEmployeePopover.value = true;
  
  // Position popover after it's shown
  nextTick(() => {
    const buttonRef = useSidebarRef ? employeeSidebarButtonRef.value : employeeButtonRef.value;
    if (buttonRef && employeePopoverRef.value) {
      const rect = buttonRef.getBoundingClientRect();
      employeePopoverRef.value.style.top = `${rect.bottom + 8}px`;
      employeePopoverRef.value.style.left = `${rect.left}px`;
    }
  });
};

const hideEmployeePopover = () => {
  showEmployeePopover.value = false;
};

// Unused functions removed - kept for potential future use
// const getStatusSeverity = (status: string) => {
//   switch (status?.toLowerCase()) {
//     case 'pending':
//       return 'secondary';
//     case 'in_progress':
//       return 'info';
//     case 'completed':
//       return 'success';
//     case 'cancelled':
//       return 'danger';
//     default:
//       return 'secondary';
//   }
// };

// const getPrioritySeverity = (priority: string) => {
//   switch (priority?.toLowerCase()) {
//     case 'low':
//       return 'secondary';
//     case 'medium':
//       return 'info';
//     case 'high':
//       return 'warn';
//     case 'critical':
//       return 'danger';
//     default:
//       return 'secondary';
//   }
// };

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return dateString;
  }
};

const formatShortDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
};

const currentTask = computed(() => taskDetails.value || props.task);

const getStatusConfig = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'pending':
      return { 
        color: 'bg-gray-50 text-gray-700 ring-gray-600/20 border-gray-200',
        dot: 'bg-gray-500',
        icon: 'fa-clock'
      };
    case 'in_progress':
    case 'in progress':
      return { 
        color: 'bg-blue-50 text-blue-700 ring-blue-600/20 border-blue-200',
        dot: 'bg-blue-500',
        icon: 'fa-spinner'
      };
    case 'completed':
      return { 
        color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: 'fa-circle-check'
      };
    case 'cancelled':
      return { 
        color: 'bg-rose-50 text-rose-700 ring-rose-600/20 border-rose-200',
        dot: 'bg-rose-500',
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

const statusConfig = computed(() => currentTask.value ? getStatusConfig(currentTask.value.status) : null);
const priorityConfig = computed(() => currentTask.value ? getPriorityConfig(currentTask.value.priority) : null);

const statusProgress = computed(() => {
  if (!currentTask.value) return 0;
  const status = currentTask.value.status?.toLowerCase();
  switch (status) {
    case 'pending':
      return 25;
    case 'in_progress':
      return 50;
    case 'completed':
      return 100;
    case 'cancelled':
      return 0;
    default:
      return 0;
  }
});

const progressBarColor = computed(() => {
  if (!currentTask.value) return 'bg-gray-300';
  const status = currentTask.value.status?.toLowerCase();
  switch (status) {
    case 'pending':
      return 'bg-gray-500';
    case 'in_progress':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-emerald-500';
    case 'cancelled':
      return 'bg-rose-500';
    default:
      return 'bg-gray-300';
  }
});
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    :header="currentTask ? `Task #${currentTask.id}` : 'Task Details'"
    :closable="true"
    :breakpoints="{ '960px': '95vw', '640px': '98vw' }"
    :style="{ width: '1200px', maxWidth: '98vw', maxHeight: '90vh' }"
  >
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600"></div>
      <p class="text-sm text-gray-500 mt-4">Loading task details...</p>
    </div>
    <div v-else-if="currentTask" class="py-2">
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
            v-if="currentTask.assigned_employee"
            @click="activeTab = 'other-tasks'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'other-tasks'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i class="fa-light fa-list-check mr-2"></i>
            Other Tasks
            <span v-if="otherTasksTotal > 0" class="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {{ otherTasksTotal }}
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
                      <h2 class="text-xl font-bold text-gray-900">{{ currentTask.title }}</h2>
                      <p class="text-sm text-gray-600 mt-0.5">Task #{{ currentTask.id }}</p>
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
                      {{ currentTask.status?.charAt(0).toUpperCase() + currentTask.status?.slice(1).replace('_', ' ') }}
                    </span>
                    <span 
                      v-if="currentTask.is_overdue"
                      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200"
                    >
                      <span class="inline-block h-2 w-2 rounded-full bg-rose-500"></span>
                      Overdue
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
                  <p class="text-sm font-semibold text-gray-900">{{ formatDate(currentTask.created_at) }}</p>
                </div>
                <div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <i class="fa-light fa-calendar-days text-xs"></i>
                    <span>Due Date</span>
                  </div>
                  <p class="text-sm font-semibold" :class="currentTask.is_overdue ? 'text-rose-600' : 'text-gray-900'">
                    {{ formatDate(currentTask.due_date) }}
                  </p>
                </div>
                <div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <i class="fa-light fa-tag text-xs"></i>
                    <span>Type</span>
                  </div>
                  <p class="text-sm font-semibold text-gray-900">{{ currentTask.type?.replace('_', ' ') || '—' }}</p>
                </div>
                <div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <i class="fa-light fa-user-tie text-xs"></i>
                    <span>Assigned To</span>
                  </div>
                  <div v-if="assignedEmployee || (currentTask.assigned_employee && currentTask.assigned_employee !== 'Unassigned')">
                    <button 
                      ref="employeeButtonRef"
                      @click="showEmployeeDetails"
                      type="button"
                      class="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1.5 group"
                    >
                      {{ assignedEmployee?.name || currentTask.assigned_employee?.name || currentTask.assigned_employee }}
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
                  <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ currentTask.description || 'No description provided.' }}</p>
                </div>
              </div>

              <!-- Notes -->
              <div v-if="currentTask.notes" class="rounded-xl border border-gray-200 bg-white p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <i class="fa-light fa-note-sticky text-blue-600"></i>
                  </div>
                  <h3 class="text-base font-semibold text-gray-900">Notes</h3>
                </div>
                <div class="prose prose-sm max-w-none">
                  <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ currentTask.notes }}</p>
                </div>
              </div>
            </div>

            <!-- Right Column - Sidebar -->
            <div class="space-y-6">
              <!-- Employee Information with Statistics -->
              <div class="rounded-xl border border-gray-200 bg-white p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <i class="fa-light fa-user text-blue-600"></i>
                  </div>
                  <h3 class="text-base font-semibold text-gray-900">Employee</h3>
                </div>
                <div class="space-y-4">
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name</p>
                    <div v-if="assignedEmployee">
                      <button 
                        ref="employeeSidebarButtonRef"
                        @click="(e) => showEmployeeDetails(e, true)"
                        type="button"
                        class="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1.5 group"
                      >
                        {{ assignedEmployee.name }}
                        <i class="fa-light fa-info-circle text-xs text-gray-400 group-hover:text-indigo-600"></i>
                      </button>
                    </div>
                    <p v-else class="text-sm text-gray-500 italic">Unassigned</p>
                  </div>
                  <div v-if="assignedEmployee?.designation">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Designation</p>
                    <p class="text-sm text-gray-900">{{ assignedEmployee.designation }}</p>
                  </div>
                  <div v-if="assignedEmployee?.email">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <a :href="`mailto:${assignedEmployee.email}`" class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline break-all">
                      {{ assignedEmployee.email }}
                    </a>
                  </div>
                  <div v-if="assignedEmployee?.phone">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                    <a :href="`tel:${assignedEmployee.phone}`" class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                      {{ assignedEmployee.phone }}
                    </a>
                  </div>
                  <div v-if="assignedEmployee?.area">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Area</p>
                    <p class="text-sm text-gray-900">{{ assignedEmployee.area }}</p>
                  </div>
                  <div v-if="assignedEmployee?.roles && assignedEmployee.roles.length > 0">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Roles</p>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="role in assignedEmployee.roles" 
                        :key="role"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700"
                      >
                        {{ role }}
                      </span>
                    </div>
                  </div>

                  <!-- Task Statistics -->
                  <div v-if="employeeTaskStats" class="pt-4 border-t border-gray-200">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Task Statistics</p>
                    
                    <div class="space-y-3">
                      <div class="p-2 rounded bg-gray-100">
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-gray-600">Total</span>
                          <span class="text-sm font-semibold text-gray-900">{{ employeeTaskStats.total || 0 }}</span>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">Pending</span>
                          <span class="text-sm font-semibold text-gray-600">{{ employeeTaskStats.pending || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="employeeTaskStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-gray-500 transition-all duration-500"
                            :style="{ width: `${((employeeTaskStats.pending || 0) / employeeTaskStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">In Progress</span>
                          <span class="text-sm font-semibold text-amber-600">{{ employeeTaskStats.in_progress || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="employeeTaskStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-amber-500 transition-all duration-500"
                            :style="{ width: `${((employeeTaskStats.in_progress || 0) / employeeTaskStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">Completed</span>
                          <span class="text-sm font-semibold text-emerald-600">{{ employeeTaskStats.completed || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="employeeTaskStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500"
                            :style="{ width: `${((employeeTaskStats.completed || 0) / employeeTaskStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                      <div v-if="employeeTaskStats.overdue > 0">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs text-gray-600">Overdue</span>
                          <span class="text-sm font-semibold text-rose-600">{{ employeeTaskStats.overdue || 0 }}</span>
                        </div>
                        <div class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            v-if="employeeTaskStats.total > 0"
                            class="absolute left-0 top-0 h-full bg-rose-500 transition-all duration-500"
                            :style="{ width: `${((employeeTaskStats.overdue || 0) / employeeTaskStats.total) * 100}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Related Information -->
              <div v-if="currentTask.creator || currentTask.customer || currentTask.subscription" class="rounded-xl border border-gray-200 bg-white p-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <i class="fa-light fa-link text-indigo-600"></i>
                  </div>
                  <h3 class="text-base font-semibold text-gray-900">Related</h3>
                </div>
                <div class="space-y-4">
                  <div v-if="currentTask.creator">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created By</p>
                    <p class="text-sm font-semibold text-gray-900">{{ currentTask.creator.name }}</p>
                    <a v-if="currentTask.creator.email" :href="`mailto:${currentTask.creator.email}`" class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline block mt-1">
                      {{ currentTask.creator.email }}
                    </a>
                  </div>
                  <div v-if="currentTask.customer">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                    <p class="text-sm font-semibold text-gray-900">{{ currentTask.customer.name }}</p>
                    <a v-if="currentTask.customer.email" :href="`mailto:${currentTask.customer.email}`" class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline block mt-1">
                      {{ currentTask.customer.email }}
                    </a>
                  </div>
                  <div v-if="currentTask.subscription">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Subscription</p>
                    <p class="text-sm font-semibold text-gray-900">{{ currentTask.subscription.package?.name || 'N/A' }}</p>
                    <p class="text-xs text-gray-500 mt-1">Status: {{ currentTask.subscription.status }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Tasks Tab -->
        <div v-show="activeTab === 'other-tasks'" class="space-y-4">
          <div v-if="loadingOtherTasks && otherTasks.length === 0" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-indigo-600"></div>
            <p class="text-sm text-gray-500 mt-4">Loading tasks...</p>
          </div>
          <div v-else-if="otherTasks.length === 0" class="flex flex-col items-center justify-center py-12">
            <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <i class="fa-light fa-inbox text-2xl text-gray-400"></i>
            </div>
            <p class="text-sm text-gray-500">No other tasks found for this employee</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="task in otherTasks" 
              :key="task.id"
              class="rounded-lg border border-gray-200 overflow-hidden transition-all"
              :class="isTaskExpanded(task.id) ? 'border-indigo-300 shadow-md' : 'hover:border-indigo-300'"
            >
              <!-- Task Header (Clickable) -->
              <div 
                @click="toggleTaskDetails(task.id)"
                class="p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-semibold text-gray-900 truncate">{{ task.title }}</h4>
                      <i 
                        :class="`fa-light transition-transform duration-200 ${isTaskExpanded(task.id) ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400`"
                      ></i>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Task #{{ task.id }}</p>
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      <span :class="`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusConfig(task.status).color}`">
                        <span :class="`inline-block h-1.5 w-1.5 rounded-full ${getStatusConfig(task.status).dot}`"></span>
                        {{ task.status?.charAt(0).toUpperCase() + task.status?.slice(1).replace('_', ' ') }}
                      </span>
                      <span :class="`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityConfig(task.priority).color}`">
                        {{ getPriorityConfig(task.priority).label }}
                      </span>
                      <span class="text-xs text-gray-500">{{ task.type?.replace('_', ' ') || '—' }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500">{{ formatShortDate(task.created_at) }}</p>
                  </div>
                </div>
              </div>

              <!-- Expanded Details -->
              <div 
                v-if="isTaskExpanded(task.id)"
                class="border-t border-gray-200 bg-gray-50/50"
              >
                <!-- Loading State -->
                <div v-if="loadingExpandedTask[task.id]" class="p-6 flex items-center justify-center">
                  <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600"></div>
                  <span class="ml-2 text-sm text-gray-500">Loading details...</span>
                </div>

                <!-- Details Content -->
                <div v-else-if="getExpandedTask(task.id)" class="p-4 space-y-4">
                  <!-- Meta Information -->
                  <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 pb-3 border-b border-gray-100">
                    <div class="flex items-center gap-1.5">
                      <i class="fa-light fa-calendar"></i>
                      <span>{{ formatDate(getExpandedTask(task.id).created_at) }}</span>
                    </div>
                    <div v-if="getExpandedTask(task.id).due_date" class="flex items-center gap-1.5">
                      <i class="fa-light fa-calendar-days"></i>
                      <span>{{ formatDate(getExpandedTask(task.id).due_date) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <i class="fa-light fa-tag"></i>
                      <span>{{ getExpandedTask(task.id).type?.replace('_', ' ') || '—' }}</span>
                    </div>
                  </div>

                  <!-- Description -->
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Description</p>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ getExpandedTask(task.id).description || 'No description provided.' }}</p>
                  </div>

                  <!-- Notes -->
                  <div v-if="getExpandedTask(task.id).notes">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ getExpandedTask(task.id).notes }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Load More Button -->
            <div v-if="otherTasksPage < otherTasksLastPage" class="pt-4 text-center">
              <button
                @click="loadMoreTasks"
                :disabled="loadingOtherTasks"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="loadingOtherTasks" class="fa-light fa-spinner fa-spin"></i>
                <i v-else class="fa-light fa-arrow-down"></i>
                {{ loadingOtherTasks ? 'Loading...' : 'Load More' }}
              </button>
            </div>
            <div v-else-if="otherTasks.length > 0" class="pt-4 text-center">
              <p class="text-xs text-gray-500">All tasks loaded ({{ otherTasks.length }} of {{ otherTasksTotal }})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="flex flex-col items-center justify-center py-12">
      <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <i class="fa-light fa-file-circle-exclamation text-2xl text-gray-400"></i>
      </div>
      <p class="text-sm text-gray-500">No task data available</p>
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

