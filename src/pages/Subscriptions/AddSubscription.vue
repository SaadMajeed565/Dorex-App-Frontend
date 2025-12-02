<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import axiosClient from '../../axios'
import Button from '../../volt/Button.vue'
import AutoComplete from '../../volt/AutoComplete.vue'
import Select from '../../volt/Select.vue'
import DatePicker from '../../volt/DatePicker.vue'
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

interface PackageOption {
  id: number
  name: string
  company: string
  speed: string
  price: number
}

interface EmployeeOption {
  id: number
  name: string
  designation: string
}

// Toast + state
const toast = useToast()
const loading = ref(false)

// Error validation
const errors = ref<Record<string, string[]>>({})

// Form data
const initialFormState = {
  customer_id: null as CustomerOption | null,
  package_id: null as PackageOption | null,
  supervisor_id: null as EmployeeOption | null,
  start_date: null as Date | null,
  end_date: null as Date | null,
  status: 'active'
}

const form = ref({ ...initialFormState })

// Data lists
const customers = ref<CustomerOption[]>([])
const packages = ref<PackageOption[]>([])
const employees = ref<EmployeeOption[]>([])

// Filtered lists for autocomplete
const filteredCustomers = ref<CustomerOption[]>([])
const filteredPackages = ref<PackageOption[]>([])
const filteredEmployees = ref<EmployeeOption[]>([])

const dataLoading = ref(true)

// Data management methods
const addCustomer = (customer: CustomerOption) => {
  customers.value.push(customer)
  filteredCustomers.value.push(customer)
}

const addPackage = (packageItem: PackageOption) => {
  packages.value.push(packageItem)
  filteredPackages.value.push(packageItem)
}

const addEmployee = (employee: EmployeeOption) => {
  employees.value.push(employee)
  filteredEmployees.value.push(employee)
}

// Method to handle external data updates
const updateDataFromExternal = (type: 'customer' | 'package' | 'employee', data: any) => {
  switch (type) {
    case 'customer':
      if (!customers.value.find(c => c.id === data.id)) {
        addCustomer({
          id: data.id,
          name: data.name,
          email: data.email,
          area: data.area || ''
        })
      }
      break
    case 'package':
      if (!packages.value.find(p => p.id === data.id)) {
        addPackage({
          id: data.id,
          name: data.name,
          company: data.company_name || '',
          speed: data.speed || '',
          price: data.sale_price || 0
        })
      }
      break
    case 'employee':
      if (!employees.value.find(e => e.id === data.id)) {
        addEmployee({
          id: data.id,
          name: data.name,
          designation: data.designation || ''
        })
      }
      break
  }
}

// Expose methods for parent components
defineExpose({
  addCustomer,
  addPackage,
  addEmployee,
  updateDataFromExternal
})

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Expired', value: 'expired' }
]

// Fetch data from API
onMounted(async () => {
  try {
    const [customersRes, packagesRes, employeesRes] = await Promise.all([
      axiosClient.get('/customers'),
      axiosClient.get('/packages'),
      axiosClient.get('/employees')
    ])

    customers.value =
      customersRes.data.customers?.map((c: any) => ({
        id: c.customer.id,
        name: c.name || `Customer #${c.customer.id}`,
        email: c.email,
        area: c.area
      })) || []

    packages.value =
      packagesRes.data.packages?.map((p: any) => ({
        id: p.id,
        name: p.name || `Package #${p.id}`,
        company: p.company_name,
        speed: p.speed,
        price: p.sale_price
      })) || []

    employees.value =
      employeesRes.data.employees?.map((e: any) => ({
        id: e.id,
        name: e.name || `Employee #${e.id}`,
        designation: e.employee?.designation
      })) || []

    filteredCustomers.value = [...customers.value]
    filteredPackages.value = [...packages.value]
    filteredEmployees.value = [...employees.value]
  } catch (error) {
    console.error('Error loading data:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load form data.',
      life: 4000
    })
  } finally {
    dataLoading.value = false
  }
})

// Autocomplete searches
const searchCustomers = (event: any) => {
  const query = event.query.toLowerCase()
  filteredCustomers.value = customers.value.filter(
    c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.area.toLowerCase().includes(query)
  )
}

const searchPackages = (event: any) => {
  const query = event.query.toLowerCase()
  filteredPackages.value = packages.value.filter(
    p =>
      p.name.toLowerCase().includes(query) ||
      (p.company && p.company.toLowerCase().includes(query)) ||
      (p.speed && p.speed.toLowerCase().includes(query)) ||
      String(p.price).toLowerCase().includes(query)
  )
}

const searchEmployees = (event: any) => {
  const query = event.query.toLowerCase()
  filteredEmployees.value = employees.value.filter(
    e =>
      e.name.toLowerCase().includes(query) ||
      (e.designation && e.designation.toLowerCase().includes(query)) ||
      String(e.id).toLowerCase().includes(query)
  )
}

