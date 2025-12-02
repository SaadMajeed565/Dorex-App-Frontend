<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import AddPayment from './AddPayment.vue';
import ImportDialog from '../../components/ImportDialog.vue';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';
import { useToast } from 'primevue/usetoast';
import ShowInvoice from '../Invoices/Show.vue';
import { formatCurrencyCents, formatCurrencyCentsFull } from '../../utils/formatCurrency';

const router = useRouter();
const toast = useToast();

const generalSettingsStore = useGeneralSettingsStore();
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit);

const showAddPayment = ref(false);
const showImportDialog = ref(false);
const addPaymentRef = ref();

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

interface Payment {
  id: string;
  customer: string;
  customer_id?: number;
  subscription_id?: number;
  account_id?: number;
  account?: {
    id: number;
    account_number?: string;
    employee?: {
      name?: string;
      email?: string;
      designation?: string;
    };
  };
  employee_id?: number;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string; // ISO string
  invoice?: {
    id: number;
    invoice_number: string;
    formatted_number?: string;
    status: string;
    status_label?: string;
    total: number;
    currency: string;
    issue_date?: string;
    due_date?: string;
  };
  invoice_id?: number;
}

const payments = ref<Payment[]>([]);
const loading = ref<boolean>(true);

const searchQuery = ref<string>('');
const statusFilter = ref<PaymentStatus | 'all'>('all');
const page = ref(1);
const pageSize = ref(10);

const formatDate = (iso: string) => {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return iso;
  }
};

const filteredPayments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const status = statusFilter.value;
  return payments.value.filter((p) => {
    const matchesQuery =
      q.length === 0 ||
      p.id.toLowerCase().includes(q) ||
      p.customer.toLowerCase().includes(q);
    const matchesStatus = status === 'all' ? true : p.status === status;
    return matchesQuery && matchesStatus;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPayments.value.length / pageSize.value)));
const paginatedPayments = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredPayments.value.slice(start, start + pageSize.value);
});

const statusClasses = (status: PaymentStatus) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
    case 'failed':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
    case 'refunded':
      return 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20';
  }
};

const copyToClipboard = async (text: string) => {
  try {
    const navAny = navigator as unknown as { clipboard?: { writeText: (t: string) => Promise<void> } };
    if (typeof window !== 'undefined' && navAny.clipboard && typeof navAny.clipboard.writeText === 'function') {
      await navAny.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch (e) {
    // Swallow clipboard errors; UI has no toast system yet
    console.error('Failed to copy', e);
  }
};

// Generate invoice from payment
const generatingInvoice = ref<string | null>(null);
const showInvoiceModal = ref(false);
const createdInvoice = ref<any>(null);

const generateInvoice = async (paymentId: string) => {
  generatingInvoice.value = paymentId;
  try {
    const response = await axiosClient.post('/invoices-from-payment', {
      payment_id: paymentId,
    });
    
    createdInvoice.value = response.data?.data || response.data;
    showInvoiceModal.value = true;
    
    toast.add({
      severity: 'success',
      summary: 'Invoice Generated',
      detail: 'Invoice created successfully.',
      life: 3000,
    });
    
    // Refresh payments list
    await fetchPayments();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to generate invoice',
      life: 4000,
    });
  } finally {
    generatingInvoice.value = null;
  }
};

const handleInvoiceModalClose = () => {
  showInvoiceModal.value = false;
  createdInvoice.value = null;
};

const openCustomerModal = (customerId: number) => {
  router.push({ name: 'Customers.Index', query: { show: customerId } });
};

const viewInvoice = (invoiceId: number) => {
  router.push({ name: 'Invoices.Index', query: { show: invoiceId } });
};

const openSubscriptionModal = (subscriptionId: number) => {
  router.push({ name: 'Subscriptions.Index', query: { show: subscriptionId } });
};


const totalPayments = computed(() => payments.value.length);
const totalAmountCents = computed(() => payments.value.reduce((sum, p) => sum + p.amountCents, 0));
const totalPaid = computed(() => payments.value.filter((p) => p.status === 'paid').length);
const totalPending = computed(() => payments.value.filter((p) => p.status === 'pending').length);

// Fetch payments from API
function normalizeStatus(status?: string): PaymentStatus {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'succeeded' || s === 'success') return 'paid';
  if (s === 'pending' || s === 'processing') return 'pending';
  if (s === 'failed' || s === 'declined' || s === 'error') return 'failed';
  if (s === 'refunded' || s === 'refund') return 'refunded';
  return 'pending';
}

