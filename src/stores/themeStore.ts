import { defineStore } from "pinia";
import { ref, watch } from "vue";

type ThemeMode = "light" | "dark";

export const useThemeStore = defineStore("theme", () => {
    const mode = ref<ThemeMode>((localStorage.getItem("theme-mode") as ThemeMode) || "light");

    function applyMode(next: ThemeMode) {
        const root = document.documentElement;
        root.classList.toggle("app-dark", next === "dark");
        localStorage.setItem("theme-mode", next);
    }

    function toggle() {
        mode.value = mode.value === "dark" ? "light" : "dark";
    }

    function setMode(next: ThemeMode) {
        mode.value = next;
    }

    // sync DOM when mode changes
    watch(mode, (val) => applyMode(val), { immediate: true });

    return { mode, toggle, setMode };
});


