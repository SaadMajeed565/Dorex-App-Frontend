<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick } from 'vue';
import axiosClient from '../../../axios';
import { useToast } from 'primevue/usetoast';
import { useRolesStore } from '../../../stores/rolesStore';
import Button from '../../../volt/Button.vue';
import InputText from '../../../volt/InputText.vue';
import Checkbox from '../../../volt/Checkbox.vue';
import Dialog from '../../../volt/Dialog.vue';
import { permissionCategories, totalPermissions } from './permissions';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'created'): void;
}>();

const toast = useToast();
const rolesStore = useRolesStore();
const loading = ref(false);

// Form state
const roleForm = ref({
  name: '',
  description: '',
  permissions: [] as string[]
});

// Check if permission is selected
const isPermissionSelected = (permissionKey: string) => {
  return roleForm.value.permissions.includes(permissionKey);
};

// Toggle permission
const togglePermission = (permissionKey: string) => {
  const index = roleForm.value.permissions.indexOf(permissionKey);
  if (index > -1) {
    roleForm.value.permissions.splice(index, 1);
  } else {
    roleForm.value.permissions.push(permissionKey);
  }
};

// Select all permissions in a category
const selectAllInCategory = (category: typeof permissionCategories[0]) => {
  const categoryPermissions = category.permissions.map(p => p.key);
  const allSelected = categoryPermissions.every(key => 
    roleForm.value.permissions.includes(key)
  );
  
  if (allSelected) {
    categoryPermissions.forEach(key => {
      const index = roleForm.value.permissions.indexOf(key);
      if (index > -1) {
        roleForm.value.permissions.splice(index, 1);
      }
    });
  } else {
    categoryPermissions.forEach(key => {
      if (!roleForm.value.permissions.includes(key)) {
        roleForm.value.permissions.push(key);
      }
    });
  }
};

// Check if all permissions in category are selected
const isCategoryFullySelected = (category: typeof permissionCategories[0]) => {
  return category.permissions.every(p => 
    roleForm.value.permissions.includes(p.key)
  );
};

// Check if any permissions in category are selected
const isCategoryPartiallySelected = (category: typeof permissionCategories[0]) => {
  return category.permissions.some(p => 
    roleForm.value.permissions.includes(p.key)
  );
};

// Select all permissions
const selectAllPermissions = () => {
  const allPermissions = permissionCategories.flatMap(cat => 
    cat.permissions.map(p => p.key)
  );
  roleForm.value.permissions = [...allPermissions];
};

// Deselect all permissions
const deselectAllPermissions = () => {
  roleForm.value.permissions = [];
};

// Reset form
const resetForm = () => {
  roleForm.value = {
    name: '',
    description: '',
    permissions: []
  };
};

// Submit form
const submitForm = async () => {
  if (!roleForm.value.name.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Role name is required',
      life: 3000,
    });
    return;
  }

  if (roleForm.value.permissions.length === 0) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please select at least one permission',
      life: 3000,
    });
    return;
  }

  loading.value = true;
  try {
    const response = await axiosClient.post('/roles', {
      name: roleForm.value.name,
      description: roleForm.value.description,
      permissions: roleForm.value.permissions
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: response.data.message || 'Role created successfully!',
      life: 3000,
    });

    resetForm();
    await rolesStore.fetchRoles();
    emit('created');
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create role. Please try again.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

// Keyboard shortcuts and autofocus when dialog opens
const dialogFormRef = ref<HTMLElement | null>(null);

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (!loading.value) submitForm();
  }
  if (e.key === 'Escape') {
    emit('update:visible', false);
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
      nextTick(() => {
        const root = dialogFormRef.value;
        const candidate = root?.querySelector(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null;
        candidate?.focus();
      });
      window.addEventListener('keydown', handleGlobalKeydown);
    } else {
      window.removeEventListener('keydown', handleGlobalKeydown);
    }
  },
  { immediate: false }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

const selectedCount = ref(0);
watch(
  () => roleForm.value.permissions.length,
  (length) => {
    selectedCount.value = length;
  },
  { immediate: true }
);
</script>

<template>
  <Dialog 
    :visible="props.visible" 
    @update:visible="(v: boolean) => emit('update:visible', v)" 
    modal
    header="Create New Role"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '1200px', maxWidth: '98vw' }"
  >
    <form ref="dialogFormRef" @submit.prevent="submitForm" class="space-y-6">
      <!-- Basic Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Role Name <span class="text-red-500">*</span>
          </label>
          <InputText 
            v-model="roleForm.name" 
            placeholder="e.g., Manager, Technician, Support"
            class="w-full"
            fluid
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <InputText 
            v-model="roleForm.description" 
            placeholder="Brief description of the role"
            class="w-full"
            fluid
          />
        </div>
      </div>

      <!-- Permissions Section -->
      <div class="border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Permissions</h3>
            <p class="text-sm text-gray-500">
              Selected: {{ selectedCount }} of {{ totalPermissions }} permissions
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button 
              type="button"
              label="Select All" 
              size="small" 
              class="p-outlined"
              @click="selectAllPermissions"
            />
            <Button 
              type="button"
              label="Deselect All" 
              size="small" 
              class="p-outlined"
              @click="deselectAllPermissions"
            />
          </div>
        </div>

        <!-- Permission Categories -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          <div 
            v-for="category in permissionCategories" 
            :key="category.category"
            class="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <i :class="category.icon" class="text-indigo-600"></i>
                <h4 class="text-sm font-semibold text-gray-900">{{ category.category }}</h4>
              </div>
              <Checkbox
                :modelValue="isCategoryFullySelected(category)"
                :indeterminate="isCategoryPartiallySelected(category) && !isCategoryFullySelected(category)"
                @update:modelValue="() => selectAllInCategory(category)"
                binary
              />
            </div>
            <div class="space-y-2">
              <label
                v-for="permission in category.permissions"
                :key="permission.key"
                class="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-2 rounded -mx-2"
              >
                <Checkbox
                  :modelValue="isPermissionSelected(permission.key)"
                  @update:modelValue="() => togglePermission(permission.key)"
                  binary
                />
                <span class="text-sm text-gray-700 group-hover:text-gray-900">
                  {{ permission.label }}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
    
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <Button 
          label="Cancel" 
          size="small" 
          class="p-outlined" 
          @click="emit('update:visible', false)" 
        />
        <Button 
          label="Create Role" 
          size="small" 
          icon="pi pi-check" 
          :loading="loading" 
          @click="submitForm" 
        />
      </div>
    </template>
  </Dialog>
</template>

