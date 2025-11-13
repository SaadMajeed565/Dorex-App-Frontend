<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from '../../volt/Dialog.vue';
import axiosClient from '../../axios';
import { useAuthStore } from '../../stores/authStore';

const props = defineProps<{ visible: boolean; employeeId: string | number | null }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'edit', value: string | number): void;
}>();

const authStore = useAuthStore();
const canUpdateEmployee = computed(() => authStore.hasPermission('update-employee'));

const loading = ref(false);
const employee = ref<any>(null);

watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.employeeId) {
      loading.value = true;
      try {
        const res = await axiosClient.get(`/employees/${props.employeeId}`);
        employee.value = res.data.employee;
      } catch (error) {
        console.error('Failed to load employee', error);
        employee.value = null;
      } finally {
        loading.value = false;
      }
    } else if (!visible) {
      employee.value = null;
    }
  },
  { immediate: false },
);

const triggerEdit = () => {
  if (!employee.value) return;
  emit('update:visible', false);
  emit('edit', employee.value.employee?.id);
};

const updateVisible = (value: boolean) => {
  emit('update:visible', value);
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="updateVisible"
    modal
    header="Employee Details"
    :closable="true"
    :style="{ width: '540px', maxWidth: '97vw' }"
  >
    <div v-if="loading" class="py-8 text-center text-gray-500">
      <i class="fa-light fa-spinner fa-spin text-2xl"></i>
    </div>
    <div v-else-if="employee" class="space-y-4 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 overflow-hidden">
            <img
              v-if="employee.profile_photo"
              :src="employee.profile_photo"
              class="h-14 w-14 rounded-full object-cover"
            />
            <span v-else>{{ employee.name?.charAt(0) || '?' }}</span>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ employee.name || 'Unknown' }}</h2>
            <div class="text-xs text-gray-500">ID: #{{ employee.id }}</div>
          </div>
        </div>
        <button
          v-if="canUpdateEmployee"
          class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          @click="triggerEdit"
        >
          <i class="fa-light fa-pen-to-square text-sm"></i>
          Edit
        </button>
      </div>

      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm">
        <div>
          <dt class="text-gray-500">Email</dt>
          <dd class="text-gray-900">{{ employee.email || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Phone</dt>
          <dd class="text-gray-900">{{ employee.phone || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">NIC</dt>
          <dd class="text-gray-900">{{ employee.nic || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Area</dt>
          <dd class="text-gray-900">{{ employee.area || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Designation</dt>
          <dd class="text-gray-900">{{ employee.designation || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Status</dt>
          <dd class="text-gray-900">{{ employee.status || '-' }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-gray-500">Roles</dt>
          <dd class="text-gray-900">
            <template v-if="employee.roles && employee.roles.length">
              {{ employee.roles.join(', ') }}
            </template>
            <template v-else>-</template>
          </dd>
        </div>
      </dl>
    </div>
    <div v-else class="py-4 text-sm text-gray-500">No data found.</div>
  </Dialog>
</template>
