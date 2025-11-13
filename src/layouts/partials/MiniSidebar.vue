<script setup lang="ts">
import { useSidebarStore } from "../../stores/sidebarStore";
import { useAuthStore } from "../../stores/authStore";
import { useRouter } from 'vue-router'

const sidebarStore = useSidebarStore();
const authStore = useAuthStore();
const router = useRouter()

function selectMini(itemId: string) {
  sidebarStore.setActiveMini(itemId);
}

async function logout() {
  await authStore.logout()
  router.replace('/auth/login')
}

const miniItems = [
  { id: "dashboard", icon: "fa-regular fa-grid-2" },
  // { id: "users", icon: "fa-regular fa-user" },
  { id: "customers", icon: "fa-regular fa-users" },
  { id: "network", icon: "fa-regular fa-network-wired" },
  { id: "operations", icon: "fa-regular fa-screwdriver-wrench" },
  { id: "business", icon: "fa-regular fa-briefcase" },
  { id: "settings", icon: "fa-regular fa-gear" },
];
</script>

<template>
  <aside
    class="sticky top-0 w-16 h-screen flex flex-col items-center py-4 
           backdrop-blur-2xl 
           bg-gradient-to-b from-[#ecf9ff] via-[#f9f9fc] to-[#e9e9ff]
           dark:from-[#181818] dark:via-[#141414] dark:to-[#1a0f1f]
           border-r border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.08)]
           shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25),0_4px_20px_rgba(0,0,0,0.04)]
           shrink-0"
  >
    <!-- Logo -->
    <div class="mb-6">
      <div
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#2563EB]
               flex items-center justify-center text-white font-semibold text-sm 
               shadow-[0_3px_10px_rgba(109,40,217,0.2)] ring-1 ring-[#6D28D9]/30
               hover:scale-[1.05] transition-transform duration-300 select-none">
        Dorex
      </div>
    </div>

    <!-- Menu Items -->
    <ul class="flex flex-col items-center justify-center flex-1 space-y-2 relative z-10">
      <li
        v-for="item in miniItems"
        :key="item.id"
        @click="selectMini(item.id)"
        :class="[ 
          'cursor-pointer p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center relative group',
          sidebarStore.activeMini === item.id
            ? 'bg-white dark:bg-[#1c1c1c] shadow-[0_3px_12px_rgba(0,0,0,0.06)] text-[#6D28D9] dark:text-[#A78BFA] ring-1 ring-[#6D28D9]/30 scale-[1.05]'
            : 'text-gray-500 hover:text-[#6D28D9] hover:bg-white/60 dark:hover:bg-[#2a2a2a]/60'
        ]"
      >
        <i :class="[item.icon, 'text-[1rem]']"></i>

        <!-- Tooltip -->
        <!-- <span
          class="absolute left-full ml-2 px-1.5 py-0.5 rounded text-[10px] text-white 
                 bg-gray-900/90 dark:bg-black/80 shadow-lg opacity-0 
                 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 
                 transition-all capitalize backdrop-blur-sm z-[9999]"
        >
          {{ item.id }}
        </span> -->
      </li>
    </ul>

    <!-- Footer -->
    <div class="relative z-10 px-3 py-3 border-t border-gray-200 flex items-center justify-between text-[13px]">
      <button
        class="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 py-1.5 rounded-md transition-all duration-200"
      @click="logout">
        <i class="fa-regular fa-right-from-bracket text-sm"></i>
      </button>
    </div>
  </aside>
</template>

<style scoped>
li {
  transform-origin: center;
}
li:hover {
  transform: translateY(-1px);
}
</style>
