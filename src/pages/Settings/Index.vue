<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MasterLayout from '../../layouts/MasterLayout.vue';
import GeneralSettings from './sections/GeneralSettings.vue';
import CommunicationSettings from './sections/CommunicationSettings.vue';
import SystemSettings from './sections/SystemSettings.vue';
import SecuritySettings from './sections/SecuritySettings.vue';
import IntegrationSettings from './sections/IntegrationSettings.vue';
import UserPreferences from './sections/UserPreferences.vue';

const route = useRoute();

const settingsComponents: Record<string, any> = {
  'Settings.General': GeneralSettings,
  'Settings.Communication': CommunicationSettings,
  'Settings.System': SystemSettings,
  'Settings.Security': SecuritySettings,
  'Settings.Integration': IntegrationSettings,
  'Settings.Preferences': UserPreferences,
};

const activeComponent = computed(() => {
  const routeName = route.name as string;
  return settingsComponents[routeName] || GeneralSettings;
});

const getPageTitle = computed(() => {
  const titles: Record<string, string> = {
    'Settings.General': 'General Settings',
    'Settings.Communication': 'Communication Settings',
    'Settings.System': 'System Settings',
    'Settings.Security': 'Security Settings',
    'Settings.Integration': 'Integration Settings',
    'Settings.Preferences': 'User Preferences',
  };
  return titles[route.name as string] || 'Settings';
});

const getPageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    'Settings.General': 'Configure basic application settings and company information',
    'Settings.Communication': 'Configure communication channels (WhatsApp, Email, SMS)',
    'Settings.System': 'Configure system-level settings and performance options',
    'Settings.Security': 'Configure security and authentication settings',
    'Settings.Integration': 'Configure payment processing, maps, and billing integrations',
    'Settings.Preferences': 'Customize your personal settings and preferences',
  };
  return descriptions[route.name as string] || 'Manage system settings and configurations';
});
</script>

<template>
  <MasterLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ getPageTitle }}</h1>
        <p class="text-sm text-gray-500">{{ getPageDescription }}</p>
      </div>

      <!-- Settings Content -->
      <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <component :is="activeComponent" />
      </div>
    </div>
  </MasterLayout>
</template>
