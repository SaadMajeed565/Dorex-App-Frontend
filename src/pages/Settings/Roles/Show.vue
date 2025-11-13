<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../../axios';
import Dialog from '../../../volt/Dialog.vue';
import { useToast } from 'primevue/usetoast';
import { permissionCategories } from './permissions';

// Props & Emits
const props = defineProps<{
  visible: boolean;
  roleId: string | number | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'updated'): void;
}>();

// State
const role = ref<any>(null);
const toast = useToast();

// Get permission labels for display
const normalizePermissions = (rawPermissions: any): string[] => {
  if (!Array.isArray(rawPermissions)) {
    return [];
  }

  return rawPermissions
    .map((permission: any) => {
      if (!permission) return null;
      if (typeof permission === 'string') return permission;
      if (typeof permission === 'object') return permission.name ?? permission.key ?? null;
      return null;
    })
    .filter((permission): permission is string => Boolean(permission));
};

const getPermissionLabels = (roleData: any) => {
  const permissions = normalizePermissions(roleData?.permissions);
  const allPermissions = permissionCategories.flatMap(cat => cat.permissions);

  return permissions.map((key: string) => {
    const perm = allPermissions.find(p => p.key === key);
    return perm ? perm.label : key;
  });
};

// Get permission count
const getPermissionCount = (roleData: any) => {
  return normalizePermissions(roleData?.permissions).length;
};

// Load role data
const loadRole = async () => {
  if (!props.roleId) return;
  try {
    const res = await axiosClient.get(`/roles/${props.roleId}`);
    const payload = res.data.role || res.data;
    role.value = {
      ...payload,
      permissions: normalizePermissions(payload?.permissions),
    };
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load role data.',
      life: 4000,
    });
  }
};

// Watch for changes in visibility or roleId
watch(
  () => [props.visible, props.roleId],
  async ([visible, id]) => {
    if (visible && id) await loadRole();
  },
  { immediate: true }
);
</script>

<template>
  <Dialog 
    :visible="props.visible" 
    @update:visible="(v: boolean) => emit('update:visible', v)" 
    modal
    header="Role Details"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '800px' }"
  >
    <div v-if="role" class="space-y-6">
      <!-- Basic Information -->
      <div>
        <h3 class="text-sm font-medium text-gray-500 mb-2">Role Name</h3>
        <p class="text-base text-gray-900">{{ role.name }}</p>
      </div>
      <div>
        <h3 class="text-sm font-medium text-gray-500 mb-2">Description</h3>
        <p class="text-base text-gray-900">{{ role.description || 'No description' }}</p>
      </div>
      <div>
        <h3 class="text-sm font-medium text-gray-500 mb-2">Permissions ({{ getPermissionCount(role) }})</h3>
        <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          <div 
            v-for="(label, index) in getPermissionLabels(role)" 
            :key="index"
            class="flex items-center gap-2 p-2 rounded bg-gray-50"
          >
            <i class="fa-light fa-check-circle text-green-600"></i>
            <span class="text-sm text-gray-700">{{ label }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="p-8 text-center text-gray-500">
      <i class="fa-light fa-spinner fa-spin text-2xl mb-2"></i>
      <p>Loading role details...</p>
    </div>
  </Dialog>
</template>

