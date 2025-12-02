<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import { useToast } from 'primevue/usetoast';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';

const props = defineProps<{
  visible: boolean;
  subscriptionId: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const subscription = ref<any>(null);
const loading = ref(false);
const toast = useToast();
const generalSettingsStore = useGeneralSettingsStore();
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit);

const formatCurrency = (amount?: number) => {
  const value = typeof amount === 'number' ? amount : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: tenantCurrency.value, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toFixed(0)} ${tenantCurrency.value}`;
  }
};

const loadSubscription = async () => {
  if (!props.subscriptionId) {
    console.warn('loadSubscription called without subscriptionId');
    return;
  }
  loading.value = true;
  try {
    const res = await axiosClient.get(`/subscriptions/${props.subscriptionId}`);
    // Backend returns: { status: true, data: SubscriptionResource }
    subscription.value = res.data.data || res.data.subscription || res.data;
    
    // If still no data, log for debugging
    if (!subscription.value) {
      console.error('Subscription data not found in response:', res.data);
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Subscription data structure unexpected. Check console for details.',
        life: 4000,
      });
    }
  } catch (error: any) {
    subscription.value = null;
    console.error('Error loading subscription:', error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to load subscription data.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.subscriptionId) {
      await loadSubscription();
    } else if (!visible) {
      subscription.value = null;
    }
  },
  { immediate: true }
);

// Also watch for subscriptionId changes when modal is already open
watch(
  () => props.subscriptionId,
  async (newId) => {
    if (props.visible && newId) {
      await loadSubscription();
    }
  },
  { immediate: true }
);
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Subscription Details"
    :closable="true"
    :style="{ width: '620px', maxWidth: '97vw' }"
  >
    <div v-if="loading" class="py-8 text-center text-gray-500">
      <i class="fa-light fa-spinner fa-spin text-2xl"></i>
    </div>
    <div v-else-if="subscription" class="space-y-4 py-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Subscription #{{ subscription.id }}</h2>
          <div class="text-xs text-gray-500 mt-1">Status: {{ subscription.status }}</div>
        </div>
      </div>

      <dl class="grid grid-cols-1 gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-gray-500">Customer</dt>
          <dd class="text-gray-900">
            <span v-if="subscription.customer?.name">{{ subscription.customer.name }}</span>
            <span v-else-if="subscription.customer_id">ID: {{ subscription.customer_id }}</span>
            <span v-else>—</span>
          </dd>
          <dd v-if="subscription.customer?.email" class="text-xs text-gray-500 mt-0.5">{{ subscription.customer.email }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Package</dt>
          <dd class="text-gray-900">
            <span v-if="subscription.package?.name">{{ subscription.package.name }}</span>
            <span v-else-if="subscription.package_snapshot?.name">{{ subscription.package_snapshot.name }}</span>
            <span v-else-if="subscription.package_id">ID: {{ subscription.package_id }}</span>
            <span v-else>—</span>
          </dd>
          <dd v-if="subscription.package?.speed" class="text-xs text-gray-500 mt-0.5">{{ subscription.package.speed }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Start Date</dt>
          <dd class="text-gray-900">{{ subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : '—' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">End Date</dt>
          <dd class="text-gray-900">{{ subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : '—' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Status</dt>
          <dd class="text-gray-900 capitalize">{{ subscription.status || '—' }}</dd>
        </div>
        <div v-if="subscription.package?.sale_price || subscription.package_snapshot?.sale_price">
          <dt class="text-gray-500">Price</dt>
          <dd class="text-gray-900 font-medium">
            {{ formatCurrency(subscription.package?.sale_price || subscription.package_snapshot?.sale_price || 0) }}
          </dd>
        </div>
        <div v-if="subscription.supervisor?.name">
          <dt class="text-gray-500">Supervisor</dt>
          <dd class="text-gray-900">{{ subscription.supervisor.name }}</dd>
        </div>
      </dl>
    </div>
    <div v-else class="py-4 text-center text-sm text-gray-500">
      No subscription data found.
    </div>
  </Dialog>
</template>

