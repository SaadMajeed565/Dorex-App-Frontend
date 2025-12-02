<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import axiosClient from '../../axios';
import Dialog from '../../volt/Dialog.vue';
import { useToast } from 'primevue/usetoast';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';

const router = useRouter();
const toast = useToast();
const generalSettingsStore = useGeneralSettingsStore();

// Props & Emits
const props = defineProps<{
  visible: boolean;
  customerId: string | number | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'updated'): void;
  (e: 'edit', customerId: string | number): void;
}>();

// State
const customer = ref<any>(null);
const subscriptions = ref<any[]>([]);
const payments = ref<any[]>([]);
const invoices = ref<any[]>([]);
const balance = ref<any>(null);
const loading = ref(false);
const loadingSubscriptions = ref(false);
const loadingPayments = ref(false);
const loadingInvoices = ref(false);
const activeTab = ref<'details' | 'subscriptions' | 'payments' | 'invoices'>('details');

const tenantCurrency = computed(() => generalSettingsStore.currencyUnit || 'PKR');

// Handle edit button click
const handleEdit = () => {
  if (props.customerId) {
    emit('edit', props.customerId);
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: tenantCurrency.value,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${tenantCurrency.value}`;
  }
};

// Format date
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

// Load customer data
const loadCustomer = async () => {
  if (!props.customerId) return;
  loading.value = true;
  try {
    const res = await axiosClient.get(`/customers/${props.customerId}`);
    customer.value = res.data.customer;
  } catch (error: any) {
    customer.value = null;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to load customer data.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

// Load subscriptions
const loadSubscriptions = async () => {
  if (!props.customerId) return;
  loadingSubscriptions.value = true;
  try {
    const res = await axiosClient.get(`/customers/${props.customerId}/subscriptions`);
    // Handle paginated response
    if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
      subscriptions.value = res.data.data.data;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      subscriptions.value = res.data.data;
    } else if (Array.isArray(res.data)) {
      subscriptions.value = res.data;
    } else {
      subscriptions.value = [];
    }
  } catch (error: any) {
    subscriptions.value = [];
    console.error('Error loading subscriptions:', error);
  } finally {
    loadingSubscriptions.value = false;
  }
};

// Load payments
const loadPayments = async () => {
  if (!props.customerId) return;
  loadingPayments.value = true;
  try {
    const res = await axiosClient.get(`/customers/${props.customerId}/payments`);
    // Handle paginated response
    if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
      payments.value = res.data.data.data;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      payments.value = res.data.data;
    } else if (Array.isArray(res.data)) {
      payments.value = res.data;
    } else {
      payments.value = [];
    }
  } catch (error: any) {
    payments.value = [];
    console.error('Error loading payments:', error);
  } finally {
    loadingPayments.value = false;
  }
};

// Load invoices
const loadInvoices = async () => {
  if (!props.customerId) return;
  loadingInvoices.value = true;
  try {
    const res = await axiosClient.get('/invoices', {
      params: { customer_id: props.customerId }
    });
    // Handle paginated response
    if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
      invoices.value = res.data.data.data;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      invoices.value = res.data.data;
    } else if (Array.isArray(res.data)) {
      invoices.value = res.data;
    } else {
      invoices.value = [];
    }
  } catch (error: any) {
    invoices.value = [];
    console.error('Error loading invoices:', error);
  } finally {
    loadingInvoices.value = false;
  }
};

// Load balance
const loadBalance = async () => {
  if (!props.customerId) return;
  try {
    const res = await axiosClient.get(`/customers/${props.customerId}/balance`);
    balance.value = res.data?.data || null;
  } catch (error: any) {
    balance.value = null;
    console.error('Error loading balance:', error);
  }
};

// Load all data
const loadAllData = async () => {
  await generalSettingsStore.fetchSettings();
  await Promise.all([
    loadCustomer(),
    loadSubscriptions(),
    loadPayments(),
    loadInvoices(),
    loadBalance(),
  ]);
};

// Watch for tab changes to load data
watch(activeTab, (tab) => {
  if (props.visible && props.customerId) {
    if (tab === 'subscriptions' && subscriptions.value.length === 0) {
      loadSubscriptions();
    } else if (tab === 'payments' && payments.value.length === 0) {
      loadPayments();
    } else if (tab === 'invoices' && invoices.value.length === 0) {
      loadInvoices();
    }
  }
});

// Watch for visibility changes and load/reset data
watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.customerId) {
      activeTab.value = 'details';
      await loadAllData();
    } else if (!visible) {
      customer.value = null;
      subscriptions.value = [];
      payments.value = [];
      invoices.value = [];
      balance.value = null;
    }
  },
  { immediate: false }
);

// Navigation helpers
const viewSubscription = (subscriptionId: number) => {
  router.push({ name: 'Subscriptions.Index', query: { show: subscriptionId } });
  emit('update:visible', false);
};

const viewPayment = (_paymentId?: number) => {
  router.push({ name: 'Payments.Index' });
  emit('update:visible', false);
};

const viewInvoice = (invoiceId?: number) => {
  if (invoiceId) {
    router.push({ name: 'Invoices.Index', query: { show: invoiceId } });
  } else {
  router.push({ name: 'Invoices.Index' });
  }
  emit('update:visible', false);
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Customer Details"
    :closable="true"
    :style="{ width: '900px', maxWidth: '97vw', maxHeight: '90vh' }"
  >
    <div v-if="loading && !customer" class="py-8 text-center text-gray-500">
      <i class="fa-light fa-spinner fa-spin text-2xl"></i>
    </div>
    <div v-else-if="customer" class="space-y-4 py-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600"
          >
            <span>{{ customer.name?.charAt(0) || '?' }}</span>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ customer.name || 'Unknown' }}
            </h2>
            <div class="text-xs text-gray-500">Customer ID: #{{ customer.id }}</div>
          </div>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          @click="handleEdit"
        >
          <i class="fa-light fa-pen-to-square text-sm"></i>
          Edit
        </button>
      </div>

      <!-- Balance Summary -->
      <div v-if="balance" class="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-gray-500">Total Payments</div>
            <div class="text-lg font-semibold text-gray-900">{{ formatCurrency(balance.total_payments || 0) }}</div>
          </div>
          <div>
            <div class="text-gray-500">Monthly Cost</div>
            <div class="text-lg font-semibold text-gray-900">{{ formatCurrency(balance.monthly_subscription_cost || 0) }}</div>
          </div>
          <div>
            <div class="text-gray-500">Outstanding Balance</div>
            <div class="text-lg font-semibold" :class="(balance.outstanding_balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'">
              {{ formatCurrency(balance.outstanding_balance || 0) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'details'"
            :class="[
              'whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors',
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            Details
          </button>
          <button
            @click="activeTab = 'subscriptions'"
            :class="[
              'whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors',
              activeTab === 'subscriptions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            Subscriptions
            <span v-if="subscriptions.length > 0" class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              {{ subscriptions.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'payments'"
            :class="[
              'whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors',
              activeTab === 'payments'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            Payments
            <span v-if="payments.length > 0" class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              {{ payments.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'invoices'"
            :class="[
              'whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium transition-colors',
              activeTab === 'invoices'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            ]"
          >
            Invoices
            <span v-if="invoices.length > 0" class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              {{ invoices.length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="max-h-[50vh] overflow-y-auto">
        <!-- Details Tab -->
        <div v-if="activeTab === 'details'" class="space-y-4">
          <dl class="grid grid-cols-1 gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-gray-500">Email</dt>
              <dd class="text-gray-900 break-all">{{ customer.email || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Primary Phone</dt>
              <dd class="text-gray-900">{{ customer.phone || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Alternative Phone</dt>
              <dd class="text-gray-900">{{ customer.alternative_phone || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Status</dt>
              <dd class="text-gray-900 capitalize">{{ customer.status || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Area</dt>
              <dd class="text-gray-900">{{ customer.area || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Full Address</dt>
              <dd class="text-gray-900">{{ customer.address || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">NIC</dt>
              <dd class="text-gray-900">{{ customer.nic || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Current Role</dt>
              <dd class="text-gray-900 capitalize">{{ customer.current_role || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Fee Amount</dt>
              <dd class="text-gray-900">{{ customer.customer?.fee_amount ?? '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Next Payment Date</dt>
              <dd class="text-gray-900">{{ customer.customer?.payment_date ? formatDate(customer.customer.payment_date) : '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Router Panel ID</dt>
              <dd class="text-gray-900">{{ customer.customer?.panel_id || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Router Panel Password</dt>
              <dd class="text-gray-900">{{ customer.customer?.panel_password || '-' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Subscriptions Tab -->
        <div v-if="activeTab === 'subscriptions'" class="space-y-4">
          <div v-if="loadingSubscriptions" class="py-8 text-center text-gray-500">
            <i class="fa-light fa-spinner fa-spin text-xl"></i>
          </div>
          <div v-else-if="subscriptions.length === 0" class="py-8 text-center text-gray-500">
            <p class="text-sm">No subscriptions found for this customer.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="sub in subscriptions"
              :key="sub.id"
              class="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="viewSubscription(sub.id)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ sub.package_snapshot?.name || sub.package?.name || 'Unknown Package' }}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">
                    <span class="capitalize">{{ sub.status }}</span>
                    <span v-if="sub.start_date" class="ml-2">• Started: {{ formatDate(sub.start_date) }}</span>
                  </div>
                  <div v-if="sub.package_snapshot?.sale_price || sub.package?.sale_price" class="text-sm font-medium text-gray-900 mt-1">
                    {{ formatCurrency(sub.package_snapshot?.sale_price || sub.package?.sale_price || 0) }}
                  </div>
                </div>
                <button
                  @click.stop="viewSubscription(sub.id)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Payments Tab -->
        <div v-if="activeTab === 'payments'" class="space-y-4">
          <div v-if="loadingPayments" class="py-8 text-center text-gray-500">
            <i class="fa-light fa-spinner fa-spin text-xl"></i>
          </div>
          <div v-else-if="payments.length === 0" class="py-8 text-center text-gray-500">
            <p class="text-sm">No payments found for this customer.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="payment in payments"
              :key="payment.id"
              class="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    Payment #{{ payment.id }}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">
                    <span class="capitalize">{{ payment.status || 'pending' }}</span>
                    <span v-if="payment.pay_date || payment.created_at" class="ml-2">
                      • {{ formatDate(payment.pay_date || payment.created_at) }}
                    </span>
                  </div>
                  <div class="text-sm font-medium text-gray-900 mt-1">
                    {{ formatCurrency(Number(payment.amount) || 0) }}
                  </div>
                </div>
                <button
                  @click="viewPayment(payment.id)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoices Tab -->
        <div v-if="activeTab === 'invoices'" class="space-y-4">
          <div v-if="loadingInvoices" class="py-8 text-center text-gray-500">
            <i class="fa-light fa-spinner fa-spin text-xl"></i>
          </div>
          <div v-else-if="invoices.length === 0" class="py-8 text-center text-gray-500">
            <p class="text-sm">No invoices found for this customer.</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="invoice in invoices"
              :key="invoice.id"
              class="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="viewInvoice(invoice.id)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ invoice.invoice_number || invoice.formatted_number || `Invoice #${invoice.id}` }}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">
                    <span class="capitalize">{{ invoice.status || 'draft' }}</span>
                    <span v-if="invoice.issue_date" class="ml-2">• {{ formatDate(invoice.issue_date) }}</span>
                  </div>
                  <div class="text-sm font-medium text-gray-900 mt-1">
                    {{ formatCurrency(invoice.total || 0) }}
                    <span v-if="invoice.amount_due > 0" class="text-rose-600 ml-2">
                      (Due: {{ formatCurrency(invoice.amount_due) }})
                    </span>
                  </div>
                </div>
                <button
                  @click.stop="viewInvoice(invoice.id)"
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="py-4 text-center text-sm text-gray-500">
      No customer data found.
    </div>
  </Dialog>
</template>
