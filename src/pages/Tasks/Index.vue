<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from '../../volt/ConfirmDialog.vue';
import AddTask from './AddTask.vue';
import EditTask from './EditTask.vue';
import ViewTask from './ViewTask.vue';

// Interface for Task
interface Task {
  id: number | string;
  title: string;
  description: string;
  priority: string;
  status: string;
  type: string;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  is_overdue: boolean;
  assigned_employee?: {
    id: number;
    name: string;
    email: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

// Reactive data
const tasks = ref<Task[]>([]);
const loading = ref<boolean>(true);
const toast = useToast();
const confirm = useConfirm();

// Modal states
const showViewModal = ref(false);
const showEditModal = ref(false);
const showAddModal = ref(false);
const selectedTask = ref<Task | null>(null);

// Filters
const search = ref('');
const statusFilter = ref('All');
const priorityFilter = ref('All');
const typeFilter = ref('All');
const assignedFilter = ref('All');

const statuses = computed(() => {
  const uniqueStatuses = [...new Set(tasks.value.map(t => t.status))].filter(Boolean);
  return ['All', ...uniqueStatuses.sort()];
});

const priorities = computed(() => {
  const uniquePriorities = [...new Set(tasks.value.map(t => t.priority))].filter(Boolean);
  return ['All', ...uniquePriorities.sort()];
});

const types = computed(() => {
  const uniqueTypes = [...new Set(tasks.value.map(t => t.type))].filter(Boolean);
  return ['All', ...uniqueTypes.sort()];
});

const assignedEmployees = computed(() => {
  const uniqueEmployees = [...new Set(
    tasks.value
      .filter(t => t.assigned_employee?.name)
      .map(t => t.assigned_employee!.name)
  )];
  return ['All', ...uniqueEmployees.sort()];
});

// Computed properties
const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    const matchesSearch = !search.value || 
      task.title.toLowerCase().includes(search.value.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.value.toLowerCase()) ||
      task.customer?.name?.toLowerCase().includes(search.value.toLowerCase());
    
    const matchesStatus = statusFilter.value === 'All' || task.status === statusFilter.value;
    const matchesPriority = priorityFilter.value === 'All' || task.priority === priorityFilter.value;
    const matchesType = typeFilter.value === 'All' || task.type === typeFilter.value;
    const matchesAssigned = assignedFilter.value === 'All' || task.assigned_employee?.name === assignedFilter.value;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssigned;
  });
});

const stats = computed(() => {
  const total = tasks.value.length;
  const pending = tasks.value.filter(t => t.status === 'pending').length;
  const inProgress = tasks.value.filter(t => t.status === 'in_progress').length;
  const completed = tasks.value.filter(t => t.status === 'completed').length;
  const overdue = tasks.value.filter(t => t.is_overdue).length;
  
  return { total, pending, inProgress, completed, overdue };
});

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800'
  };
  return colors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pending': 'bg-gray-100 text-gray-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'installation': 'bg-purple-100 text-purple-800',
    'maintenance': 'bg-blue-100 text-blue-800',
    'repair': 'bg-orange-100 text-orange-800',
    'upgrade': 'bg-green-100 text-green-800',
    'other': 'bg-gray-100 text-gray-800'
  };
  return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

// Normalize status from API
const normalizeStatus = (status?: string): string => {
  if (!status) return 'pending';
  return status.toLowerCase();
};

// Normalize priority from API
const normalizePriority = (priority?: string): string => {
  if (!priority) return 'medium';
  return priority.toLowerCase();
};

// Fetch tasks from API
const fetchTasks = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/tasks');
    let raw: any = [];
    
    // Handle paginated response
    if (res?.data?.data && Array.isArray(res.data.data)) {
      raw = res.data.data;
    } else if (Array.isArray(res?.data)) {
      raw = res.data;
    } else {
      raw = [];
    }

    tasks.value = raw.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      priority: normalizePriority(item.priority),
      status: normalizeStatus(item.status),
      type: item.type || 'other',
      due_date: item.due_date,
      started_at: item.started_at,
      completed_at: item.completed_at,
      is_overdue: item.is_overdue || false,
      assigned_employee: item.assigned_employee,
      customer: item.customer,
      creator: item.creator,
      created_at: item.created_at,
    }));
  } catch (err: any) {
    console.error('Error fetching tasks:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Failed to load tasks.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

// Modal handlers
const openViewModal = (task: Task) => {
  selectedTask.value = task;
  showViewModal.value = true;
};

const openEditModal = (task: Task) => {
  selectedTask.value = task;
  showEditModal.value = true;
};

const handleTaskCreated = () => {
  fetchTasks();
  showAddModal.value = false;
};

const handleTaskUpdated = () => {
  fetchTasks();
  showEditModal.value = false;
  selectedTask.value = null;
};

// Task actions
const startTask = async (task: Task) => {
  confirm.require({
    message: `Are you sure you want to start task "${task.title}"?`,
    header: 'Start Task',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Start',
      severity: 'success'
    },
    accept: async () => {
      try {
        await axiosClient.post(`/tasks/${task.id}/start`);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Task started successfully!',
          life: 3000,
        });
        await fetchTasks();
      } catch (err: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Failed to start task.',
          life: 4000,
        });
      }
    },
  });
};

