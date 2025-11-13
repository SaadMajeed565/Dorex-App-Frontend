<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import axiosClient from '../../axios'
import Button from '../../volt/Button.vue'
import AutoComplete from '../../volt/AutoComplete.vue'
import Select from '../../volt/Select.vue'
import DatePicker from '../../volt/DatePicker.vue'
import InputNumber from '../../volt/InputNumber.vue'
import InputText from '../../volt/InputText.vue'
import { useToast } from 'primevue/usetoast'
import Dialog from '../../volt/Dialog.vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created', data: any): void
}>()

interface CustomerOption {
  id: number
  name: string
  email: string
  area: string
}

// Toast + state
const toast = useToast()
const loading = ref(false)

// Error validation
const errors = ref<{
  customer_id?: string
  amount?: string
  currency?: string
  payment_date?: string
}>({})

// Form data
const initialFormState = {
  customer_id: null as CustomerOption | null,
  amount: null as number | null,
  currency: 'USD',
  status: 'pending' as 'paid' | 'pending' | 'failed' | 'refunded',
  payment_date: null as string | null,
  payment_method: '',
  reference: '',
  notes: ''
}

const form = ref({ ...initialFormState })

// Data lists
const customers = ref<CustomerOption[]>([])
const filteredCustomers = ref<CustomerOption[]>([])
const dataLoading = ref(true)

// Payment method options
const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Debit Card', value: 'debit_card' },
  { label: 'Mobile Payment', value: 'mobile_payment' },
  { label: 'Other', value: 'other' }
]

// Status options
const statusOptions = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' }
]

// Currency options
const currencyOptions = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'PKR - Pakistani Rupee', value: 'PKR' },
  { label: 'INR - Indian Rupee', value: 'INR' }
]

// Fetch customers from API
onMounted(async () => {
  try {
    const customersRes = await axiosClient.get('/customers')

    customers.value =
      customersRes.data.customers?.map((c: any) => ({
        id: c.customer.id,
        name: c.name || `Customer #${c.customer.id}`,
        email: c.email,
        area: c.area || ''
      })) || []

    filteredCustomers.value = [...customers.value]
  } catch (error) {
    console.error('Error loading customers:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load customer data.',
      life: 4000
    })
  } finally {
    dataLoading.value = false
  }
})

// Autocomplete search for customers
const searchCustomers = (event: any) => {
  const query = event.query.toLowerCase()
  filteredCustomers.value = customers.value.filter(
    c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.area.toLowerCase().includes(query)
  )
}

// Submit function
const submitForm = async () => {
  loading.value = true
  
  // Clear previous errors
  errors.value = {}
  
  // Validate required fields
  let hasErrors = false
  
  if (!form.value.customer_id) {
    errors.value.customer_id = 'Customer is required'
    hasErrors = true
  }
  
  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Amount is required and must be greater than 0'
    hasErrors = true
  }
  
  if (!form.value.currency) {
    errors.value.currency = 'Currency is required'
    hasErrors = true
  }

  if (!form.value.payment_date) {
    errors.value.payment_date = 'Payment date is required'
    hasErrors = true
  }
  
  if (hasErrors) {
    loading.value = false
    return
  }
  
  try {
    // Convert amount to cents for API (InputNumber in currency mode gives us dollars)
    const amountInCents = Math.round((form.value.amount || 0) * 100)
    
    const payload = {
      customer_id: form.value.customer_id!.id,
      amount: amountInCents,
      currency: form.value.currency,
      status: form.value.status,
      payment_date: form.value.payment_date,
      payment_method: form.value.payment_method || null,
      reference: form.value.reference || null,
      notes: form.value.notes || null
    }

    const res = await axiosClient.post('/payments', payload)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data.message || 'Payment created successfully!',
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
      filteredCustomers.value = [...customers.value]
      
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
    header="Add New Payment"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '960px', maxWidth: '98vw' }"
  >
    <form
      ref="dialogFormRef"
      @submit.prevent="submitForm"
      class="p-4 space-y-6"
    >
      <!-- Customer Selection -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">
          Customer <span class="text-red-500">*</span>
        </label>
        <AutoComplete
          size="small"
          fluid
          v-model="form.customer_id"
          :suggestions="filteredCustomers"
          @complete="searchCustomers"
          :optionLabel="(c) => `${c.name} - ${c.area}`"
          placeholder="Search customers by name, email, or area"
          class="w-full"
          :minLength="1"
          :disabled="dataLoading"
        >
        </AutoComplete>
        <p v-if="errors.customer_id" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.customer_id }}</p>
      </div>

      <!-- Amount and Currency -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Amount <span class="text-red-500">*</span>
          </label>
          <InputNumber
            size="small"
            fluid
            v-model="form.amount"
            mode="currency"
            :currency="form.currency"
            :locale="'en-US'"
            :min="0"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            class="w-full"
            placeholder="0.00"
          />
          <p v-if="errors.amount" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.amount }}</p>
          <p v-else class="mt-1 text-xs text-gray-500">Enter the payment amount in {{ form.currency }}</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Currency <span class="text-red-500">*</span>
          </label>
          <Select
            size="small"
            fluid
            v-model="form.currency"
            :options="currencyOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
          <p v-if="errors.currency" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.currency }}</p>
        </div>
      </div>

      <!-- Payment Date and Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Payment Date <span class="text-red-500">*</span>
          </label>
          <DatePicker
            size="small"
            fluid
            v-model="form.payment_date"
            placeholder="Select payment date"
            class="w-full"
            dateFormat="yy-mm-dd"
          />
          <p v-if="errors.payment_date" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.payment_date }}</p>
          <p v-else class="mt-1 text-xs text-gray-500">Format: yyyy-mm-dd</p>
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

      <!-- Payment Method and Reference -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Payment Method (Optional)
          </label>
          <Select
            size="small"
            fluid
            v-model="form.payment_method"
            :options="paymentMethods"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Reference (Optional)
          </label>
          <InputText
            size="small"
            fluid
            v-model="form.reference"
            placeholder="Transaction reference or ID"
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
          placeholder="Additional notes about this payment..."
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
          label="Create Payment"
          size="small"
          icon="pi pi-check"
          :loading="loading"
          @click="submitForm"
        />
      </div>
    </template>
  </Dialog>
</template>

