<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

// State
const showMenu = ref(false)
const user = ref({
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://i.pravatar.cc/150?img=3' // sample avatar
})

const router = useRouter()
const authStore = useAuthStore()

// Toggle dropdown visibility
const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

// Close when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const menu = document.getElementById('avatar-menu')
  if (menu && !menu.contains(event.target as Node)) {
    showMenu.value = false
  }
}

const logout = async () => {
  await authStore.logout()
  router.replace('/auth/login')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <div id="avatar-menu" class="relative">
    <!-- Avatar -->
    <button @click.stop="toggleMenu" class="focus:outline-none">
      <img
        :src="user.avatar"
        alt="User Avatar"
        class="w-8 h-8 rounded-full border-2 border-indigo-500 cursor-pointer hover:scale-105 transition"
      />
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
      >
        <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
          <p class="font-semibold">{{ user.name }}</p>
          <p class="text-xs text-gray-500">{{ user.email }}</p>
        </div>
        <a href="/profile"
           class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
          Profile
        </a>
        <a href="/settings"
           class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
          Settings
        </a>
        <button
          @click="logout"
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-800">
          Logout
        </button>
      </div>
    </transition>
  </div>
</template>
