<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Dialog from '../volt/Dialog.vue';
import Button from '../volt/Button.vue';
import axiosClient from '../axios';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const props = defineProps<{
  visible: boolean;
  invoiceId: number;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'sent': [];
}>();

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const checkingSettings = ref(true);
const emailConfigured = ref(false);
const whatsappConfigured = ref(false);
const selectedMethod = ref<'email' | 'whatsapp' | 'both' | null>(null);

const canSendEmail = computed(() => emailConfigured.value);
const canSendWhatsApp = computed(() => whatsappConfigured.value);
const canSendBoth = computed(() => emailConfigured.value && whatsappConfigured.value);

const hasAnyMethod = computed(() => canSendEmail.value || canSendWhatsApp.value);

const checkCommunicationSettings = async () => {
  checkingSettings.value = true;
  try {
    const res = await axiosClient.get('/communication-settings');
    const settings = res.data?.data || {};
    
    // Check email configuration
    const emailSettings = settings.email || {};
    emailConfigured.value = emailSettings.enabled === true && 
                          emailSettings.from_address && 
                          (emailSettings.driver === 'smtp' ? (emailSettings.host && emailSettings.username) : true);
    
    // Check WhatsApp configuration
    const whatsappSettings = settings.whatsapp || {};
    whatsappConfigured.value = whatsappSettings.enabled === true && 
                               whatsappSettings.provider && 
                               ((whatsappSettings.provider === 'twilio' && whatsappSettings.twilio_account_sid && whatsappSettings.twilio_auth_token) ||
                                (whatsappSettings.provider === 'whatsapp_business' && whatsappSettings.phone_number_id && whatsappSettings.access_token) ||
                                (whatsappSettings.provider === 'green_api' && whatsappSettings.green_api_instance_id && whatsappSettings.green_api_token));
    
    // Auto-select method if only one is available
    if (canSendBoth.value) {
      selectedMethod.value = 'both';
    } else if (canSendEmail.value) {
      selectedMethod.value = 'email';
    } else if (canSendWhatsApp.value) {
      selectedMethod.value = 'whatsapp';
    }
  } catch (error) {
    console.error('Error checking communication settings:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to check communication settings',
      life: 3000,
    });
  } finally {
    checkingSettings.value = false;
  }
};

const sendInvoice = async () => {
  if (!selectedMethod.value) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please select a sending method',
      life: 3000,
    });
    return;
  }

  loading.value = true;
  try {
    const res = await axiosClient.post(`/invoices/${props.invoiceId}/send`, {
      method: selectedMethod.value,
    });
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: res.data?.message || 'Invoice sent successfully',
      life: 3000,
    });
    
    emit('sent');
    emit('update:visible', false);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to send invoice',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const goToSettings = () => {
  emit('update:visible', false);
  router.push({ name: 'Settings.Communication' });
};

// Watch for visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal) {
    checkCommunicationSettings();
  } else {
    selectedMethod.value = null;
  }
});

onMounted(() => {
  if (props.visible) {
    checkCommunicationSettings();
  }
});
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Send Invoice"
    :closable="true"
    :style="{ width: '500px', maxWidth: '98vw' }"
  >
    <div v-if="checkingSettings" class="py-8 text-center text-gray-500">
      <i class="fa-light fa-spinner fa-spin text-2xl"></i>
      <p class="mt-2 text-sm">Checking communication settings...</p>
    </div>

    <div v-else-if="!hasAnyMethod" class="space-y-4 py-4">
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div class="flex items-start gap-3">
          <i class="fa-light fa-triangle-exclamation text-amber-600 text-xl mt-0.5"></i>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-amber-900 mb-1">No Communication Methods Configured</h3>
            <p class="text-sm text-amber-700 mb-3">
              Please configure Email or WhatsApp in Communication Settings before sending invoices.
            </p>
            <Button
              label="Go to Settings"
              size="small"
              icon="pi pi-cog"
              @click="goToSettings"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4 py-4">
      <p class="text-sm text-gray-600">
        Select how you want to send this invoice to the customer:
      </p>

      <div class="space-y-3">
        <!-- Email Option -->
        <label
          v-if="canSendEmail"
          class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
          :class="selectedMethod === 'email' || selectedMethod === 'both' 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
        >
          <input
            type="radio"
            :value="'email'"
            v-model="selectedMethod"
            class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <i class="fa-light fa-envelope text-indigo-600"></i>
              <span class="font-medium text-gray-900">Send via Email</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Invoice will be sent to the customer's email address with PDF attachment
            </p>
          </div>
        </label>

        <!-- WhatsApp Option -->
        <label
          v-if="canSendWhatsApp"
          class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
          :class="selectedMethod === 'whatsapp' || selectedMethod === 'both' 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
        >
          <input
            type="radio"
            :value="'whatsapp'"
            v-model="selectedMethod"
            class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <i class="fa-brands fa-whatsapp text-green-600"></i>
              <span class="font-medium text-gray-900">Send via WhatsApp</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Invoice will be sent to the customer's WhatsApp number
            </p>
          </div>
        </label>

        <!-- Both Option -->
        <label
          v-if="canSendBoth"
          class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
          :class="selectedMethod === 'both' 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
        >
          <input
            type="radio"
            :value="'both'"
            v-model="selectedMethod"
            class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <i class="fa-light fa-paper-plane text-indigo-600"></i>
              <span class="font-medium text-gray-900">Send via Both</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Invoice will be sent via both Email and WhatsApp
            </p>
          </div>
        </label>
      </div>

      <!-- Configuration Warnings -->
      <div v-if="!canSendEmail && canSendWhatsApp" class="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div class="flex items-start gap-2">
          <i class="fa-light fa-info-circle text-amber-600 text-sm mt-0.5"></i>
          <p class="text-xs text-amber-700">
            Email is not configured. <button @click="goToSettings" class="underline font-medium">Configure Email</button> to enable email sending.
          </p>
        </div>
      </div>

      <div v-if="!canSendWhatsApp && canSendEmail" class="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div class="flex items-start gap-2">
          <i class="fa-light fa-info-circle text-amber-600 text-sm mt-0.5"></i>
          <p class="text-xs text-amber-700">
            WhatsApp is not configured. <button @click="goToSettings" class="underline font-medium">Configure WhatsApp</button> to enable WhatsApp sending.
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          size="small"
          class="p-outlined"
          @click="emit('update:visible', false)"
        />
        <Button
          v-if="hasAnyMethod"
          label="Send Invoice"
          size="small"
          icon="pi pi-send"
          :loading="loading"
          :disabled="!selectedMethod"
          @click="sendInvoice"
        />
      </div>
    </template>
  </Dialog>
</template>

