<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axiosClient from '../../axios'
import Button from '../../volt/Button.vue'
import InputText from 'primevue/inputtext'
import { ptViewMerge } from '../../volt/utils'
import type { InputTextPassThroughOptions } from 'primevue/inputtext'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// 🎨 Input Theme
const inputTheme: InputTextPassThroughOptions = {
  root: `
    w-full rounded-lg border border-gray-300 dark:border-gray-700
    bg-white dark:bg-gray-900
    px-3 py-2 text-sm text-gray-800 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
    transition-all duration-150
  `
}

const form = ref({
  identifier: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

// ✅ Pre-fill identifier from localStorage (email or login_id)
onMounted(() => {
  if (authStore.token) {
    router.replace('/')
    return
  }

  // Pre-fill identifier field from auth store
  const identifier = authStore.getLoginIdentifier()
  if (identifier) {
    form.value.identifier = identifier
  }
})

const login = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await axiosClient.post('/login', form.value)
    console.log('Login success:', data)

    // Save token using auth store
    authStore.setToken(data.token)

    const loaded = await authStore.fetchCurrentUser()

    if (!loaded) {
      errorMessage.value = 'Failed to verify user data. Please try again.'
      return
    }

    router.replace('/')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Login failed'
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
    <div
      class="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 
             rounded-xl shadow-md p-6 sm:p-8"
    >
      <!-- Branding -->
      <div
        class="w-15 h-15 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#2563EB]
               flex items-center justify-center text-white font-semibold text-lg mx-auto mb-6
               shadow-[0_3px_10px_rgba(109,40,217,0.2)] ring-1 ring-[#6D28D9]/30
               hover:scale-[1.05] transition-transform duration-300 select-none"
      >
        Dorex
      </div>

      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">ISP Admin Panel</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Sign in to your account
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-2 mb-3 bg-red-100 text-red-700 rounded text-sm">
        {{ errorMessage }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="login" class="space-y-4">
        <InputText
          unstyled
          :pt="inputTheme"
          :ptOptions="{ mergeProps: ptViewMerge }"
          placeholder="Email or Login ID"
          v-model="form.identifier"
        />
        <InputText
          unstyled
          :pt="inputTheme"
          :ptOptions="{ mergeProps: ptViewMerge }"
          placeholder="Password"
          type="password"
          v-model="form.password"
        />

        <div class="pt-2">
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </Button>
        </div>
      </form>

      <!-- Footer Links -->
      <div class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <a href="/auth/register" class="hover:underline text-indigo-600">Create account</a> ·
        <a href="/forgot-password" class="hover:underline text-indigo-600">Forgot password?</a>
      </div>
    </div>
  </div>
</template>
