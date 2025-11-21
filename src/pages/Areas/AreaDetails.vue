<script setup lang="ts">
import { computed } from 'vue';
import Dialog from '../../volt/Dialog.vue';

const props = defineProps<{
  visible: boolean
  area: any | null
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>();

const title = computed(() => props.area?.name ? `Area: ${props.area.name}` : 'Area Details');
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    :header="title"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <div v-if="props.area" class="space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-xl border border-gray-100 p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Basic</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Name</span><span class="font-medium text-gray-900">{{ props.area.name }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Code</span><span class="font-medium text-gray-900">{{ props.area.code ?? '—' }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="font-medium text-gray-900">{{ props.area.status ?? '—' }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Customers</span><span class="font-medium text-gray-900">{{ (props.area.customers_count || 0).toLocaleString() }}</span></div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-100 p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Operations</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Infrastructure</span><span class="font-medium text-gray-900">{{ props.area.infrastructure ?? '—' }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Manager</span><span class="font-medium text-gray-900">{{ props.area.manager ?? '—' }}</span></div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-100 p-4">
        <h3 class="text-sm font-semibold text-gray-800 mb-2">Meta</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">ID</span><span class="font-medium text-gray-900">{{ props.area.id }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Parent ID</span><span class="font-medium text-gray-900">{{ props.area.parent_id ?? '—' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Created</span><span class="font-medium text-gray-900">{{ props.area.created_at ?? '—' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Updated</span><span class="font-medium text-gray-900">{{ props.area.updated_at ?? '—' }}</span></div>
        </div>
      </div>

      <div v-if="props.area.coverage_map" class="rounded-xl border border-gray-100 p-4">
        <h3 class="text-sm font-semibold text-gray-800 mb-2">Coverage Map</h3>
        <pre class="text-xs bg-gray-50 border border-gray-100 rounded p-2 overflow-auto max-h-48">{{ typeof props.area.coverage_map === 'string' ? props.area.coverage_map : JSON.stringify(props.area.coverage_map, null, 2) }}</pre>
        <div v-for="child in props.area.children" :key="child.id">
          <pre class="text-xs bg-gray-50 border border-gray-100 rounded p-2 overflow-auto max-h-48">{{ child.name }}</pre>
        </div>
      </div>
    </div>
    <div v-else class="text-sm text-gray-500">No area selected.</div>
  </Dialog>
</template>

<style scoped>
</style>


