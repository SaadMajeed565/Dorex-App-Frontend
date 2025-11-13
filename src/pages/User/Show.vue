<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const route = useRoute();
const router = useRouter();
const user = ref<any>(null);

async function load() {
    const { id } = route.params as { id: string };
    const res = await axiosClient.get(`/users/${id}`);
    user.value = res.data.user || res.data || null;
}

onMounted(load);

const statusBadge = computed(() => user.value?.active
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-rose-50 text-rose-700 border border-rose-200');
</script>

<template>
    <MasterLayout>
        <div class="p-4">
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">User Details</h1>
                    <p class="text-sm text-gray-500">Profile and account information</p>
                </div>
                <div class="flex items-center gap-3">
                    <button class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors" @click="router.push({ name: 'User.Edit', params: { id: user?.id } })">
                        <i class="fa-light fa-pen"></i>
                        Edit
                    </button>
                    <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" @click="router.back()">
                        <i class="fa-light fa-arrow-left"></i>
                        Back
                    </button>
                </div>
            </div>

            <div v-if="user" class="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <div class="text-xs text-gray-500">Name</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.name }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">Email</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.email }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">Login ID</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.login_id }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">NIC</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.nic }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">Phone</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.phone }}</div>
                        </div>
                        <div class="sm:col-span-2">
                            <div class="text-xs text-gray-500">Address</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.address }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">Area</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.area }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">Designation</div>
                            <div class="text-sm font-medium text-gray-800">{{ user.employee?.designation }}</div>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border border-gray-200 bg-white p-6">
                    <div class="text-xs text-gray-500">Status</div>
                    <div class="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="statusBadge">
                        <i :class="user.active ? 'fa-regular fa-circle-check mr-1' : 'fa-regular fa-circle-xmark mr-1'"></i>
                        {{ user.active ? 'Active' : 'Inactive' }}
                    </div>
                </div>
            </div>

            <div v-else class="mt-6 text-sm text-gray-500">Loading...</div>
        </div>
    </MasterLayout>
</template>
