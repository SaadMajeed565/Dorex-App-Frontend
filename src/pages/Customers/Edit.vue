<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick, computed, onMounted } from 'vue'
import axiosClient from '../../axios'
import { useToast } from 'primevue/usetoast'
import { useCustomerStore } from '../../stores/customerStore'
import Button from '../../volt/Button.vue'
import InputText from '../../volt/InputText.vue'
import DatePicker from '../../volt/DatePicker.vue'
import InputNumber from '../../volt/InputNumber.vue'
import Password from '../../volt/Password.vue'
import Select from '../../volt/Select.vue'
import AutoComplete from '../../volt/AutoComplete.vue'
import Dialog from '../../volt/Dialog.vue'
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore'

const generalSettingsStore = useGeneralSettingsStore()
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit)

const props = defineProps<{ visible: boolean; customerId: string | number | null }>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'updated'): void
}>()
const toast = useToast()
const customerStore = useCustomerStore()

// Toast + state
const loading = ref(false)
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const existingPhotoUrl = ref<string | null>(null)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Dropdown options
const roles = [
  { label: 'Customer', value: 'customer' },
  { label: 'Admin', value: 'admin' },
]

const statuses = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
]

// Form fields (combined for both tables)
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
  current_role: 'customer',
  status: 'active',
  fee_amount: null as number | null,
  payment_date: null as Date | null,
  panel_id: '',
  panel_password: '',
}

const form = ref({ ...initialFormState })

// Area autocomplete
const areaList = ref<any[]>([]);
const areaLoading = ref(false);
const selectedArea = ref<any|null>(null);

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

// File handler - Drag and Drop
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

// Load customer data when dialog opens
const loadCustomer = async () => {
  if (!props.customerId) return
  try {
    const res = await axiosClient.get(`/customers/${props.customerId}`)
    const customer = res.data.customer
    console.log(res);
    

    form.value = {
      name: customer.name || '',
      email: customer.email || '',
      login_id: customer.login_id || '',
      password: '',
      nic: customer.nic || '',
      phone: customer.phone || '',
      alternative_phone: customer.alternative_phone || '',
      area: customer.area || '',
      address: customer.address || '',
      current_role: customer.current_role || 'customer',
      status: customer.status || 'active',
      fee_amount: customer.customer.fee_amount || null,
      payment_date: customer.customer.payment_date || null,
      panel_id: customer.customer.panel_id || '',
      panel_password: customer.customer.panel_password || '',
    }

    existingPhotoUrl.value = customer.profile_photo || null
    
    // Sync selectedArea with form.area after areas are loaded
    await fetchAreas();
    selectedArea.value = areaList.value.find(a => a.name === form.value.area) || form.value.area || null;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load customer data.',
      life: 4000,
    })
  }
}

// Submit function
const submitForm = async () => {
  loading.value = true
  // If selectedArea is an object, use its name; if it's a string (free-typed), use as is
  if (selectedArea.value && typeof selectedArea.value === 'object') {
    form.value.area = selectedArea.value.name || '';
  } else if (typeof selectedArea.value === 'string') {
    form.value.area = selectedArea.value;
  }
  try {
    const id = props.customerId
    if (!id) throw new Error('Missing customer id')
    const data = new FormData()
    
    Object.entries(form.value).forEach(([key, val]) => {
      let valueToAppend: string | Blob = ''
      if (val === null || val === undefined) {
        valueToAppend = ''
      } else if (key === 'fee_amount') {
        valueToAppend = String(val)
      } else if (key === 'payment_date') {
        // Ensure consistent date string (yyyy-mm-dd)
        const d = val as Date | null
        if (d instanceof Date) {
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          valueToAppend = `${yyyy}-${mm}-${dd}`
        } else {
          valueToAppend = ''
        }
      } else {
        valueToAppend = String(val as any)
      }
      data.append(key, valueToAppend)
    })
    data.append('_method', 'PUT')

    // Only add password confirmation if password is provided
    if (form.value.password) {
      data.append('password_confirmation', form.value.password)
    }
    
    if (file.value) data.append('profile_photo', file.value)

    const res = await axiosClient.post(`/customers/${id}`, data)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data.message || 'Customer updated successfully!',
      life: 3000,
    })

    // Refresh store data
    await customerStore.fetchCustomers()
    emit('updated')
    emit('update:visible', false)
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Something went wrong.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

// Keyboard shortcuts and autofocus when dialog opens
const dialogFormRef = ref<HTMLElement | null>(null)

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (!loading.value) submitForm()
  }
  if (e.key === 'Escape') {
    emit('update:visible', false)
  }
}

onMounted(async () => {
  await generalSettingsStore.fetchSettings()
})

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadCustomer()
      nextTick(() => {
        const root = dialogFormRef.value
        const candidate = root?.querySelector(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null
        candidate?.focus()
      })
      window.addEventListener('keydown', handleGlobalKeydown)
    } else {
      window.removeEventListener('keydown', handleGlobalKeydown)
    }
  },
  { immediate: false }
)
</script>

