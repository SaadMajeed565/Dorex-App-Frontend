<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import { useToast } from 'primevue/usetoast';

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

const loadSubscription = async () => {
  if (!props.subscriptionId) return;
  loading.value = true;
  try {
    const res = await axiosClient.get(`/subscriptions/${props.subscriptionId}`);
    subscription.value = res.data.subscription || res.data.data;
  } catch (error: any) {
    subscription.value = null;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load subscription data.',
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
  { immediate: false }
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
          <dt class="text-gray-500">Customer ID</dt>
          <dd class="text-gray-900">{{ subscription.customer_id || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Package ID</dt>
          <dd class="text-gray-900">{{ subscription.package_id || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Start Date</dt>
          <dd class="text-gray-900">{{ subscription.start_date || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">End Date</dt>
          <dd class="text-gray-900">{{ subscription.end_date || '-' }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Status</dt>
          <dd class="text-gray-900 capitalize">{{ subscription.status || '-' }}</dd>
        </div>
      </dl>
    </div>
    <div v-else class="py-4 text-center text-sm text-gray-500">
      No subscription data found.
    </div>
  </Dialog>
</template>

