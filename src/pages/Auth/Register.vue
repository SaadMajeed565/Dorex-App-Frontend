<script setup lang="ts">
import { ref } from 'vue'
import axiosClient from '../../axios'
import Button from '../../volt/Button.vue'
import InputText from 'primevue/inputtext'
import { ptViewMerge } from '../../volt/utils'
import type { InputTextPassThroughOptions } from 'primevue/inputtext'

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
  name: '',
  email: '',
  login_id: '',
  password: '',
  nic: '',
  phone: '',
  alternative_phone: '',
  area: '',
  address: ''
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const register = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const { data } = await axiosClient.post('/register', form.value)
    successMessage.value = 'Account created successfully!'
    console.log('Registration success:', data)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Registration failed'
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
    <div class="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 
                rounded-xl shadow-md p-6 sm:p-8">
      
      <!-- Branding -->
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Volt Admin</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create your admin account
        </p>
      </div>

      <!-- Messages -->
      <div v-if="successMessage" class="p-2 mb-3 bg-green-100 text-green-700 rounded text-sm">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="p-2 mb-3 bg-red-100 text-red-700 rounded text-sm">
        {{ errorMessage }}
      </div>

      <!-- Registration Form -->
      <form @submit.prevent="register" class="space-y-4">
        
        <!-- Row 1: Name + Email -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Full Name" v-model="form.name" />
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Email" type="email" v-model="form.email" />
        </div>

        <!-- Row 2: Login ID + Password -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Login ID" v-model="form.login_id" />
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Password" type="password" v-model="form.password" />
        </div>

        <!-- Row 3: NIC -->
        <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
          placeholder="NIC" v-model="form.nic" />

        <!-- Row 4: Phone + Alternative Phone -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Phone" v-model="form.phone" />
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Alt. Phone" v-model="form.alternative_phone" />
        </div>

        <!-- Row 5: Area + Address -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Area" v-model="form.area" />
          <InputText unstyled :pt="inputTheme" :ptOptions="{ mergeProps: ptViewMerge }"
            placeholder="Address" v-model="form.address" />
        </div>

        <!-- Submit -->
        <div class="pt-2">
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? 'Registering...' : 'Register' }}
          </Button>
        </div>
      </form>

      <!-- Footer -->
      <div class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        © 2025 Volt Admin Panel
      </div>
    </div>
  </div>
</template>
