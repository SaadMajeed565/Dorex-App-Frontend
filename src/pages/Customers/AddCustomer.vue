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
import AutoComplete from '../../volt/AutoComplete.vue'
import Dialog from '../../volt/Dialog.vue'
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore'

const generalSettingsStore = useGeneralSettingsStore()
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit)

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created'): void
}>()

// Toast + state
const toast = useToast()
const customerStore = useCustomerStore()
const loading = ref(false)
const file = ref<File | null>(null)
const errors = ref<Record<string, string[]>>({})

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
  payment_date: null as Date | string | null,
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
const previewUrl = ref<string | null>(null)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

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

// Submit function
const submitForm = async () => {
  loading.value = true
  errors.value = {}
  // If selectedArea is an object, use its name; if it's a string (free-typed), use as is
  if (selectedArea.value && typeof selectedArea.value === 'object') {
    form.value.area = selectedArea.value.name || '';
  } else if (typeof selectedArea.value === 'string') {
    form.value.area = selectedArea.value;
  }
  try {
    const data = new FormData()
    Object.entries(form.value).forEach(([key, val]) => {
      let valueToAppend: string | Blob = ''
      if (val === null || val === undefined) {
        valueToAppend = ''
      } else if (key === 'fee_amount') {
        valueToAppend = String(val)
      } else if (key === 'payment_date') {
        // Ensure consistent date string (yyyy-mm-dd)
        const d = val as Date | string
        if (d instanceof Date) {
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          valueToAppend = `${yyyy}-${mm}-${dd}`
        } else {
          valueToAppend = d
        }
      } else {
        valueToAppend = String(val as any)
      }
      data.append(key, valueToAppend)
    })

    // 🔹 Automatically add password confirmation (no extra input field)
    if (form.value.password) {
      data.append('password_confirmation', form.value.password)
    }
    if (file.value) data.append('profile_photo', file.value)

    const res = await axiosClient.post('/customers', data)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data.message || 'Customer created successfully!',
      life: 3000,
    })

    // reset to initial defaults
    form.value = { ...initialFormState }
    errors.value = {}
    file.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    // Refresh store data
    await customerStore.fetchCustomers()
    emit('created')
    emit('update:visible', false)
  } catch (error: any) {
    if (error.response?.data?.errors) {
      const rawErrors = error.response.data.errors;
      // Transform error messages: show "This field is required" when field is empty
      errors.value = Object.keys(rawErrors).reduce((acc, key) => {
        const fieldValue = form.value[key as keyof typeof form.value];
        const isEmpty = fieldValue === null || fieldValue === undefined || fieldValue === '' || (typeof fieldValue === 'string' && fieldValue.trim() === '');
        acc[key] = rawErrors[key].map((msg: string) => {
          // If field is empty and error mentions "must be" or "required", show friendly message
          if (isEmpty && (msg.toLowerCase().includes('must be') || msg.toLowerCase().includes('required'))) {
            return 'This field is required';
          }
          return msg;
        });
        return acc;
      }, {} as Record<string, string[]>);
    }
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
  (visible) => {
    if (visible) {
      fetchAreas();
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
      // Reset area selection
      selectedArea.value = null;
    }
  },
  { immediate: false }
)
</script>

