<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import Select from '../../volt/Select.vue';
import MultiSelect from '../../volt/MultiSelect.vue';
import DatePicker from '../../volt/DatePicker.vue';
import ToggleSwitch from '../../volt/ToggleSwitch.vue';
import Button from '../../volt/Button.vue';

const props = defineProps<{
  visible: boolean;
  communication?: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'created'): void;
  (e: 'updated'): void;
  (e: 'closed'): void;
}>();

const toast = useToast();
const loading = ref(false);

// Form data
const form = ref({
  type: 'WhatsApp', // WhatsApp or Email
  recipient_type: 'customers', // customers, employees, or both
  customer_ids: [] as number[],
  employee_ids: [] as number[],
  template_id: null as number | null,
  subject: '',
  message: '',
  send_immediately: true,
  scheduled_at: null as Date | string | null,
});

const isEditing = computed(() => !!props.communication);

// Communication type options
const typeOptions = [
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Email', value: 'Email' },
];

const templateOptions = ref<Record<string, any[]>>({});
const templateLoading = ref(false);
const isInitializing = ref(false);

const requiresTemplateForType = (type: string) => ['WhatsApp', 'Email'].includes(type);

const requiresTemplate = computed(() => requiresTemplateForType(form.value.type));

const templateOptionsForType = computed(() => templateOptions.value[form.value.type] ?? []);

const activeTemplate = computed(() => {
  if (!form.value.template_id) return null;
  return templateOptionsForType.value.find((tpl: any) => tpl.id === form.value.template_id) ?? null;
});

const getTokenPlaceholder = (name: string) => `{{ ${name} }}`;

const fetchTemplates = async (channel: string) => {
  if (!requiresTemplateForType(channel)) return;
  if (templateOptions.value[channel]?.length) return;

  templateLoading.value = true;
  try {
    const res = await axiosClient.get('/communication-templates', {
      params: { channel },
    });

    const templates = Array.isArray(res.data?.data) ? res.data.data : [];
    templateOptions.value = {
      ...templateOptions.value,
      [channel]: templates,
    };
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load templates.',
      life: 3000,
    });
    templateOptions.value = {
      ...templateOptions.value,
      [channel]: [],
    };
  } finally {
    templateLoading.value = false;
  }
};

// Recipient type options
const recipientTypeOptions = [
  { label: 'Customers', value: 'customers' },
  { label: 'Employees', value: 'employees' },
  { label: 'Both', value: 'both' },
];

// Customers and Employees data
const customers = ref<any[]>([]);
const employees = ref<any[]>([]);
const customersLoading = ref(false);
const employeesLoading = ref(false);

// Fetch customers
const fetchCustomers = async () => {
  if (customers.value.length > 0) return;
  customersLoading.value = true;
  try {
    const res = await axiosClient.get('/customers');
    let raw: any[] = [];
    
    if (res.data?.status && Array.isArray(res.data.customers)) {
      raw = res.data.customers;
    } else if (Array.isArray(res.data?.data)) {
      raw = res.data.data;
    } else if (Array.isArray(res.data)) {
      raw = res.data;
    } else {
      raw = [];
    }

    customers.value = raw.map((cust: any) => ({
      id: cust?.customer?.id ?? cust?.id,
      name: cust?.name ?? 'Unknown',
      email: cust?.email ?? '',
      phone: cust?.phone ?? '',
      area: cust?.area ?? '',
    }));
  } catch (err) {
    console.error('Error fetching customers:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load customers.',
      life: 3000,
    });
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
    let raw: any[] = [];
    
    if (res.data?.status && Array.isArray(res.data.employees)) {
      raw = res.data.employees;
    } else if (Array.isArray(res.data?.data)) {
      raw = res.data.data;
    } else if (Array.isArray(res.data)) {
      raw = res.data;
    } else {
      raw = [];
    }

    employees.value = raw.map((emp: any) => ({
      id: emp?.id ?? emp?.employee?.id,
      name: emp?.name ?? emp?.employee?.name ?? 'Unknown',
      email: emp?.email ?? '',
      phone: emp?.phone ?? '',
    }));
  } catch (err) {
    console.error('Error fetching employees:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load employees.',
      life: 3000,
    });
  } finally {
    employeesLoading.value = false;
  }
};

// Load communication data for editing
const loadCommunicationData = async () => {
  if (!props.communication) return;

  isInitializing.value = true;
  const type = props.communication.type || 'WhatsApp';

  form.value = {
    type,
    recipient_type: props.communication.recipient_type || 'customers',
    customer_ids:
      props.communication.recipients
        ?.filter((r: any) => r.recipient_type === 'App\\Models\\Customer')
        .map((r: any) => r.recipient_id) || [],
    employee_ids:
      props.communication.recipients
        ?.filter((r: any) => r.recipient_type === 'App\\Models\\Employee')
        .map((r: any) => r.recipient_id) || [],
    template_id: props.communication.template?.id ?? props.communication.template_id ?? null,
    subject: props.communication.subject || '',
    message: props.communication.message || '',
    send_immediately: props.communication.send_immediately ?? true,
    scheduled_at: props.communication.scheduled_at ? new Date(props.communication.scheduled_at) : null,
  };

  if (requiresTemplateForType(type)) {
    await fetchTemplates(type);
  }

  isInitializing.value = false;
};

