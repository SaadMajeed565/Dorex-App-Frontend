<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useSidebarStore } from "../../stores/sidebarStore";
import { useAuthStore } from "../../stores/authStore";

interface SidebarOption {
  label: string;
  name: string;
  icon: string;
  permission?: string | string[];
}

const sidebarStore = useSidebarStore();
const route = useRoute();
const authStore = useAuthStore();

const sidebarOptions: Record<string, SidebarOption[]> = {
  dashboard: [
    { label: "Dashboard", name: "Home.Index", icon: "fa-regular fa-home", permission: "view-dashboard" },
    // { label: "Stats", name: "Home.Stats", icon: "fa-regular fa-chart-simple", permission: "stats-dashboard" },
    { label: "Reports", name: "Reports.Index", icon: "fa-regular fa-chart-line", permission: "reports-dashboard" },
    { label: "Contacts", name: "Contacts.Index", icon: "fa-regular fa-address-book", permission: "view-customer" },
  ],
  customers: [
    { label: "Customers", name: "Customers.Index", icon: "fa-regular fa-users", permission: "view-customer" },
    { label: "Subscriptions", name: "Subscriptions.Index", icon: "fa-regular fa-badge-check", permission: "view-subscription" },
    { label: "Payments", name: "Payments.Index", icon: "fa-regular fa-credit-card", permission: "view-payment" },
  ],
  network: [
    { label: "Areas", name: "Areas.Index", icon: "fa-regular fa-map-location-dot", permission: "view-area" },
    { label: "Packages", name: "Packages.Index", icon: "fa-regular fa-boxes-stacked", permission: "view-package" },
    // { label: "Equipment", name: "Equipment.Index", icon: "fa-regular fa-router", permission: "view-equipment" },
  ],
  operations: [
    { label: "Employees", name: "Employees.Index", icon: "fa-regular fa-id-badge", permission: "view-employee" },
    { label: "Complaints", name: "Complaints.Index", icon: "fa-regular fa-message-exclamation", permission: "view-complaint" },
    { label: "Tasks", name: "Tasks.Index", icon: "fa-regular fa-list-check", permission: "view-task" },
  ],
  business: [
    // { label: "Accounts", name: "Accounts.Index", icon: "fa-regular fa-books", permission: "view-account" },
    { label: "Communications", name: "Communications.Index", icon: "fa-regular fa-messages", permission: "view-communication" },
  ],
  settings: [
    { label: "General", name: "Settings.General", icon: "fa-regular fa-gear", permission: "view-setting" },
    { label: "Communication", name: "Settings.Communication", icon: "fa-regular fa-message", permission: "view-setting" },
    // { label: "System", name: "Settings.System", icon: "fa-regular fa-server", permission: "view-setting" },
    // { label: "Security", name: "Settings.Security", icon: "fa-regular fa-shield", permission: "view-setting" },
    // { label: "Integrations", name: "Settings.Integration", icon: "fa-regular fa-plug", permission: "view-setting" },
    // { label: "Preferences", name: "Settings.Preferences", icon: "fa-regular fa-user", permission: "view-setting" },
    { label: "Roles & Permissions", name: "Settings.Roles.Index", icon: "fa-regular fa-user-shield", permission: "roles-settings" },
  ],
};

const visibleSidebarOptions = computed(() => {
  const result: Record<string, SidebarOption[]> = {};
  Object.entries(sidebarOptions).forEach(([section, options]) => {
    result[section] = options.filter((option) => {
      if (!option.permission) return true;
      if (Array.isArray(option.permission)) {
        return authStore.hasAnyPermission(option.permission);
      }
      return authStore.hasPermission(option.permission);
    });
  });

  return result;
});

watch(
  () => route.name,
  (newName) => {
    if (!newName) return;
    sidebarStore.setActiveSubmenu(newName as string);
    const parentMenu = Object.keys(sidebarOptions).find((section) =>
      visibleSidebarOptions.value[section]?.some((item) => item.name === newName)
    );
    if (parentMenu) {
      sidebarStore.setActiveMini(parentMenu);
    }
  },
  { immediate: true }
);
</script>

<template>
  <aside
    class="sticky top-0 h-screen w-48 flex flex-col items-start py-4
           backdrop-blur-xl 
           bg-gradient-to-b from-[#f0f9ff] via-[#f8fafc] to-[#f1f5f9]
           dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]
           border-r border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)]
           shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3),0_2px_12px_rgba(0,0,0,0.06)]
           shrink-0"
  >
    <!-- Header -->
    <div class="relative z-10 px-4 py-3 mb-4 w-full">
      <h2 class="text-sm uppercase tracking-widest text-gray-500 font-bold capitalize">
        {{ sidebarStore.activeMini }}
      </h2>
    </div>

    <!-- Scrollable Menu -->
    <ul class="relative z-10 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent w-full px-2 space-y-0.5">
      <li
        v-for="option in visibleSidebarOptions[sidebarStore.activeMini as keyof typeof visibleSidebarOptions] || []"
        :key="option.label"
      >
        <RouterLink
          :to="{ name: option.name }"
          class="group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ease-in-out relative"
          :class="sidebarStore.activeSubmenu === option.name
            ? 'bg-white/90 dark:bg-[#1c1c1c] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#6D28D9] dark:text-[#A78BFA] ring-1 ring-[#6D28D9]/20 scale-[1.01]'
            : 'text-gray-500 hover:text-[#6D28D9] hover:bg-white/50 dark:hover:bg-[#2a2a2a]/40'"
        >
          <div
            class="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-300"
            :class="sidebarStore.activeSubmenu === option.name
              ? 'bg-[#6D28D9]/15 dark:bg-[#A78BFA]/15'
              : 'bg-gray-100/50 dark:bg-[#2a2a2a]/30 group-hover:bg-[#6D28D9]/10'"
          >
            <i :class="[option.icon, 'text-[13px]']"></i>
          </div>
          <span class="truncate font-medium text-sm">{{ option.label }}</span>
        </RouterLink>
      </li>
    </ul>
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
