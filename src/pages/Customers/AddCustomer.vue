<script setup lang="ts">
import { ref, onBeforeUnmount, watch, nextTick } from 'vue'
import axiosClient from '../../axios'
import { useToast } from 'primevue/usetoast'
import { useCustomerStore } from '../../stores/customerStore'
import Button from '../../volt/Button.vue'
import InputText from '../../volt/InputText.vue'
import DatePicker from '../../volt/DatePicker.vue'
import InputNumber from '../../volt/InputNumber.vue'
import Password from '../../volt/Password.vue'
import AutoComplete from '../../volt/AutoComplete.vue'
import FileUpload from 'primevue/fileupload'
import Dialog from '../../volt/Dialog.vue'

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

// File handler
const previewUrl = ref<string | null>(null)

const handleFileUpload = (event: any) => {
  const selected = event.files?.[0]
  file.value = selected || null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = selected ? URL.createObjectURL(selected) : null
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
              <p class="mt-1 text-xs text-gray-500">Use at least 8 characters, mixing letters and numbers.</p>
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
              <InputNumber size="small" v-model="form.fee_amount" mode="currency" currency="PKR" locale="en-PK"
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
          <p class="text-sm text-gray-500 mt-1">JPG, PNG up to ~2MB.</p>
          <div class="mt-3">
            <FileUpload mode="basic" chooseLabel="Choose Image" accept="image/*" @select="handleFileUpload" />
          </div>
          <div v-if="previewUrl" class="mt-4">
            <div
              class="aspect-square w-full rounded-xl overflow-hidden ring-1 ring-gray-200 bg-gray-50 flex items-center justify-center">
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
        <Button label="Cancel" size="small" class="p-outlined" @click="emit('update:visible', false)" />
        <Button label="Save Customer" size="small" icon="pi pi-check" :loading="loading" @click="submitForm" />
      </div>
    </template>
  </Dialog>
</template>

<!-- Removed custom InputField component: using InputText consistently -->
