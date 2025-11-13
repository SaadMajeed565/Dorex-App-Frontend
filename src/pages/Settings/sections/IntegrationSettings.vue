<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputText from '../../../volt/InputText.vue';
import Password from '../../../volt/Password.vue';
import Select from '../../../volt/Select.vue';
import ToggleSwitch from '../../../volt/ToggleSwitch.vue';
import Button from '../../../volt/Button.vue';

const toast = useToast();
const loading = ref(false);

const integrations = ref({
  payment_gateway: {
    enabled: false,
    provider: 'stripe',
    api_key: '',
    api_secret: '',
    webhook_secret: '',
  },
  maps: {
    enabled: false,
    google_maps_api_key: '',
    provider: 'google',
  },
  billing: {
    auto_generate_invoices: true,
    invoice_prefix: 'INV',
    invoice_due_days: 30,
    late_fee_percentage: 5,
  },
});

const paymentProviders = [
  { label: 'Stripe', value: 'stripe' },
  { label: 'PayPal', value: 'paypal' },
  { label: 'Razorpay', value: 'razorpay' },
  { label: 'Manual', value: 'manual' },
];

const mapProviders = [
  { label: 'Google Maps', value: 'google' },
  { label: 'OpenStreetMap', value: 'osm' },
];

const savePaymentGateway = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Payment gateway settings saved!',
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

const saveMaps = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Maps settings saved!',
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

const saveBilling = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Billing settings saved!',
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
  <div class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Integration Settings</h2>
      <p class="text-sm text-gray-500">Configure payment processing, maps, and billing integrations</p>
    </div>

    <!-- Payment Gateway -->
    <div class="rounded-lg border border-gray-200 p-6 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Payment Gateway</h3>
          <p class="text-xs text-gray-500 mt-1">Configure payment processing for customer subscriptions</p>
        </div>
        <ToggleSwitch v-model="integrations.payment_gateway.enabled" />
      </div>

      <div v-if="integrations.payment_gateway.enabled" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Payment Provider
          </label>
          <Select
            v-model="integrations.payment_gateway.provider"
            :options="paymentProviders"
            optionLabel="label"
            optionValue="value"
            placeholder="Select payment provider"
            size="small"
            fluid
          />
        </div>

        <div v-if="integrations.payment_gateway.provider !== 'manual'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              API Key / Public Key
            </label>
            <InputText
              v-model="integrations.payment_gateway.api_key"
              placeholder="Enter API key"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              API Secret / Private Key
            </label>
            <Password
              v-model="integrations.payment_gateway.api_secret"
              placeholder="Enter API secret"
              size="small"
              fluid
              toggleMask
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <Password
              v-model="integrations.payment_gateway.webhook_secret"
              placeholder="Enter webhook secret"
              size="small"
              fluid
              toggleMask
            />
            <p class="mt-1 text-xs text-gray-500">For verifying payment webhooks</p>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <Button
            label="Save Payment Settings"
            size="small"
            :loading="loading"
            @click="savePaymentGateway"
          />
        </div>
      </div>
    </div>

    <!-- Maps Integration -->
    <div class="rounded-lg border border-gray-200 p-6 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Maps Integration</h3>
          <p class="text-xs text-gray-500 mt-1">Enable map features for coverage areas and customer locations</p>
        </div>
        <ToggleSwitch v-model="integrations.maps.enabled" />
      </div>

      <div v-if="integrations.maps.enabled" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Map Provider
          </label>
          <Select
            v-model="integrations.maps.provider"
            :options="mapProviders"
            optionLabel="label"
            optionValue="value"
            placeholder="Select map provider"
            size="small"
            fluid
          />
        </div>

        <div v-if="integrations.maps.provider === 'google'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Google Maps API Key
          </label>
          <InputText
            v-model="integrations.maps.google_maps_api_key"
            placeholder="Enter Google Maps API key"
            size="small"
            fluid
          />
        </div>

        <div class="flex justify-end pt-2">
          <Button
            label="Save Maps Settings"
            size="small"
            :loading="loading"
            @click="saveMaps"
          />
        </div>
      </div>
    </div>

    <!-- Billing Settings -->
    <div class="rounded-lg border border-gray-200 p-6 space-y-4">
      <div>
        <h3 class="text-base font-semibold text-gray-900 mb-4">Billing Configuration</h3>
        <p class="text-xs text-gray-500 mb-4">Configure invoice and billing settings</p>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Auto-Generate Invoices
            </label>
            <p class="text-xs text-gray-500">Automatically generate invoices for subscriptions</p>
          </div>
          <ToggleSwitch v-model="integrations.billing.auto_generate_invoices" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Invoice Prefix
          </label>
          <InputText
            v-model="integrations.billing.invoice_prefix"
            placeholder="INV"
            size="small"
            fluid
          />
          <p class="mt-1 text-xs text-gray-500">Prefix for invoice numbers (e.g., INV-2024-001)</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Invoice Due Days
          </label>
          <div class="relative">
            <input
              v-model.number="integrations.billing.invoice_due_days"
              type="number"
              min="1"
              max="90"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">days</span>
          </div>
          <p class="mt-1 text-xs text-gray-500">Number of days until invoice is due</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Late Fee Percentage
          </label>
          <div class="relative">
            <input
              v-model.number="integrations.billing.late_fee_percentage"
              type="number"
              min="0"
              max="50"
              step="0.1"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">%</span>
          </div>
          <p class="mt-1 text-xs text-gray-500">Percentage charged for late payments</p>
        </div>

        <div class="flex justify-end pt-2">
          <Button
            label="Save Billing Settings"
            size="small"
            :loading="loading"
            @click="saveBilling"
          />
        </div>
      </div>
    </div>
  </div>
</template>
