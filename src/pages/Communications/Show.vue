<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const communication = ref<any>(null);
const loading = ref(true);

const fetchCommunication = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get(`/communications/${route.params.id}`);
    communication.value = res.data?.communication || res.data?.data || res.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load communication.',
      life: 4000,
    });
    router.push({ name: 'Communications.Index' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCommunication();
});

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
</script>

<template>
  <MasterLayout>
    <div v-if="loading" class="flex items-center justify-center p-10">
      <div class="text-center">
        <i class="fa-light fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
        <p class="text-sm text-gray-500">Loading communication...</p>
      </div>
    </div>

    <template v-else-if="communication">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            @click="router.back()"
            class="mb-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <i class="fa-light fa-arrow-left"></i>
            Back
          </button>
          <h1 class="text-2xl font-bold text-gray-900">{{ communication.subject }}</h1>
          <p class="text-sm text-gray-500">Communication Details</p>
        </div>
        <div class="flex items-center gap-3">
          <span :class="`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(communication.status)}`">
            {{ communication.status }}
          </span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left Column - Main Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Communication Details Card -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Communication Details</h2>
            
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500">Subject</label>
                <p class="mt-1 text-sm text-gray-900">{{ communication.subject }}</p>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500">Message</label>
                <div class="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {{ communication.message }}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-500">Type</label>
                  <div class="mt-1">
                    <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(communication.type)}`">
                      {{ communication.type }}
                    </span>
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium text-gray-500">Recipient Type</label>
                  <p class="mt-1 text-sm text-gray-900 capitalize">{{ communication.recipient_type }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recipients Card -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Recipients</h2>
            <div v-if="communication.recipients && communication.recipients.length > 0" class="space-y-2">
              <div
                v-for="recipient in communication.recipients"
                :key="recipient.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ recipient.recipient || 'Unknown' }}</p>
                  <p class="text-xs text-gray-500">{{ recipient.recipient_type }}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                  {{ recipient.status }}
                </span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500">No recipients found.</p>
          </div>
        </div>

        <!-- Right Column - Sidebar -->
        <div class="space-y-6">
          <!-- Status Card -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Status Information</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-gray-500">Current Status</label>
                <div class="mt-1">
                  <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(communication.status)}`">
                    {{ communication.status }}
                  </span>
                </div>
              </div>

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

          <!-- Performance Metrics Card -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-gray-500">Total Recipients</label>
                <p class="mt-1 text-lg font-bold text-gray-900">{{ communication.total_recipients || 0 }}</p>
              </div>

              <div>
                <label class="text-xs font-medium text-gray-500">Delivered</label>
                <p class="mt-1 text-sm text-gray-900">{{ communication.delivered_count || 0 }}</p>
              </div>

              <div>
                <label class="text-xs font-medium text-gray-500">Opened</label>
                <p class="mt-1 text-sm text-gray-900">{{ communication.opened_count || 0 }}</p>
              </div>

              <div>
                <label class="text-xs font-medium text-gray-500">Clicked</label>
                <p class="mt-1 text-sm text-gray-900">{{ communication.clicked_count || 0 }}</p>
              </div>

              <div v-if="communication.open_rate !== null">
                <label class="text-xs font-medium text-gray-500">Open Rate</label>
                <p class="mt-1 text-sm font-semibold text-gray-900">{{ communication.open_rate }}%</p>
              </div>

              <div v-if="communication.click_rate !== null">
                <label class="text-xs font-medium text-gray-500">Click Rate</label>
                <p class="mt-1 text-sm font-semibold text-gray-900">{{ communication.click_rate }}%</p>
              </div>
            </div>
          </div>

          <!-- Metadata Card -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Metadata</h3>
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
    </template>
  </MasterLayout>
</template>

