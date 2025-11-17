<script setup lang="ts">
import { computed, watch, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSidebarStore } from '../../stores/sidebarStore';

const sidebarStore = useSidebarStore();
const route = useRoute();
const router = useRouter();

const drawerHeight = ref(40); // Default 40%
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(40);

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 75;

const sidebarOptions = {
  dashboard: [
    { label: "Dashboard", name: "Home.Index", icon: "fa-regular fa-home" },
    // { label: "Stats", name: "Home.Stats", icon: "fa-regular fa-chart-simple" },
    // { label: "Reports", name: "Home.Report", icon: "fa-regular fa-clipboard-list" },
    { label: "Contacts", name: "Contacts.Index", icon: "fa-regular fa-address-book", permission: "view-customer" },
  ],
  customers: [
    { label: "Customers", name: "Customers.Index", icon: "fa-regular fa-users" },
    { label: "Subscriptions", name: "Subscriptions.Index", icon: "fa-regular fa-badge-check" },
    { label: "Payments", name: "Payments.Index", icon: "fa-regular fa-credit-card" },
  ],
  network: [
    { label: "Areas", name: "Areas.Index", icon: "fa-regular fa-map-location-dot" },
    { label: "Packages", name: "Packages.Index", icon: "fa-regular fa-boxes-stacked" },
    // { label: "Equipment", name: "Equipment.Index", icon: "fa-regular fa-router" },
    // { label: "Inventory", name: "Inventory.Index", icon: "fa-regular fa-warehouse" },
  ],
  operations: [
    { label: "Employees", name: "Employees.Index", icon: "fa-regular fa-id-badge" },
    { label: "Complaints", name: "Complaints.Index", icon: "fa-regular fa-message-exclamation" },
    { label: "Tasks", name: "Tasks.Index", icon: "fa-regular fa-list-check" },
  ],
  business: [
    // { label: "Accounts", name: "Accounts.Index", icon: "fa-regular fa-books" },
    { label: "Communications", name: "Communications.Index", icon: "fa-regular fa-messages" },
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

const currentMenuOptions = computed(() => {
  return sidebarOptions[sidebarStore.activeMini as keyof typeof sidebarOptions] || [];
});

const drawerStyle = computed(() => {
  if (!sidebarStore.mobileDrawerVisible) {
    return {
      transform: 'translateY(100%)',
      transition: 'transform 0.3s ease-out',
    };
  }

  return {
    height: `${drawerHeight.value}vh`,
    maxHeight: `${drawerHeight.value}vh`,
    transform: 'translateY(0)',
    transition: isDragging.value ? 'none' : 'height 0.3s ease-out',
  };
});

function navigateToRoute(routeName: string) {
  router.push({ name: routeName });
  sidebarStore.closeMobileDrawer();
}

// Drag handlers
function handleStart(e: TouchEvent | MouseEvent) {
  if (!sidebarStore.mobileDrawerVisible) return;

  e.preventDefault();
  e.stopPropagation();

  isDragging.value = true;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  startY.value = clientY;
  startHeight.value = drawerHeight.value;

  // Prevent scrolling while dragging
  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';

  // Add mousemove listener for mouse events
  if ('clientX' in e && !('touches' in e)) {
    document.addEventListener('mousemove', handleMove);
  }
}

function handleMove(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return;

  e.preventDefault();
  e.stopPropagation();

  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const windowHeight = window.innerHeight;

  // Calculate how much we've moved from start
  const deltaY = startY.value - clientY; // Positive when dragging up

  // Convert pixel movement to percentage
  const deltaPercent = (deltaY / windowHeight) * 100;

  // Calculate new height
  let newHeight = startHeight.value + deltaPercent;

  // Constrain between min and max
  newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));

  drawerHeight.value = newHeight;
}

function handleEnd() {
  if (!isDragging.value) return;

  isDragging.value = false;
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
  document.removeEventListener('mousemove', handleMove);

  // Snap to nearest position
  const midPoint = (MIN_HEIGHT + MAX_HEIGHT) / 2; // 50%

  if (drawerHeight.value < 15) {
    // Close if dragged down too much (< 15%)
    sidebarStore.closeMobileDrawer();
    drawerHeight.value = MIN_HEIGHT; // Reset to default for next open
  } else if (drawerHeight.value < midPoint) {
    // Snap to 40%
    drawerHeight.value = MIN_HEIGHT;
  } else {
    // Snap to 75%
    drawerHeight.value = MAX_HEIGHT;
  }
}

// Reset height when drawer opens
watch(() => sidebarStore.mobileDrawerVisible, (visible) => {
  if (visible) {
    drawerHeight.value = MIN_HEIGHT; // Start at 40%
  } else {
    // Clean up any ongoing drag
    if (isDragging.value) {
      isDragging.value = false;
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.removeEventListener('mousemove', handleMove);
    }
  }
});

// Close drawer when route changes
watch(() => route.name, () => {
  sidebarStore.closeMobileDrawer();
});

// Event listeners
onMounted(() => {
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleEnd);
  document.addEventListener('mouseup', handleEnd);
});

onUnmounted(() => {
  document.removeEventListener('touchmove', handleMove);
  document.removeEventListener('touchend', handleEnd);
  document.removeEventListener('mousemove', handleMove);
  document.removeEventListener('mouseup', handleEnd);
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
});
</script>

<template>
  <div v-if="sidebarStore.mobileDrawerVisible"
    class="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none md:hidden">
    <!-- Overlay -->
    <div v-if="sidebarStore.mobileDrawerVisible" @click="sidebarStore.closeMobileDrawer"
      class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
      :class="sidebarStore.mobileDrawerVisible ? 'opacity-100' : 'opacity-0'"></div>

    <!-- Drawer -->
    <div class="relative w-[95%] max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl pointer-events-auto overflow-hidden"
      :style="drawerStyle">
      <!-- Draggable Header Section (Handle bar + Header) -->
      <div class="cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0"
        @touchstart.prevent="handleStart" @mousedown.prevent="handleStart">
        <!-- Handle bar -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="px-5 pb-3 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#2563EB] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              Dorex
            </div>
            <div>
              <h2 class="font-semibold text-lg text-gray-900 capitalize">
                {{ sidebarStore.activeMini || 'Menu' }}
              </h2>
              <p class="text-xs text-gray-500">Select an option</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto px-5"
        :style="{ height: `calc(${drawerHeight}vh - 100px)`, maxHeight: `calc(${drawerHeight}vh - 100px)`, touchAction: 'pan-y' }">
        <div class="flex flex-col pt-4 pb-20">
          <!-- Sidebar Items Grid (3 per row) -->
          <div v-if="currentMenuOptions.length > 0" class="mb-4">
            <div class="grid grid-cols-3 gap-3">
              <button v-for="option in currentMenuOptions" :key="option.name" @click="navigateToRoute(option.name)"
                :class="[
                  'flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 active:scale-95 aspect-square',
                  sidebarStore.activeSubmenu === option.name
                    ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200 shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                ]">
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 aspect-square',
                  sidebarStore.activeSubmenu === option.name
                    ? 'bg-indigo-100'
                    : 'bg-white'
                ]">
                  <i :class="[option.icon, 'text-2xl']"></i>
                </div>
                <span :class="[
                  'text-xs font-medium text-center leading-tight',
                  sidebarStore.activeSubmenu === option.name
                    ? 'text-indigo-600'
                    : 'text-gray-600'
                ]">
                  {{ option.label }}
                </span>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <i class="fa-light fa-folder-open text-4xl text-gray-300 mb-2"></i>
            <p class="text-sm text-gray-500">No options available</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
