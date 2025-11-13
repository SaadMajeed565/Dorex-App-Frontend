<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const addons = ref<any[]>([]);

onMounted(async () => {
  const { id } = route.params as { id: string };
  const res = await axiosClient.get(`/packages/${id}/addons`);
  addons.value = res.data.addons || [];
});
</script>

<template>
  <MasterLayout>
    <div class="rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-800">Plan addons</h2>
        <router-link :to="{ name: 'PlanAddons.Create', params: { id: ($route.params as any).id } }" class="text-sm text-[var(--p-primary-700)] hover:underline">Add addon</router-link>
      </div>
      <ul class="mt-3 divide-y divide-gray-100 text-sm">
        <li v-for="a in addons" :key="a.id" class="py-2 flex items-center justify-between">
          <div class="text-gray-800">{{ a.name }} — {{ a.price }}</div>
          <router-link :to="{ name: 'PlanAddons.Edit', params: { id: ($route.params as any).id, addonId: a.id } }" class="text-xs text-gray-600 hover:underline">Edit</router-link>
        </li>
      </ul>
    </div>
  </MasterLayout>
</template>

