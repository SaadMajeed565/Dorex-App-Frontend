<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputNumber from '../../../volt/InputNumber.vue';
import ToggleSwitch from '../../../volt/ToggleSwitch.vue';
import Button from '../../../volt/Button.vue';

const toast = useToast();
const loading = ref(false);

const securitySettings = ref({
  two_factor_enabled: false,
  login_attempts_limit: 5,
  lockout_duration: 30,
  session_timeout: 120,
  require_https: false,
  enable_csrf: true,
  enable_rate_limiting: true,
  rate_limit_requests: 60,
  rate_limit_period: 1,
  enable_ip_whitelist: false,
  allowed_ips: [] as string[],
});

const saveSettings = async () => {
  loading.value = true;
  try {
    // TODO: API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Security settings saved successfully!',
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
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Security Settings</h2>
      <p class="text-sm text-gray-500">Configure security and authentication settings</p>
    </div>

    <!-- Two-Factor Authentication -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Two-Factor Authentication</h3>
      
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Enable Two-Factor Authentication
          </label>
          <p class="text-xs text-gray-500">Require users to use 2FA for login</p>
        </div>
        <ToggleSwitch v-model="securitySettings.two_factor_enabled" />
      </div>
    </div>

    <!-- Login Security -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Login Security</h3>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Maximum Login Attempts
        </label>
        <InputNumber
          v-model="securitySettings.login_attempts_limit"
          :min="3"
          :max="10"
          size="small"
          fluid
        />
        <p class="mt-1 text-xs text-gray-500">Account will be locked after this many failed attempts</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Lockout Duration (minutes)
        </label>
        <div class="relative">
          <InputNumber
            v-model="securitySettings.lockout_duration"
            :min="5"
            :max="1440"
            size="small"
            fluid
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">minutes</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Session Timeout (minutes)
        </label>
        <div class="relative">
          <InputNumber
            v-model="securitySettings.session_timeout"
            :min="5"
            :max="1440"
            size="small"
            fluid
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">minutes</span>
        </div>
      </div>
    </div>

    <!-- HTTPS & CSRF -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Connection Security</h3>
      
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Require HTTPS
          </label>
          <p class="text-xs text-gray-500">Force all connections to use HTTPS</p>
        </div>
        <ToggleSwitch v-model="securitySettings.require_https" />
      </div>

      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Enable CSRF Protection
          </label>
          <p class="text-xs text-gray-500">Protect against Cross-Site Request Forgery attacks</p>
        </div>
        <ToggleSwitch v-model="securitySettings.enable_csrf" />
      </div>
    </div>

    <!-- Rate Limiting -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Rate Limiting</h3>
      
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Enable Rate Limiting
          </label>
          <p class="text-xs text-gray-500">Limit the number of requests per time period</p>
        </div>
        <ToggleSwitch v-model="securitySettings.enable_rate_limiting" />
      </div>

      <div v-if="securitySettings.enable_rate_limiting" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Requests Limit
          </label>
          <InputNumber
            v-model="securitySettings.rate_limit_requests"
            :min="10"
            :max="1000"
            size="small"
            fluid
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Period (minutes)
          </label>
          <div class="relative">
            <InputNumber
              v-model="securitySettings.rate_limit_period"
              :min="1"
              :max="60"
              size="small"
              fluid
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">minutes</span>
          </div>
        </div>
      </div>
    </div>

    <!-- IP Whitelist -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">IP Access Control</h3>
      
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Enable IP Whitelist
          </label>
          <p class="text-xs text-gray-500">Restrict access to specific IP addresses</p>
        </div>
        <ToggleSwitch v-model="securitySettings.enable_ip_whitelist" />
      </div>

      <div v-if="securitySettings.enable_ip_whitelist" class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800">
          <i class="fa-light fa-exclamation-triangle mr-2"></i>
          IP whitelist configuration will be available in the backend implementation.
        </p>
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

