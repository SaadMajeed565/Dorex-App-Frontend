<script setup lang="ts">
import { computed, ref } from 'vue';
import Dialog from '../../volt/Dialog.vue';
import Button from '../../volt/Button.vue';
import OrganizationChart from '../../volt/OrganizationChart.vue';

const props = defineProps<{
  visible: boolean;
  areas?: any[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>();

// Zoom controls
const scale = ref(1);
const minScale = 0.5;
const maxScale = 2;
const step = 0.1;

const zoomOut = () => {
  scale.value = Math.max(minScale, +(scale.value - step).toFixed(2));
};

const zoomIn = () => {
  scale.value = Math.min(maxScale, +(scale.value + step).toFixed(2));
};

const resetZoom = () => {
  scale.value = 1;
};

const transformStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'center center',
}));

const chartContainer = ref<HTMLElement | null>(null);

// Handle mouse wheel zoom (only when Ctrl / Cmd is pressed, so normal scroll still works)
const handleWheelZoom = (event: WheelEvent) => {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }
  event.preventDefault();
  const delta = event.deltaY > 0 ? -step : step;
  const newScale = Math.max(minScale, Math.min(maxScale, +(scale.value + delta).toFixed(2)));
  scale.value = newScale;
};

// Transform areas data into OrgChart format
const orgChartData = computed(() => {
  const list = props.areas ?? [];
  if (list.length === 0) return null;

  // Index by id for quick lookups
  const idToArea = new Map<number, any>();
  for (const a of list) idToArea.set(a.id, a);

  const getFullChildren = (area: any): any[] => {
    // Prefer embedded children if present; otherwise derive from flat list
    const embedded = Array.isArray(area.children) ? area.children : [];
    if (embedded.length > 0) {
      return embedded.map((c: any) => idToArea.get(c.id) ?? c);
    }
    return list.filter((x) => x.parent_id === area.id);
  };

  const visited = new Set<number>();
  const buildNode = (area: any): any => {
    if (!area) return null;
    if (visited.has(area.id)) {
      return {
        key: area.id,
        label: area.name,
        data: area,
        children: [],
      };
    }
    visited.add(area.id);
    const children = getFullChildren(area)
      .map((c) => buildNode(idToArea.get(c.id) ?? c))
      .filter(Boolean);

    return {
      key: area.id,
      label: area.name,
      data: area,
      children,
    };
  };

  // Determine roots
  const rootAreas = list.filter((a) => a.parent_id == null);
  if (rootAreas.length === 0) return null;

  if (rootAreas.length === 1) {
    return buildNode(rootAreas[0]);
  }

  return {
    key: 'root',
    label: 'All Areas',
    children: rootAreas.map((r) => buildNode(r))
  };
});

const closeDialog = () => {
  emit('update:visible', false);
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="closeDialog"
    modal
    header="Areas Organization Chart"
    :closable="true"
    :breakpoints="{ '960px': '95vw', '640px': '98vw' }"
    :style="{ width: '90vw', maxWidth: '1400px', height: '85vh' }"
  >
    <div class="flex flex-col h-full">
      <!-- Zoom Controls -->
      <div v-if="orgChartData" class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button 
            @click="zoomOut"
            :disabled="scale <= minScale"
            title="Zoom Out"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fa-light fa-minus text-sm"></i>
          </button>
          <button 
            @click="resetZoom"
            title="Reset Zoom"
            class="inline-flex items-center justify-center px-3 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            {{ Math.round(scale * 100) }}%
          </button>
          <button 
            @click="zoomIn"
            :disabled="scale >= maxScale"
            title="Zoom In"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fa-light fa-plus text-sm"></i>
          </button>
        </div>
        <div class="text-sm text-gray-500 flex items-center gap-1">
          <i class="fa-light fa-magnifying-glass"></i>
          <span>Zoom: {{ Math.round(scale * 100) }}%</span>
        </div>
      </div>

      <!-- OrgChart Container -->
      <div v-if="!orgChartData" class="flex items-center justify-center h-full">
        <div class="text-center text-gray-500">
          <i class="fa-light fa-sitemap fa-3x mb-3"></i>
          <p>No areas available to display</p>
          <p class="text-xs mt-2">Areas received: {{ areas?.length || 0 }}</p>
        </div>
      </div>

      <div 
        v-else 
        ref="chartContainer"
        class="flex-1 overflow-auto border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 relative"
        @wheel="handleWheelZoom"
      >
        <div class="p-6 flex items-center justify-center min-h-full" :style="transformStyle">
          <OrganizationChart
            :value="orgChartData"
          >
            <template #default="slotProps">
              <div class="flex flex-col items-start gap-1 text-left">
                <div class="flex items-center gap-2">
                  <i class="fa-light fa-map-location-dot text-indigo-500"></i>
                  <span class="font-semibold text-sm text-gray-900">
                    {{ slotProps.node.label }}
                  </span>
                </div>
                <div class="text-xs text-gray-500" v-if="slotProps.node.data?.code">
                  Code: <span class="font-medium text-gray-700">{{ slotProps.node.data.code }}</span>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-gray-500">
                  <span v-if="slotProps.node.data?.infrastructure">
                    Infra:
                    <span class="font-medium text-gray-700">{{ slotProps.node.data.infrastructure }}</span>
                  </span>
                  <span v-if="slotProps.node.data?.manager">
                    Manager:
                    <span class="font-medium text-gray-700">{{ slotProps.node.data.manager }}</span>
                  </span>
                  <span v-if="slotProps.node.data?.customers_count != null">
                    Customers:
                    <span class="font-medium text-gray-700">
                      {{ (slotProps.node.data.customers_count || 0).toLocaleString() }}
                    </span>
                  </span>
                </div>
              </div>
            </template>
          </OrganizationChart>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-4 flex justify-end gap-3">
        <Button
          label="Close"
          size="small"
          class="p-outlined"
          @click="closeDialog"
        />
      </div>
    </div>
  </Dialog>
</template>
