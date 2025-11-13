<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import Edit from './Edit.vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{ 
  visible: boolean;
  packageId: number | string | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'deleted'): void
}>();

const pkg = ref<any>(null);
const loading = ref(false);
const showEditPackage = ref(false);
const showDeleteConfirm = ref(false);
const deleting = ref(false);
const toast = useToast();

// Function to fetch package data
const fetchPackage = async () => {
  if (!props.packageId) return;
  
  loading.value = true;
  try {
    const res = await axiosClient.get(`/packages/${props.packageId}`);
    pkg.value = res.data?.package || res.data;
  } catch (error) {
    console.error('Error fetching package:', error);
    pkg.value = null;
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible && props.packageId) {
      fetchPackage();
    } else {
      pkg.value = null;
    }
  },
  { immediate: false }
);

function formatCurrency(amount: number | string | null | undefined): string {
  if (!amount || amount === '') return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num);
}

// Delete package function
const deletePackage = async () => {
  if (!props.packageId || deleting.value) return;
  
  deleting.value = true;
  try {
    await axiosClient.delete(`/packages/${props.packageId}`);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Package deleted successfully!',
      life: 3000,
    });
    
    showDeleteConfirm.value = false;
    emit('deleted');
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to delete package. Please try again.',
      life: 4000,
    });
  } finally {
    deleting.value = false;
  }
};

// Handle delete confirmation
const handleDelete = () => {
  showDeleteConfirm.value = true;
};

// Cancel delete
const cancelDelete = () => {
  showDeleteConfirm.value = false;
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Package Details"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '600px', maxWidth: '98vw' }"
  >
    <div v-if="loading" class="flex items-center justify-center p-8">
      <i class="fa-light fa-spinner fa-spin text-2xl text-gray-400"></i>
    </div>
    <div v-else-if="pkg" class="space-y-4">
      <div class="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 class="text-lg font-semibold text-gray-900">{{ pkg.name }}</h2>
        <div class="flex items-center gap-2">
          <button
            @click="showEditPackage = true"
            class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <i class="fa-light fa-pen-to-square"></i>
            Edit
          </button>
          <button
            @click="handleDelete"
            class="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <i class="fa-light fa-trash-can"></i>
            Delete
          </button>
        </div>
      </div>
      
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-gray-500 mb-1">Company</dt>
          <dd class="text-gray-900 font-medium">{{ pkg.company_name || pkg.companyName || '—' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500 mb-1">Speed</dt>
          <dd class="text-gray-900 font-medium">{{ pkg.speed ? `${pkg.speed}` : '—' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500 mb-1">Purchase Price</dt>
          <dd class="text-gray-900 font-medium">{{ formatCurrency(pkg.purchase_price || pkg.purchasePrice) }}</dd>
        </div>
        <div>
          <dt class="text-gray-500 mb-1">Sale Price</dt>
          <dd class="text-gray-900 font-medium">{{ formatCurrency(pkg.sale_price || pkg.salePrice) }}</dd>
        </div>
        <div>
          <dt class="text-gray-500 mb-1">Status</dt>
          <dd class="text-gray-900 font-medium">
            <span :class="[
              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
              (pkg.is_active || pkg.isActive || pkg.status === 'Active') 
                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
            ]">
              {{ (pkg.is_active || pkg.isActive || pkg.status === 'Active') ? 'Active' : 'Inactive' }}
            </span>
          </dd>
        </div>
        <div v-if="pkg.description" class="sm:col-span-2">
          <dt class="text-gray-500 mb-1">Description</dt>
          <dd class="text-gray-900 font-medium">{{ pkg.description }}</dd>
        </div>
      </dl>
      
      <div v-if="pkg.created_at || pkg.createdAt" class="pt-4 border-t border-gray-200">
        <p class="text-xs text-gray-500">
          Created: {{ pkg.created_at || pkg.createdAt }}
        </p>
      </div>
    </div>
    <div v-else class="flex items-center justify-center p-8 text-gray-500">
      <p>Package not found</p>
    </div>
    
    <!-- Edit Package Dialog -->
    <Edit 
      v-model:visible="showEditPackage" 
      :package-id="packageId"
      @updated="() => { showEditPackage = false; fetchPackage(); }" 
    />
    
    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="showDeleteConfirm" 
      modal 
      header="Delete Package" 
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-4 mb-4">
        <i class="fa-light fa-exclamation-triangle text-red-500 text-2xl"></i>
        <div>
          <p class="text-gray-900 font-medium">Are you sure you want to delete this package?</p>
          <p class="text-gray-600 text-sm mt-1">
            This will permanently delete "{{ pkg?.name }}" and cannot be undone.
          </p>
        </div>
      </div>
      
      <div class="flex justify-end gap-2 pt-4">
        <button 
          @click="cancelDelete"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button 
          @click="deletePackage"
          :disabled="deleting"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i v-if="deleting" class="fa-light fa-spinner fa-spin"></i>
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </Dialog>
  </Dialog>
</template>

