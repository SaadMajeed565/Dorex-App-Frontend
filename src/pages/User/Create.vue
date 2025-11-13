<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

const router = useRouter();

const saving = ref(false);
const form = ref<any>({
    name: '',
    email: '',
    login_id: '',
    nic: '',
    phone: '',
    address: '',
    area: '',
    active: true,
    employee: { designation: '' }
});

async function submit() {
    if (saving.value) return;
    saving.value = true;
    try {
        await axiosClient.post('/users', form.value);
        router.push({ name: 'User.Index' });
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <MasterLayout>
        <div class="p-4">
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Add User</h1>
                    <p class="text-sm text-gray-500">Create a new user account</p>
                </div>
                <div class="flex items-center gap-3">
                    <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" @click="$router.back()" type="button">
                        <i class="fa-light fa-arrow-left"></i>
                        Back
                    </button>
                </div>
            </div>

            <form @submit.prevent="submit" class="rounded-xl border border-gray-200 bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs text-gray-600 mb-1">Name</label>
                    <input v-model="form.name" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" required />
                </div>
                <div>
                    <label class="block text-xs text-gray-600 mb-1">Email</label>
                    <input v-model="form.email" type="email" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" required />
                </div>
                <div>
                    <label class="block text-xs text-gray-600 mb-1">Login ID</label>
                    <input v-model="form.login_id" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                    <label class="block text-xs text-gray-600 mb-1">NIC</label>
                    <input v-model="form.nic" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                    <label class="block text-xs text-gray-600 mb-1">Phone</label>
                    <input v-model="form.phone" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs text-gray-600 mb-1">Address</label>
                    <input v-model="form.address" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                    <label class="block text-xs text-gray-600 mb-1">Area</label>
                    <input v-model="form.area" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                    <label class="block text-xs text-gray-600 mb-1">Designation</label>
                    <input v-model="form.employee.designation" type="text" class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div class="flex items-center gap-2 mt-1">
                    <input id="active" v-model="form.active" type="checkbox" class="h-4 w-4 border-gray-300 rounded" />
                    <label for="active" class="text-sm text-gray-700">Active</label>
                </div>

                <div class="md:col-span-2 mt-2 flex items-center gap-3">
                    <button :disabled="saving" type="submit" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
                        <i class="fa-light fa-check"></i>
                        Create
                    </button>
                    <button type="button" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" @click="$router.back()">
                        <i class="fa-light fa-xmark"></i>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </MasterLayout>
    
</template>


