<script setup lang="ts">
import Dialog from '../../volt/Dialog.vue';
import Card from '../../volt/Card.vue';
import Badge from '../../volt/Badge.vue';

const props = defineProps<{
  visible: boolean;
  complaint: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const getStatusSeverity = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'danger';
    case 'in progress':
      return 'warn';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'info';
    default:
      return 'secondary';
  }
};

const getPrioritySeverity = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'low':
      return 'secondary';
    case 'medium':
      return 'info';
    case 'high':
      return 'warn';
    case 'critical':
      return 'danger';
    default:
      return 'secondary';
  }
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    :header="props.complaint ? `Ticket: ${props.complaint.ticketNumber}` : 'Complaint Details'"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '900px', maxWidth: '98vw' }"
  >
    <div v-if="props.complaint" class="space-y-6">
      <!-- Header Info -->
      <Card>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ props.complaint.subject }}</h3>
              <div class="flex items-center gap-2 flex-wrap">
                <Badge :value="props.complaint.status" :severity="getStatusSeverity(props.complaint.status)" />
                <Badge :value="props.complaint.priority" :severity="getPrioritySeverity(props.complaint.priority)" />
                <Badge :value="props.complaint.category" severity="info" />
              </div>
            </div>
            <div class="text-right md:text-left md:pl-4">
              <p class="text-sm text-gray-500">Created</p>
              <p class="text-sm font-medium text-gray-900">{{ new Date(props.complaint.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true}) }}</p>
              <p class="text-sm text-gray-500 mt-1">Last Updated</p>
              <p class="text-sm font-medium text-gray-900">{{ new Date(props.complaint.lastUpdated).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true}) }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Customer Information -->
      <Card>
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Customer Information</h4>
        </template>
        <template #content>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Name</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.complaint.customerName || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Email</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.complaint.customerEmail || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Phone</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.complaint.customerPhone || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Area</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.complaint.customerArea || '—' }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <!-- Complaint Details -->
      <Card>
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Complaint Details</h4>
        </template>
        <template #content>
          <div class="space-y-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Description</dt>
              <dd class="text-sm text-gray-900 mt-2 whitespace-pre-wrap">{{ props.complaint.description || '—' }}</dd>
            </div>
          </div>
        </template>
      </Card>

      <!-- Assignment Information -->
      <Card>
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Assignment</h4>
        </template>
        <template #content>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.complaint.assignedTo || 'Unassigned' }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <!-- Resolution -->
      <Card v-if="props.complaint.resolution || props.complaint.status === 'Resolved'">
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Resolution</h4>
        </template>
        <template #content>
          <div class="space-y-2">
            <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ props.complaint.resolution || 'No resolution notes provided.' }}</p>
          </div>
        </template>
      </Card>
    </div>
    <div v-else class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="text-sm text-gray-500 mt-2">Loading complaint details...</p>
    </div>
  </Dialog>
</template>

