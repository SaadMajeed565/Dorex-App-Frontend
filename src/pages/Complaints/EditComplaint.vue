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
  complaint: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'updated', data: any): void;
}>();

const toast = useToast();
const loading = ref(false);

// Form data
const form = ref({
  subject: '',
  description: '',
  status: 'Open',
  priority: 'Medium',
  category: 'Technical',
  assigned_to: null as any,
  resolution: '',
});

// Options
const statusOptions = [
  { label: 'Open', value: 'Open' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Closed', value: 'Closed' },
];

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

// Employees for assignment
const employees = ref<any[]>([]);
const employeesLoading = ref(false);
const filteredEmployees = ref<any[]>([]);
const selectedEmployee = ref<any>(null);

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
      id: emp?.id ?? emp?.employee?.id,
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

// Watch for dialog open and populate form
watch(
  () => [props.visible, props.complaint],
  async ([visible, complaint]) => {
    if (visible && complaint) {
      form.value = {
        subject: complaint.subject || '',
        description: complaint.description || '',
        status: complaint.status || 'Open',
        priority: complaint.priority || 'Medium',
        category: complaint.category || 'Technical',
        assigned_to: null,
        resolution: complaint.resolution || '',
      };

      // Set selected employee if assigned
      await fetchEmployees();
      if (complaint.assignedTo && complaint.assignedTo !== 'Unassigned') {
        const emp = employees.value.find(e => e.name === complaint.assignedTo);
        if (emp) {
          selectedEmployee.value = emp;
          form.value.assigned_to = emp.id;
        }
      }
    } else {
      // Reset form
      form.value = {
        subject: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        category: 'Technical',
        assigned_to: null,
        resolution: '',
      };
      selectedEmployee.value = null;
    }
  },
  { immediate: true }
);

const handleEmployeeSelect = (event: any) => {
  selectedEmployee.value = event.value;
  form.value.assigned_to = event.value?.id || null;
};

const submit = async () => {
  if (loading.value || !props.complaint) return;
  loading.value = true;

  try {
    const payload: any = {
      subject: form.value.subject,
      description: form.value.description,
      status: form.value.status.toLowerCase().replace(' ', '_'),
      priority: form.value.priority.toLowerCase(),
      category: form.value.category,
    };

    if (form.value.assigned_to) {
      payload.assigned_to = form.value.assigned_to;
    }

    if (form.value.resolution) {
      payload.resolution = form.value.resolution;
      payload.status = 'resolved';
    }

    const res = await axiosClient.put(`/complaints/${props.complaint.id}`, payload);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Complaint updated successfully',
      life: 3000,
    });
    emit('updated', res.data);
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to update complaint',
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
    header="Edit Complaint"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <form @submit.prevent="submit" class="space-y-4 p-1">
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select v-model="form.status" :options="statusOptions" option-label="label" option-value="value" fluid size="small" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <Select v-model="form.priority" :options="priorityOptions" option-label="label" option-value="value" fluid size="small" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <Select v-model="form.category" :options="categoryOptions" option-label="label" option-value="value" fluid size="small" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
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
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
        <Textarea v-model="form.resolution" rows="3" placeholder="Add resolution notes..." fluid size="small" />
        <p class="text-xs text-gray-500 mt-1">Adding resolution notes will automatically set status to "Resolved"</p>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" @click="emit('update:visible', false)" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" :disabled="loading || !form.subject || !form.description" class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          <i v-if="loading" class="fa-light fa-spinner fa-spin"></i>
          <i v-else class="fa-light fa-save"></i>
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

