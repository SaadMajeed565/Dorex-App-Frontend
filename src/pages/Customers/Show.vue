<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import { useToast } from 'primevue/usetoast';

// Props & Emits
const props = defineProps<{
  visible: boolean;
  customerId: string | number | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'updated'): void;
  (e: 'edit', customerId: string | number): void;
}>();

// State
const customer = ref<any>(null);
const loading = ref(false);
const toast = useToast();

// Handle edit button click
const handleEdit = () => {
  if (props.customerId) {
    emit('edit', props.customerId);
  }
};

// Load customer data
const loadCustomer = async () => {
  if (!props.customerId) return;
  loading.value = true;
  try {
    const res = await axiosClient.get(`/customers/${props.customerId}`);
    customer.value = res.data.customer;
  } catch (error: any) {
    customer.value = null;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load customer data.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

// Watch for visibility changes and load/reset data
watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.customerId) {
      await loadCustomer();
    } else if (!visible) {
      customer.value = null;
    }
  },
  { immediate: false }
);
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Customer Details"
    :closable="true"
    :style="{ width: '620px', maxWidth: '97vw' }"
  >
    <div v-if="loading" class="py-8 text-center text-gray-500">
      <i class="fa-light fa-spinner fa-spin text-2xl"></i>
    </div>
    <div v-else-if="customer" class="space-y-4 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600"
          >
            <span>{{ customer.name?.charAt(0) || '?' }}</span>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ customer.name || 'Unknown' }}
            </h2>
            <div class="text-xs text-gray-500">Customer ID: #{{ customer.id }}</div>
          </div>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          @click="handleEdit"
        >
          <i class="fa-light fa-pen-to-square text-sm"></i>
          Edit
        </button>
      </div>

      <dl class="grid grid-cols-1 gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-gray-500">Email</dt>
          <dd class="text-gray-900 break-all">{{ customer.email || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Primary Phone</dt>
          <dd class="text-gray-900">{{ customer.phone || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Alternative Phone</dt>
          <dd class="text-gray-900">{{ customer.alternative_phone || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Status</dt>
          <dd class="text-gray-900 capitalize">{{ customer.status || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Area</dt>
          <dd class="text-gray-900">{{ customer.area || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Full Address</dt>
          <dd class="text-gray-900">{{ customer.address || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">NIC</dt>
          <dd class="text-gray-900">{{ customer.nic || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Current Role</dt>
          <dd class="text-gray-900 capitalize">{{ customer.current_role || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Fee Amount</dt>
          <dd class="text-gray-900">{{ customer.customer.fee_amount ?? '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Next Payment Date</dt>
          <dd class="text-gray-900">{{ customer.customer.payment_date ?? '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Router Panel ID</dt>
          <dd class="text-gray-900">{{ customer.customer.panel_id || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Router Panel Password</dt>
          <dd class="text-gray-900">{{ customer.customer.panel_password || '-' }}</dd>
        </div>
      </dl>
    </div>
    <div v-else class="py-4 text-center text-sm text-gray-500">
      No customer data found.
    </div>
  </Dialog>
</template>
