<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import axiosClient from '../../../axios';
import InputText from '../../../volt/InputText.vue';
import Password from '../../../volt/Password.vue';
import Select from '../../../volt/Select.vue';
import ToggleSwitch from '../../../volt/ToggleSwitch.vue';
import Button from '../../../volt/Button.vue';
import Dialog from '../../../volt/Dialog.vue';
import Textarea from '../../../volt/Textarea.vue';
import MultiSelect from '../../../volt/MultiSelect.vue';

const toast = useToast();
const loading = ref(false);
const initialLoading = ref(true);

// WhatsApp Settings
const whatsappSettings = ref({
  provider: 'twilio',
  enabled: false,
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_whatsapp_from: '',
  phone_number_id: '',
  access_token: '',
  webhook_verify_token: '',
  green_api_instance_id: '',
  green_api_token: '',
  default_country_code: '1',
});

// Email Settings
const emailSettings = ref({
  enabled: true,
  driver: 'smtp',
  host: '',
  port: '587',
  username: '',
  password: '',
  encryption: 'tls',
  from_address: '',
  from_name: '',
});

// SMS Settings
const smsSettings = ref({
  enabled: false,
  provider: 'twilio',
  api_key: '',
  api_secret: '',
  from_number: '',
});

const whatsappProviders = [
  { label: 'Twilio', value: 'twilio' },
  { label: 'WhatsApp Business API', value: 'whatsapp_business' },
  { label: 'Green API', value: 'green_api' },
];

const emailDrivers = [
  { label: 'SMTP', value: 'smtp' },
  { label: 'Mailgun', value: 'mailgun' },
  { label: 'SES', value: 'ses' },
  { label: 'Postmark', value: 'postmark' },
];

const encryptionTypes = [
  { label: 'TLS', value: 'tls' },
  { label: 'SSL', value: 'ssl' },
  { label: 'None', value: null },
];

const templateChannels = ['WhatsApp', 'Email'];
const templateChannelOptions = templateChannels.map(channel => ({ label: channel, value: channel }));
const selectedTemplateChannel = ref<string>('WhatsApp');
const availableTemplateTokens = ref<Record<string, any[]>>({});
const templateTokensLoading = ref(false);
const templateLists = ref<Record<string, any[]>>({});
const templateListsLoaded = ref<Record<string, boolean>>({});
const templateListLoading = ref(false);
const templateDeletingId = ref<number | null>(null);

const templateDialogVisible = ref(false);
const templateDialogLoading = ref(false);
const editingTemplate = ref(false);

const templateForm = ref({
  id: null as number | null,
  channel: 'WhatsApp',
  name: '',
  provider_template_name: '',
  template_language: 'en_US',
  subject: '',
  body: '',
  is_active: true,
  selectedTokenNames: [] as string[],
  tokenSettings: {} as Record<string, { required: boolean; default: string | null }>,
});

const currentTemplates = computed(() => templateLists.value[selectedTemplateChannel.value] ?? []);
const templateTokenOptions = computed(() => {
  const channel = templateForm.value.channel;
  return (availableTemplateTokens.value[channel] ?? []).map((token: any) => ({
    label: token.label,
    value: token.name,
  }));
});
const selectedTokenDetails = computed(() => {
  const channel = templateForm.value.channel;
  return templateForm.value.selectedTokenNames
    .map(name => {
      const tokens = availableTemplateTokens.value[channel] ?? [];
      const token = tokens.find((token: any) => token.name === name);
      if (!token) {
        return null;
      }
      if (!templateForm.value.tokenSettings[name]) {
        return null;
      }
      return token;
    })
    .filter((token): token is Record<string, any> => !!token);
});

const findToken = (channel: string, name: string) => {
  return (availableTemplateTokens.value[channel] ?? []).find((token: any) => token.name === name) || null;
};

const getTokenPlaceholder = (name: string) => `{{ ${name} }}`;

