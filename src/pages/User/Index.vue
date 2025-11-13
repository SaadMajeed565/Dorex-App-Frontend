<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';

// dummy data (overridden by API when available)
const dummyUsers = [
    { id: 1, name: 'Sarah Connor', email: 'sarah.connor@example.com', login_id: 'sconnor', nic: '92123-1234567-1', phone: '+1 (555) 101-2020', address: '742 Evergreen Terrace', area: 'Downtown', active: true, employee: { designation: 'Admin' } },
    { id: 2, name: 'John Wick', email: 'john.wick@example.com', login_id: 'jwick', nic: '35202-9876543-2', phone: '+1 (555) 303-4040', address: '1 Continental St', area: 'Uptown', active: true, employee: { designation: 'Manager' } },
    { id: 3, name: 'Ellen Ripley', email: 'ellen.ripley@example.com', login_id: 'eripley', nic: '61101-1122334-5', phone: '+1 (555) 505-6060', address: 'Nostromo Bay 12', area: 'Suburbs', active: false, employee: { designation: 'Technician' } },
    { id: 4, name: 'Tony Stark', email: 'tony.stark@example.com', login_id: 'tstark', nic: '42101-5566778-9', phone: '+1 (555) 707-8080', address: '10880 Malibu Point', area: 'Industrial', active: true, employee: { designation: 'Engineer' } },
    { id: 5, name: 'Diana Prince', email: 'diana.prince@example.com', login_id: 'dprince', nic: '71203-4455667-3', phone: '+1 (555) 909-0000', address: 'Themyscira Ave', area: 'Downtown', active: true, employee: { designation: 'Support' } },
    { id: 6, name: 'Bruce Wayne', email: 'bruce.wayne@example.com', login_id: 'bwayne', nic: '51203-2233445-6', phone: '+1 (555) 111-2222', address: '1007 Mountain Drive', area: 'Uptown', active: false, employee: { designation: 'Analyst' } }
];

// reactive states
const users = ref<any[]>(dummyUsers);
const selected = ref<any[]>([]);
const search = ref<string>('');
const status = ref<string>('All');
const area = ref<string>('All');
const role = ref<string>('All');
const statuses = ['All','Active','Inactive'];

// function to fetch data
const sendRequest = async () => {
  try {
    const response = await axiosClient.get('/employees');
    users.value = response.data.employees  || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

onMounted(() => {
  sendRequest();
});

const filtered = computed(() => {
	const term = search.value.toLowerCase();
	return users.value.filter((u:any) => {
		const matchesTerm = !term || [u.name, u.email, u.login_id, u.phone, u.area, u.employee?.designation]
			.some((v:string) => (v || '').toLowerCase().includes(term));
		const matchesStatus = status.value === 'All' || (status.value === 'Active' ? u.active : !u.active);
		const matchesArea = area.value === 'All' || (u.area || '') === area.value;
		const matchesRole = role.value === 'All' || (u.employee?.designation || '') === role.value;
		return matchesTerm && matchesStatus && matchesArea && matchesRole;
	});
});

const totalUsers = computed(() => users.value.length);
const activeCount = computed(() => users.value.filter((u:any) => !!u.active).length);
const inactiveCount = computed(() => users.value.filter((u:any) => !u.active).length);
const distinctAreas = computed(() => ['All', ...Array.from(new Set((users.value.map((u:any) => u.area || '').filter(Boolean))))]);
const distinctRoles = computed(() => ['All', ...Array.from(new Set((users.value.map((u:any) => u.employee?.designation || '').filter(Boolean))))]);

async function removeSelected() {
  const ids = selected.value.map((u:any) => u.id);
  await Promise.all(ids.map((id:number) => axiosClient.delete(`/users/${id}`)));
  await sendRequest();
  selected.value = [];
}
</script>

<template>
    <MasterLayout>
        <div class="p-4">
            <!-- Header -->
            <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Users</h1>
                    <p class="text-sm text-gray-500">Manage application users and roles</p>
                </div>
                <div class="flex items-center gap-3">
                    <button class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors" @click="$router.push({ name: 'User.Create' })">
                        <i class="fa-light fa-plus"></i>
                        Add User
                    </button>
                    <button @click="sendRequest" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <i class="fa-light fa-arrow-rotate-right"></i>
                        Refresh
                    </button>
                    <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <i class="fa-light fa-download"></i>
                        Export
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div class="rounded-xl border border-gray-200 bg-white p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Users</p>
                            <p class="text-2xl font-bold text-gray-900">{{ totalUsers }}</p>
                        </div>
                        <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <i class="fa-light fa-users text-lg"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border border-gray-200 bg-white p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Active</p>
                            <p class="text-2xl font-bold text-gray-900">{{ activeCount }}</p>
                        </div>
                        <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
                            <i class="fa-light fa-badge-check text-lg"></i>
                        </div>
                    </div>
                </div>
                <div class="rounded-xl border border-gray-200 bg-white p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Inactive</p>
                            <p class="text-2xl font-bold text-gray-900">{{ inactiveCount }}</p>
                        </div>
                        <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                            <i class="fa-light fa-user-slash text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 sticky top-15">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div class="flex-1">
                        <div class="relative">
                            <input 
                                v-model="search" 
                                type="text" 
                                placeholder="Search users..." 
                                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <select 
                            v-model="status" 
                            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                        </select>
                        <select 
                            v-model="area" 
                            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option v-for="a in distinctAreas" :key="a" :value="a">{{ a }}</option>
                        </select>
                        <select 
                            v-model="role" 
                            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option v-for="r in distinctRoles" :key="r" :value="r">{{ r }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Users Table (matches Customers style) -->
            <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login / NIC</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area / Role</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="u in filtered" :key="u.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="h-10 w-10 flex-shrink-0">
                                            <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span class="text-sm font-medium text-indigo-600">{{ (u.name || '?').charAt(0) }}</span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">{{ u.name }}</div>
                                            <div class="text-sm text-gray-500">ID: {{ u.id }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">{{ u.email }}</div>
                                    <div class="text-sm text-gray-500">{{ u.phone }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">{{ u.login_id }}</div>
                                    <div class="text-sm text-gray-500">{{ u.nic }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">{{ u.area }}</div>
                                    <div class="text-sm text-gray-500">{{ u.employee?.designation }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${u.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`">
                                        {{ u.active ? 'Active' : 'Inactive' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div class="flex items-center gap-2">
                                        <router-link :to="{ name: 'User.Show', params: { id: u.id } }" class="text-indigo-600 hover:text-indigo-900">View</router-link>
                                        <router-link :to="{ name: 'User.Edit', params: { id: u.id } }" class="text-gray-600 hover:text-gray-900">Edit</router-link>
                                        <button @click="axiosClient.delete(`/users/${u.id}`).then(sendRequest)" class="text-red-600 hover:text-red-900">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
			<div class="mt-3 flex items-center gap-2">
				<button @click="removeSelected" :disabled="!selected.length" class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">Delete selected</button>
			</div>
		</div>
  </MasterLayout>
</template>