const fetchPayments = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/payments');
    let raw: any = [];
    if (Array.isArray(res?.data)) raw = res.data;
    else if (Array.isArray(res?.data?.data)) raw = res.data.data;
    else if (Array.isArray(res?.data?.payments)) raw = res.data.payments;
    else raw = [];

    payments.value = (raw as any[]).map((item) => {
      const amount = item?.amount ?? item?.amountCents ?? item?.amount ?? 0;
      const currency = item?.currency ?? tenantCurrency.value;
      const customerName = item?.customer_name ?? item?.customerName ?? item?.customer?.name ?? (typeof item?.customer === 'string' ? item?.customer : '—');
      const created = item?.created_at ?? item?.createdAt ?? item?.date ?? new Date().toISOString();
      const id = String(item?.id ?? item?.payment_id ?? item?.reference ?? Math.random().toString(36).slice(2));
      return {
        id,
        customer: String(customerName),
        customer_id: item?.customer_id ?? item?.customer?.id,
        subscription_id: item?.subscription_id ?? item?.subscription?.id,
        account_id: item?.account_id ?? item?.account?.id,
        account: item?.account ? {
          id: item.account.id,
          account_number: item.account.account_number,
          employee: item.account.employee ? {
            name: item.account.employee.name,
            email: item.account.employee.email,
            designation: item.account.employee.designation,
          } : undefined,
        } : undefined,
        employee_id: item?.employee_id ?? item?.employee?.id,
        amountCents: typeof amount === 'number' ? Math.round(amount) : Number(amount) * (Number(amount) < 1000 ? 100 : 1),
        currency: String(currency).toUpperCase(),
        status: normalizeStatus(item?.status),
        createdAt: String(created),
        invoice: item?.invoice ? {
          id: item.invoice.id,
          invoice_number: item.invoice.invoice_number,
          formatted_number: item.invoice.formatted_number,
          status: item.invoice.status,
          status_label: item.invoice.status_label,
          total: item.invoice.total,
          currency: item.invoice.currency,
          issue_date: item.invoice.issue_date,
          due_date: item.invoice.due_date,
        } : undefined,
        invoice_id: item?.invoice_id ?? item?.invoice?.id,
      } as Payment;
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    payments.value = [];
  } finally {
    loading.value = false;
  }
};

