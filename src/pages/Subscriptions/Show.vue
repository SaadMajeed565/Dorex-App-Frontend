<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const subscription = ref<any>(null);

onMounted(async () => {
  const { id } = route.params as { id: string };
  const res = await axiosClient.get(`/subscriptions/${id}`);
  subscription.value = res.data.subscription;
});
</script>

<template>
  <MasterLayout>
    <div class="rounded-xl border border-gray-200 bg-white p-4">
      <div v-if="subscription">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800">Subscription #{{ subscription.id }}</h2>
          <router-link :to="{ name: 'Subscriptions.Edit', params: { id: subscription.id } }" class="text-sm text-[var(--p-primary-700)] hover:underline">Edit</router-link>
        </div>
        <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500">Customer ID</dt>
            <dd class="text-gray-900">{{ subscription.customer_id }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Package ID</dt>
            <dd class="text-gray-900">{{ subscription.package_id }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Start Date</dt>
            <dd class="text-gray-900">{{ subscription.start_date }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Status</dt>
            <dd class="text-gray-900">{{ subscription.status }}</dd>
          </div>
        </dl>
      </div>
      <div v-else class="text-sm text-gray-500">Loading...</div>
    </div>
  </MasterLayout>
</template>

