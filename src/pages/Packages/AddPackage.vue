<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created', data: any): void
}>();

const form = ref({ company_name: '', name: '', description: '', speed: '', purchase_price: '', sale_price: '', is_active: true });
const loading = ref(false);
const dialogFormRef = ref<HTMLElement | null>(null);
const toast = useToast();
const errors = ref<Record<string, string[]>>({});
const companySuggestions = ref<string[]>([]);
const companiesLoading = ref(false);

// Function to fetch existing companies from packages
const fetchCompanies = async () => {
  companiesLoading.value = true;
  try {
    const response = await axiosClient.get('/packages');
    const list = Array.isArray(response.data?.packages) ? response.data.packages : response.data;
    if (Array.isArray(list)) {
      // Extract unique company names
      const companies = new Set<string>();
      list.forEach((item: any) => {
        const companyName = item.company_name ?? item.companyName ?? '';
        if (companyName && companyName.trim()) {
          companies.add(companyName.trim());
        }
      });
      companySuggestions.value = Array.from(companies).sort();
    } else {
      companySuggestions.value = [];
    }
  } catch (error) {
    console.error('Error fetching companies:', error);
    companySuggestions.value = [];
  } finally {
    companiesLoading.value = false;
  }
};

// Filter suggestions based on search term
const filteredCompanySuggestions = ref<string[]>([]);

// Function to search/filter companies
const searchCompanies = (event: any) => {
  const query = event.query;
  if (!query || query.trim() === '') {
    // Show all companies if no query
    filteredCompanySuggestions.value = companySuggestions.value;
  } else {
    const lowerQuery = query.toLowerCase();
    filteredCompanySuggestions.value = companySuggestions.value.filter(
      company => company.toLowerCase().includes(lowerQuery)
    );
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchCompanies().then(() => {
        // Initialize filtered suggestions after companies are loaded
        filteredCompanySuggestions.value = companySuggestions.value;
      });
      nextTick(() => {
        const root = dialogFormRef.value;
        const candidate = root?.querySelector(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null;
        candidate?.focus();
      });
    } else {
      // Reset form when dialog closes
      form.value = { company_name: '', name: '', description: '', speed: '', purchase_price: '', sale_price: '', is_active: true };
      errors.value = {};
      filteredCompanySuggestions.value = [];
    }
  },
  { immediate: false }
);

async function submit() {
  if (loading.value) return;
  loading.value = true;
  errors.value = {};
  try {
    const res = await axiosClient.post('/packages', form.value);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data?.message || 'Package created successfully!',
      life: 3000,
    });
    
    emit('created', res.data);
    emit('update:visible', false);
    form.value = { company_name: '', name: '', description: '', speed: '', purchase_price: '', sale_price: '', is_active: true };
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
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to create package. Please try again.',
      life: 4000,
    });
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
    header="Add New Package"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <form ref="dialogFormRef" @submit.prevent="submit" class="space-y-4 p-1">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Company</label>
          <AutoComplete
            v-model="form.company_name"
            :suggestions="filteredCompanySuggestions"
            @complete="searchCompanies"
            placeholder="Enter or select company name"
            size="small"
            fluid
            dropdown
            :loading="companiesLoading"
            class="w-full"
            :class="{ 'border-rose-500': errors.company_name }"
          />
          <p v-if="errors.company_name" class="mt-1 text-xs text-rose-500">{{ errors.company_name[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Name</label>
          <InputText 
            v-model="form.name" 
            placeholder="Enter package name"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.name }"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-rose-500">{{ errors.name[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Speed (Mbps)</label>
          <InputText 
            v-model="form.speed" 
            placeholder="Enter speed"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.speed }"
          />
          <p v-if="errors.speed" class="mt-1 text-xs text-rose-500">{{ errors.speed[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Purchase Price</label>
          <InputText 
            v-model="form.purchase_price" 
            type="number"
            step="0.01"
            placeholder="Enter purchase price"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.purchase_price }"
          />
          <p v-if="errors.purchase_price" class="mt-1 text-xs text-rose-500">{{ errors.purchase_price[0] }}</p>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Sale Price</label>
          <InputText 
            v-model="form.sale_price" 
            type="number"
            step="0.01"
            placeholder="Enter sale price"
            size="small"
            fluid
            :class="{ 'border-rose-500': errors.sale_price }"
          />
          <p v-if="errors.sale_price" class="mt-1 text-xs text-rose-500">{{ errors.sale_price[0] }}</p>
        </div>
        <div class="flex items-center gap-2 mt-6">
          <input id="active" type="checkbox" v-model="form.is_active" class="accent-gray-600">
          <label for="active" class="text-sm text-gray-700">Active</label>
        </div>
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Description</label>
        <Textarea 
          v-model="form.description" 
          rows="4"
          placeholder="Enter description..."
          size="small"
          fluid
          :class="{ 'border-rose-500': errors.description }"
        />
        <p v-if="errors.description" class="mt-1 text-xs text-rose-500">{{ errors.description[0] }}</p>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" @click="emit('update:visible', false)" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
        <button type="submit" :disabled="loading" class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60">Create package</button>
      </div>
    </form>
  </Dialog>
</template>

