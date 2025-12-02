<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import Select from '../../volt/Select.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
import DatePicker from '../../volt/DatePicker.vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'created', data: any): void;
}>();

const toast = useToast();
const loading = ref(false);

// Form data
const form = ref({
  title: '',
  description: '',
  priority: 'medium',
  type: 'other',
  customer_id: null as any,
  subscription_id: null as any,
  assigned_to: null as any,
  due_date: null as Date | null,
  notes: '',
});

// Options
const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const typeOptions = [
  { label: 'Installation', value: 'installation' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Upgrade', value: 'upgrade' },
  { label: 'Other', value: 'other' },
];

// Customers for selection
const customers = ref<any[]>([]);
const customersLoading = ref(false);
const filteredCustomers = ref<any[]>([]);
const selectedCustomer = ref<any>(null);

// Employees for assignment
const employees = ref<any[]>([]);
const employeesLoading = ref(false);
const filteredEmployees = ref<any[]>([]);
const selectedEmployee = ref<any>(null);

// Subscriptions for selection
const subscriptions = ref<any[]>([]);
const subscriptionsLoading = ref(false);
const filteredSubscriptions = ref<any[]>([]);
const selectedSubscription = ref<any>(null);

// Fetch customers
const fetchCustomers = async () => {
  if (customers.value.length > 0) return;
  customersLoading.value = true;
  try {
    const res = await axiosClient.get('/customers');
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.customers)) raw = res.data.customers;
    else raw = [];

    customers.value = raw.map((cust: any) => ({
      id: cust?.customer?.id ?? cust?.id,
      name: cust?.name ?? 'Unknown',
      email: cust?.email ?? '',
      area: cust?.area ?? '',
    }));
    filteredCustomers.value = [...customers.value];
  } catch (err) {
    console.error('Error fetching customers:', err);
  } finally {
    customersLoading.value = false;
  }
};

// Fetch employees
const fetchEmployees = async () => {
  if (employees.value.length > 0) return;
  employeesLoading.value = true;
  try {
    const res = await axiosClient.get('/employees');
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.employees)) raw = res.data.employees;
    else raw = [];

    employees.value = raw.map((emp: any) => ({
      id: emp?.employee?.id ?? emp?.id, // Prioritize nested ID structure
      name: emp?.name ?? emp?.employee?.name ?? 'Unknown',
      email: emp?.email ?? '',
    }));
    filteredEmployees.value = [...employees.value];
  } catch (err) {
    console.error('Error fetching employees:', err);
  } finally {
    employeesLoading.value = false;
  }
};

// Fetch subscriptions for selected customer
const fetchSubscriptions = async (customerId: number) => {
  if (!customerId) {
    subscriptions.value = [];
    filteredSubscriptions.value = [];
    return;
  }
  subscriptionsLoading.value = true;
  try {
    const res = await axiosClient.get(`/customers/${customerId}/subscriptions`);
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.data?.data)) raw = res.data.data.data;
    else raw = [];

    subscriptions.value = raw.map((sub: any) => ({
      id: sub.id,
      name: `${sub.package?.name || 'Package'} - ${sub.status}`,
      status: sub.status,
    }));
    filteredSubscriptions.value = [...subscriptions.value];
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
  } finally {
    subscriptionsLoading.value = false;
  }
};

// Search functions
const searchCustomers = (event: any) => {
  const query = event.query?.toLowerCase() || '';
  if (!query) {
    filteredCustomers.value = [...customers.value];
    return;
  }
  filteredCustomers.value = customers.value.filter(
    (cust: any) => cust.name?.toLowerCase().includes(query) || cust.email?.toLowerCase().includes(query)
  );
};

const searchEmployees = (event: any) => {
  const query = event.query?.toLowerCase() || '';
  if (!query) {
    filteredEmployees.value = [...employees.value];
    return;
  }
  filteredEmployees.value = employees.value.filter(
    (emp: any) => emp.name?.toLowerCase().includes(query) || emp.email?.toLowerCase().includes(query)
  );
};

// Watch for dialog open
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchCustomers();
      fetchEmployees();
    } else {
      form.value = {
        title: '',
        description: '',
        priority: 'medium',
        type: 'other',
        customer_id: null,
        subscription_id: null,
        assigned_to: null,
        due_date: null,
        notes: '',
      };
      selectedCustomer.value = null;
      selectedEmployee.value = null;
      selectedSubscription.value = null;
    }
  }
);

