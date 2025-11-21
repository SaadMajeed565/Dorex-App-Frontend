<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Password from '../../volt/Password.vue';
import Button from '../../volt/Button.vue';
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
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

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

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selected = target.files?.[0]
  if (selected && selected.type.startsWith('image/')) {
    file.value = selected
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(selected)
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Invalid File',
      detail: 'Please select an image file (JPG, PNG, etc.)',
      life: 3000,
    })
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  const droppedFile = event.dataTransfer?.files?.[0]
  if (droppedFile && droppedFile.type.startsWith('image/')) {
    file.value = droppedFile
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(droppedFile)
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Invalid File',
      detail: 'Please drop an image file (JPG, PNG, etc.)',
      life: 3000,
    })
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const clearFile = () => {
  file.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
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
          <div class="mt-3">
            <div
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
              :class="[
                'relative flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-200',
                isDragging ? 'border-indigo-500 bg-indigo-50' :
                previewUrl ? 'border-green-400 bg-green-50' :
                'border-gray-300 bg-white hover:border-gray-400'
              ]"
              style="min-height: 200px;"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                class="hidden"
              />
              <div v-if="!previewUrl" class="text-center p-6">
                <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-3"></i>
                <p class="mb-2 text-sm text-gray-600">
                  <span class="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p class="text-xs text-gray-500">JPG, PNG, GIF (MAX. 5MB)</p>
              </div>
              <div v-else class="text-center p-4 w-full">
                <div class="mx-auto w-32 h-32 rounded-lg overflow-hidden ring-2 ring-green-400 bg-gray-50 mb-3">
                  <img :src="previewUrl" alt="Selected profile" class="h-full w-full object-cover" />
                </div>
                <p class="text-sm font-medium text-gray-900 mb-1">{{ file?.name }}</p>
                <p class="text-xs text-gray-500 mb-3">{{ (file?.size ? (file.size / 1024 / 1024).toFixed(2) : '0') }} MB</p>
                <button
                  type="button"
                  @click.stop="clearFile"
                  class="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Change image
                </button>
              </div>
            </div>
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

