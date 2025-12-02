<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import Select from '../../volt/Select.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
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
  customer_id: null as any,
  subject: '',
  description: '',
  priority: 'Medium',
  category: 'Technical',
  assigned_to: null as any,
});

// Options
const priorityOptions = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
  { label: 'Critical', value: 'Critical' },
];

const categoryOptions = [
  { label: 'Technical', value: 'Technical' },
  { label: 'Billing', value: 'Billing' },
  { label: 'Service', value: 'Service' },
  { label: 'Network', value: 'Network' },
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

// Fetch customers
const fetchCustomers = async () => {
  if (customers.value.length > 0) return; // Already loaded
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
  if (employees.value.length > 0) return; // Already loaded
  employeesLoading.value = true;
  try {
    const res = await axiosClient.get('/employees');
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.employees)) raw = res.data.employees;
    else raw = [];

    employees.value = raw.map((emp: any) => ({
      id: emp?.employee?.id ?? emp?.id,
      name: emp?.name ?? 'Unknown',
      email: emp?.email ?? '',
    }));
    filteredEmployees.value = [...employees.value];
  } catch (err) {
    console.error('Error fetching employees:', err);
  } finally {
    employeesLoading.value = false;
  }
};

// Search customers
const searchCustomers = (event: any) => {
  const query = event.query?.toLowerCase() || '';
  if (!query) {
    filteredCustomers.value = [...customers.value];
    return;
  }
  filteredCustomers.value = customers.value.filter(
    (cust: any) => cust.name?.toLowerCase().includes(query) || cust.email?.toLowerCase().includes(query) || cust.area?.toLowerCase().includes(query)
  );
};

// Search employees
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
      // Reset form
      form.value = {
        customer_id: null,
        subject: '',
        description: '',
        priority: 'Medium',
        category: 'Technical',
        assigned_to: null,
      };
      selectedCustomer.value = null;
      selectedEmployee.value = null;
    }
  }
);

const handleCustomerSelect = (event: any) => {
  selectedCustomer.value = event.value;
  form.value.customer_id = event.value?.id || null;
};

const handleEmployeeSelect = (event: any) => {
  selectedEmployee.value = event.value;
  form.value.assigned_to = event.value?.id || null;
};

const submit = async () => {
  if (loading.value) return;

  if (!form.value.customer_id) {
    toast.add({
      severity: 'warn',
      summary: 'Required',
      detail: 'Please select a customer',
      life: 3000,
    });
    return;
  }

  if (!form.value.subject?.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Required',
      detail: 'Please enter a subject',
      life: 3000,
    });
    return;
  }

  if (!form.value.description?.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Required',
      detail: 'Please enter a description',
      life: 3000,
    });
    return;
  }

  loading.value = true;

  try {
    const payload: any = {
      customer_id: form.value.customer_id,
      subject: form.value.subject.trim(),
      description: form.value.description.trim(),
      priority: form.value.priority.toLowerCase(),
      category: form.value.category,
      status: 'open',
    };

    if (form.value.assigned_to) {
      payload.assigned_to = form.value.assigned_to;
    }

    const res = await axiosClient.post('/complaints', payload);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Complaint created successfully',
      life: 3000,
    });
    emit('created', res.data);
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create complaint',
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
    header="Create New Complaint"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <form @submit.prevent="submit" class="space-y-4 p-1">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
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
          required
        >
          <template #item="{ option }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ option.name }}</span>
              <span v-if="option.email" class="text-xs text-gray-500">{{ option.email }}</span>
              <span v-if="option.area" class="text-xs text-gray-500">{{ option.area }}</span>
            </div>
          </template>
        </AutoComplete>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
        <InputText v-model="form.subject" placeholder="Complaint subject" fluid size="small" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <Textarea v-model="form.description" rows="5" placeholder="Describe the complaint..." fluid size="small" required />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <Select v-model="form.priority" :options="priorityOptions" option-label="label" option-value="value" fluid size="small" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <Select v-model="form.category" :options="categoryOptions" option-label="label" option-value="value" fluid size="small" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Assign To (Optional)</label>
        <AutoComplete
          v-model="selectedEmployee"
          :suggestions="filteredEmployees"
          @complete="searchEmployees"
          @item-select="handleEmployeeSelect"
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

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" @click="emit('update:visible', false)" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" :disabled="loading || !form.customer_id || !form.subject?.trim() || !form.description?.trim()" class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          <i v-if="loading" class="fa-light fa-spinner fa-spin"></i>
          <i v-else class="fa-light fa-plus"></i>
          {{ loading ? 'Creating...' : 'Create Complaint' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

