<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputText from '../../../volt/InputText.vue';
import Select from '../../../volt/Select.vue';
import Button from '../../../volt/Button.vue';
import { useGeneralSettingsStore } from '../../../stores/generalSettingsStore';

const toast = useToast();
const loading = ref(false);
const generalSettingsStore = useGeneralSettingsStore();

const settings = ref({
  company_name: generalSettingsStore.displayCompanyName,
  currency: generalSettingsStore.currencyUnit,
});

const currencies = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'INR - Indian Rupee', value: 'INR' },
  { label: 'PKR - Pakistani Rupee', value: 'PKR' },
  { label: 'AUD - Australian Dollar', value: 'AUD' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' },
  { label: 'AED - UAE Dirham', value: 'AED' },
  { label: 'SAR - Saudi Riyal', value: 'SAR' },
];

const syncFromStore = () => {
  settings.value.company_name = generalSettingsStore.companyName ?? generalSettingsStore.displayCompanyName;
  settings.value.currency = generalSettingsStore.currencyUnit;
};

onMounted(async () => {
  await generalSettingsStore.fetchSettings().catch(() => null);
  syncFromStore();
});

watch(
  () => generalSettingsStore.loaded,
  (loaded) => {
    if (loaded) {
      syncFromStore();
    }
  }
);

const saveSettings = async () => {
  loading.value = true;
  try {
    await generalSettingsStore.updateSettings({
      company_name: settings.value.company_name?.trim()
        ? settings.value.company_name.trim()
        : null,
      currency_unit: settings.value.currency || generalSettingsStore.currencyUnit,
    });

    syncFromStore();

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'General settings saved successfully!',
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
      <h2 class="text-lg font-semibold text-gray-900 mb-1">General Settings</h2>
      <p class="text-sm text-gray-500">
        Update company information displayed across the application.
      </p>
    </div>

    <div class="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm w-full">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          Company Name <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="settings.company_name"
          placeholder="Enter company name"
          size="small"
          fluid
        />
        <p class="text-xs text-gray-500">
          This name appears in the top bar and other areas of the product.
        </p>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          Default Currency <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="settings.currency"
          :options="currencies"
          optionLabel="label"
          optionValue="value"
          placeholder="Select currency"
          size="small"
          fluid
        />
        <p class="text-xs text-gray-500">
          Used as the default currency across dashboards and analytics.
        </p>
      </div>
    </div>

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

