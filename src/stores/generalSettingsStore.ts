import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import axiosClient from '../axios';

const FALLBACK_COMPANY_NAME = 'TrigonoLinks';
const FALLBACK_CURRENCY = 'PKR';

interface GeneralSettingsResponse {
  company_name?: string | null;
  currency_unit?: string | null;
}

export const useGeneralSettingsStore = defineStore('generalSettings', () => {
  const companyName = ref<string | null>(null);
  const currencyUnitInternal = ref<string>(FALLBACK_CURRENCY);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref<string | null>(null);

  const displayCompanyName = computed(() => {
    const value = companyName.value?.trim();
    return value && value.length > 0 ? value : FALLBACK_COMPANY_NAME;
  });

  const companyInitials = computed(() => {
    const words = displayCompanyName.value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    const initials = words.map((word) => word[0]?.toUpperCase() ?? '').join('');
    return initials || FALLBACK_COMPANY_NAME.slice(0, 2).toUpperCase();
  });

  const currencyUnit = computed(() => {
    const value = currencyUnitInternal.value?.trim().toUpperCase();
    return value && value.length === 3 ? value : FALLBACK_CURRENCY;
  });

  const fetchSettings = async (force = false) => {
    if (loaded.value && !force) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await axiosClient.get('/general-settings');
      const data: GeneralSettingsResponse | undefined = response?.data?.data ?? response?.data;

      if (data) {
        if (typeof data.company_name === 'string' || data.company_name === null) {
          companyName.value = data.company_name;
        }
        if (typeof data.currency_unit === 'string' && data.currency_unit.length > 0) {
          currencyUnitInternal.value = data.currency_unit;
        }
      }

      loaded.value = true;
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Failed to load general settings.';
      console.error('Failed to load general settings', e);
    } finally {
      loading.value = false;
    }
  };

  const updateSettings = async (payload: { company_name?: string | null; currency_unit: string }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axiosClient.put('/general-settings', payload);
      const data: GeneralSettingsResponse | undefined = response?.data?.data ?? response?.data;

      if (data) {
        if (typeof data.company_name === 'string' || data.company_name === null) {
          companyName.value = data.company_name ?? null;
        }
        if (typeof data.currency_unit === 'string' && data.currency_unit.length > 0) {
          currencyUnitInternal.value = data.currency_unit;
        }
      }

      loaded.value = true;
      return response;
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Failed to update general settings.';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const resetToDefaults = () => {
    companyName.value = null;
    currencyUnitInternal.value = FALLBACK_CURRENCY;
  };

  return {
    companyName,
    currencyUnit,
    companyInitials,
    displayCompanyName,
    loading,
    error,
    loaded,
    fetchSettings,
    updateSettings,
    resetToDefaults,
    FALLBACK_COMPANY_NAME,
    FALLBACK_CURRENCY,
  };
});