const handlePaymentCreated = (newPayment: any) => {
  // Extract payment data from response - API may return payment object directly or nested
  const paymentData = newPayment?.payment ?? newPayment?.data ?? newPayment
  
  const amount = paymentData?.amount ?? paymentData?.amountCents ?? paymentData?.amount ?? 0;
  const currency = paymentData?.currency ?? newPayment?.currency ?? tenantCurrency.value;
  const customerName = paymentData?.customer_name ?? paymentData?.customerName ?? paymentData?.customer?.name ?? newPayment?.customer_name ?? newPayment?.customer?.name ?? (typeof paymentData?.customer === 'string' ? paymentData?.customer : (typeof newPayment?.customer === 'string' ? newPayment?.customer : '—'));
  const created = paymentData?.created_at ?? paymentData?.createdAt ?? paymentData?.payment_date ?? newPayment?.created_at ?? new Date().toISOString();
  const id = String(paymentData?.id ?? paymentData?.payment_id ?? newPayment?.id ?? Math.random().toString(36).slice(2));
  
  // Convert amount to cents if needed (handle both cents and dollars)
  let amountCents: number
  if (typeof amount === 'number') {
    // If amount is less than 1000, it's likely already in cents, otherwise it's dollars
    amountCents = amount < 1000 && amount > 0 ? Math.round(amount) : Math.round(amount * 100)
  } else {
    const numAmount = Number(amount)
    amountCents = numAmount < 1000 && numAmount > 0 ? Math.round(numAmount) : Math.round(numAmount * 100)
  }
  
  payments.value.unshift({
    id,
    customer: String(customerName),
    amountCents,
    currency: String(currency).toUpperCase(),
    status: normalizeStatus(paymentData?.status ?? newPayment?.status),
    createdAt: String(created),
  } as Payment);
  
  // Refresh the list silently to ensure consistency with server (without showing loading state)
  const refreshSilently = async () => {
    try {
      const res = await axiosClient.get('/payments');
      let raw: any = [];
      if (Array.isArray(res?.data)) raw = res.data;
      else if (Array.isArray(res?.data?.data)) raw = res.data.data;
      else if (Array.isArray(res?.data?.payments)) raw = res.data.payments;
      else raw = [];

      payments.value = (raw as any[]).map((item) => {
        const amount = item?.amount ?? item?.amountCents ?? item?.amount ?? 0;
        const currency = item?.currency ?? tenantCurrency.value;
        const customerName = item?.customer_name ?? item?.customerName ?? item?.customer?.name ?? (typeof item?.customer === 'string' ? item?.customer : '—');
        const created = item?.created_at ?? item?.createdAt ?? item?.date ?? new Date().toISOString();
        const id = String(item?.id ?? item?.payment_id ?? item?.reference ?? Math.random().toString(36).slice(2));
        return {
          id,
          customer: String(customerName),
          customer_id: item?.customer_id ?? item?.customer?.id,
          subscription_id: item?.subscription_id ?? item?.subscription?.id,
          account_id: item?.account_id ?? item?.account?.id,
          account: item?.account ? {
            id: item.account.id,
            account_number: item.account.account_number,
            employee: item.account.employee ? {
              name: item.account.employee.name,
              email: item.account.employee.email,
              designation: item.account.employee.designation,
            } : undefined,
          } : undefined,
          employee_id: item?.employee_id ?? item?.employee?.id,
          amountCents: typeof amount === 'number' ? Math.round(amount) : Number(amount) * (Number(amount) < 1000 ? 100 : 1),
          currency: String(currency).toUpperCase(),
          status: normalizeStatus(item?.status),
          createdAt: String(created),
          invoice: item?.invoice ? {
            id: item.invoice.id,
            invoice_number: item.invoice.invoice_number,
            formatted_number: item.invoice.formatted_number,
            status: item.invoice.status,
            status_label: item.invoice.status_label,
            total: item.invoice.total,
            currency: item.invoice.currency,
            issue_date: item.invoice.issue_date,
            due_date: item.invoice.due_date,
          } : undefined,
          invoice_id: item?.invoice_id ?? item?.invoice?.id,
        } as Payment;
      });
    } catch (err) {
      console.error('Error refreshing payments:', err);
    }
  };
  
  refreshSilently();
};

