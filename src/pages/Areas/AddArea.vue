<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import Select from '../../volt/Select.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created', data: any): void
}>();

const form = ref({ 
  name: '', 
  code: '', 
  parent_area_id: '', 
  coverage_map: '', 
  status: 'Active', 
  infrastructure: '', 
  manager: '' 
});
const loading = ref(false);
const dialogFormRef = ref<HTMLElement | null>(null);
const errors = ref<Record<string, string[]>>({});
const areas = ref<any[]>([]);
const areasLoading = ref(false);
const selectedParentArea = ref<any>(null);
const parentSearchTerm = ref('');

// Employees for manager selection
const employees = ref<any[]>([]);
const employeesLoading = ref(false);
const selectedManager = ref<any>(null);
const managerSearchTerm = ref('');

// Function to fetch areas for parent selection
const fetchAreas = async () => {
  areasLoading.value = true;
  try {
    const response = await axiosClient.get('/areas');
    if (response.data?.status && Array.isArray(response.data?.areas)) {
      areas.value = response.data.areas;
    } else {
      areas.value = [];
    }
  } catch (error) {
    console.error("Error fetching areas:", error);
    areas.value = [];
  } finally {
    areasLoading.value = false;
  }
};

// Function to fetch employees for manager selection
const fetchEmployees = async () => {
  employeesLoading.value = true;
  try {
    const response = await axiosClient.get('/employees');
    if (response.data?.status && Array.isArray(response.data?.employees)) {
      employees.value = response.data.employees.map((emp: any) => ({
        id: emp.employee?.id || emp.id,
        name: emp.name || `Employee #${emp.id}`,
        designation: emp.employee?.designation || emp.designation || '',
        email: emp.email || ''
      }));
    } else {
      employees.value = [];
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    employees.value = [];
  } finally {
    employeesLoading.value = false;
  }
};

// Function to search employees for AutoComplete
const searchEmployees = (event: any) => {
  managerSearchTerm.value = event.query;
  // The AutoComplete will automatically filter based on the query
};

// Function to handle manager selection
const onManagerSelect = (event: any) => {
  selectedManager.value = event.value;
  form.value.manager = event.value?.name || '';
};

// Function to search areas for AutoComplete
const searchAreas = (event: any) => {
  parentSearchTerm.value = event.query;
  // The AutoComplete will automatically filter based on the query
};

// Function to handle area selection
const onAreaSelect = (event: any) => {
  selectedParentArea.value = event.value;
  form.value.parent_area_id = event.value?.id || '';
};


watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchAreas(); // Load areas when dialog opens
      fetchEmployees(); // Load employees when dialog opens
      nextTick(() => {
        const root = dialogFormRef.value;
        const candidate = root?.querySelector(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null;
        candidate?.focus();
      });
    } else {
      // Reset form when dialog closes
      form.value = { 
        name: '', 
        code: '', 
        parent_area_id: '', 
        coverage_map: '', 
        status: 'Active', 
        infrastructure: '', 
        manager: '' 
      };
      errors.value = {};
      selectedParentArea.value = null;
      parentSearchTerm.value = '';
      selectedManager.value = null;
      managerSearchTerm.value = '';
    }
  },
  { immediate: false }
);

async function submit() {
  if (loading.value) return;
  loading.value = true;
  errors.value = {};
  try {
    const res = await axiosClient.post('/areas', form.value);
    emit('created', res.data);
    emit('update:visible', false);
    form.value = { 
      name: '', 
      code: '', 
      parent_area_id: '', 
      coverage_map: '', 
      status: 'Active', 
      infrastructure: '', 
      manager: '' 
    };
    errors.value = {};
  } catch (error: any) {
    if (error.response?.data?.errors) {
      const rawErrors = error.response.data.errors;
      // Transform error messages: show "This field is required" when field is empty
      errors.value = Object.keys(rawErrors).reduce((acc, key) => {
        const fieldValue = form.value[key as keyof typeof form.value];
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
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Add New Area"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <form ref="dialogFormRef" @submit.prevent="submit" class="space-y-4 p-1">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Name</label>
          <InputText 
            v-model="form.name" 
            placeholder="Enter area name"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.name }"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Code</label>
          <InputText 
            v-model="form.code" 
            placeholder="Enter area code"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.code }"
          />
          <p v-if="errors.code" class="mt-1 text-xs text-rose-500">{{ errors.code[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Status</label>
          <Select
            v-model="form.status"
            :options="[
              { label: 'Active', value: 'Active' },
              { label: 'Maintenance', value: 'Maintenance' },
              { label: 'Planned', value: 'Planned' }
            ]"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.status }"
          />
          <p v-if="errors.status" class="mt-1 text-xs text-rose-500">{{ errors.status[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Infrastructure</label>
          <Select
            v-model="form.infrastructure"
            :options="[
              { label: 'Fiber Optic', value: 'Fiber Optic' },
              { label: 'Wireless', value: 'Wireless' },
              { label: 'Copper', value: 'Copper' }
            ]"
            optionLabel="label"
            optionValue="value"
            placeholder="Select infrastructure"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.infrastructure }"
          />
          <p v-if="errors.infrastructure" class="mt-1 text-xs text-rose-500">{{ errors.infrastructure[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Manager</label>
          <AutoComplete
            size="small"
            fluid
            v-model="selectedManager"
            :suggestions="employees"
            @complete="searchEmployees"
            @item-select="onManagerSelect"
            option-label="name"
            placeholder="Search for manager..."
            :loading="employeesLoading"
            class="w-full"
            :class="{ 'border-rose-500': errors.manager }"
            dropdown
          >
            <template #item="{ option }">
              <div class="flex flex-col">
                <div class="font-medium text-gray-900">{{ option.name }}</div>
                <div v-if="option.designation" class="text-xs text-gray-500">{{ option.designation }}</div>
              </div>
            </template>
          </AutoComplete>
          <p v-if="errors.manager" class="mt-1 text-xs text-rose-500">{{ errors.manager[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Parent Area</label>
          <AutoComplete
            size="small"
            fluid
            v-model="selectedParentArea"
            :suggestions="areas"
            @complete="searchAreas"
            @item-select="onAreaSelect"
            option-label="name"
            placeholder="Search for parent area..."
            :loading="areasLoading"
            class="w-full"
            :class="{ 'border-rose-500': errors.parent_area_id }"
            dropdown
          >
            <template #item="{ option }">
              <div class="flex flex-col">
                <div class="font-medium text-gray-900">{{ option.name }}</div>
                <div v-if="option.code" class="text-xs text-gray-500">{{ option.code }}</div>
              </div>
            </template>
          </AutoComplete>
          <p v-if="errors.parent_area_id" class="mt-1 text-xs text-rose-500">{{ errors.parent_area_id[0] }}</p>
        </div>
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Coverage Map (JSON)</label>
        <Textarea 
          v-model="form.coverage_map" 
          rows="5"
          placeholder="Enter coverage map JSON..."
          size="small"
          fluid
          :class="{ 'border-rose-500': errors.coverage_map }"
        />
        <p v-if="errors.coverage_map" class="mt-1 text-xs text-rose-500">{{ errors.coverage_map[0] }}</p>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" @click="emit('update:visible', false)" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
        <button type="submit" :disabled="loading" class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60">Create area</button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
</style>


