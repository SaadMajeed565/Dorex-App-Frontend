<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axiosClient from '../../../axios';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useRolesStore } from '../../../stores/rolesStore';
import MasterLayout from '../../../layouts/MasterLayout.vue';
import Card from '../../../volt/Card.vue';
import ConfirmDialog from '../../../volt/ConfirmDialog.vue';
import AddRole from './AddRole.vue';
import Edit from './Edit.vue';
import Show from './Show.vue';

const toast = useToast();
const confirm = useConfirm();
const rolesStore = useRolesStore();

// UI States
const showAddRole = ref(false);
const showViewRole = ref(false);
const showEditRole = ref(false);
const selectedRoleId = ref<string | number | null>(null);

// Modal handlers
const openShowModal = (roleId: string | number) => {
  selectedRoleId.value = roleId;
  showViewRole.value = true;
};

const openEditModal = (roleId: string | number) => {
  selectedRoleId.value = roleId;
  showEditRole.value = true;
};

// Delete role
const deleteRole = async (role: any) => {
  confirm.require({
    message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
    header: 'Delete Role',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await axiosClient.delete(`/roles/${role.id}`);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Role deleted successfully!',
          life: 3000,
        });
        await rolesStore.fetchRoles();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'Failed to delete role',
          life: 4000,
        });
      }
    }
  });
};

const handleRefresh = () => {
  rolesStore.fetchRoles();
};

onMounted(() => {
  rolesStore.fetchRoles();
});
</script>

<template>
  <MasterLayout>
    <ConfirmDialog />
    
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Roles</h1>
        <p class="text-sm text-gray-500">Manage system roles and permissions</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="showAddRole = true"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <i class="fa-light fa-plus"></i>
          <span>Create Role</span>
        </button>
        <button 
          @click="rolesStore.fetchRoles"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <i class="fa-light fa-refresh"></i>
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Roles List -->
    <Card>
      <template #header>
        <div class="p-5 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Roles</h2>
              <p class="text-sm text-gray-500 mt-1">Manage existing roles and their permissions</p>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative">
                <input 
                  v-model="rolesStore.searchQuery"
                  type="text" 
                  placeholder="Search roles..." 
                  class="w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #content>
        <div v-if="rolesStore.loading" class="p-8 text-center text-gray-500">
          <i class="fa-light fa-spinner fa-spin text-2xl mb-2"></i>
          <p>Loading roles...</p>
        </div>
        <div v-else-if="rolesStore.filteredRoles.length === 0" class="p-8 text-center text-gray-500">
          <i class="fa-light fa-inbox text-4xl mb-2"></i>
          <p>{{ rolesStore.searchQuery ? 'No roles found matching your search' : 'No roles found. Create your first role!' }}</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="role in rolesStore.filteredRoles" :key="role.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                      <i class="fa-light fa-user-shield text-indigo-600"></i>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ role.name }}</div>
                      <div class="text-sm text-gray-500">ID: {{ role.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ role.description || 'No description' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {{ rolesStore.getPermissionCount(role) }} permissions
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <button @click="openShowModal(role.id)" class="text-indigo-600 hover:text-indigo-900">View</button>
                    <button @click="openEditModal(role.id)" class="text-gray-600 hover:text-gray-900">Edit</button>
                    <button @click="deleteRole(role)" class="text-red-600 hover:text-red-900">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <!-- Modals -->
    <AddRole v-model:visible="showAddRole" @created="handleRefresh" />
    <Show 
      :visible="showViewRole" 
      :roleId="selectedRoleId" 
      @update:visible="showViewRole = $event" 
      @updated="handleRefresh" 
    />
    <Edit 
      :visible="showEditRole" 
      :roleId="selectedRoleId" 
      @update:visible="showEditRole = $event" 
      @updated="handleRefresh" 
    />
  </MasterLayout>
</template>