const insertTokenPlaceholder = (name: string, target: 'subject' | 'body') => {
  const placeholder = getTokenPlaceholder(name);

  if (target === 'subject') {
    templateForm.value.subject = templateForm.value.subject
      ? `${templateForm.value.subject} ${placeholder}`
      : placeholder;
    return;
  }

  templateForm.value.body = templateForm.value.body
    ? `${templateForm.value.body}\n${placeholder}`
    : placeholder;
};

const resetTemplateForm = (channel = 'WhatsApp') => {
  templateForm.value = {
    id: null,
    channel,
    name: '',
    provider_template_name: '',
    template_language: channel === 'WhatsApp' ? 'en_US' : '',
    subject: '',
    body: '',
    is_active: true,
    selectedTokenNames: [],
    tokenSettings: {},
  };
};

const syncTokenSettings = () => {
  const channel = templateForm.value.channel;

  templateForm.value.selectedTokenNames.forEach(name => {
    if (!templateForm.value.tokenSettings[name]) {
      const token = findToken(channel, name);
      templateForm.value.tokenSettings[name] = {
        required: token?.required_by_default ?? false,
        default: token?.default ?? '',
      };
    }
  });

  Object.keys(templateForm.value.tokenSettings).forEach(name => {
    if (!templateForm.value.selectedTokenNames.includes(name)) {
      delete templateForm.value.tokenSettings[name];
    }
  });
};

const loadTemplateTokens = async () => {
  if (Object.keys(availableTemplateTokens.value).length > 0) {
    return;
  }

  templateTokensLoading.value = true;
  try {
    const res = await axiosClient.get('/communication-template-tokens');
    if (res.data?.status) {
      availableTemplateTokens.value = res.data.data?.tokens ?? {};
      const channelsFromApi = res.data.data?.channels ?? [];
      if (
        channelsFromApi.length > 0 &&
        !channelsFromApi.includes(selectedTemplateChannel.value)
      ) {
        selectedTemplateChannel.value = channelsFromApi[0];
      }
    }
  } catch (error: any) {
    console.error('Error loading template tokens:', error);
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Failed to load template tokens.',
      life: 4000,
    });
  } finally {
    templateTokensLoading.value = false;
  }
};

const loadTemplatesForChannel = async (channel: string) => {
  templateListLoading.value = true;
  try {
    const res = await axiosClient.get('/communication-templates', {
      params: { channel },
    });

    if (res.data?.status) {
      templateLists.value = {
        ...templateLists.value,
        [channel]: res.data.data ?? [],
      };
      templateListsLoaded.value[channel] = true;
    }
  } catch (error: any) {
    console.error('Error loading templates:', error);
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: `Failed to load ${channel} templates.`,
      life: 4000,
    });
  } finally {
    templateListLoading.value = false;
  }
};

const ensureTemplatesForChannel = async (channel: string) => {
  if (templateListsLoaded.value[channel]) {
    return;
  }

  await loadTemplatesForChannel(channel);
};

const openCreateTemplate = async () => {
  if (!Object.keys(availableTemplateTokens.value).length) {
    await loadTemplateTokens();
  }

  resetTemplateForm(selectedTemplateChannel.value);
  editingTemplate.value = false;
  templateDialogVisible.value = true;
};

const openEditTemplate = async (template: any) => {
  if (!Object.keys(availableTemplateTokens.value).length) {
    await loadTemplateTokens();
  }

  editingTemplate.value = true;

  const channel = template.channel || selectedTemplateChannel.value;
  templateForm.value = {
    id: template.id,
    channel,
    name: template.name || '',
    provider_template_name: template.provider_template_name || '',
    template_language: template.template_language || (channel === 'WhatsApp' ? 'en_US' : ''),
    subject: template.subject || '',
    body: template.body || '',
    is_active: template.is_active !== undefined ? !!template.is_active : true,
    selectedTokenNames: Array.isArray(template.variables)
      ? template.variables.map((variable: any) => variable.name).filter(Boolean)
      : [],
    tokenSettings: {},
  };

  if (Array.isArray(template.variables)) {
    template.variables.forEach((variable: any) => {
      if (!variable?.name) {
        return;
      }

      templateForm.value.tokenSettings[variable.name] = {
        required: variable.required ?? false,
        default: variable.default ?? '',
      };
    });
  }

  syncTokenSettings();
  templateDialogVisible.value = true;
};

