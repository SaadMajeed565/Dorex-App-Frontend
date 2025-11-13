import { defineStore } from "pinia";
import { ref } from "vue";

export const useSidebarStore = defineStore("sidebar", () => {
    const activeMini = ref<string | null>(null);
    const activeSubmenu = ref<string | null>(null);
    const mobileDrawerVisible = ref(false);

    function setActiveMini(menu: string | null) {
        activeMini.value = menu;
    }

    function setActiveSubmenu(submenu: string | null) {
        activeSubmenu.value = submenu;
    }

    function toggleMobileDrawer() {
        mobileDrawerVisible.value = !mobileDrawerVisible.value;
    }

    function closeMobileDrawer() {
        mobileDrawerVisible.value = false;
    }

    return {
        activeMini,
        activeSubmenu,
        mobileDrawerVisible,
        setActiveMini,
        setActiveSubmenu,
        toggleMobileDrawer,
        closeMobileDrawer
    };
});
