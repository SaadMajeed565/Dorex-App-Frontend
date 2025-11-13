<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import axiosClient from '../../axios';
import { useToast } from 'primevue/usetoast';
import Dialog from '../../volt/Dialog.vue';
import Button from '../../volt/Button.vue';

const props = defineProps<{
  visible: boolean;
  communicationId: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'closed'): void;
}>();

const toast = useToast();
const loading = ref(false);
const communication = ref<any>(null);

const fetchCommunication = async () => {
  if (!props.communicationId) return;
  
  loading.value = true;
  try {
    const res = await axiosClient.get(`/communications/${props.communicationId}`);
    communication.value = res.data?.communication || res.data?.data || res.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load communication details.',
      life: 4000,
    });
    emit('update:visible', false);
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  const colors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Scheduled': 'bg-blue-100 text-blue-800',
    'Sent': 'bg-green-100 text-green-800',
    'Failed': 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getTypeColor = (type: string) => {
  const colors = {
    'Email': 'bg-blue-100 text-blue-800',
    'WhatsApp': 'bg-green-100 text-green-800',
    'SMS': 'bg-green-100 text-green-800',
    'Push Notification': 'bg-purple-100 text-purple-800',
    'Phone Call': 'bg-orange-100 text-orange-800'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

// Watch visible prop to fetch data when dialog opens
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.communicationId) {
      fetchCommunication();
    } else {
      communication.value = null;
      emit('closed');
    }
  },
  { immediate: false }
);

// Watch communicationId changes
watch(
  () => props.communicationId,
  (newId) => {
    if (props.visible && newId) {
      fetchCommunication();
    }
  }
);

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('update:visible', false);
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      window.addEventListener('keydown', handleGlobalKeydown);
    } else {
      window.removeEventListener('keydown', handleGlobalKeydown);
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Communication Details"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '900px', maxWidth: '98vw' }"
  >
    <div v-if="loading" class="flex items-center justify-center p-10">
      <div class="text-center">
        <i class="fa-light fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
        <p class="text-sm text-gray-500">Loading communication details...</p>
      </div>
    </div>

    <template v-else-if="communication">
      <div class="space-y-6">
        <!-- Header Info -->
        <div class="flex items-start justify-between pb-4 border-b border-gray-200">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ communication.subject }}</h3>
            <div class="flex items-center gap-3">
              <span :class="`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(communication.status)}`">
                {{ communication.status }}
              </span>
              <span :class="`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(communication.type)}`">
                {{ communication.type }}
              </span>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Left Column - Main Details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Message Content -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label class="text-sm font-medium text-gray-500 mb-2 block">Message</label>
              <div class="text-sm text-gray-900 whitespace-pre-wrap">
                {{ communication.message }}
              </div>
            </div>

            <!-- Template Details -->
            <div
              v-if="communication.template"
              class="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
            >
              <div>
                <label class="text-xs font-medium text-gray-500">Template Name</label>
                <p class="mt-1 text-sm font-semibold text-gray-900">
                  {{ communication.template.name }}
                </p>
                <p class="text-xs text-gray-500">
                  Channel: {{ communication.template.channel }}
                  <span v-if="communication.template.provider_template_name">
                    · Provider ID: {{ communication.template.provider_template_name }}
                  </span>
                </p>
              </div>

              <div v-if="communication.template.variables && communication.template.variables.length">
                <label class="text-xs font-medium text-gray-500">Variables</label>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="variable in communication.template.variables"
                    :key="variable.name"
                    class="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm"
                  >
                    <span class="font-medium text-gray-700">
                      {{ variable.label || variable.name }}
                    </span>
                    <span class="text-gray-900">
                      {{
                        (communication.template_variables &&
                          communication.template_variables[variable.name]) ||
                        '—'
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recipients -->
            <div>
              <label class="text-sm font-medium text-gray-500 mb-3 block">Recipients</label>
              <div v-if="communication.recipients && communication.recipients.length > 0" class="space-y-2">
                <div
                  v-for="recipient in communication.recipients"
                  :key="recipient.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ recipient.recipient || 'Unknown' }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ recipient.recipient_type?.replace('App\\Models\\', '') || 'Unknown Type' }}
                    </p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 capitalize">
                    {{ recipient.status }}
                  </span>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500">No recipients found.</p>
            </div>
          </div>

          <!-- Right Column - Sidebar Info -->
          <div class="space-y-4">
            <!-- Status Information -->
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">Status Information</h4>
              <div class="space-y-3">
                <div>
                  <label class="text-xs font-medium text-gray-500">Send Immediately</label>
                  <p class="mt-1 text-sm text-gray-900">{{ communication.send_immediately ? 'Yes' : 'No' }}</p>
                </div>

                <div v-if="communication.scheduled_at">
                  <label class="text-xs font-medium text-gray-500">Scheduled At</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(communication.scheduled_at) }}</p>
                </div>

                <div v-if="communication.sent_at">
                  <label class="text-xs font-medium text-gray-500">Sent At</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(communication.sent_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Performance Metrics -->
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">Performance</h4>
              <div class="space-y-3">
                <div>
                  <label class="text-xs font-medium text-gray-500">Total Recipients</label>
                  <p class="mt-1 text-lg font-bold text-gray-900">{{ communication.total_recipients || 0 }}</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs font-medium text-gray-500">Delivered</label>
                    <p class="mt-1 text-sm font-semibold text-gray-900">{{ communication.delivered_count || 0 }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-500">Opened</label>
                    <p class="mt-1 text-sm font-semibold text-gray-900">{{ communication.opened_count || 0 }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-500">Clicked</label>
                    <p class="mt-1 text-sm font-semibold text-gray-900">{{ communication.clicked_count || 0 }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-500">Failed</label>
                    <p class="mt-1 text-sm font-semibold text-red-600">{{ communication.failed_count || 0 }}</p>
                  </div>
                </div>

                <div v-if="communication.open_rate !== null" class="pt-2 border-t border-gray-200">
                  <label class="text-xs font-medium text-gray-500">Open Rate</label>
                  <p class="mt-1 text-sm font-semibold text-indigo-600">{{ communication.open_rate }}%</p>
                </div>

                <div v-if="communication.click_rate !== null" class="pt-2 border-t border-gray-200">
                  <label class="text-xs font-medium text-gray-500">Click Rate</label>
                  <p class="mt-1 text-sm font-semibold text-indigo-600">{{ communication.click_rate }}%</p>
                </div>
              </div>
            </div>

            <!-- Metadata -->
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">Metadata</h4>
              <div class="space-y-3">
                <div v-if="communication.creator">
                  <label class="text-xs font-medium text-gray-500">Created By</label>
                  <p class="mt-1 text-sm text-gray-900">{{ communication.creator.name || 'Unknown' }}</p>
                </div>

                <div>
                  <label class="text-xs font-medium text-gray-500">Created At</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(communication.created_at) }}</p>
                </div>

                <div>
                  <label class="text-xs font-medium text-gray-500">Last Updated</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(communication.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="w-full flex items-center justify-end">
        <Button
          label="Close"
          size="small"
          class="p-outlined"
          @click="emit('update:visible', false)"
        />
      </div>
    </template>
  </Dialog>
</template>

