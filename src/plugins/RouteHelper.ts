// Helpers/RouteHelper.ts
import { type App } from 'vue';
import type { Router } from 'vue-router';

export default {
    install(app: App, router: Router) {
        const routeUrl = (
            name: string,
            params: Record<string, any> = {},
            query: Record<string, any> = {}
        ) => router.resolve({ name, params, query }).href;

        const goTo = (
            name: string,
            params: Record<string, any> = {},
            query: Record<string, any> = {}
        ) => router.push({ name, params, query });

        const isRoute = (name: string) => router.currentRoute.value.name === name;

        app.config.globalProperties.$routeUrl = routeUrl;
        app.config.globalProperties.$goTo = goTo;
        app.config.globalProperties.$isRoute = isRoute;
    }
};
