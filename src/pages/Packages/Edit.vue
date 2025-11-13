<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{ 
  visible: boolean;
  packageId: number | string | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'updated', data: any): void
}>();

const form = ref({ company_name: '', name: '', description: '', speed: '', purchase_price: '', sale_price: '', is_active: true });
const loading = ref(false);
const fetchingPackage = ref(false);
const dialogFormRef = ref<HTMLElement | null>(null);
const toast = useToast();
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

// Function to fetch package data
const fetchPackage = async () => {
  if (!props.packageId) return;
  
  fetchingPackage.value = true;
  try {
    const res = await axiosClient.get(`/packages/${props.packageId}`);
    const pkg = res.data?.package || res.data;
    form.value = {
      company_name: pkg.company_name ?? pkg.companyName ?? '',
      name: pkg.name ?? '',
      description: pkg.description ?? '',
      speed: pkg.speed ?? '',
      purchase_price: pkg.purchase_price ?? pkg.purchasePrice ?? '',
      sale_price: pkg.sale_price ?? pkg.salePrice ?? '',
      is_active: pkg.is_active ?? pkg.isActive ?? (pkg.status === 'Active' || pkg.status === true)
    };
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load package data.',
      life: 4000,
    });
  } finally {
    fetchingPackage.value = false;
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
    if (visible && props.packageId) {
      fetchCompanies().then(() => {
        filteredCompanySuggestions.value = companySuggestions.value;
      });
      fetchPackage();
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
      filteredCompanySuggestions.value = [];
    }
  },
  { immediate: false }
);

async function save() {
  if (loading.value || !props.packageId) return;
  loading.value = true;
  try {
    const res = await axiosClient.put(`/packages/${props.packageId}`, form.value);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data?.message || 'Package updated successfully!',
      life: 3000,
    });
    
    emit('updated', res.data);
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to update package. Please try again.',
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
    header="Edit Package"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <div v-if="fetchingPackage" class="flex items-center justify-center p-8">
      <i class="fa-light fa-spinner fa-spin text-2xl text-gray-400"></i>
    </div>
    <form v-else ref="dialogFormRef" @submit.prevent="save" class="space-y-4 p-1">
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
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Name</label>
          <InputText 
            v-model="form.name" 
            placeholder="Enter package name"
            size="small"
            fluid
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Speed (Mbps)</label>
          <InputText 
            v-model="form.speed" 
            placeholder="Enter speed"
            size="small"
            fluid
          />
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
          />
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
          />
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
        />
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" @click="emit('update:visible', false)" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
        <button type="submit" :disabled="loading" class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60">
          <i v-if="loading" class="fa-light fa-spinner fa-spin"></i>
          {{ loading ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

