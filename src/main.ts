import { createApp } from 'vue'
import './style.css'
import './assets/fonts/all.min.css'
import './assets/fonts/all.min.js'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import router from './router'
import RouteHelper from './plugins/RouteHelper'
import { createPinia } from 'pinia'
import { useThemeStore } from './stores/themeStore'

// 🟢 Import PrimeVue Toast Service + Component
import ToastService from 'primevue/toastservice'
import Toast from './volt/Toast.vue'
// 🟢 Import PrimeVue Confirm Service
import ConfirmationService from 'primevue/confirmationservice'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
   .use(RouteHelper, router)
   .use(pinia)
   .use(PrimeVue, { unstyled: false })
   .use(ToastService) // ✅ enable Toast globally
   .use(ConfirmationService) // ✅ enable Confirm Dialog globally
   .mount('#app')

// 🟢 Register Toast Component Globally
app.component('Toast', Toast)

// 🟢 Initialize theme after pinia
const theme = useThemeStore()
theme.setMode(theme.mode)
