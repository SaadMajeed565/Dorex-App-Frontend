<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputNumber from '../../../volt/InputNumber.vue';
import Select from '../../../volt/Select.vue';
import ToggleSwitch from '../../../volt/ToggleSwitch.vue';
import Button from '../../../volt/Button.vue';

const toast = useToast();
const loading = ref(false);

const systemSettings = ref({
  max_upload_size: 10,
  session_lifetime: 120,
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_symbols: false,
  enable_logging: true,
  log_level: 'info',
  enable_backup: true,
  backup_frequency: 'daily',
  cache_driver: 'file',
  queue_driver: 'sync',
});

const logLevels = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
];

const backupFrequencies = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const cacheDrivers = [
  { label: 'File', value: 'file' },
  { label: 'Redis', value: 'redis' },
  { label: 'Database', value: 'database' },
];

const queueDrivers = [
  { label: 'Sync', value: 'sync' },
  { label: 'Database', value: 'database' },
  { label: 'Redis', value: 'redis' },
];

const saveSettings = async () => {
  loading.value = true;
  try {
    // TODO: API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'System settings saved successfully!',
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save settings.',
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
      <h2 class="text-lg font-semibold text-gray-900 mb-1">System Settings</h2>
      <p class="text-sm text-gray-500">Configure system-level settings and performance options</p>
    </div>

    <!-- File Upload Settings -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">File Upload</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Maximum Upload Size (MB)
        </label>
        <div class="relative">
          <InputNumber
            v-model="systemSettings.max_upload_size"
            :min="1"
            :max="100"
            size="small"
            fluid
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">MB</span>
        </div>
      </div>
    </div>

    <!-- Session Settings -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Session Settings</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Session Lifetime (minutes)
        </label>
        <div class="relative">
          <InputNumber
            v-model="systemSettings.session_lifetime"
            :min="5"
            :max="1440"
            size="small"
            fluid
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">minutes</span>
        </div>
        <p class="mt-1 text-xs text-gray-500">Session will expire after this many minutes of inactivity</p>
      </div>
    </div>

    <!-- Password Policy -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Password Policy</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Minimum Password Length
        </label>
        <InputNumber
          v-model="systemSettings.password_min_length"
          :min="6"
          :max="32"
          size="small"
          fluid
        />
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Require Uppercase Letters
            </label>
            <p class="text-xs text-gray-500">Password must contain at least one uppercase letter</p>
          </div>
          <ToggleSwitch v-model="systemSettings.password_require_uppercase" />
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Require Lowercase Letters
            </label>
            <p class="text-xs text-gray-500">Password must contain at least one lowercase letter</p>
          </div>
          <ToggleSwitch v-model="systemSettings.password_require_lowercase" />
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Require Numbers
            </label>
            <p class="text-xs text-gray-500">Password must contain at least one number</p>
          </div>
          <ToggleSwitch v-model="systemSettings.password_require_numbers" />
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Require Special Characters
            </label>
            <p class="text-xs text-gray-500">Password must contain at least one special character</p>
          </div>
          <ToggleSwitch v-model="systemSettings.password_require_symbols" />
        </div>
      </div>
    </div>

    <!-- Logging Settings -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Logging</h3>
      
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Enable Logging
          </label>
          <p class="text-xs text-gray-500">Enable system logging</p>
        </div>
        <ToggleSwitch v-model="systemSettings.enable_logging" />
      </div>

      <div v-if="systemSettings.enable_logging">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Log Level
        </label>
        <Select
          v-model="systemSettings.log_level"
          :options="logLevels"
          optionLabel="label"
          optionValue="value"
          placeholder="Select log level"
          size="small"
          fluid
        />
      </div>
    </div>

    <!-- Backup Settings -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Backup</h3>
      
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Enable Automatic Backups
          </label>
          <p class="text-xs text-gray-500">Automatically backup database and files</p>
        </div>
        <ToggleSwitch v-model="systemSettings.enable_backup" />
      </div>

      <div v-if="systemSettings.enable_backup">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Backup Frequency
        </label>
        <Select
          v-model="systemSettings.backup_frequency"
          :options="backupFrequencies"
          optionLabel="label"
          optionValue="value"
          placeholder="Select frequency"
          size="small"
          fluid
        />
      </div>
    </div>

    <!-- Performance Settings -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Performance</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Cache Driver
        </label>
        <Select
          v-model="systemSettings.cache_driver"
          :options="cacheDrivers"
          optionLabel="label"
          optionValue="value"
          placeholder="Select cache driver"
          size="small"
          fluid
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Queue Driver
        </label>
        <Select
          v-model="systemSettings.queue_driver"
          :options="queueDrivers"
          optionLabel="label"
          optionValue="value"
          placeholder="Select queue driver"
          size="small"
          fluid
        />
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex items-center justify-end pt-4 border-t border-gray-200">
      <Button
        label="Save Changes"
        icon="pi pi-check"
        :loading="loading"
        @click="saveSettings"
      />
    </div>
  </div>
</template>