<template>
  <Dialog :visible="props.visible" @update:visible="(v: boolean) => emit('update:visible', v)" modal
    header="Edit Customer" :closable="true" :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '1080px', maxWidth: '98vw' }">
    <form ref="dialogFormRef" @submit.prevent="submitForm" class="p-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Section: Basic Information -->
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium tracking-wide text-gray-900">Basic information</h3>
              <span class="text-[11px] uppercase tracking-wide text-gray-400">Step 1</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">Customer identity and contact details.</p>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Customer Name</label>
                <InputText fluid size="small" label="Full Name" v-model="form.name" placeholder="e.g Muhammad Ali" />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Customer Email</label>
                <InputText fluid size="small" label="Email" v-model="form.email" placeholder="e.g user@mail.com" />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Customer NIC</label>
                <InputText fluid size="small" label="NIC" v-model="form.nic" placeholder="XXXXX-XXXXXXX-X" />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Customer Phone (Primary)</label>
                <InputText fluid size="small" label="Phone" v-model="form.phone" placeholder="0312-3456789" />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Customer Phone (Optional)</label>
                <InputText fluid size="small" label="Alternative Phone" v-model="form.alternative_phone"
                  placeholder="0312-3456789" />
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
                <InputText fluid size="small" label="Address" v-model="form.address" placeholder="Customer address" />
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium tracking-wide text-gray-900">Access & authentication</h3>
              <span class="text-[11px] uppercase tracking-wide text-gray-400">Step 2</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">Credentials and authorization.</p>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Login ID</label>
                <InputText fluid size="small" label="Login ID" v-model="form.login_id" placeholder="Unique login ID" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <Password fluid size="small" v-model="form.password" toggleMask :feedback="false" class="w-full" />
                <p class="mt-1 text-xs text-gray-500">Leave blank to keep current password.</p>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Router Panel ID</label>
                <InputText fluid size="small" label="Panel ID" v-model="form.panel_id" placeholder="Enter panel ID" />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Router Panel Password</label>
                <InputText fluid size="small" label="Panel Password" v-model="form.panel_password"
                  placeholder="Enter panel password" />
              </div>

          <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Current Role</label>
                <Select size="small" fluid label="Current Role" v-model="form.current_role" :options="roles" optionLabel="label" optionValue="value" />
          </div>
          <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <Select size="small" fluid label="Status" v-model="form.status" :options="statuses" optionLabel="label" optionValue="value" />
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium tracking-wide text-gray-900">Billing</h3>
              <span class="text-[11px] uppercase tracking-wide text-gray-400">Step 3</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">Set subscription fee and next payment date.</p>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Fee Amount</label>
                <InputNumber size="small" v-model="form.fee_amount" mode="currency" :currency="tenantCurrency"
                  class="w-full" />
                <p class="mt-1 text-xs text-gray-500">Amount charged per billing cycle.</p>
          </div>
          <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Payment Date</label>
                <DatePicker size="small" v-model="form.payment_date" dateFormat="yy-mm-dd" class="w-full" />
                <p class="mt-1 text-xs text-gray-500">Format: yyyy-mm-dd.</p>
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
                  existingPhotoUrl ? 'border-blue-300 bg-blue-50' :
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
                <!-- Show existing photo if no new one selected -->
                <div v-if="existingPhotoUrl && !previewUrl" class="text-center p-4 w-full">
                  <div class="mx-auto w-32 h-32 rounded-lg overflow-hidden ring-2 ring-blue-400 bg-gray-50 mb-3">
                    <img :src="existingPhotoUrl" alt="Current profile" class="h-full w-full object-cover" />
                  </div>
                  <p class="text-sm font-medium text-gray-900 mb-1">Current Photo</p>
                  <p class="text-xs text-gray-500 mb-3">Click or drag to replace</p>
                  <button
                    type="button"
                    @click.stop="triggerFileInput"
                    class="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Change image
                  </button>
                </div>
                <!-- Show upload zone if no existing photo and no preview -->
                <div v-else-if="!previewUrl" class="text-center p-6">
                  <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-3"></i>
                  <p class="mb-2 text-sm text-gray-600">
                    <span class="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p class="text-xs text-gray-500">JPG, PNG, GIF (MAX. 5MB)</p>
                </div>
                <!-- Show new photo preview -->
                <div v-else class="text-center p-4 w-full">
                  <div class="mx-auto w-32 h-32 rounded-lg overflow-hidden ring-2 ring-green-400 bg-gray-50 mb-3">
                    <img :src="previewUrl" alt="New profile" class="h-full w-full object-cover" />
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
          <Button label="Cancel" size="small" class="p-outlined" @click="emit('update:visible', false)" />
          <Button label="Update Customer" size="small" icon="pi pi-check" :loading="loading" @click="submitForm" />
        </div>
      </template>
  </Dialog>
</template>

