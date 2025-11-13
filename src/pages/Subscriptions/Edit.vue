<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const router = useRouter();
const form = ref<any>({});

onMounted(async () => {
  const { id } = route.params as { id: string };
  const res = await axiosClient.get(`/subscriptions/${id}`);
  form.value = res.data.subscription;
});

async function save() {
  const { id } = route.params as { id: string };
  await axiosClient.put(`/subscriptions/${id}`, form.value);
  router.push({ name: 'Subscriptions.Show', params: { id } });
}
</script>

<template>
  <MasterLayout>
    <div class="max-w-2xl">
      <h2 class="text-base font-semibold text-gray-800 mb-4">Edit subscription</h2>
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Start Date</label>
            <input v-model="form.start_date" type="date" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">End Date</label>
            <input v-model="form.end_date" type="date" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Status</label>
            <select v-model="form.status" class="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="suspended">suspended</option>
            </select>
          </div>
        </div>
        <div class="pt-2">
          <button type="submit" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Save changes</button>
        </div>
      </form>
    </div>
  </MasterLayout>
</template>