const handleTemplateDialogVisibility = (value: boolean) => {
  templateDialogVisible.value = value;
  if (!value) {
    resetTemplateForm(selectedTemplateChannel.value);
    editingTemplate.value = false;
  }
};

const saveTemplate = async () => {
  if (!templateForm.value.name.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please enter a template name.',
      life: 3000,
    });
    return;
  }

  if (!templateForm.value.channel) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please select a template channel.',
      life: 3000,
    });
    return;
  }

  if (
    templateForm.value.channel === 'WhatsApp' &&
    !templateForm.value.provider_template_name.trim()
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Provider template name is required for WhatsApp templates.',
      life: 3000,
    });
    return;
  }

  if (
    templateForm.value.channel === 'WhatsApp' &&
    !templateForm.value.template_language.trim()
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Template language is required for WhatsApp templates.',
      life: 3000,
    });
    return;
  }

  templateDialogLoading.value = true;

  try {
    const channel = templateForm.value.channel;
    const payload: Record<string, any> = {
      name: templateForm.value.name.trim(),
      channel,
      provider_template_name: templateForm.value.provider_template_name?.trim() || null,
      template_language: templateForm.value.template_language?.trim() || null,
      subject: templateForm.value.subject || null,
      body: templateForm.value.body || null,
      is_active: templateForm.value.is_active,
      variables: templateForm.value.selectedTokenNames.map(name => {
        const token = findToken(channel, name);
        const config = templateForm.value.tokenSettings[name] ?? {
          required: token?.required_by_default ?? false,
          default: token?.default ?? '',
        };

        return {
          name,
          label: token?.label ?? name,
          required: config.required ?? false,
          default: config.default === '' ? null : config.default,
        };
      }),
    };

    let response;
    if (editingTemplate.value && templateForm.value.id) {
      response = await axiosClient.put(
        `/communication-templates/${templateForm.value.id}`,
        payload
      );
    } else {
      response = await axiosClient.post('/communication-templates', payload);
    }

    if (response.data?.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: response.data.message || 'Template saved successfully.',
        life: 3000,
      });

      templateDialogVisible.value = false;
      editingTemplate.value = false;
      templateListsLoaded.value[channel] = false;
      await ensureTemplatesForChannel(channel);
      selectedTemplateChannel.value = channel;
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      (error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : 'Failed to save template.');

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 4000,
    });
  } finally {
    templateDialogLoading.value = false;
  }
};

const deleteTemplate = async (template: any) => {
  if (!confirm(`Delete template "${template.name}"? This action cannot be undone.`)) {
    return;
  }

  templateDeletingId.value = template.id;

  try {
    const res = await axiosClient.delete(`/communication-templates/${template.id}`);
    if (res.data?.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: res.data.message || 'Template deleted successfully.',
        life: 3000,
      });

      templateListsLoaded.value[template.channel] = false;
      await ensureTemplatesForChannel(template.channel);
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: res.data?.message || 'Unable to delete template.',
        life: 4000,
      });
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      'Failed to delete template.';

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 4000,
    });
  } finally {
    templateDeletingId.value = null;
  }
};

watch(selectedTemplateChannel, (channel) => {
  ensureTemplatesForChannel(channel);
});

watch(
  () => templateForm.value.selectedTokenNames,
  () => {
    if (!templateDialogVisible.value) {
      return;
    }
    syncTokenSettings();
  }
);

watch(
  () => templateForm.value.channel,
  (channel, previous) => {
    if (!templateDialogVisible.value || channel === previous) {
      return;
    }

    templateForm.value.selectedTokenNames = [];
    templateForm.value.tokenSettings = {};

    if (channel === 'WhatsApp' && !templateForm.value.template_language) {
      templateForm.value.template_language = 'en_US';
    } else if (channel !== 'WhatsApp') {
      templateForm.value.template_language = templateForm.value.template_language || '';
    }
  }
);

