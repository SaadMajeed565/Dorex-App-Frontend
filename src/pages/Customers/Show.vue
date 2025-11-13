<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import Card from '../../volt/Card.vue';
import Badge from '../../volt/Badge.vue';
import Avatar from '../../volt/Avatar.vue';
import Button from '../../volt/Button.vue';
import SectionHeader from '../../volt/SectionHeader.vue';
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
  try {
    const res = await axiosClient.get(`/customers/${props.customerId}`);
    customer.value = res.data.customer;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load customer data.',
      life: 4000,
    });
  }
};

// Watch for changes in visibility or customerId
watch(
  () => [props.visible, props.customerId],
  async ([visible, id]) => {
    if (visible && id) await loadCustomer();
  },
  { immediate: true }
);
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Customer Details"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '1080px', maxWidth: '98vw' }"
  >
    <div class="space-y-6">
      <div v-if="customer">
        <!-- Customer Header -->
        <Card>
          <template #content>
            <div class="flex items-center space-x-4">
              <Avatar :label="customer.name.charAt(0).toUpperCase()" size="xlarge" />
              <div class="flex-1">
                <h2 class="text-xl font-semibold text-gray-900">{{ customer.name }}</h2>
                <p class="text-gray-600">{{ customer.email }}</p>
                <div class="flex items-center space-x-2 mt-2">
                  <Badge
                    :value="customer.status"
                    :severity="customer.status === 'active' ? 'success' : 'danger'"
                  />
                  <span class="text-sm text-gray-500 capitalize">{{ customer.current_role }}</span>
                </div>
              </div>
              <Button
                label="Edit"
                icon="pi pi-pencil"
                outlined
                @click="handleEdit"
              />
            </div>
          </template>
        </Card>

        <!-- Contact Information -->
        <Card>
          <template #title>
            <SectionHeader title="Contact Information" />
          </template>
          <template #content>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Phone</dt>
                <dd class="text-sm text-gray-900">{{ customer.phone }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Alternative Phone</dt>
                <dd class="text-sm text-gray-900">{{ customer.alternative_phone || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="text-sm text-gray-900">{{ customer.email }}</dd>
              </div>
            </dl>
          </template>
        </Card>

        <!-- Address Information -->
        <Card>
          <template #title>
            <SectionHeader title="Address Information" />
          </template>
          <template #content>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Area</dt>
                <dd class="text-sm text-gray-900">{{ customer.area }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">Address</dt>
                <dd class="text-sm text-gray-900">{{ customer.address }}</dd>
              </div>
            </dl>
          </template>
        </Card>

        <!-- Personal Information -->
        <Card>
          <template #title>
            <SectionHeader title="Personal Information" />
          </template>
          <template #content>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">NIC</dt>
                <dd class="text-sm text-gray-900">{{ customer.nic }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Current Role</dt>
                <dd class="text-sm text-gray-900 capitalize">{{ customer.current_role }}</dd>
              </div>
            </dl>
          </template>
        </Card>

        <!-- Billing Information -->
        <Card>
          <template #title>
            <SectionHeader title="Billing Information" />
          </template>
          <template #content>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Fee Amount</dt>
                <dd class="text-sm text-gray-900">{{ customer.fee_amount ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Payment Date</dt>
                <dd class="text-sm text-gray-900">{{ customer.payment_date ?? '-' }}</dd>
              </div>
            </dl>
          </template>
        </Card>

        <!-- Panel Information -->
        <Card>
          <template #title>
            <SectionHeader title="Panel Information" />
          </template>
          <template #content>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Panel ID</dt>
                <dd class="text-sm text-gray-900">{{ customer.panel_id || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Panel Password</dt>
                <dd class="text-sm text-gray-900">{{ customer.panel_password || '-' }}</dd>
              </div>
            </dl>
          </template>
        </Card>
      </div>

      <div v-else class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p class="text-sm text-gray-500 mt-2">Loading customer details...</p>
      </div>
    </div>
  </Dialog>
</template>
