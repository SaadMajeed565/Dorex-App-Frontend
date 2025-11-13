<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const form = ref({ name: '', price: '', description: '' });

async function submit() {
  const { id } = route.params as { id: string };
  await axiosClient.post(`/packages/${id}/addons`, form.value);
}
</script>

<template>
  <MasterLayout>
    <div class="max-w-2xl">
      <h2 class="text-base font-semibold text-gray-800 mb-4">Add addon</h2>
      <form @submit.prevent="submit" class="space-y-4">
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
          <button type="submit" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Create addon</button>
        </div>
      </form>
    </div>
  </MasterLayout>
</template>

