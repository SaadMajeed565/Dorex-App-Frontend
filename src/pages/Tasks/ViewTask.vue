<script setup lang="ts">
import Dialog from '../../volt/Dialog.vue';
import Card from '../../volt/Card.vue';
import Badge from '../../volt/Badge.vue';

const props = defineProps<{
  visible: boolean;
  task: any | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const getStatusSeverity = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'in_progress':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getPrioritySeverity = (priority: string) => {
  switch (priority?.toLowerCase()) {
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

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    :header="props.task ? `Task: ${props.task.title}` : 'Task Details'"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '900px', maxWidth: '98vw' }"
  >
    <div v-if="props.task" class="space-y-6">
      <!-- Header Info -->
      <Card>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ props.task.title }}</h3>
              <div class="flex items-center gap-2 flex-wrap">
                <Badge :value="props.task.status?.replace('_', ' ')" :severity="getStatusSeverity(props.task.status)" />
                <Badge :value="props.task.priority" :severity="getPrioritySeverity(props.task.priority)" />
                <Badge :value="props.task.type" severity="info" />
                <Badge v-if="props.task.is_overdue" value="Overdue" severity="danger" />
              </div>
            </div>
            <div class="text-right md:text-left md:pl-4">
              <p class="text-sm text-gray-500">Created</p>
              <p class="text-sm font-medium text-gray-900">{{ formatDate(props.task.created_at) }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Description -->
      <Card v-if="props.task.description">
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Description</h4>
        </template>
        <template #content>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ props.task.description }}</p>
        </template>
      </Card>

      <!-- Task Information -->
      <Card>
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Task Information</h4>
        </template>
        <template #content>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Due Date</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ formatDate(props.task.due_date) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Started At</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ formatDate(props.task.started_at) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Completed At</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ formatDate(props.task.completed_at) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.task.assigned_employee?.name || 'Unassigned' }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <!-- Customer Information -->
      <Card v-if="props.task.customer">
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Customer Information</h4>
        </template>
        <template #content>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Name</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.task.customer.name || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Email</dt>
              <dd class="text-sm text-gray-900 mt-1">{{ props.task.customer.email || '—' }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <!-- Notes -->
      <Card v-if="props.task.notes">
        <template #title>
          <h4 class="text-sm font-semibold text-gray-800">Notes</h4>
        </template>
        <template #content>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ props.task.notes }}</p>
        </template>
      </Card>
    </div>
  </Dialog>
</template>