<template>
  <Dialog :visible="props.visible" @update:visible="(v: boolean) => emit('update:visible', v)" modal
    header="Add New Customer" :closable="true" :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
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
              <InputText fluid size="small" label="Full Name" v-model="form.name" placeholder="e.g Muhammad Ali" 
                :class="{ 'border-rose-500': errors.name }" />
              <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name[0] }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Customer Email</label>
              <InputText fluid size="small" label="Email" v-model="form.email" placeholder="e.g user@mail.com" 
                :class="{ 'border-rose-500': errors.email }" />
              <p v-if="errors.email" class="mt-1 text-xs text-rose-500">{{ errors.email[0] }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Customer NIC</label>
              <InputText fluid size="small" label="NIC" v-model="form.nic" placeholder="XXXXX-XXXXXXX-X" 
                :class="{ 'border-rose-500': errors.nic }" />
              <p v-if="errors.nic" class="mt-1 text-xs text-rose-500">{{ errors.nic[0] }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Customer Phone (Primary)</label>
              <InputText fluid size="small" label="Phone" v-model="form.phone" placeholder="0312-3456789" 
                :class="{ 'border-rose-500': errors.phone }" />
              <p v-if="errors.phone" class="mt-1 text-xs text-rose-500">{{ errors.phone[0] }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Customer Phone (Optional)</label>
              <InputText fluid size="small" label="Alternative Phone" v-model="form.alternative_phone"
                placeholder="0312-3456789" 
                :class="{ 'border-rose-500': errors.alternative_phone }" />
              <p v-if="errors.alternative_phone" class="mt-1 text-xs text-rose-500">{{ errors.alternative_phone[0] }}</p>
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
                :class="{ 'border-rose-500': errors.area }"
                dropdown
              >
                <template #item="{ option }">
                  <div class="flex flex-col">
                    <div class="font-medium text-gray-900">{{ option.name }}</div>
                    <div v-if="option.code" class="text-xs text-gray-500">{{ option.code }}</div>
                  </div>
                </template>
              </AutoComplete>
              <p v-if="errors.area" class="mt-1 text-xs text-rose-500">{{ errors.area[0] }}</p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <InputText fluid size="small" label="Address" v-model="form.address" placeholder="Customer address" 
                :class="{ 'border-rose-500': errors.address }" />
              <p v-if="errors.address" class="mt-1 text-xs text-rose-500">{{ errors.address[0] }}</p>
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
              <InputText fluid size="small" label="Login ID" v-model="form.login_id" placeholder="Unique login ID" 
                :class="{ 'border-rose-500': errors.login_id }" />
              <p v-if="errors.login_id" class="mt-1 text-xs text-rose-500">{{ errors.login_id[0] }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <Password fluid size="small" v-model="form.password" toggleMask :feedback="false" class="w-full" 
                :class="{ 'border-rose-500': errors.password }" />
              <p v-if="errors.password" class="mt-1 text-xs text-rose-500">{{ errors.password[0] }}</p>
              <p v-else class="mt-1 text-xs text-gray-500">Use at least 8 characters, mixing letters and numbers.</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Router Panel ID</label>
              <InputText fluid size="small" label="Panel ID" v-model="form.panel_id" placeholder="Enter panel ID" 
                :class="{ 'border-rose-500': errors.panel_id }" />
              <p v-if="errors.panel_id" class="mt-1 text-xs text-rose-500">{{ errors.panel_id[0] }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Router Panel Password</label>
              <InputText fluid size="small" label="Panel Password" v-model="form.panel_password"
                placeholder="Enter panel password" 
                :class="{ 'border-rose-500': errors.panel_password }" />
              <p v-if="errors.panel_password" class="mt-1 text-xs text-rose-500">{{ errors.panel_password[0] }}</p>
            </div>
            <!-- <Select size="small" label="Current Role" v-model="form.current_role" :options="roles" optionLabel="label" optionValue="value" />
                <Select size="small" label="Status" v-model="form.status" :options="statuses" optionLabel="label" optionValue="value" /> -->
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
                class="w-full" 
                :class="{ 'border-rose-500': errors.fee_amount }" />
              <p v-if="errors.fee_amount" class="mt-1 text-xs text-rose-500">{{ errors.fee_amount[0] }}</p>
              <p v-else class="mt-1 text-xs text-gray-500">Amount charged per billing cycle.</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Payment Date</label>
              <DatePicker size="small" v-model="form.payment_date" dateFormat="yy-mm-dd" class="w-full" 
                :class="{ 'border-rose-500': errors.payment_date }" />
              <p v-if="errors.payment_date" class="mt-1 text-xs text-rose-500">{{ errors.payment_date[0] }}</p>
              <p v-else class="mt-1 text-xs text-gray-500">Format: yyyy-mm-dd.</p>
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
        <Button label="Cancel" size="small" class="p-outlined" @click="emit('update:visible', false)" />
        <Button label="Save Customer" size="small" icon="pi pi-check" :loading="loading" @click="submitForm" />
      </div>
    </template>
  </Dialog>
</template>

<!-- Removed custom InputField component: using InputText consistently -->