// Load settings from API
const loadSettings = async () => {
  initialLoading.value = true;
  try {
    const res = await axiosClient.get('/communication-settings');
    
    if (res.data?.status && res.data.data) {
      const data = res.data.data;
      
      // Load WhatsApp settings
      if (data.whatsapp) {
        whatsappSettings.value = {
          provider: data.whatsapp.provider || 'twilio',
          enabled: data.whatsapp.enabled || false,
          twilio_account_sid: data.whatsapp.twilio_account_sid || '',
          twilio_auth_token: data.whatsapp.twilio_auth_token || '',
          twilio_whatsapp_from: data.whatsapp.twilio_whatsapp_from || '',
          phone_number_id: data.whatsapp.phone_number_id || '',
          access_token: data.whatsapp.access_token || '',
          webhook_verify_token: data.whatsapp.webhook_verify_token || '',
          green_api_instance_id: data.whatsapp.green_api_instance_id || '',
          green_api_token: data.whatsapp.green_api_token || '',
          default_country_code: data.whatsapp.default_country_code || '1',
        };
      }
      
      // Load Email settings
      if (data.email) {
        emailSettings.value = {
          enabled: data.email.enabled !== undefined ? data.email.enabled : true,
          driver: data.email.driver || 'smtp',
          host: data.email.host || '',
          port: data.email.port ? String(data.email.port) : '587',
          username: data.email.username || '',
          password: data.email.password || '',
          encryption: data.email.encryption || 'tls',
          from_address: data.email.from_address || '',
          from_name: data.email.from_name || '',
        };
      }
      
      // Load SMS settings
      if (data.sms) {
        smsSettings.value = {
          enabled: data.sms.enabled || false,
          provider: data.sms.provider || 'twilio',
          api_key: data.sms.api_key || '',
          api_secret: data.sms.api_secret || '',
          from_number: data.sms.from_number || '',
        };
      }
    }
  } catch (error: any) {
    console.error('Error loading communication settings:', error);
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Failed to load saved settings. Using defaults.',
      life: 4000,
    });
  } finally {
    initialLoading.value = false;
  }
};

const saveWhatsAppSettings = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.put('/communication-settings/whatsapp', whatsappSettings.value);
    
    if (res.data?.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: res.data.message || 'WhatsApp settings saved successfully!',
        life: 3000,
      });
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors ? 
                        Object.values(error.response.data.errors).flat().join(', ') : 
                        'Failed to save WhatsApp settings.';
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const saveEmailSettings = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.put('/communication-settings/email', emailSettings.value);
    
    if (res.data?.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: res.data.message || 'Email settings saved successfully!',
        life: 3000,
      });
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors ? 
                        Object.values(error.response.data.errors).flat().join(', ') : 
                        'Failed to save email settings.';
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const saveSMSSettings = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.put('/communication-settings/sms', smsSettings.value);
    
    if (res.data?.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: res.data.message || 'SMS settings saved successfully!',
        life: 3000,
      });
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors ? 
                        Object.values(error.response.data.errors).flat().join(', ') : 
                        'Failed to save SMS settings.';
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

