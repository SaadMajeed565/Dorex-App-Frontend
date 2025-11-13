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
  category?: string
  quantity?: string
  location?: string
}>({})

// Form data
const initialFormState = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  location: '',
  quantity: null as number | null,
  min_stock: null as number | null,
  max_stock: null as number | null,
  unit_price: null as number | null,
  status: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock',
  supplier: '',
  notes: ''
}

const form = ref({ ...initialFormState })

// Category options
const categoryOptions = [
  { label: 'Cables & Connectors', value: 'Cables & Connectors' },
  { label: 'Network Equipment', value: 'Network Equipment' },
  { label: 'Tools & Hardware', value: 'Tools & Hardware' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Accessories', value: 'Accessories' },
  { label: 'Office Supplies', value: 'Office Supplies' },
  { label: 'Other', value: 'Other' }
]

// Status options
const statusOptions = [
  { label: 'In Stock', value: 'In Stock' },
  { label: 'Low Stock', value: 'Low Stock' },
  { label: 'Out of Stock', value: 'Out of Stock' }
]

// Auto-update status based on quantity and min_stock
watch([() => form.value.quantity, () => form.value.min_stock], () => {
  if (form.value.quantity !== null) {
    if (form.value.quantity <= 0) {
      form.value.status = 'Out of Stock'
    } else if (form.value.min_stock && form.value.quantity <= form.value.min_stock) {
      form.value.status = 'Low Stock'
    } else {
      form.value.status = 'In Stock'
    }
  }
}, { immediate: false })

// Submit function
const submitForm = async () => {
  loading.value = true
  
  // Clear previous errors
  errors.value = {}
  
  // Validate required fields
  let hasErrors = false
  
  if (!form.value.name || form.value.name.trim() === '') {
    errors.value.name = 'Item name is required'
    hasErrors = true
  }
  
  if (!form.value.category || form.value.category.trim() === '') {
    errors.value.category = 'Category is required'
    hasErrors = true
  }
  
  if (form.value.quantity === null || form.value.quantity < 0) {
    errors.value.quantity = 'Quantity is required and must be 0 or greater'
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
      sku: form.value.sku?.trim() || null,
      barcode: form.value.barcode?.trim() || null,
      category: form.value.category,
      location: form.value.location.trim(),
      quantity: form.value.quantity,
      min_stock: form.value.min_stock || null,
      max_stock: form.value.max_stock || null,
      unit_price: form.value.unit_price || null,
      status: form.value.status,
      supplier: form.value.supplier?.trim() || null,
      notes: form.value.notes?.trim() || null
    }

    const res = await axiosClient.post('/inventory', payload)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data.message || 'Inventory item created successfully!',
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
    header="Add New Inventory Item"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '960px', maxWidth: '98vw' }"
  >
    <form
      ref="dialogFormRef"
      @submit.prevent="submitForm"
      class="space-y-6"
    >
      <!-- Name and Category -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Item Name <span class="text-red-500">*</span>
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.name"
            placeholder="e.g., CAT6 Ethernet Cable"
            class="w-full"
          />
          <p v-if="errors.name" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Category <span class="text-red-500">*</span>
          </label>
          <Select
            size="small"
            fluid
            v-model="form.category"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select category"
            class="w-full"
          />
          <p v-if="errors.category" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.category }}</p>
        </div>
      </div>

      <!-- SKU and Barcode -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            SKU (Optional)
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.sku"
            placeholder="e.g., CAT6-10M-BLK"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Barcode (Optional)
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.barcode"
            placeholder="e.g., 1234567890123"
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
            placeholder="e.g., Warehouse A, Shelf B-3"
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
          <p class="mt-1 text-xs text-gray-500">Auto-updates based on quantity</p>
        </div>
      </div>

      <!-- Quantity, Min Stock, Max Stock -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Quantity <span class="text-red-500">*</span>
          </label>
          <InputNumber
            size="small"
            fluid
            v-model="form.quantity"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="0"
            class="w-full"
            placeholder="0"
          />
          <p v-if="errors.quantity" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.quantity }}</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Min Stock (Optional)
          </label>
          <InputNumber
            size="small"
            fluid
            v-model="form.min_stock"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="0"
            class="w-full"
            placeholder="0"
          />
          <p class="mt-1 text-xs text-gray-500">Alert when below this level</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Max Stock (Optional)
          </label>
          <InputNumber
            size="small"
            fluid
            v-model="form.max_stock"
            :min="0"
            :minFractionDigits="0"
            :maxFractionDigits="0"
            class="w-full"
            placeholder="0"
          />
        </div>
      </div>

      <!-- Unit Price and Supplier -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Unit Price (Optional)
          </label>
          <InputNumber
            size="small"
            fluid
            v-model="form.unit_price"
            mode="currency"
            currency="USD"
            :min="0"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            class="w-full"
            placeholder="0.00"
          />
          <p class="mt-1 text-xs text-gray-500">Price per unit</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Supplier (Optional)
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.supplier"
            placeholder="e.g., Supplier Name or Company"
            class="w-full"
          />
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
          placeholder="Additional notes about this item..."
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
          label="Create Item"
          size="small"
          icon="pi pi-check"
          :loading="loading"
          @click="submitForm"
        />
      </div>
    </template>
  </Dialog>
</template>


