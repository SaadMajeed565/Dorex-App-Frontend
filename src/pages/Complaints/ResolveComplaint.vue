<script setup lang="ts">
import { ref, watch } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import Textarea from '../../volt/Textarea.vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{
  visible: boolean;
  complaint: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'resolved', data: any): void;
}>();

const toast = useToast();
const loading = ref(false);
const resolution = ref('');

// Reset resolution when dialog opens/closes
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resolution.value = props.complaint?.resolution || '';
    } else {
      resolution.value = '';
    }
  }
);

const submit = async () => {
  if (loading.value || !props.complaint) return;
  
  if (!resolution.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Required',
      detail: 'Please provide resolution notes',
      life: 3000,
    });
    return;
  }

  loading.value = true;

  try {
    const payload = {
      status: 'resolved',
      resolution: resolution.value.trim(),
    };

    const res = await axiosClient.put(`/complaints/${props.complaint.id}`, payload);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Complaint resolved successfully',
      life: 3000,
    });
    emit('resolved', res.data);
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to resolve complaint',
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
    :header="props.complaint ? `Resolve: ${props.complaint.ticketNumber}` : 'Resolve Complaint'"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '600px', maxWidth: '98vw' }"
  >
    <div v-if="props.complaint" class="space-y-4 p-1">
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p class="text-sm font-medium text-gray-900 mb-1">{{ props.complaint.subject }}</p>
        <p class="text-sm text-gray-600">{{ props.complaint.description }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Resolution Notes *</label>
        <Textarea
          v-model="resolution"
          rows="6"
          placeholder="Describe how this complaint was resolved..."
          fluid
          size="small"
          required
        />
        <p class="text-xs text-gray-500 mt-1">Provide details about the resolution for future reference.</p>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button
          type="button"
          @click="emit('update:visible', false)"
          class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="submit"
          :disabled="loading || !resolution.trim()"
          class="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          <i v-if="loading" class="fa-light fa-spinner fa-spin"></i>
          <i v-else class="fa-light fa-check"></i>
          {{ loading ? 'Resolving...' : 'Resolve Complaint' }}
        </button>
      </div>
    </div>
    <div v-else class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      <p class="text-sm text-gray-500 mt-2">Loading complaint details...</p>
    </div>
  </Dialog>
</template>

