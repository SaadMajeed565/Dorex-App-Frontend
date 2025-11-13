<script setup lang="ts">
import { ref } from 'vue';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const form = ref({
  name: '',
  email: '',
  phone: '',
  area: '',
  plan: 'Fiber 100 Mbps',
  active: true
});

const plans = ['Fiber 100 Mbps','Fiber 200 Mbps','Wireless 50 Mbps'];

async function submit() {
  await axiosClient.post('/users', form.value);
}
</script>

<template>
  <MasterLayout>
    <div class="max-w-3xl">
      <h2 class="text-base font-semibold text-gray-800 mb-4">Add user</h2>
      <form @submit.prevent="submit" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Name</label>
            <input v-model="form.name" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Email</label>
            <input v-model="form.email" type="email" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Phone</label>
            <input v-model="form.phone" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Area</label>
            <input v-model="form.area" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Plan</label>
            <select v-model="form.plan" class="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
              <option v-for="p in plans" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2 mt-6">
            <input id="active" type="checkbox" v-model="form.active" class="accent-gray-600">
            <label for="active" class="text-sm text-gray-700">Active</label>
          </div>
        </div>
        <div class="pt-2">
          <button type="submit" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <i class="fa-light fa-user-plus"></i>
            Create user
          </button>
        </div>
      </form>
    </div>
  </MasterLayout>
</template>