// Submit form
const submitForm = async () => {
  // Validation
  if (requiresTemplate.value) {
    if (!form.value.template_id) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select a template.',
        life: 3000,
      });
      return;
    }
  } else {
    if (!form.value.subject.trim()) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter a subject.',
        life: 3000,
      });
      return;
    }

    if (!form.value.message.trim()) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter a message.',
        life: 3000,
      });
      return;
    }
  }

  // Validate recipients
  if (form.value.recipient_type === 'customers' && form.value.customer_ids.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please select at least one customer.',
      life: 3000,
    });
    return;
  }

  if (form.value.recipient_type === 'employees' && form.value.employee_ids.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please select at least one employee.',
      life: 3000,
    });
    return;
  }

  if (form.value.recipient_type === 'both' && 
      form.value.customer_ids.length === 0 && 
      form.value.employee_ids.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please select at least one recipient.',
      life: 3000,
    });
    return;
  }

  if (!form.value.send_immediately && !form.value.scheduled_at) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please select a scheduled date and time.',
      life: 3000,
    });
    return;
  }

  loading.value = true;
  try {
    const data = new FormData();
    data.append('type', form.value.type);
    data.append('recipient_type', form.value.recipient_type);
    data.append('send_immediately', form.value.send_immediately ? '1' : '0');

    if (requiresTemplate.value && form.value.template_id) {
      data.append('template_id', String(form.value.template_id));
    } else {
      data.append('subject', form.value.subject);
      data.append('message', form.value.message);
    }
    
    if (form.value.customer_ids.length > 0) {
      form.value.customer_ids.forEach(id => {
        data.append('customer_ids[]', String(id));
      });
    }
    
    if (form.value.employee_ids.length > 0) {
      form.value.employee_ids.forEach(id => {
        data.append('employee_ids[]', String(id));
      });
    }

    if (!form.value.send_immediately && form.value.scheduled_at) {
      const scheduledDate = form.value.scheduled_at instanceof Date
        ? form.value.scheduled_at.toISOString()
        : form.value.scheduled_at;
      data.append('scheduled_at', scheduledDate);
    }

    let res;
    if (isEditing.value && props.communication) {
      res = await axiosClient.put(`/communications/${props.communication.id}`, data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: res.data?.message || 'Communication updated successfully!',
        life: 3000,
      });
      emit('updated');
    } else {
      res = await axiosClient.post('/communications', data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: res.data?.message || 'Communication created successfully!',
        life: 3000,
      });
      emit('created');
    }

    // Reset form
    form.value = {
      type: 'WhatsApp',
      recipient_type: 'customers',
      customer_ids: [],
      employee_ids: [],
      template_id: null,
      subject: '',
      message: '',
      send_immediately: true,
      scheduled_at: null,
    };

    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create communication.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

// Watch recipient type to clear selections when changed
watch(() => form.value.recipient_type, (newType) => {
  if (newType === 'customers') {
    form.value.employee_ids = [];
  } else if (newType === 'employees') {
    form.value.customer_ids = [];
  }
});

watch(
  () => form.value.type,
  async (newType, _previousType) => {
    if (isInitializing.value) return;

    if (requiresTemplateForType(newType)) {
      await fetchTemplates(newType);
      form.value.template_id = null;
      form.value.subject = '';
      form.value.message = '';
    } else {
      form.value.template_id = null;
    }
  }
);

// Watch visible prop to fetch data when dialog opens
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      const initialType = isEditing.value
        ? (props.communication?.type || form.value.type)
        : form.value.type;
      await fetchTemplates(initialType);
      if (isEditing.value) {
        await loadCommunicationData();
      }
      fetchCustomers();
      if (form.value.recipient_type === 'employees' || form.value.recipient_type === 'both') {
        fetchEmployees();
      }
      nextTick(() => {
        const root = dialogFormRef.value;
        const candidate = root?.querySelector(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null;
        candidate?.focus();
      });
      window.addEventListener('keydown', handleGlobalKeydown);
    } else {
      window.removeEventListener('keydown', handleGlobalKeydown);
      emit('closed');
    }
  },
  { immediate: false }
);

