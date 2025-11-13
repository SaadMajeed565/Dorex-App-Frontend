<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Password from '../../volt/Password.vue';
import Button from '../../volt/Button.vue';
import FileUpload from 'primevue/fileupload';
import { useToast } from 'primevue/usetoast';
import AutoComplete from '../../volt/AutoComplete.vue';
import { useRolesStore } from '../../stores/rolesStore';

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
const toast = useToast()
const rolesStore = useRolesStore();

const loading = ref(false)
const file = ref<File|null>(null)
const previewUrl = ref<string|null>(null)
const dialogFormRef = ref<HTMLElement|null>(null)

const initialFormState = {
  name: '',
  nic: '',
  email: '',
  login_id: '',
  password: '',
  phone: '',
  alternative_phone: '',
  area: '',
  address: '',
  designation: ''
}
const form = ref({...initialFormState})

const areaList = ref<any[]>([]);
const areaLoading = ref(false);
const selectedArea = ref<any|null>(null);

const selectedRole = ref<any | null>(null);
const roleOptions = computed(() => rolesStore.roles.map((role: any) => ({
  id: role.id,
  name: role.name,
  description: role.description,
})));

const completeRoles = (event: any) => {
  const query = event.query?.toLowerCase() || '';
  event.suggestions = roleOptions.value.filter((role) => {
    const nameMatch = role.name?.toLowerCase().includes(query);
    const descriptionMatch = (role.description ?? '').toLowerCase().includes(query);
    return nameMatch || descriptionMatch;
  });
};

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
  // If no existing matches, allow creation by name (free-typed entry), by allowing user to enter unlisted names
};

watch(selectedRole, (role) => {
  form.value.designation = role?.name || '';
});

const handleFileUpload = (event: any) => {
  const selected = event.files?.[0]
  file.value = selected || null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = selected ? URL.createObjectURL(selected) : null
}

async function submit() {
  loading.value = true
  // If selectedArea is an object, use its name; if it's a string (free-typed), use as is
  if (selectedArea.value && typeof selectedArea.value === 'object') {
    form.value.area = selectedArea.value.name || '';
  } else if (typeof selectedArea.value === 'string') {
    form.value.area = selectedArea.value;
  }
  if (!selectedRole.value?.name) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please select a designation (role) for this employee',
      life: 3000,
    });
    loading.value = false;
    return;
  }
  form.value.designation = selectedRole.value.name;
  try {
    const data = new FormData()
    Object.entries(form.value).forEach(([key, val]) => data.append(key, val ?? ''))
    if (form.value.password) data.append('password_confirmation', form.value.password)
    if (file.value) data.append('profile_photo', file.value)
    await axiosClient.post('/employees', data)
    toast.add({
      severity: 'success', summary: 'Success', detail: 'Employee created successfully!', life: 3000
    })
    form.value = { ...initialFormState }
    file.value = null
    selectedRole.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    emit('close')
  } catch (error: any) {
    toast.add({
      severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Something went wrong.', life: 4000
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, async (v) => {
  if (v) {
    fetchAreas();
    if (!rolesStore.roles.length) {
      await rolesStore.fetchRoles();
    }
    selectedArea.value = areaList.value.find(a => a.name === form.value.area) || null;
    selectedRole.value = roleOptions.value.find(role => role.name === form.value.designation) || null;
  if (!roleOptions.value.length) {
    toast.add({
      severity: 'warn',
      summary: 'No Roles Found',
      detail: 'Please create at least one role before adding employees.',
      life: 4000,
    });
  }
    if (!selectedRole.value && roleOptions.value.length) {
      selectedRole.value = roleOptions.value[0];
      form.value.designation = selectedRole.value.name;
    }
  } else {
    form.value = { ...initialFormState }
    file.value = null
    selectedRole.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
})
</script>

<template>
  <Dialog :visible="visible" :modal="true" :closable="true" header="Add New Employee"
    @update:visible="(v: boolean) => { if (!v) emit('close') }" :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '1080px', maxWidth: '98vw' }">
    <form ref="dialogFormRef" @submit.prevent="submit" class="p-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Section: Basic Information -->
      <div class="lg:col-span-2 space-y-6">
        <div class="rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium tracking-wide text-gray-900">Basic Information</h3>
            <span class="text-[11px] uppercase tracking-wide text-gray-400">Step 1</span>
          </div>
          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <InputText fluid size="small" label="Full Name" v-model="form.name" placeholder="e.g Muhammad Ali" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <InputText fluid size="small" label="Email" v-model="form.email" placeholder="e.g user@mail.com" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">NIC</label>
              <InputText fluid size="small" label="NIC" v-model="form.nic" placeholder="XXXXX-XXXXXXX-X" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <InputText fluid size="small" label="Phone" v-model="form.phone" placeholder="0312-3456789" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Alternative Phone</label>
              <InputText fluid size="small" label="Alternative Phone" v-model="form.alternative_phone" placeholder="0312-3456789" />
            </div>
            <div>
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
              <InputText fluid size="small" label="Address" v-model="form.address" placeholder="Employee address" />
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium tracking-wide text-gray-900">Authentication & Designation</h3>
            <span class="text-[11px] uppercase tracking-wide text-gray-400">Step 2</span>
          </div>
          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Login ID</label>
              <InputText fluid size="small" label="Login ID" v-model="form.login_id" placeholder="Unique login ID" />
        </div>
        <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <Password fluid size="small" v-model="form.password" toggleMask :feedback="false" class="w-full" />
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
                :force-selection="true"
                class="w-full"
              >
                <template #item="{ option }">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900">{{ option.name }}</span>
                    <span v-if="option.description" class="text-xs text-gray-500">{{ option.description }}</span>
                  </div>
                </template>
              </AutoComplete>
              <p class="mt-1 text-xs text-gray-500">
                Choose an existing role. The role controls what this employee can access.
              </p>
            </div>
          </div>
        </div>
      </div>
      <!-- Profile Photo -->
      <div class="lg:col-span-1">
        <div class="rounded-xl border border-gray-100 p-5 sticky top-4">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-900">Profile Photo</label>
            <span class="text-[11px] uppercase tracking-wide text-gray-400">Optional</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">JPG, PNG up to ~2MB.</p>
          <div class="mt-3">
            <FileUpload mode="basic" chooseLabel="Choose Image" accept="image/*" @select="handleFileUpload" />
          </div>
          <div v-if="previewUrl" class="mt-4">
            <div class="aspect-square w-full rounded-xl overflow-hidden ring-1 ring-gray-200 bg-gray-50 flex items-center justify-center">
              <img :src="previewUrl" alt="Selected profile" class="h-full w-full object-cover select-none" />
            </div>
            <p class="mt-2 text-xs text-gray-500">Preview of the selected image.</p>
          </div>
        </div>
        </div>
      <!-- Spacer to avoid footer overlap -->
      <div class="lg:col-span-3 h-2"></div>
      </form>
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <Button label="Cancel" size="small" class="p-outlined" :disabled="loading" @click="emit('close')" />
        <Button label="Save Employee" size="small" icon="pi pi-check" :loading="loading" @click="submit" />
    </div>
    </template>
  </Dialog>
</template>