const handleCustomerSelect = (event: any) => {
  selectedCustomer.value = event.value;
  form.value.customer_id = event.value?.id || null;
  form.value.subscription_id = null;
  selectedSubscription.value = null;
  if (event.value?.id) {
    fetchSubscriptions(event.value.id);
  }
};

const handleEmployeeSelect = (event: any) => {
  selectedEmployee.value = event.value;
  form.value.assigned_to = event.value?.id ? Number(event.value.id) : null;
};

const handleEmployeeClear = () => {
  selectedEmployee.value = null;
  form.value.assigned_to = null;
};

const handleSubscriptionSelect = (event: any) => {
  selectedSubscription.value = event.value;
  form.value.subscription_id = event.value?.id || null;
};

const submit = async () => {
  if (loading.value) return;

  if (!form.value.title?.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Required',
      detail: 'Please enter a task title',
      life: 3000,
    });
    return;
  }

  loading.value = true;

  try {
    const payload: any = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || null,
      priority: form.value.priority,
      type: form.value.type,
      status: 'pending',
    };

    if (form.value.customer_id) payload.customer_id = form.value.customer_id;
    if (form.value.subscription_id) payload.subscription_id = form.value.subscription_id;
    if (form.value.assigned_to !== null && form.value.assigned_to !== undefined && form.value.assigned_to !== '') {
      payload.assigned_to = Number(form.value.assigned_to); // Ensure numeric ID
    } else {
      payload.assigned_to = null; // Explicitly send null if unassigned
    }
    if (form.value.due_date) {
      payload.due_date = form.value.due_date instanceof Date 
        ? form.value.due_date.toISOString().split('T')[0] 
        : form.value.due_date;
    }
    if (form.value.notes) payload.notes = form.value.notes;

    const res = await axiosClient.post('/tasks', payload);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Task created successfully',
      life: 3000,
    });
    emit('created', res.data);
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create task',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Create New Task"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <form @submit.prevent="submit" class="space-y-4 p-1">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <InputText v-model="form.title" placeholder="Task title" fluid size="small" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <Textarea v-model="form.description" rows="4" placeholder="Describe the task..." fluid size="small" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <Select v-model="form.priority" :options="priorityOptions" option-label="label" option-value="value" fluid size="small" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <Select v-model="form.type" :options="typeOptions" option-label="label" option-value="value" fluid size="small" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Customer (Optional)</label>
        <AutoComplete
          v-model="selectedCustomer"
          :suggestions="filteredCustomers"
          @complete="searchCustomers"
          @item-select="handleCustomerSelect"
          option-label="name"
          placeholder="Search customer..."
          :loading="customersLoading"
          fluid
          size="small"
          dropdown
        >
          <template #item="{ option }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ option.name }}</span>
              <span v-if="option.email" class="text-xs text-gray-500">{{ option.email }}</span>
            </div>
          </template>
        </AutoComplete>
      </div>

      <div v-if="selectedCustomer">
        <label class="block text-sm font-medium text-gray-700 mb-1">Subscription (Optional)</label>
        <AutoComplete
          v-model="selectedSubscription"
          :suggestions="filteredSubscriptions"
          @item-select="handleSubscriptionSelect"
          option-label="name"
          placeholder="Select subscription..."
          :loading="subscriptionsLoading"
          fluid
          size="small"
          dropdown
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Assign To (Optional)</label>
        <AutoComplete
          v-model="selectedEmployee"
          :suggestions="filteredEmployees"
          @complete="searchEmployees"
          @item-select="handleEmployeeSelect"
          @clear="handleEmployeeClear"
          option-label="name"
          placeholder="Search employee..."
          :loading="employeesLoading"
          fluid
          size="small"
          dropdown
        >
          <template #item="{ option }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ option.name }}</span>
              <span v-if="option.email" class="text-xs text-gray-500">{{ option.email }}</span>
            </div>
          </template>
        </AutoComplete>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
        <DatePicker v-model="form.due_date" fluid size="small" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
        <Textarea v-model="form.notes" rows="3" placeholder="Additional notes..." fluid size="small" />
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" @click="emit('update:visible', false)" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" :disabled="loading || !form.title?.trim()" class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          <i v-if="loading" class="fa-light fa-spinner fa-spin"></i>
          <i v-else class="fa-light fa-plus"></i>
          {{ loading ? 'Creating...' : 'Create Task' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

