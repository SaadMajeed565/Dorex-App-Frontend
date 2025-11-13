<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'created', data: any): void
}>();

const form = ref({ name: '', parent_area_id: '', coverage_map: '' });
const loading = ref(false);
const dialogFormRef = ref<HTMLElement | null>(null);
const areas = ref<any[]>([]);
const areasLoading = ref(false);
const selectedParentArea = ref<any>(null);
const parentSearchTerm = ref('');

// Function to fetch areas for parent selection
const fetchAreas = async () => {
  areasLoading.value = true;
  try {
    const response = await axiosClient.get('/areas');
    if (response.data?.status && Array.isArray(response.data?.areas)) {
      areas.value = response.data.areas;
    } else {
      areas.value = [];
    }
  } catch (error) {
    console.error("Error fetching areas:", error);
    areas.value = [];
  } finally {
    areasLoading.value = false;
  }
};

// Function to search areas for AutoComplete
const searchAreas = (event: any) => {
  parentSearchTerm.value = event.query;
  // The AutoComplete will automatically filter based on the query
};

// Function to handle area selection
const onAreaSelect = (event: any) => {
  selectedParentArea.value = event.value;
  form.value.parent_area_id = event.value?.id || '';
};


watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchAreas(); // Load areas when dialog opens
      nextTick(() => {
        const root = dialogFormRef.value;
        const candidate = root?.querySelector(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null;
        candidate?.focus();
      });
    } else {
      // Reset form when dialog closes
      form.value = { name: '', parent_area_id: '', coverage_map: '' };
      selectedParentArea.value = null;
      parentSearchTerm.value = '';
    }
  },
  { immediate: false }
);

async function submit() {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await axiosClient.post('/areas', form.value);
    emit('created', res.data);
    emit('update:visible', false);
    form.value = { name: '', parent_area_id: '', coverage_map: '' };
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Add New Area"
    :closable="true"
    :breakpoints="{ '960px': '90vw', '640px': '98vw' }"
    :style="{ width: '720px', maxWidth: '98vw' }"
  >
    <form ref="dialogFormRef" @submit.prevent="submit" class="space-y-4 p-1">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Name</label>
          <InputText 
            v-model="form.name" 
            placeholder="Enter area name"
            size="small"
            fluid
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Parent Area</label>
          <AutoComplete
            size="small"
            fluid
            v-model="selectedParentArea"
            :suggestions="areas"
            @complete="searchAreas"
            @item-select="onAreaSelect"
            option-label="name"
            placeholder="Search for parent area..."
            :loading="areasLoading"
            class="w-full"
            dropdown
          >
            <template #item="{ option }">
              <div class="flex flex-col">
                <div class="font-medium text-gray-900">{{ option.name }}</div>
                <div v-if="option.code" class="text-xs text-gray-500">{{ option.code }}</div>
              </div>
            </template>
          </AutoComplete>
        </div>
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">Coverage Map (JSON)</label>
        <Textarea 
          v-model="form.coverage_map" 
          rows="5"
          placeholder="Enter coverage map JSON..."
          size="small"
          fluid
        />
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" @click="emit('update:visible', false)" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
        <button type="submit" :disabled="loading" class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60">Create area</button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
</style>


