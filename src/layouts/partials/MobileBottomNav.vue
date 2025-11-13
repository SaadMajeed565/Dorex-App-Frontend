<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSidebarStore } from '../../stores/sidebarStore';

const sidebarStore = useSidebarStore();
const route = useRoute();

const miniItems = [
  { id: "dashboard", icon: "fa-regular fa-grid-2", label: "Dashboard", routes: ["Home.Index", "Home.Stats", "Home.Report"] },
  { id: "customers", icon: "fa-regular fa-users", label: "Customers", routes: ["Customers.Index", "Subscriptions.Index", "Payments.Index"] },
  { id: "network", icon: "fa-regular fa-network-wired", label: "Network", routes: ["Areas.Index", "Packages.Index", "Equipment.Index", "Inventory.Index"] },
  { id: "operations", icon: "fa-regular fa-screwdriver-wrench", label: "Operations", routes: ["Employees.Index", "Complaints.Index", "Tasks.Index"] },
  { id: "business", icon: "fa-regular fa-briefcase", label: "Business", routes: ["Accounts.Index", "Communications.Index"] },
  { id: "settings", icon: "fa-regular fa-gear", label: "Settings", routes: ["Settings.Index"] },
];

// Check if current route belongs to a mini item
const getActiveMiniId = computed(() => {
  const currentRoute = route.name as string;
  const activeItem = miniItems.find(item => item.routes.includes(currentRoute));
  return activeItem?.id || null;
});

function handleItemClick(item: typeof miniItems[0]) {
  // Set the active mini and open the drawer
  sidebarStore.setActiveMini(item.id);
  sidebarStore.toggleMobileDrawer();
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <div class="overflow-x-auto scrollbar-hide h-16 flex items-center px-2">
      <div class="flex items-center justify-start gap-1 min-w-max h-full">
        <button
          v-for="item in miniItems"
          :key="item.id"
          @click="handleItemClick(item)"
          :class="[
            'flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-all duration-200 relative px-3 shrink-0',
            getActiveMiniId === item.id
              ? 'text-indigo-600'
              : 'text-gray-500 active:text-indigo-600'
          ]"
        >
          <div
            :class="[
              'relative',
              getActiveMiniId === item.id
                ? 'text-indigo-600'
                : 'text-gray-500'
            ]"
          >
            <i :class="[item.icon, 'text-xl']"></i>
            <!-- Active indicator dot -->
            <span
              v-if="getActiveMiniId === item.id"
              class="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full"
            ></span>
          </div>
          <span
            :class="[
              'text-[10px] font-medium whitespace-nowrap',
              getActiveMiniId === item.id
                ? 'text-indigo-600'
                : 'text-gray-500'
            ]"
          >
            {{ item.label }}
          </span>
          <!-- Active indicator bar -->
          <div
            v-if="getActiveMiniId === item.id"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-indigo-600 rounded-t-full"
          ></div>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
</style>
