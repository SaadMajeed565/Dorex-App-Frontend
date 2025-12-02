<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import axiosClient from '../../axios'
import Button from '../../volt/Button.vue'
import AutoComplete from '../../volt/AutoComplete.vue'
import Select from '../../volt/Select.vue'
import DatePicker from '../../volt/DatePicker.vue'
import InputNumber from '../../volt/InputNumber.vue'
import InputText from '../../volt/InputText.vue'
import { useToast } from 'primevue/usetoast'
import Dialog from '../../volt/Dialog.vue'
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore'

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

interface Subscription {
  id: number
  package_name: string
  status: string
  package_snapshot?: {
    name: string
    sale_price: number
  }
}

interface AccountOption {
  id: number
  account_number: string | null
  employee_id: number
  employee_name: string
  employee_email: string
  employee_designation: string
  current_balance: number
}

// Toast + state
const toast = useToast()
const loading = ref(false)
const generalSettingsStore = useGeneralSettingsStore()
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit)

// Error validation
const errors = ref<Record<string, string[]>>({})

// Form data - currency will be set from tenant settings
const getInitialFormState = () => ({
  customer_id: null as CustomerOption | null,
  subscription_id: null as number | null,
  account_id: null as number | null,
  employee_id: null as number | null,
  amount: null as number | null,
  currency: tenantCurrency.value,
  status: 'pending' as 'paid' | 'pending' | 'failed' | 'refunded',
  payment_date: null as Date | null,
  payment_method: '',
  reference: '',
  notes: ''
})

const initialFormState = getInitialFormState()

const form = ref({ ...initialFormState })

// Data lists
const customers = ref<CustomerOption[]>([])
const filteredCustomers = ref<CustomerOption[]>([])
const subscriptions = ref<Subscription[]>([])
const loadingSubscriptions = ref(false)
const accounts = ref<AccountOption[]>([])
const loadingAccounts = ref(false)
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

// Fetch active accounts for collection
const fetchActiveAccounts = async () => {
  loadingAccounts.value = true
  try {
    const res = await axiosClient.get('/accounts/active')
    if (res.data?.status && Array.isArray(res.data?.data)) {
      accounts.value = res.data.data
    } else {
      accounts.value = []
    }
  } catch (error) {
    console.error('Error loading accounts:', error)
    accounts.value = []
  } finally {
    loadingAccounts.value = false
  }
}

