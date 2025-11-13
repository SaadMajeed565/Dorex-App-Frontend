<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import axiosClient from '../../axios'
import Button from '../../volt/Button.vue'
import Select from '../../volt/Select.vue'
import InputNumber from '../../volt/InputNumber.vue'
import InputText from '../../volt/InputText.vue'
import { useToast } from 'primevue/usetoast'
import Dialog from '../../volt/Dialog.vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created', data: any): void
}>()

// Toast + state
const toast = useToast()
const loading = ref(false)

// Error validation
const errors = ref<{
  name?: string
  type?: string
  model?: string
  serial_number?: string
  location?: string
  status?: string
}>({})

// Form data
const initialFormState = {
  name: '',
  type: '',
  model: '',
  serial_number: '',
  location: '',
  status: 'Active' as 'Active' | 'Maintenance' | 'Planned' | 'Offline',
  uptime: null as number | null,
  utilization: null as number | null,
  notes: ''
}

const form = ref({ ...initialFormState })

// Equipment type options
const typeOptions = [
  { label: 'Router', value: 'Router' },
  { label: 'Switch', value: 'Switch' },
  { label: 'Access Point', value: 'Access Point' },
  { label: 'Modem', value: 'Modem' },
  { label: 'Gateway', value: 'Gateway' },
  { label: 'Firewall', value: 'Firewall' },
  { label: 'Other', value: 'Other' }
]

// Status options
const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'Planned', value: 'Planned' },
  { label: 'Offline', value: 'Offline' }
]

// Submit function
const submitForm = async () => {
  loading.value = true
  
  // Clear previous errors
  errors.value = {}
  
  // Validate required fields
  let hasErrors = false
  
  if (!form.value.name || form.value.name.trim() === '') {
    errors.value.name = 'Equipment name is required'
    hasErrors = true
  }
  
  if (!form.value.type || form.value.type.trim() === '') {
    errors.value.type = 'Equipment type is required'
    hasErrors = true
  }
  
  if (!form.value.location || form.value.location.trim() === '') {
    errors.value.location = 'Location is required'
    hasErrors = true
  }
  
  if (hasErrors) {
    loading.value = false
    return
  }
  
  try {
    const payload = {
      name: form.value.name.trim(),
      type: form.value.type,
      model: form.value.model?.trim() || null,
      serial_number: form.value.serial_number?.trim() || null,
      location: form.value.location.trim(),
      status: form.value.status,
      uptime: form.value.uptime || null,
      utilization: form.value.utilization || null,
      notes: form.value.notes?.trim() || null
    }

    const res = await axiosClient.post('/equipments', payload)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data.message || 'Equipment created successfully!',
      life: 3000
    })

    // Reset form to initial state
    form.value = { ...initialFormState }
    emit('created', res.data)
    emit('update:visible', false)
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Something went wrong.',
      life: 4000
    })
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  // Cleanup if needed
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
      // Reset form when dialog opens
      form.value = { ...initialFormState }
      errors.value = {}
      
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
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Add New Equipment"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '960px', maxWidth: '98vw' }"
  >
    <form
      ref="dialogFormRef"
      @submit.prevent="submitForm"
      class="space-y-6"
    >
      <!-- Name and Type -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Equipment Name <span class="text-red-500">*</span>
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.name"
            placeholder="e.g., Main Router - Building A"
            class="w-full"
          />
          <p v-if="errors.name" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Type <span class="text-red-500">*</span>
          </label>
          <Select
            size="small"
            fluid
            v-model="form.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select equipment type"
            class="w-full"
          />
          <p v-if="errors.type" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.type }}</p>
        </div>
      </div>

      <!-- Model and Serial Number -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Model (Optional)
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.model"
            placeholder="e.g., Cisco Catalyst 2960"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Serial Number (Optional)
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.serial_number"
            placeholder="e.g., SN123456789"
            class="w-full"
          />
        </div>
      </div>

      <!-- Location and Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Location <span class="text-red-500">*</span>
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.location"
            placeholder="e.g., Building A - Room 101"
            class="w-full"
          />
          <p v-if="errors.location" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.location }}</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Status
          </label>
          <Select
            size="small"
            fluid
            v-model="form.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <!-- Uptime and Utilization -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Uptime % (Optional)
          </label>
          <InputNumber
            size="small"
            fluid
            v-model="form.uptime"
            :min="0"
            :max="100"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            suffix="%"
            class="w-full"
            placeholder="0.00"
          />
          <p class="mt-1 text-xs text-gray-500">Current uptime percentage (0-100)</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Utilization % (Optional)
          </label>
          <InputNumber
            size="small"
            fluid
            v-model="form.utilization"
            :min="0"
            :max="100"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            suffix="%"
            class="w-full"
            placeholder="0.00"
          />
          <p class="mt-1 text-xs text-gray-500">Current resource utilization (0-100)</p>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Additional notes about this equipment..."
        ></textarea>
      </div>
    </form>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end items-center gap-3 p-3 border-t border-gray-100">
        <Button
          label="Cancel"
          size="small"
          class="p-outlined"
          @click="emit('update:visible', false)"
        />
        <Button
          label="Create Equipment"
          size="small"
          icon="pi pi-check"
          :loading="loading"
          @click="submitForm"
        />
      </div>
    </template>
  </Dialog>
</template>

