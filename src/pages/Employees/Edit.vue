<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';
import { useRolesStore } from '../../stores/rolesStore';
import Dialog from '../../volt/Dialog.vue';
import Button from '../../volt/Button.vue';
import InputText from '../../volt/InputText.vue';
import Password from '../../volt/Password.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
import FileUpload from 'primevue/fileupload';

const props = defineProps<{ visible: boolean; employeeId: string | number | null }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'updated'): void;
}>();

const toast = useToast();
const rolesStore = useRolesStore();

const loading = ref(false);
const file = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const existingPhotoUrl = ref<string | null>(null);

const areaList = ref<any[]>([]);
const areaLoading = ref(false);
const selectedArea = ref<any | null>(null);

const initialFormState = {
  name: '',
  email: '',
  login_id: '',
  password: '',
  nic: '',
  phone: '',
  alternative_phone: '',
  area: '',
  address: '',
  designation: '',
};

const form = ref({ ...initialFormState });

const roleOptions = computed(() =>
  rolesStore.roles.map((role) => ({
    name: role.name,
    description: role.description,
  })),
);
const selectedRole = ref<any | null>(null);

const fetchAreas = async () => {
  areaLoading.value = true;
  try {
    const response = await axiosClient.get('/areas');
    if (response.data?.status && Array.isArray(response.data?.areas)) {
      areaList.value = response.data.areas;
    } else {
      areaList.value = [];
    }
  } catch {
    areaList.value = [];
  } finally {
    areaLoading.value = false;
  }
};

const completeAreas = (event: any) => {
  const query = event.query?.toLowerCase() || '';
  event.suggestions = areaList.value.filter((area: any) => area.name?.toLowerCase().includes(query));
};

const completeRoles = (event: any) => {
  const query = event.query?.toLowerCase() || '';
  event.suggestions = roleOptions.value.filter((role) => {
    const nameMatch = role.name?.toLowerCase().includes(query);
    const descriptionMatch = (role.description ?? '').toLowerCase().includes(query);
    return nameMatch || descriptionMatch;
  });
};

const dialogFormRef = ref<HTMLElement | null>(null);

const resetForm = () => {
  form.value = { ...initialFormState };
  selectedArea.value = null;
  selectedRole.value = null;
  file.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  existingPhotoUrl.value = null;
};