// Keyboard shortcuts
const dialogFormRef = ref<HTMLElement | null>(null);

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (!loading.value) submitForm();
  }
  if (e.key === 'Escape') {
    emit('update:visible', false);
  }
};

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    :header="isEditing ? 'Edit Communication' : 'Create New Communication'"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '800px', maxWidth: '98vw' }"
  >
    <form ref="dialogFormRef" @submit.prevent="submitForm" class="space-y-6 p-1">
      <!-- Communication Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Communication Type <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="form.type"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select type"
          size="small"
          fluid
        />
      </div>

      <!-- Recipient Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Recipient Type <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="form.recipient_type"
          :options="recipientTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select recipient type"
          size="small"
          fluid
        />
      </div>

      <!-- Customer Selection -->
      <div v-if="form.recipient_type === 'customers' || form.recipient_type === 'both'">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Customers <span class="text-red-500">*</span>
        </label>
        <MultiSelect
          v-model="form.customer_ids"
          :options="customers"
          optionLabel="name"
          optionValue="id"
          placeholder="Select customers"
          :loading="customersLoading"
          size="small"
          fluid
          filter
          :maxSelectedLabels="3"
          display="chip"
        >
          <template #option="{ option }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ option.name }}</span>
              <span v-if="option.email" class="text-xs text-gray-500">{{ option.email }}</span>
              <span v-if="option.phone" class="text-xs text-gray-500">{{ option.phone }}</span>
            </div>
          </template>
        </MultiSelect>
        <p class="mt-1 text-xs text-gray-500">
          {{ form.customer_ids.length }} customer(s) selected
        </p>
      </div>

      <!-- Employee Selection -->
      <div v-if="form.recipient_type === 'employees' || form.recipient_type === 'both'">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Employees <span class="text-red-500">*</span>
        </label>
        <MultiSelect
          v-model="form.employee_ids"
          :options="employees"
          optionLabel="name"
          optionValue="id"
          placeholder="Select employees"
          :loading="employeesLoading"
          size="small"
          fluid
          filter
          :maxSelectedLabels="3"
          display="chip"
        >
          <template #option="{ option }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ option.name }}</span>
              <span v-if="option.email" class="text-xs text-gray-500">{{ option.email }}</span>
              <span v-if="option.phone" class="text-xs text-gray-500">{{ option.phone }}</span>
            </div>
          </template>
        </MultiSelect>
        <p class="mt-1 text-xs text-gray-500">
          {{ form.employee_ids.length }} employee(s) selected
        </p>
      </div>

      <!-- Template Selection -->
      <div v-if="requiresTemplate" class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Template <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="form.template_id"
            :options="templateOptionsForType"
            optionLabel="name"
            optionValue="id"
            placeholder="Select template"
            :loading="templateLoading"
            size="small"
            fluid
          />
        </div>

        <div v-if="activeTemplate" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Template Channel</label>
            <p class="text-sm text-gray-900">{{ activeTemplate.channel }}</p>
          </div>

          <div v-if="activeTemplate.provider_template_name">
            <label class="block text-xs font-medium text-gray-500 mb-1">Provider Name</label>
            <p class="text-sm text-gray-900">{{ activeTemplate.provider_template_name }}</p>
          </div>

          <div v-if="activeTemplate.variables && activeTemplate.variables.length">
            <label class="block text-xs font-medium text-gray-500 mb-2">Personalization Tokens</label>
            <ul class="space-y-2">
              <li
                v-for="variable in activeTemplate.variables"
                :key="variable.name"
                class="text-sm text-gray-700 flex items-center justify-between rounded border border-dashed border-gray-300 px-3 py-2 bg-white"
              >
                <span class="font-medium">{{ variable.label || variable.name }}</span>
                <code class="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {{ getTokenPlaceholder(variable.name) }}
                </code>
              </li>
            </ul>
          </div>

          <p class="text-xs text-gray-500">
            Variable values are filled automatically from customer and employee records when messages are sent.
          </p>
        </div>
      </div>

      <!-- Subject -->
      <div v-if="!requiresTemplate">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Subject <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="form.subject"
          placeholder="Enter message subject"
          size="small"
          fluid
        />
      </div>

      <!-- Message -->
      <div v-if="!requiresTemplate">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Message <span class="text-red-500">*</span>
        </label>
        <Textarea
          v-model="form.message"
          rows="6"
          placeholder="Enter your message here..."
          size="small"
          fluid
        />
        <p class="mt-1 text-xs text-gray-500">
          For WhatsApp: Keep messages concise. For Email: You can include HTML formatting.
        </p>
      </div>

      <!-- Send Options -->
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Send Immediately
            </label>
            <p class="text-xs text-gray-500">Send the message right away</p>
          </div>
          <ToggleSwitch v-model="form.send_immediately" />
        </div>

        <div v-if="!form.send_immediately">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Schedule Date & Time <span class="text-red-500">*</span>
          </label>
          <DatePicker
            v-model="form.scheduled_at"
            :showTime="true"
            hourFormat="24"
            dateFormat="yy-mm-dd"
            :minDate="new Date()"
            placeholder="Select date and time"
            size="small"
            fluid
          />
          <p class="mt-1 text-xs text-gray-500">
            Select when you want to send this communication
          </p>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="w-full flex items-center justify-between">
        <Button
          label="Cancel"
          size="small"
          class="p-outlined"
          @click="emit('update:visible', false)"
        />
        <Button
          :label="isEditing ? 'Update' : (form.send_immediately ? 'Send Now' : 'Schedule')"
          size="small"
          icon="pi pi-check"
          :loading="loading"
          @click="submitForm"
        />
      </div>
    </template>
  </Dialog>
</template>

