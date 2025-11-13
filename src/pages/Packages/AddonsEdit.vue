<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const router = useRouter();
const form = ref<any>({});

onMounted(async () => {
  const { id, addonId } = route.params as { id: string; addonId: string };
  const res = await axiosClient.get(`/packages/${id}/addons/${addonId}`);
  form.value = res.data.addon;
});

async function save() {
  const { id, addonId } = route.params as { id: string; addonId: string };
  await axiosClient.put(`/packages/${id}/addons/${addonId}`, form.value);
  router.push({ name: 'PlanAddons.Index', params: { id } });
}
</script>

<template>
  <MasterLayout>
    <div class="max-w-2xl">
      <h2 class="text-base font-semibold text-gray-800 mb-4">Edit addon</h2>
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Name</label>
            <input v-model="form.name" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Price</label>
            <input v-model="form.price" type="number" step="0.01" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Description</label>
          <textarea v-model="form.description" rows="4" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"></textarea>
        </div>
        <div class="pt-2">
          <button type="submit" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Save changes</button>
        </div>
      </form>
    </div>
  </MasterLayout>
</template>