const completeTask = async (task: Task) => {
  confirm.require({
    message: `Are you sure you want to mark task "${task.title}" as completed?`,
    header: 'Complete Task',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Complete',
      severity: 'success'
    },
    accept: async () => {
      try {
        await axiosClient.post(`/tasks/${task.id}/complete`);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Task completed successfully!',
          life: 3000,
        });
        await fetchTasks();
      } catch (err: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Failed to complete task.',
          life: 4000,
        });
      }
    },
  });
};

const deleteTask = async (task: Task) => {
  confirm.require({
    message: `Are you sure you want to delete task "${task.title}"?`,
    header: 'Delete Task',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      try {
        await axiosClient.delete(`/tasks/${task.id}`);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Task deleted successfully!',
          life: 3000,
        });
        await fetchTasks();
      } catch (err: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Failed to delete task.',
          life: 4000,
        });
      }
    },
  });
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
          <p class="text-sm text-gray-500">Manage and track all tasks</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="fetchTasks"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
          <button
            @click="showAddModal = true"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <i class="fa-light fa-plus"></i>
            Add Task
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">Total Tasks</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">Pending</p>
          <p class="text-2xl font-bold text-yellow-600">{{ stats.pending }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">In Progress</p>
          <p class="text-2xl font-bold text-blue-600">{{ stats.inProgress }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">Completed</p>
          <p class="text-2xl font-bold text-green-600">{{ stats.completed }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <p class="text-sm font-medium text-gray-500">Overdue</p>
          <p class="text-2xl font-bold text-red-600">{{ stats.overdue }}</p>
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
                placeholder="Search tasks by title, description, or customer..."
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
              v-model="typeFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="type in types" :key="type" :value="type">{{ type }}</option>
            </select>
            <select
              v-model="assignedFilter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="employee in assignedEmployees" :key="employee" :value="employee">{{ employee }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tasks Table -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div v-if="filteredTasks.length === 0" class="flex items-center justify-center p-10 text-center">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">No tasks found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating your first task.</p>
          </div>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Task</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Priority</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Assigned To</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="task in filteredTasks" :key="task.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ task.title }}</div>
                    <div v-if="task.description" class="text-xs text-gray-500 truncate max-w-xs">{{ task.description }}</div>
                    <div v-if="task.customer" class="text-xs text-gray-400 mt-1">
                      <i class="fa-light fa-user"></i> {{ task.customer.name }}
                    </div>
                  </div>
                  <span v-if="task.is_overdue" class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    Overdue
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize', getTypeColor(task.type)]">
                  {{ task.type }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize', getPriorityColor(task.priority)]">
                  {{ task.priority }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize', getStatusColor(task.status)]">
                  {{ task.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ task.assigned_employee?.name || 'Unassigned' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ formatDate(task.due_date) }}
              </td>
              <td class="px-4 py-3 text-right text-sm">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openViewModal(task)"
                    class="text-indigo-600 hover:text-indigo-500"
                    title="View"
                  >
                    <i class="fa-light fa-eye"></i>
                  </button>
                  <button
                    @click="openEditModal(task)"
                    class="text-blue-600 hover:text-blue-500"
                    title="Edit"
                  >
                    <i class="fa-light fa-edit"></i>
                  </button>
                  <button
                    v-if="task.status === 'pending'"
                    type="button"
                    @click.stop="startTask(task)"
                    class="text-green-600 hover:text-green-500"
                    title="Start"
                  >
                    <i class="fa-light fa-play"></i>
                  </button>
                  <button
                    v-if="task.status === 'in_progress'"
                    type="button"
                    @click.stop="completeTask(task)"
                    class="text-green-600 hover:text-green-500"
                    title="Complete"
                  >
                    <i class="fa-light fa-check"></i>
                  </button>
                  <button
                    type="button"
                    @click.stop="deleteTask(task)"
                    class="text-red-600 hover:text-red-500"
                    title="Delete"
                  >
                    <i class="fa-light fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <!-- Modals -->
      <ConfirmDialog />
      <AddTask v-model:visible="showAddModal" @created="handleTaskCreated" />
      <EditTask v-model:visible="showEditModal" :task="selectedTask" @updated="handleTaskUpdated" />
      <ViewTask v-model:visible="showViewModal" :task="selectedTask" />
    </template>
  </MasterLayout>
</template>