onMounted(async () => {
  await generalSettingsStore.fetchSettings();
  fetchPayments();
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-else>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Payments</h1>
        <p class="text-sm text-gray-500">Track transactions and statuses</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="showAddPayment = true" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          <i class="fa-light fa-plus"></i>
          Add Payment
        </button>
        <button @click="fetchPayments" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-arrow-rotate-right"></i>
          Refresh
        </button>
        <button @click="showImportDialog = true" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <i class="fa-light fa-file-import"></i>
          Import
        </button>
        <!-- <button class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <i class="fa-light fa-arrow-down-to-line"></i>
          Export
        </button> -->
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Payments</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalPayments }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <i class="fa-light fa-receipt text-lg"></i>
          </div>
        </div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Paid</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalPaid }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <i class="fa-light fa-circle-check text-lg"></i>
          </div>
        </div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Pending</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalPending }}</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <i class="fa-light fa-clock text-lg"></i>
          </div>
        </div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Volume</p>
            <p 
              class="text-2xl font-bold text-gray-900 cursor-help" 
              :title="formatCurrencyCentsFull(totalAmountCents, payments.length > 0 ? payments[0].currency : tenantCurrency)"
            >
              {{ formatCurrencyCents(totalAmountCents, payments.length > 0 ? payments[0].currency : tenantCurrency) }}
            </p>
            <p v-if="payments.length > 0 && payments.some(p => p.currency !== (payments[0]?.currency || tenantCurrency))" class="text-xs text-gray-400 mt-1">Multiple currencies</p>
          </div>
          <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <i class="fa-light fa-dollar-sign text-lg"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search payments, customers, IDs..."
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <i class="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="statusFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div v-if="!payments.length" class="flex items-center justify-center p-10 text-center">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">No payments yet</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by adding your first payment.</p>
        </div>
      </div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Payment ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Collector</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="payment in paginatedPayments" :key="payment.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ payment.id }}</td>
                <td class="px-4 py-3">
                  <div class="text-sm text-gray-900">{{ payment.customer }}</div>
                  <div v-if="payment.customer_id" class="flex items-center gap-2 mt-1">
                    <button 
                      @click.stop="openCustomerModal(payment.customer_id!)"
                      class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <i class="fa-light fa-user"></i> View Customer
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div v-if="payment.account?.employee?.name" class="text-sm text-gray-900">
                    {{ payment.account.employee.name }}
                  </div>
                  <div v-else-if="payment.employee_id" class="text-sm text-gray-500 italic">
                    Employee #{{ payment.employee_id }}
                  </div>
                  <div v-else class="text-sm text-gray-400 italic">
                    —
                  </div>
                  <div v-if="payment.account?.account_number" class="text-xs text-gray-500 mt-0.5">
                    Account #{{ payment.account.account_number }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  <span 
                    class="cursor-help" 
                    :title="formatCurrencyCentsFull(payment.amountCents, payment.currency)"
                  >
                    {{ formatCurrencyCents(payment.amountCents, payment.currency) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium" :class="statusClasses(payment.status)">
                    <span
                      class="inline-block h-1.5 w-1.5 rounded-full"
                      :class="{
                        'bg-emerald-600': payment.status === 'paid',
                        'bg-amber-600': payment.status === 'pending',
                        'bg-rose-600': payment.status === 'failed',
                        'bg-sky-600': payment.status === 'refunded',
                      }"
                    ></span>
                    {{ payment.status.charAt(0).toUpperCase() + payment.status.slice(1) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(payment.createdAt) }}</td>
                <td class="px-4 py-3">
                  <div v-if="payment.invoice" class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <i class="fa-light fa-file-invoice text-indigo-600"></i>
                      <button 
                        @click.stop="viewInvoice(payment.invoice!.id)"
                        class="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {{ payment.invoice.invoice_number || payment.invoice.formatted_number || `#${payment.invoice.id}` }}
                      </button>
                    </div>
                    <span 
                      :class="[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        payment.invoice.status === 'paid' ? 'bg-green-50 text-green-700' :
                        payment.invoice.status === 'sent' ? 'bg-blue-50 text-blue-700' :
                        payment.invoice.status === 'overdue' ? 'bg-red-50 text-red-700' :
                        payment.invoice.status === 'draft' ? 'bg-gray-50 text-gray-700' :
                        'bg-yellow-50 text-yellow-700'
                      ]"
                    >
                      {{ payment.invoice.status_label || payment.invoice.status }}
                    </span>
                  </div>
                  <div v-else class="flex items-center justify-end gap-2">
                    <button 
                      @click="generateInvoice(payment.id)"
                      :disabled="generatingInvoice === payment.id"
                      class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                      title="Generate Invoice"
                    >
                      <i class="fa-light fa-file-invoice text-sm"></i>
                      <span v-if="generatingInvoice === payment.id">...</span>
                      <span v-else>Generate</span>
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3 text-right text-sm">
                  <div class="flex items-center justify-end gap-2">
                    <span v-if="payment.subscription_id" class="text-gray-300">|</span>
                    <button 
                      v-if="payment.subscription_id"
                      @click.stop="openSubscriptionModal(payment.subscription_id!)"
                      class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500"
                      title="View Subscription"
                    >
                      <i class="fa-light fa-list-check text-sm"></i>
                      Subscription
                    </button>
                    <span class="text-gray-300">|</span>
                    <button class="text-gray-600 hover:text-gray-800" @click="() => copyToClipboard(payment.id)">Copy ID</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div class="text-sm text-gray-500">
            Page {{ page }} of {{ totalPages }} — {{ filteredPayments.length }} results
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              :disabled="page <= 1"
              @click="page = Math.max(1, page - 1)"
            >
              Previous
            </button>
            <button
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              :disabled="page >= totalPages"
              @click="page = Math.min(totalPages, page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
    </template>
    <AddPayment ref="addPaymentRef" v-model:visible="showAddPayment" @created="(data: any) => handlePaymentCreated(data)" />
    <ImportDialog v-model="showImportDialog" module="payments" @imported="fetchPayments" />

    <!-- Invoice View Modal -->
    <ShowInvoice
      v-if="createdInvoice"
      :visible="showInvoiceModal"
      :invoice-data="createdInvoice"
      @update:visible="handleInvoiceModalClose"
    />

  </MasterLayout>
</template>

