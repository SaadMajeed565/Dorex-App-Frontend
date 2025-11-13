<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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
  task: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'updated', data: any): void;
}>();

const toast = useToast();
const loading = ref(false);

// Form data
const form = ref({
  title: '',
  description: '',
  priority: 'medium',
  type: 'other',
  status: 'pending',
  customer_id: null as any,
  subscription_id: null as any,
  assigned_to: null as any,
  due_date: null as string | null,
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

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

// Customers, employees, subscriptions
const customers = ref<any[]>([]);
const employees = ref<any[]>([]);
const subscriptions = ref<any[]>([]);
const filteredCustomers = ref<any[]>([]);
const filteredEmployees = ref<any[]>([]);
const filteredSubscriptions = ref<any[]>([]);
const selectedCustomer = ref<any>(null);
const selectedEmployee = ref<any>(null);

const isEditing = computed(() => !!props.task);

// Load task data
const loadTaskData = () => {
  if (!props.task) return;
  
  form.value = {
    title: props.task.title || '',
    description: props.task.description || '',
    priority: props.task.priority || 'medium',
    type: props.task.type || 'other',
    status: props.task.status || 'pending',
    customer_id: props.task.customer?.id || null,
    subscription_id: props.task.subscription?.id || null,
    assigned_to: props.task.assigned_employee?.id || null,
    due_date: props.task.due_date || null,
    notes: props.task.notes || '',
  };

  if (props.task.customer) {
    selectedCustomer.value = {
      id: props.task.customer.id,
      name: props.task.customer.name,
    };
  }
  if (props.task.assigned_employee) {
    selectedEmployee.value = {
      id: props.task.assigned_employee.id,
      name: props.task.assigned_employee.name,
    };
  }
};

// Fetch data
const fetchCustomers = async () => {
  try {
    const res = await axiosClient.get('/customers');
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.customers)) raw = res.data.customers;
    customers.value = raw.map((cust: any) => ({
      id: cust?.customer?.id ?? cust?.id,
      name: cust?.name ?? 'Unknown',
      email: cust?.email ?? '',
    }));
    filteredCustomers.value = [...customers.value];
  } catch (err) {
    console.error('Error fetching customers:', err);
  }
};

const fetchEmployees = async () => {
  try {
    const res = await axiosClient.get('/employees');
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.employees)) raw = res.data.employees;
    employees.value = raw.map((emp: any) => ({
      id: emp?.id ?? emp?.employee?.id,
      name: emp?.name ?? emp?.employee?.name ?? 'Unknown',
    }));
    filteredEmployees.value = [...employees.value];
  } catch (err) {
    console.error('Error fetching employees:', err);
  }
};

const fetchSubscriptions = async (customerId: number) => {
  if (!customerId) return;
  try {
    const res = await axiosClient.get(`/customers/${customerId}/subscriptions`);
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    subscriptions.value = raw.map((sub: any) => ({
      id: sub.id,
      name: `${sub.package?.name || 'Package'} - ${sub.status}`,
    }));
    filteredSubscriptions.value = [...subscriptions.value];
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchCustomers();
      fetchEmployees();
      loadTaskData();
      if (form.value.customer_id) {
        fetchSubscriptions(form.value.customer_id);
      }
    }
  }
);

const handleCustomerSelect = (event: any) => {
  selectedCustomer.value = event.value;
  form.value.customer_id = event.value?.id || null;
  if (event.value?.id) {
    fetchSubscriptions(event.value.id);
  }
};

const submit = async () => {
  if (loading.value || !props.task) return;

  loading.value = true;
  try {
    const payload: any = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || null,
      priority: form.value.priority,
      type: form.value.type,
      status: form.value.status,
    };

    if (form.value.customer_id) payload.customer_id = form.value.customer_id;
    if (form.value.subscription_id) payload.subscription_id = form.value.subscription_id;
    if (form.value.assigned_to) payload.assigned_to = form.value.assigned_to;
    if (form.value.due_date) payload.due_date = form.value.due_date;
    if (form.value.notes) payload.notes = form.value.notes;

    const res = await axiosClient.put(`/tasks/${props.task.id}`, payload);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Task updated successfully',
      life: 3000,
    });
    emit('updated', res.data);
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to update task',
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
    :header="isEditing ? 'Edit Task' : 'Create Task'"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <form v-if="props.task" @submit.prevent="submit" class="space-y-4 p-1">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <InputText v-model="form.title" placeholder="Task title" fluid size="small" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <Textarea v-model="form.description" rows="4" placeholder="Describe the task..." fluid size="small" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <Select v-model="form.priority" :options="priorityOptions" option-label="label" option-value="value" fluid size="small" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <Select v-model="form.type" :options="typeOptions" option-label="label" option-value="value" fluid size="small" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select v-model="form.status" :options="statusOptions" option-label="label" option-value="value" fluid size="small" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Customer (Optional)</label>
        <AutoComplete
          v-model="selectedCustomer"
          :suggestions="filteredCustomers"
          @item-select="handleCustomerSelect"
          option-label="name"
          placeholder="Search customer..."
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
          @item-select="(e: any) => { selectedEmployee = e.value; form.assigned_to = e.value?.id || null; }"
          option-label="name"
          placeholder="Search employee..."
          fluid
          size="small"
          dropdown
        />
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
          <i v-else class="fa-light fa-save"></i>
          {{ loading ? 'Updating...' : 'Update Task' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

