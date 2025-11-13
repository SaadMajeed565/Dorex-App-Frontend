<script setup lang="ts">
import { ref, computed } from 'vue';
import MasterLayout from '../../layouts/MasterLayout.vue';

// Reactive data
const tasks = ref([
  {
    id: 1,
    title: 'Network maintenance - Downtown Hub',
    description: 'Scheduled maintenance for core router and switches',
    priority: 'High',
    status: 'In Progress',
    category: 'Maintenance',
    assignedTo: 'Sarah Johnson',
    dueDate: '2024-01-20',
    createdAt: '2024-01-15',
    progress: 65,
    estimatedHours: 8,
    actualHours: 5.2
  },
  {
    id: 2,
    title: 'Customer installation - Uptown Area',
    description: 'Install fiber connection for new customer',
    priority: 'Medium',
    status: 'Pending',
    category: 'Installation',
    assignedTo: 'Alex Thompson',
    dueDate: '2024-01-18',
    createdAt: '2024-01-16',
    progress: 0,
    estimatedHours: 4,
    actualHours: 0
  },
  {
    id: 3,
    title: 'Equipment upgrade - Main Data Center',
    description: 'Upgrade core switches to latest firmware',
    priority: 'High',
    status: 'Completed',
    category: 'Upgrade',
    assignedTo: 'Mike Chen',
    dueDate: '2024-01-15',
    createdAt: '2024-01-10',
    progress: 100,
    estimatedHours: 6,
    actualHours: 5.8
  },
  {
    id: 4,
    title: 'Network troubleshooting - Industrial Zone',
    description: 'Investigate connectivity issues in industrial area',
    priority: 'Critical',
    status: 'In Progress',
    category: 'Troubleshooting',
    assignedTo: 'Lisa Rodriguez',
    dueDate: '2024-01-17',
    createdAt: '2024-01-16',
    progress: 30,
    estimatedHours: 12,
    actualHours: 3.6
  },
  {
    id: 5,
    title: 'Customer support training',
    description: 'Conduct training session for new support staff',
    priority: 'Low',
    status: 'Scheduled',
    category: 'Training',
    assignedTo: 'David Kim',
    dueDate: '2024-01-25',
    createdAt: '2024-01-14',
    progress: 0,
    estimatedHours: 3,
    actualHours: 0
  }
]);

const search = ref('');
const statusFilter = ref('All');
const priorityFilter = ref('All');
const categoryFilter = ref('All');
const assignedFilter = ref('All');

const statuses = ['All', 'Pending', 'In Progress', 'Completed', 'Scheduled'];
const priorities = ['All', 'Low', 'Medium', 'High', 'Critical'];
const categories = ['All', 'Maintenance', 'Installation', 'Upgrade', 'Troubleshooting', 'Training'];
const assignees = ['All', 'Sarah Johnson', 'Mike Chen', 'Lisa Rodriguez', 'Alex Thompson', 'David Kim'];

// Computed properties
const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    const matchesSearch = !search.value || 
      task.title.toLowerCase().includes(search.value.toLowerCase()) ||
      task.description.toLowerCase().includes(search.value.toLowerCase());
    
    const matchesStatus = statusFilter.value === 'All' || task.status === statusFilter.value;
    const matchesPriority = priorityFilter.value === 'All' || task.priority === priorityFilter.value;
    const matchesCategory = categoryFilter.value === 'All' || task.category === categoryFilter.value;
    const matchesAssigned = assignedFilter.value === 'All' || task.assignedTo === assignedFilter.value;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned;
  });
});

const stats = computed(() => {
  const total = tasks.value.length;
  const pending = tasks.value.filter(t => t.status === 'Pending').length;
  const inProgress = tasks.value.filter(t => t.status === 'In Progress').length;
  const completed = tasks.value.filter(t => t.status === 'Completed').length;
  const overdue = tasks.value.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
  
  return { total, pending, inProgress, completed, overdue };
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
    'Pending': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Scheduled': 'bg-purple-100 text-purple-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getCategoryColor = (category: string) => {
  const colors = {
    'Maintenance': 'bg-blue-100 text-blue-800',
    'Installation': 'bg-green-100 text-green-800',
    'Upgrade': 'bg-purple-100 text-purple-800',
    'Troubleshooting': 'bg-red-100 text-red-800',
    'Training': 'bg-yellow-100 text-yellow-800'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const isOverdue = (dueDate: string, status: string) => {
  return new Date(dueDate) < new Date() && status !== 'Completed';
};
</script>

<template>
  <MasterLayout>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
        <p class="text-sm text-gray-500">Manage and track team tasks and assignments</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          <i class="fa-light fa-plus"></i>
          New Task
        </button>
        <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-calendar"></i>
          Schedule
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Tasks</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-list-check text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Pending</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.pending }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
            <i class="fa-light fa-clock text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">In Progress</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.inProgress }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-play text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Completed</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.completed }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <i class="fa-light fa-check-circle text-lg"></i>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Overdue</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.overdue }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <i class="fa-light fa-exclamation-triangle text-lg"></i>
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
              placeholder="Search tasks..." 
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

    <!-- Tasks Table -->
    <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="task in filteredTasks" :key="task.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-start">
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">{{ task.title }}</div>
                    <div class="text-sm text-gray-500 mt-1">{{ task.description }}</div>
                    <div class="mt-2">
                      <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(task.category)}`">
                        {{ task.category }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`">
                  {{ task.priority }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`">
                  {{ task.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ task.assignedTo }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-16 rounded-full bg-gray-200">
                    <div 
                      class="h-2 rounded-full bg-indigo-500" 
                      :style="`width: ${task.progress}%`"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ task.progress }}%</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">{{ task.actualHours }}/{{ task.estimatedHours }}h</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div :class="`text-sm font-medium ${isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-gray-900'}`">
                  {{ task.dueDate }}
                </div>
                <div v-if="isOverdue(task.dueDate, task.status)" class="text-xs text-red-500">Overdue</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button class="text-indigo-600 hover:text-indigo-900">View</button>
                  <button class="text-gray-600 hover:text-gray-900">Edit</button>
                  <button class="text-green-600 hover:text-green-900">Complete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MasterLayout>
</template>

