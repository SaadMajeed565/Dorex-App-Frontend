<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import MiniSidebar from "./partials/MiniSidebar.vue";
import Sidebar from "./partials/Sidebar.vue";
import MobileBottomNav from "./partials/MobileBottomNav.vue";
import MobileSidebarDrawer from "./partials/MobileSidebarDrawer.vue";
import UserAvatarMenu from "../components/UserAvatarMenu.vue";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import { ref } from "vue";
import { useGeneralSettingsStore } from "../stores/generalSettingsStore";

const theme = useThemeStore();
const router = useRouter();
const authStore = useAuthStore();
const isAuthenticated = ref(false);
const generalSettingsStore = useGeneralSettingsStore();

const companyInitials = computed(() => generalSettingsStore.companyInitials);
const companyName = computed(() => generalSettingsStore.displayCompanyName);

onMounted(async () => {
  generalSettingsStore.fetchSettings().catch(() => {
    // Non-blocking failure is logged inside the store
  });

  const valid = await authStore.authenticateToken();
  isAuthenticated.value = valid;
  if (!valid) {
    router.replace("/auth/login");
  }
});

function toggleTheme() {
  theme.toggle();
}
</script>

<template>
  <div
    class="min-h-screen flex bg-gray-50 from-[#ffff] via-[#ebf7ff] to-[#facbf2] text-gray-800 transition-colors duration-300"
  >
    <!-- Desktop: Mini Sidebar - Hidden on mobile -->
    <MiniSidebar class="hidden md:flex" />

    <!-- Desktop: Full Sidebar - Hidden on mobile -->
    <Sidebar class="hidden md:flex" />

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-h-screen w-full md:w-auto pb-16 md:pb-0">
      <!-- Header -->
      <header class="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-200/70 shadow-[0_1px_10px_rgba(0,0,0,0.03)]">
        <div class="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div class="h-14 flex items-center justify-between">
            <div class="flex items-center gap-2.5 min-w-0 flex-1 md:flex-initial">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-tr from-indigo-500 to-sky-500 text-white font-semibold text-sm shadow-sm shrink-0">
                {{ companyInitials }}
              </span>
              <h1 class="truncate text-[15px] sm:text-[16px] font-semibold text-gray-800 ml-2.5">
                {{ companyName }}
              </h1>
            </div>

            <div class="flex items-center gap-1.5 sm:gap-2.5">
              <!-- Search - Hidden on mobile -->
              <div class="hidden md:flex items-center">
                <div class="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    class="w-44 lg:w-60 rounded-md border border-gray-300 bg-white/90 px-2.5 py-1.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 shadow-inner"
                  />
                </div>
              </div>

              <!-- Notification -->
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white/90 text-gray-600 hover:text-indigo-600 hover:bg-gray-100/80 focus:outline-none transition shrink-0"
              >
                <i class="fa-light fa-bell text-[15px]"></i>
              </button>

              <!-- Theme toggle -->
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white/90 text-gray-600 hover:text-indigo-600 hover:bg-gray-100/80 focus:outline-none transition shrink-0"
                aria-label="Toggle theme"
                @click="toggleTheme"
              >
                <i
                  class="fa-light text-[15px]"
                  :class="theme.mode === 'dark' ? 'fa-sun' : 'fa-moon'"
                ></i>
              </button>

              <!-- Avatar - Hidden on mobile -->
              <div class="hidden sm:flex items-center pl-2">
                <UserAvatarMenu />
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main slot -->
      <main
        class="flex-1 mx-auto max-w-screen-2xl w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-5"
      >
        <Toast />
        <slot />
      </main>

      <!-- Footer -->
      <footer
        class="hidden md:block bg-white/90 border-t border-gray-200 text-center py-2 md:py-2.5 text-xs md:text-[13px] text-gray-500"
      >
        © {{ new Date().getFullYear() }} ConnecTel Home. All rights reserved.
      </footer>
    </div>

    <!-- Mobile: Bottom Navigation Bar -->
    <MobileBottomNav class="md:hidden" />

    <!-- Mobile: Sidebar Drawer (opens from bottom) -->
    <MobileSidebarDrawer />
  </div>
</template>