const loadEmployee = async () => {
  if (!props.employeeId) return;

  loading.value = true;
  try {
    if (!rolesStore.roles.length) {
      await rolesStore.fetchRoles();
    }

    await fetchAreas();

    const res = await axiosClient.get(`/employees/${props.employeeId}`);
    const payload = res.data.employee;

    form.value = {
      name: payload?.name || '',
      email: payload?.email || '',
      login_id: payload?.login_id || '',
      password: '',
      nic: payload?.nic || '',
      phone: payload?.phone || '',
      alternative_phone: payload?.alternative_phone || '',
      area: payload?.area || '',
      address: payload?.address || '',
      designation: payload?.designation || payload?.employee?.designation || '',
    };

    existingPhotoUrl.value = payload?.profile_photo ?? null;

    selectedArea.value =
      areaList.value.find((area: any) => area.name === form.value.area) || form.value.area || null;

    selectedRole.value =
      roleOptions.value.find((role) => role.name === form.value.designation) ||
      (form.value.designation ? { name: form.value.designation } : null);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load employee.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const handleFileUpload = (event: any) => {
  const selected = event.files?.[0];
  file.value = selected || null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = selected ? URL.createObjectURL(selected) : null;
};

const submitForm = async () => {
  if (!props.employeeId) return;

  loading.value = true;
  try {
    if (selectedArea.value && typeof selectedArea.value === 'object') {
      form.value.area = selectedArea.value.name || '';
    } else if (typeof selectedArea.value === 'string') {
      form.value.area = selectedArea.value;
    }

    form.value.designation = selectedRole.value?.name || '';

    const data = new FormData();
    Object.entries(form.value).forEach(([key, val]) => {
      if (key === 'password' && !val) {
        return;
      }
      data.append(key, val ?? '');
    });

    data.append('_method', 'PUT');

    if (form.value.password) {
      data.append('password_confirmation', form.value.password);
    }

    if (file.value) {
      data.append('profile_photo', file.value);
    }

    const res = await axiosClient.post(`/employees/${props.employeeId}`, data);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data?.message || 'Employee updated successfully!',
      life: 3000,
    });

    emit('updated');
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to update employee.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

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
  async (visible) => {
    if (visible) {
      await loadEmployee();
      nextTick(() => {
        const root = dialogFormRef.value;
        const candidate = root?.querySelector(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
        ) as HTMLElement | null;
        candidate?.focus();
      });
      window.addEventListener('keydown', handleGlobalKeydown);
    } else {
      window.removeEventListener('keydown', handleGlobalKeydown);
      resetForm();
    }
  },
  { immediate: false },
);

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Edit Employee"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '1080px', maxWidth: '98vw' }"
  >
    <form ref="dialogFormRef" @submit.prevent="submitForm" class="p-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 space-y-6">
        <div class="rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium tracking-wide text-gray-900">Basic Information</h3>
            <span class="text-[11px] uppercase tracking-wide text-gray-400">Step 1</span>
          </div>
          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <InputText fluid size="small" v-model="form.name" placeholder="e.g Muhammad Ali" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <InputText fluid size="small" v-model="form.email" placeholder="e.g user@mail.com" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">NIC</label>
              <InputText fluid size="small" v-model="form.nic" placeholder="XXXXX-XXXXXXX-X" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <InputText fluid size="small" v-model="form.phone" placeholder="0312-3456789" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Alternative Phone</label>
              <InputText fluid size="small" v-model="form.alternative_phone" placeholder="0312-3456789" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">Area</label>
              <AutoComplete
                v-model="selectedArea"
                :suggestions="areaList"
                @complete="completeAreas"
                option-label="name"
                placeholder="Type or select area"
                size="small"
                fluid
                :loading="areaLoading"
                class="w-full"
                dropdown
              >
                <template #item="{ option }">
                  <div class="flex flex-col">
                    <div class="font-medium text-gray-900">{{ option.name }}</div>
                    <div v-if="option.code" class="text-xs text-gray-500">{{ option.code }}</div>
                  </div>
                </template>
              </AutoComplete>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <InputText fluid size="small" v-model="form.address" placeholder="Employee address" />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium tracking-wide text-gray-900">Access & Designation</h3>
            <span class="text-[11px] uppercase tracking-wide text-gray-400">Step 2</span>
          </div>
          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Login ID</label>
              <InputText fluid size="small" v-model="form.login_id" placeholder="Unique login ID" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <Password fluid size="small" v-model="form.password" toggleMask :feedback="false" class="w-full" />
              <p class="mt-1 text-xs text-gray-500">Leave blank to keep current password.</p>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">Designation</label>
              <AutoComplete
                v-model="selectedRole"
                :suggestions="roleOptions"
                @complete="completeRoles"
                option-label="name"
                placeholder="Select role / designation"
                size="small"
                fluid
                dropdown
                :loading="rolesStore.loading"
                :force-selection="false"
                class="w-full"
              >
                <template #item="{ option }">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900">{{ option.name }}</span>
                    <span v-if="option.description" class="text-xs text-gray-500">{{ option.description }}</span>
                  </div>
                </template>
              </AutoComplete>
              <p class="mt-1 text-xs text-gray-500">Choose an existing role to control permissions.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="rounded-xl border border-gray-100 p-5 sticky top-4">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-900">Profile Photo</label>
            <span class="text-[11px] uppercase tracking-wide text-gray-400">Optional</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">JPG, PNG up to ~2MB.</p>
          <div class="mt-3">
            <FileUpload mode="basic" chooseLabel="Choose New Image" accept="image/*" @select="handleFileUpload" />
          </div>

          <div v-if="existingPhotoUrl && !previewUrl" class="mt-4">
            <div class="aspect-square w-full rounded-xl overflow-hidden ring-1 ring-gray-200 bg-gray-50 flex items-center justify-center">
              <img :src="existingPhotoUrl" alt="Current profile" class="h-full w-full object-cover select-none" />
            </div>
            <p class="mt-2 text-xs text-gray-500">Current profile photo.</p>
          </div>

          <div v-if="previewUrl" class="mt-4">
            <div class="aspect-square w-full rounded-xl overflow-hidden ring-1 ring-gray-200 bg-gray-50 flex items-center justify-center">
              <img :src="previewUrl" alt="New profile" class="h-full w-full object-cover select-none" />
            </div>
            <p class="mt-2 text-xs text-gray-500">Preview of the new image.</p>
          </div>
        </div>
      </div>

      <div class="lg:col-span-3 h-2"></div>
    </form>

    <template #footer>
      <div class="w-full flex items-center justify-between">
        <Button label="Cancel" size="small" class="p-outlined" :disabled="loading" @click="emit('update:visible', false)" />
        <Button label="Update Employee" size="small" icon="pi pi-check" :loading="loading" @click="submitForm" />
      </div>
    </template>
  </Dialog>
</template>