// Submit function
const submitForm = async () => {
  loading.value = true
  
  // Clear previous errors
  errors.value = {}
  
  try {

    const payload = {
      customer_id: form.value.customer_id!.id,
      package_id: form.value.package_id!.id,
      supervisor_id: form.value.supervisor_id?.id || null,
      start_date: form.value.start_date ? (form.value.start_date instanceof Date ? form.value.start_date.toISOString().split('T')[0] : form.value.start_date) : null,
      end_date: form.value.end_date ? (form.value.end_date instanceof Date ? form.value.end_date.toISOString().split('T')[0] : form.value.end_date) : null,
      status: form.value.status
    }

    const res = await axiosClient.post('/subscriptions', payload)

    // Add new data to existing arrays if returned in response
    if (res.data.customer && !customers.value.find(c => c.id === res.data.customer.id)) {
      addCustomer({
        id: res.data.customer.id,
        name: res.data.customer.name,
        email: res.data.customer.email,
        area: res.data.customer.area || ''
      })
    }

    if (res.data.package && !packages.value.find(p => p.id === res.data.package.id)) {
      addPackage({
        id: res.data.package.id,
        name: res.data.package.name,
        company: res.data.package.company_name || '',
        speed: res.data.package.speed || '',
        price: res.data.package.sale_price || 0
      })
    }

    if (res.data.supervisor && !employees.value.find(e => e.id === res.data.supervisor.id)) {
      addEmployee({
        id: res.data.supervisor.id,
        name: res.data.supervisor.name,
        designation: res.data.supervisor.designation || ''
      })
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data.message || 'Subscription created successfully!',
      life: 3000
    })

    // Reset form to initial state
    form.value = { ...initialFormState }
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
        } else if (key === 'package_id') {
          fieldValue = form.value.package_id;
        } else if (key === 'supervisor_id') {
          fieldValue = form.value.supervisor_id;
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
    header="Add New Subscription"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '960px', maxWidth: '98vw' }"
  >
    <form
      ref="dialogFormRef"
      @submit.prevent="submitForm"
      class="p-4 space-y-6 overflow-y-auto max-h-[75vh]"
    >
      <!-- Customer + Package + Supervisor -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Customer -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Select Customer <span class="text-red-500">*</span>
          </label>
          <AutoComplete
            size="small"
            fluid
            v-model="form.customer_id"
            :suggestions="filteredCustomers"
            @complete="searchCustomers"
            :optionLabel="(c) => `${c.name} - ${c.area}`"
            placeholder="Search customers by name or email"
            class="w-full"
            :minLength="1"
            :disabled="dataLoading"
          >
          </AutoComplete>
          <p v-if="errors.customer_id" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.customer_id[0] }}</p>
        </div>

        <!-- Package -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Select Package <span class="text-red-500">*</span>
          </label>
          <AutoComplete
            size="small"
            fluid
            v-model="form.package_id"
            :suggestions="filteredPackages"
            @complete="searchPackages"
            :optionLabel="(p) => `${p.name} - ${p.company} - ${p.speed} - ${p.price}`"
            placeholder="Search by name, company, speed or price"
            class="w-full"
            :minLength="1"
            :disabled="dataLoading"
          >
          </AutoComplete>
          <p v-if="errors.package_id" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.package_id[0] }}</p>
        </div>

        <!-- Supervisor -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Assign Supervisor (Optional)
          </label>
          <AutoComplete
            size="small"
            fluid
            v-model="form.supervisor_id"
            :suggestions="filteredEmployees"
            @complete="searchEmployees"
            :optionLabel="(e) => `${e.name} - ${e.designation}`"
            placeholder="Search employees by name or designation"
            class="w-full"
            :class="{ 'border-rose-500': errors.supervisor_id }"
            :minLength="1"
          >
          </AutoComplete>
          <p v-if="errors.supervisor_id" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.supervisor_id[0] }}</p>
        </div>
      </div>

      <!-- Dates and Status -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Start Date -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Start Date <span class="text-red-500">*</span>
          </label>
          <DatePicker
            size="small"
            v-model="form.start_date"
            placeholder="Select start date"
            class="w-full"
            dateFormat="yy-mm-dd"
          />
          <p v-if="errors.start_date" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.start_date[0] }}</p>
          <p v-else class="mt-1 text-xs text-gray-500">Format: yyyy-mm-dd</p>
        </div>

        <!-- End Date -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            End Date
          </label>
          <DatePicker
            size="small"
            v-model="form.end_date"
            placeholder="Select end date (optional)"
            class="w-full"
            :class="{ 'border-rose-500': errors.end_date }"
            dateFormat="yy-mm-dd"
          />
          <p v-if="errors.end_date" class="text-xs text-red-600 mt-1" aria-live="polite">{{ errors.end_date[0] }}</p>
          <p v-else class="mt-1 text-xs text-gray-500">Leave empty for ongoing.</p>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Status
          </label>
          <Select
            size="small"
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
          label="Create Subscription"
          size="small"
          icon="pi pi-check"
          :loading="loading"
          @click="submitForm"
        />
      </div>
    </template>
  </Dialog>
</template>