// Fetch customers from API
onMounted(async () => {
  // Load general settings to get currency
  await generalSettingsStore.fetchSettings()
  
  // Update form currency to match tenant settings
  form.value.currency = tenantCurrency.value
  
  // Fetch accounts and customers in parallel
  await Promise.all([
    fetchActiveAccounts(),
    (async () => {
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
    })()
  ])
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

// Fetch subscriptions for selected customer
const fetchSubscriptions = async (customerId: number) => {
  if (!customerId) {
    subscriptions.value = []
    return
  }
  
  loadingSubscriptions.value = true
  try {
    const res = await axiosClient.get(`/customers/${customerId}/subscriptions`)
    let raw: any[] = []
    if (Array.isArray(res?.data?.data?.data)) raw = res.data.data.data
    else if (Array.isArray(res?.data?.data)) raw = res.data.data
    else if (Array.isArray(res?.data)) raw = res.data

    subscriptions.value = raw.map((s) => ({
      id: s.id,
      package_name: s.package_snapshot?.name || s.package?.name || 'Unknown Package',
      status: s.status,
      package_snapshot: s.package_snapshot,
    }))
  } catch (err) {
    console.error('Error fetching subscriptions:', err)
    subscriptions.value = []
  } finally {
    loadingSubscriptions.value = false
  }
}

// Watch for customer selection change
watch(() => form.value.customer_id, (newCustomer) => {
  if (newCustomer) {
    fetchSubscriptions(newCustomer.id)
  } else {
    form.value.subscription_id = null
    subscriptions.value = []
  }
})

// Watch for subscription change to auto-populate amount
watch(() => form.value.subscription_id, (newId) => {
  if (newId) {
    const subscription = subscriptions.value.find(s => s.id === newId)
    if (subscription?.package_snapshot?.sale_price) {
      form.value.amount = subscription.package_snapshot.sale_price
    }
  }
})

// Watch for account selection to auto-set employee_id
watch(() => form.value.account_id, (newAccountId) => {
  if (newAccountId) {
    const account = accounts.value.find(a => a.id === newAccountId)
    if (account) {
      form.value.employee_id = account.employee_id
    }
  } else {
    form.value.employee_id = null
  }
})

// Submit function
const submitForm = async () => {
  loading.value = true
  
  // Clear previous errors
  errors.value = {}
  
  try {
    // Convert amount to cents for API (InputNumber in currency mode gives us dollars)
    const amountInCents = Math.round((form.value.amount || 0) * 100)
    
    // Format date to YYYY-MM-DD string
    const formatDate = (date: Date | null): string | null => {
      if (!date) return null
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    const payload = {
      customer_id: form.value.customer_id!.id,
      subscription_id: form.value.subscription_id || null,
      account_id: form.value.account_id || null,
      employee_id: form.value.employee_id || null,
      amount: amountInCents,
      currency: form.value.currency,
      status: form.value.status,
      pay_date: formatDate(form.value.payment_date),
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

    // Reset form to initial state with current tenant currency
    form.value = { ...getInitialFormState() }
    emit('created', res.data)
    emit('update:visible', false)
  } catch (error: any) {
    if (error.response?.data?.errors) {
      const rawErrors = error.response.data.errors;
      // Transform error messages: show "This field is required" when field is empty
      errors.value = Object.keys(rawErrors).reduce((acc, key) => {
        let fieldValue: any;
        if (key === 'customer_id') {
          fieldValue = form.value.customer_id;
        } else {
          fieldValue = form.value[key as keyof typeof form.value];
        }
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
      // Reset form when dialog opens with current tenant currency
      form.value = { ...getInitialFormState() }
      errors.value = {}
      filteredCustomers.value = [...customers.value]
      subscriptions.value = []
      // Reload accounts to get latest active accounts
      fetchActiveAccounts()
      
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
      <!-- Customer & Subscription Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            :class="{ 'border-rose-500': errors.customer_id }"
          >
          </AutoComplete>
          <p v-if="errors.customer_id" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.customer_id[0] }}</p>
        </div>

        <!-- Subscription Selection (Optional) -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Subscription <span class="text-gray-400">(optional)</span>
          </label>
          <select
            v-model="form.subscription_id"
            class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :class="{ 'border-rose-500': errors.subscription_id, 'border-gray-200': !errors.subscription_id }"
            :disabled="!form.customer_id || loadingSubscriptions"
          >
            <option :value="null">No subscription</option>
            <option v-for="sub in subscriptions" :key="sub.id" :value="sub.id">
              {{ sub.package_name }} ({{ sub.status }})
            </option>
          </select>
          <p v-if="errors.subscription_id" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.subscription_id[0] }}</p>
          <p v-else-if="loadingSubscriptions" class="mt-1 text-xs text-gray-500">Loading subscriptions...</p>
          <p v-else-if="form.customer_id && subscriptions.length === 0" class="mt-1 text-xs text-gray-500">No subscriptions found for this customer</p>
        </div>
      </div>

      <!-- Collector Account Section -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">
          Collector Account <span class="text-gray-400">(optional)</span>
        </label>
        <Select
          size="small"
          fluid
          v-model="form.account_id"
          :options="accounts"
          optionLabel="employee_name"
          optionValue="id"
          placeholder="Select collector account"
          class="w-full"
          :loading="loadingAccounts"
          :disabled="loadingAccounts"
          :class="{ 'border-rose-500': errors.account_id }"
        >
          <template #option="slotProps">
            <div>
              <div class="font-medium">{{ slotProps.option.employee_name }}</div>
              <div class="text-xs text-gray-500">
                {{ slotProps.option.employee_designation }}
                <span v-if="slotProps.option.account_number"> • Account #{{ slotProps.option.account_number }}</span>
              </div>
            </div>
          </template>
        </Select>
        <p v-if="errors.account_id" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.account_id[0] }}</p>
        <p v-else-if="loadingAccounts" class="mt-1 text-xs text-gray-500">Loading accounts...</p>
        <p v-else-if="!loadingAccounts && accounts.length === 0" class="mt-1 text-xs text-gray-500">No active collector accounts available</p>
        <p v-else class="mt-1 text-xs text-gray-500">Select the account through which this payment is collected</p>
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
          <p v-if="errors.amount" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.amount[0] }}</p>
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
          <p v-if="errors.currency" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.currency[0] }}</p>
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
          <p v-if="errors.payment_date" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.payment_date[0] }}</p>
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
            :class="{ 'border-rose-500': errors.status }"
          />
          <p v-if="errors.status" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.status[0] }}</p>
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
            :class="{ 'border-rose-500': errors.payment_method }"
          />
          <p v-if="errors.payment_method" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.payment_method[0] }}</p>
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
            :class="{ 'border-rose-500': errors.reference }"
          />
          <p v-if="errors.reference" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.reference[0] }}</p>
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
          class="w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :class="{ 'border-rose-500': errors.notes, 'border-gray-200': !errors.notes }"
          placeholder="Additional notes about this payment..."
        ></textarea>
        <p v-if="errors.notes" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.notes[0] }}</p>
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

