<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const area = ref<any>(null);

onMounted(async () => {
  const { id } = route.params as { id: string };
  const res = await axiosClient.get(`/areas/${id}`);
  area.value = res.data.area;
});
</script>

<template>
  <MasterLayout>
    <div class="rounded-xl border border-gray-200 bg-white p-4">
      <div v-if="area">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800">{{ area.name }}</h2>
          <router-link :to="{ name: 'Areas.Edit', params: { id: area.id } }" class="text-sm text-[var(--p-primary-700)] hover:underline">Edit</router-link>
        </div>
        <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500">Parent Area</dt>
            <dd class="text-gray-900">{{ area.parent_area_id || '-' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-gray-500">Coverage Map</dt>
            <dd class="text-gray-900"><pre class="whitespace-pre-wrap">{{ area.coverage_map }}</pre></dd>
          </div>
        </dl>
      </div>
      <div v-else class="text-sm text-gray-500">Loading...</div>
    </div>
  </MasterLayout>
</template>