// Load settings on mount
onMounted(() => {
  loadSettings();
  loadTemplateTokens();
  ensureTemplatesForChannel(selectedTemplateChannel.value);
});
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Communication Settings</h2>
      <p class="text-sm text-gray-500">Configure communication channels (WhatsApp, Email, SMS)</p>
    </div>

    <div v-if="initialLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="fa-light fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
        <p class="text-sm text-gray-500">Loading settings...</p>
      </div>
    </div>

    <template v-else>

    <!-- WhatsApp Settings -->
    <div class="rounded-lg border border-gray-200 p-6 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">WhatsApp Configuration</h3>
          <p class="text-xs text-gray-500 mt-1">Configure WhatsApp API integration</p>
        </div>
        <ToggleSwitch v-model="whatsappSettings.enabled" />
      </div>

      <div v-if="whatsappSettings.enabled" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Provider
          </label>
          <Select
            v-model="whatsappSettings.provider"
            :options="whatsappProviders"
            optionLabel="label"
            optionValue="value"
            placeholder="Select provider"
            size="small"
            fluid
          />
        </div>

        <div v-if="whatsappSettings.provider === 'twilio'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Twilio Account SID
            </label>
            <InputText
              v-model="whatsappSettings.twilio_account_sid"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Twilio Auth Token
            </label>
            <Password
              v-model="whatsappSettings.twilio_auth_token"
              placeholder="Enter auth token"
              size="small"
              fluid
              toggleMask
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp From Number
            </label>
            <InputText
              v-model="whatsappSettings.twilio_whatsapp_from"
              placeholder="whatsapp:+14155238886"
              size="small"
              fluid
            />
          </div>
        </div>

        <div v-if="whatsappSettings.provider === 'whatsapp_business'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Phone Number ID
            </label>
            <InputText
              v-model="whatsappSettings.phone_number_id"
              placeholder="Enter phone number ID"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Access Token
            </label>
            <Password
              v-model="whatsappSettings.access_token"
              placeholder="Enter access token"
              size="small"
              fluid
              toggleMask
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Webhook Verify Token
            </label>
            <InputText
              v-model="whatsappSettings.webhook_verify_token"
              placeholder="Enter webhook verify token"
              size="small"
              fluid
            />
          </div>
        </div>

        <div v-if="whatsappSettings.provider === 'green_api'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Instance ID
            </label>
            <InputText
              v-model="whatsappSettings.green_api_instance_id"
              placeholder="Enter Green API instance ID"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <Password
              v-model="whatsappSettings.green_api_token"
              placeholder="Enter API token"
              size="small"
              fluid
              toggleMask
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Default Country Code
          </label>
          <InputText
            v-model="whatsappSettings.default_country_code"
            placeholder="1"
            size="small"
            fluid
          />
        </div>

        <div class="flex justify-end pt-2">
          <Button
            label="Save WhatsApp Settings"
            size="small"
            :loading="loading"
            @click="saveWhatsAppSettings"
          />
        </div>
      </div>
    </div>

    <!-- Email Settings -->
    <div class="rounded-lg border border-gray-200 p-6 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Email Configuration</h3>
          <p class="text-xs text-gray-500 mt-1">Configure email server settings</p>
        </div>
        <ToggleSwitch v-model="emailSettings.enabled" />
      </div>

      <div v-if="emailSettings.enabled" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Mail Driver
          </label>
          <Select
            v-model="emailSettings.driver"
            :options="emailDrivers"
            optionLabel="label"
            optionValue="value"
            placeholder="Select mail driver"
            size="small"
            fluid
          />
        </div>

        <div v-if="emailSettings.driver === 'smtp'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <InputText
                v-model="emailSettings.host"
                placeholder="smtp.mailtrap.io"
                size="small"
                fluid
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <InputText
                v-model="emailSettings.port"
                type="number"
                placeholder="587"
                size="small"
                fluid
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Encryption
            </label>
            <Select
              v-model="emailSettings.encryption"
              :options="encryptionTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select encryption"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              SMTP Username
            </label>
            <InputText
              v-model="emailSettings.username"
              placeholder="Enter SMTP username"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              SMTP Password
            </label>
            <Password
              v-model="emailSettings.password"
              placeholder="Enter SMTP password"
              size="small"
              fluid
              toggleMask
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              From Address
            </label>
            <InputText
              v-model="emailSettings.from_address"
              type="email"
              placeholder="noreply@company.com"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              From Name
            </label>
            <InputText
              v-model="emailSettings.from_name"
              placeholder="Company Name"
              size="small"
              fluid
            />
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <Button
            label="Save Email Settings"
            size="small"
            :loading="loading"
            @click="saveEmailSettings"
          />
        </div>
      </div>
    </div>

    <!-- SMS Settings -->
    <div class="rounded-lg border border-gray-200 p-6 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">SMS Configuration</h3>
          <p class="text-xs text-gray-500 mt-1">Configure SMS provider settings</p>
        </div>
        <ToggleSwitch v-model="smsSettings.enabled" />
      </div>

      <div v-if="smsSettings.enabled" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <InputText
            v-model="smsSettings.api_key"
            placeholder="Enter API key"
            size="small"
            fluid
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            API Secret
          </label>
          <Password
            v-model="smsSettings.api_secret"
            placeholder="Enter API secret"
            size="small"
            fluid
            toggleMask
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            From Number
          </label>
          <InputText
            v-model="smsSettings.from_number"
            placeholder="+1234567890"
            size="small"
            fluid
          />
        </div>

        <div class="flex justify-end pt-2">
          <Button
            label="Save SMS Settings"
            size="small"
            :loading="loading"
            @click="saveSMSSettings"
          />
        </div>
      </div>
    </div>

    <!-- Message Templates -->
    <div class="rounded-lg border border-gray-200 p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Message Templates</h3>
          <p class="text-xs text-gray-500 mt-1">
            Define reusable templates and personalization tokens for your communication channels.
          </p>
        </div>
        <Button
          label="New Template"
          icon="pi pi-plus"
          size="small"
          @click="openCreateTemplate"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="channel in templateChannels"
          :key="channel"
          type="button"
          class="px-3 py-1 text-sm rounded border transition-colors"
          :class="channel === selectedTemplateChannel
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'"
          @click="selectedTemplateChannel = channel"
        >
          {{ channel }}
        </button>
      </div>

      <div v-if="templateTokensLoading || templateListLoading" class="flex items-center justify-center py-8">
        <div class="text-center">
          <i class="fa-light fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
          <p class="text-sm text-gray-500">Loading templates...</p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div v-if="currentTemplates.length > 0" class="space-y-4">
          <div
            v-for="template in currentTemplates"
            :key="template.id"
            class="rounded-lg border border-gray-200 bg-white p-4 space-y-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <h4 class="text-sm font-semibold text-gray-900">{{ template.name }}</h4>
                <p class="text-xs text-gray-500">
                  Channel: {{ template.channel }}
                  <span v-if="template.provider_template_name">
                    · Provider ID: {{ template.provider_template_name }}
                  </span>
                </p>
                <p v-if="template.subject" class="text-xs text-gray-600">
                  <span class="font-medium text-gray-700">Subject:</span> {{ template.subject }}
                </p>
              </div>
              <span
                class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full"
                :class="template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'"
              >
                {{ template.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div v-if="template.variables && template.variables.length" class="space-y-2">
              <p class="text-xs font-medium text-gray-500">Variables</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="variable in template.variables"
                  :key="variable.name"
                  class="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                >
                  {{ variable.label || variable.name }}
                </span>
              </div>
              <p v-if="template.template_language" class="text-xs text-gray-500">
                Language: <span class="font-medium text-gray-700">{{ template.template_language }}</span>
              </p>
              <div class="space-y-1 text-xs text-gray-500">
                <p>Placeholder tokens:</p>
                <ul class="space-y-1">
                  <li
                    v-for="variable in template.variables"
                    :key="`${template.id}-${variable.name}-placeholder`"
                    class="flex items-center justify-between rounded border border-dashed border-gray-300 px-3 py-1.5 bg-gray-50"
                  >
                    <span class="font-medium text-gray-600">{{ variable.label || variable.name }}</span>
                    <code class="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {{ getTokenPlaceholder(variable.name) }}
                    </code>
                  </li>
                </ul>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                size="small"
                class="p-outlined"
                @click="openEditTemplate(template)"
              />
              <Button
                label="Delete"
                icon="pi pi-trash"
                size="small"
                class="p-button-danger"
                :loading="templateDeletingId === template.id"
                @click="deleteTemplate(template)"
              />
            </div>
          </div>
        </div>

        <p v-else class="text-sm text-gray-500">
          No templates defined yet for {{ selectedTemplateChannel }}. Create one to get started.
        </p>
      </div>
    </div>
    </template>
  </div>

  <Dialog
    :visible="templateDialogVisible"
    @update:visible="handleTemplateDialogVisibility"
    modal
    :header="editingTemplate ? 'Edit Template' : 'Create Template'"
    :closable="!templateDialogLoading"
    :style="{ width: '640px', maxWidth: '95vw' }"
  >
    <form @submit.prevent="saveTemplate" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Template Name <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="templateForm.name"
            placeholder="Enter template name"
            size="small"
            fluid
            :disabled="templateDialogLoading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Channel <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="templateForm.channel"
            :options="templateChannelOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select channel"
            size="small"
            fluid
            :disabled="templateDialogLoading || editingTemplate"
          />
        </div>
      </div>

      <div v-if="templateForm.channel === 'WhatsApp'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Provider Template Name <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="templateForm.provider_template_name"
            placeholder="Enter provider template name"
            size="small"
            fluid
            :disabled="templateDialogLoading"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Template Language <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="templateForm.template_language"
            placeholder="e.g. en_US"
            size="small"
            fluid
            :disabled="templateDialogLoading"
          />
        </div>
      </div>

      <div v-else>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Template Language
        </label>
        <InputText
          v-model="templateForm.template_language"
          placeholder="Optional language code (e.g. en)"
          size="small"
          fluid
          :disabled="templateDialogLoading"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <InputText
            v-model="templateForm.subject"
            placeholder="Optional subject"
            size="small"
            fluid
            :disabled="templateDialogLoading"
          />
        </div>
        <div class="flex items-center gap-3 mt-6 sm:mt-0">
          <span class="text-sm text-gray-700">Active</span>
          <ToggleSwitch v-model="templateForm.is_active" :disabled="templateDialogLoading" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Body</label>
        <Textarea
          v-model="templateForm.body"
          rows="5"
          placeholder="Enter message body (use tokens like {{customer.name}})"
          size="small"
          fluid
          :disabled="templateDialogLoading"
        />
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Personalization Tokens
          </label>
          <p class="text-xs text-gray-500 mb-2">
            Select tokens to enable personalization. Use the buttons below to inject placeholders directly into the subject or body.
          </p>
          <MultiSelect
            v-model="templateForm.selectedTokenNames"
            :options="templateTokenOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select tokens"
            display="chip"
            size="small"
            fluid
            :filter="true"
            :disabled="templateDialogLoading"
          />
        </div>

        <div v-if="selectedTokenDetails.length" class="space-y-3">
          <div
            v-for="token in selectedTokenDetails"
            :key="token.name"
            class="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ token.label }}</p>
                <p class="text-xs text-gray-500">{{ token.description || token.name }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">Required</span>
                <ToggleSwitch
                  v-model="templateForm.tokenSettings[token.name].required"
                  :disabled="templateDialogLoading"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Default Value</label>
              <InputText
                v-model="templateForm.tokenSettings[token.name].default"
                placeholder="Optional default value"
                size="small"
                fluid
                :disabled="templateDialogLoading"
              />
            </div>
            <div class="flex items-center gap-2 pt-1">
              <Button
                label="Insert into Subject"
                size="x-small"
                class="p-button-text"
                :disabled="templateDialogLoading"
                @click="insertTokenPlaceholder(token.name, 'subject')"
              />
              <Button
                label="Insert into Body"
                size="x-small"
                class="p-button-text"
                :disabled="templateDialogLoading"
                @click="insertTokenPlaceholder(token.name, 'body')"
              />
              <code class="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {{ getTokenPlaceholder(token.name) }}
              </code>
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="w-full flex items-center justify-end gap-2">
        <Button
          label="Cancel"
          size="small"
          class="p-outlined"
          :disabled="templateDialogLoading"
          @click="handleTemplateDialogVisibility(false)"
        />
        <Button
          label="Save Template"
          icon="pi pi-check"
          size="small"
          :loading="templateDialogLoading"
          @click="saveTemplate"
        />
      </div>
    </template>
  </Dialog>
</template>

