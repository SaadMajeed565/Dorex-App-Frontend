<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useThemeStore } from '../../../stores/themeStore';
import Select from '../../../volt/Select.vue';
import ToggleSwitch from '../../../volt/ToggleSwitch.vue';
import Button from '../../../volt/Button.vue';

const toast = useToast();
const themeStore = useThemeStore();
const loading = ref(false);

const preferences = ref({
  theme: themeStore.mode,
  language: 'en',
  date_format: 'Y-m-d',
  time_format: 'H:i',
  notifications_enabled: true,
  email_notifications: true,
  sms_notifications: false,
  whatsapp_notifications: false,
  dashboard_refresh_interval: 30,
  items_per_page: 25,
});

const themes = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
];

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
];

const dateFormats = [
  { label: 'YYYY-MM-DD', value: 'Y-m-d' },
  { label: 'MM/DD/YYYY', value: 'm/d/Y' },
  { label: 'DD/MM/YYYY', value: 'd/m/Y' },
];

const timeFormats = [
  { label: '24 Hour', value: 'H:i' },
  { label: '12 Hour', value: 'h:i A' },
];

const savePreferences = async () => {
  loading.value = true;
  try {
    // Update theme immediately
    if (preferences.value.theme !== themeStore.mode) {
      themeStore.setMode(preferences.value.theme);
    }
    
    // TODO: API call to save preferences
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Preferences saved successfully!',
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save preferences.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">User Preferences</h2>
      <p class="text-sm text-gray-500">Customize your personal settings and preferences</p>
    </div>

    <!-- Appearance -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Appearance</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Theme
        </label>
        <Select
          v-model="preferences.theme"
          :options="themes"
          optionLabel="label"
          optionValue="value"
          placeholder="Select theme"
          size="small"
          fluid
        />
      </div>
    </div>

    <!-- Localization -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Localization</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <Select
          v-model="preferences.language"
          :options="languages"
          optionLabel="label"
          optionValue="value"
          placeholder="Select language"
          size="small"
          fluid
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <Select
            v-model="preferences.date_format"
            :options="dateFormats"
            optionLabel="label"
            optionValue="value"
            placeholder="Select date format"
            size="small"
            fluid
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Time Format
          </label>
          <Select
            v-model="preferences.time_format"
            :options="timeFormats"
            optionLabel="label"
            optionValue="value"
            placeholder="Select time format"
            size="small"
            fluid
          />
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Notifications</h3>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Enable Notifications
            </label>
            <p class="text-xs text-gray-500">Receive in-app notifications</p>
          </div>
          <ToggleSwitch v-model="preferences.notifications_enabled" />
        </div>

        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email Notifications
            </label>
            <p class="text-xs text-gray-500">Receive notifications via email</p>
          </div>
          <ToggleSwitch v-model="preferences.email_notifications" />
        </div>

        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              SMS Notifications
            </label>
            <p class="text-xs text-gray-500">Receive notifications via SMS</p>
          </div>
          <ToggleSwitch v-model="preferences.sms_notifications" />
        </div>

        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Notifications
            </label>
            <p class="text-xs text-gray-500">Receive notifications via WhatsApp</p>
          </div>
          <ToggleSwitch v-model="preferences.whatsapp_notifications" />
        </div>
      </div>
    </div>

    <!-- Display Settings -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Display Settings</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Dashboard Auto Refresh (seconds)
        </label>
        <input
          v-model.number="preferences.dashboard_refresh_interval"
          type="number"
          min="10"
          max="300"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p class="mt-1 text-xs text-gray-500">Dashboard will automatically refresh data after this interval</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Items Per Page
        </label>
        <input
          v-model.number="preferences.items_per_page"
          type="number"
          min="10"
          max="100"
          step="5"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p class="mt-1 text-xs text-gray-500">Number of items to display per page in lists</p>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex items-center justify-end pt-4 border-t border-gray-200">
      <Button
        label="Save Preferences"
        icon="pi pi-check"
        :loading="loading"
        @click="savePreferences"
      />
    </div>
  </div>
</template>

