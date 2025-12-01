<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import MasterLayout from '../../layouts/MasterLayout.vue';
import IndexPageSkeleton from '../../components/IndexPageSkeleton.vue';
import axiosClient from '../../axios';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';
import { useToast } from 'primevue/usetoast';
import AddInvoice from './AddInvoice.vue';
import ShowInvoice from './Show.vue';
import SendInvoiceModal from '../../components/SendInvoiceModal.vue';

const router = useRouter();
const toast = useToast();
const generalSettingsStore = useGeneralSettingsStore();
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit || 'PKR');

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';

interface Invoice {
  id: number;
  invoice_number: string;
  customer: {
    id: number;
    name: string;
    email?: string;
  };
  total: number;
  amount_due: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  is_overdue: boolean;
  can_be_sent: boolean;
  can_be_paid: boolean;
}

const invoices = ref<Invoice[]>([]);
const loading = ref<boolean>(true);
const statistics = ref({
  total: 0,
  draft: 0,
  sent: 0,
  paid: 0,
  overdue: 0,
  total_amount: 0,
  paid_amount: 0,
  unpaid_amount: 0,
});

const searchQuery = ref<string>('');
const statusFilter = ref<InvoiceStatus | 'all'>('all');
const page = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// Action states
const sendingInvoice = ref<number | null>(null);
const markingPaid = ref<number | null>(null);
const showAddInvoiceDialog = ref(false);
const showInvoiceModal = ref(false);
const selectedInvoiceId = ref<number | null>(null);
const showSendInvoiceModal = ref(false);
const invoiceToSend = ref<Invoice | null>(null);

const formatCurrency = (amount: number, currency?: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || tenantCurrency.value,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || tenantCurrency.value}`;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
};

const filteredInvoices = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const status = statusFilter.value;
  return invoices.value.filter((inv) => {
    const matchesQuery =
      q.length === 0 ||
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q);
    const matchesStatus = status === 'all' ? true : inv.status === status;
    return matchesQuery && matchesStatus;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredInvoices.value.length / pageSize.value)));
const paginatedInvoices = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredInvoices.value.slice(start, start + pageSize.value);
});

const statusClasses = (status: InvoiceStatus) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
    case 'sent':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
    case 'partial':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
    case 'overdue':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
    case 'cancelled':
      return 'bg-gray-50 text-gray-500 ring-1 ring-gray-400/20';
    default:
      return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
  }
};

const statusDotClass = (status: InvoiceStatus) => {
  switch (status) {
    case 'draft': return 'bg-gray-500';
    case 'sent': return 'bg-blue-500';
    case 'paid': return 'bg-emerald-500';
    case 'partial': return 'bg-amber-500';
    case 'overdue': return 'bg-rose-500';
    case 'cancelled': return 'bg-gray-400';
    default: return 'bg-gray-500';
  }
};

const fetchInvoices = async () => {
  loading.value = true;
  try {
    const res = await axiosClient.get('/invoices');
    let raw: any[] = [];
    if (Array.isArray(res?.data?.data)) {
      raw = res.data.data;
    } else if (res?.data?.data?.data && Array.isArray(res.data.data.data)) {
      raw = res.data.data.data; // Paginated response
    } else if (Array.isArray(res?.data)) {
      raw = res.data;
    }

    // Use a new array to avoid Vue reactivity issues
    const newInvoices = raw.map((item) => ({
      id: item.id,
      invoice_number: item.invoice_number || item.formatted_number,
      customer: {
        id: item.customer?.id || item.customer_id,
        name: item.customer?.name || 'Unknown',
        email: item.customer?.email,
      },
      total: parseFloat(item.total) || 0,
      amount_due: parseFloat(item.amount_due) || 0,
      currency: item.currency || tenantCurrency.value,
      status: item.status || 'draft',
      issue_date: item.issue_date,
      due_date: item.due_date,
      is_overdue: item.is_overdue || false,
      can_be_sent: item.can_be_sent || false,
      can_be_paid: item.can_be_paid || false,
    }));

    invoices.value = newInvoices;
    totalItems.value = res.data?.meta?.total || res.data?.data?.total || newInvoices.length;
  } catch (err) {
    console.error('Error fetching invoices:', err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load invoices', life: 3000 });
    invoices.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchStatistics = async () => {
  try {
    const res = await axiosClient.get('/invoices-statistics');
    if (res?.data?.data) {
      statistics.value = res.data.data;
    }
  } catch (err) {
    console.error('Error fetching statistics:', err);
  }
};

const openSendInvoiceModal = (invoice: Invoice) => {
  if (!invoice.can_be_sent) return;
  invoiceToSend.value = invoice;
  showSendInvoiceModal.value = true;
};

const handleInvoiceSent = async () => {
  showSendInvoiceModal.value = false;
  invoiceToSend.value = null;
  await fetchInvoices();
  await fetchStatistics();
};

const markAsPaid = async (invoice: Invoice) => {
  if (!invoice.can_be_paid) return;
  
  markingPaid.value = invoice.id;
  try {
    await axiosClient.post(`/invoices/${invoice.id}/mark-paid`);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Invoice marked as paid', life: 3000 });
    await fetchInvoices();
    await fetchStatistics();
  } catch (err: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.response?.data?.message || 'Failed to mark invoice as paid', 
      life: 3000 
    });
  } finally {
    markingPaid.value = null;
  }
};

const downloadPdf = async (invoice: Invoice) => {
  try {
    const response = await axiosClient.get(`/invoices/${invoice.id}/pdf`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoice_number}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to download PDF', life: 3000 });
  }
};

const viewInvoice = (invoice: Invoice) => {
  selectedInvoiceId.value = invoice.id;
  showInvoiceModal.value = true;
};

const handleInvoiceModalClose = () => {
  showInvoiceModal.value = false;
  selectedInvoiceId.value = null;
};

const handleInvoiceDuplicated = async (duplicatedInvoice: any) => {
  showInvoiceModal.value = false;
  selectedInvoiceId.value = duplicatedInvoice.id;
  await Promise.all([fetchInvoices(), fetchStatistics()]);
  showInvoiceModal.value = true;
};

const createInvoice = () => {
  showAddInvoiceDialog.value = true;
};

const handleInvoiceCreated = async () => {
  try {
    await Promise.all([fetchInvoices(), fetchStatistics()]);
  } catch (error) {
    console.error('Error refreshing invoices after creation:', error);
  }
};

const openCustomerModal = (customerId: number) => {
  router.push({ name: 'Customers.Index', query: { show: customerId } });
};

onMounted(async () => {
  await generalSettingsStore.fetchSettings();
  await Promise.all([fetchInvoices(), fetchStatistics()]);
});
</script>

<template>
  <MasterLayout>
    <IndexPageSkeleton v-if="loading" />
    <template v-if="!loading">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Invoices</h1>
          <p class="text-sm text-gray-500">Create, manage, and track customer invoices</p>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="createInvoice" 
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <i class="fa-light fa-plus"></i>
            Create Invoice
          </button>
          <button 
            @click="fetchInvoices" 
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <i class="fa-light fa-arrow-rotate-right"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Invoices</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.total }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <i class="fa-light fa-file-invoice text-lg"></i>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Paid</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.paid }}</p>
              <p class="text-xs text-emerald-600 mt-1">{{ formatCurrency(statistics.paid_amount) }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <i class="fa-light fa-circle-check text-lg"></i>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Unpaid</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.sent + statistics.draft }}</p>
              <p class="text-xs text-amber-600 mt-1">{{ formatCurrency(statistics.unpaid_amount) }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <i class="fa-light fa-clock text-lg"></i>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Overdue</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.overdue }}</p>
            </div>
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <i class="fa-light fa-triangle-exclamation text-lg"></i>
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
                placeholder="Search by invoice number or customer..."
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
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div v-if="!invoices.length" class="flex flex-col items-center justify-center p-10 text-center">
          <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <i class="fa-light fa-file-invoice text-2xl text-gray-400"></i>
          </div>
          <h3 class="text-sm font-semibold text-gray-900">No invoices yet</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
          <button 
            @click="createInvoice"
            class="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <i class="fa-light fa-plus"></i>
            Create Invoice
          </button>
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Issue Date</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</th>
                  <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr 
                  v-for="invoice in paginatedInvoices" 
                  :key="invoice.id" 
                  class="hover:bg-gray-50 cursor-pointer"
                  @click="viewInvoice(invoice)"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-indigo-600">{{ invoice.invoice_number }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ invoice.customer?.name }}</div>
                    <div v-if="invoice.customer?.email" class="text-xs text-gray-500">{{ invoice.customer?.email }}</div>
                    <button 
                      v-if="invoice.customer?.id"
                      @click.stop="openCustomerModal(invoice.customer.id)"
                      class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <i class="fa-light fa-user"></i> View Customer
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm font-semibold text-gray-900">{{ formatCurrency(invoice.total, invoice.currency) }}</div>
                    <div v-if="invoice.amount_due > 0 && invoice.status !== 'paid'" class="text-xs text-rose-600">
                      Due: {{ formatCurrency(invoice.amount_due, invoice.currency) }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span 
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" 
                      :class="statusClasses(invoice.status)"
                    >
                      <span class="inline-block h-1.5 w-1.5 rounded-full" :class="statusDotClass(invoice.status)"></span>
                      {{ invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ formatDate(invoice.issue_date) }}</td>
                  <td class="px-4 py-3">
                    <span 
                      class="text-sm" 
                      :class="invoice.is_overdue ? 'text-rose-600 font-medium' : 'text-gray-700'"
                    >
                      {{ formatDate(invoice.due_date) }}
                      <span v-if="invoice.is_overdue" class="ml-1 text-xs">(Overdue)</span>
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right" @click.stop>
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        v-if="invoice.can_be_sent"
                        @click="openSendInvoiceModal(invoice)"
                        :disabled="sendingInvoice === invoice.id"
                        class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                        title="Send Invoice"
                      >
                        <i class="fa-light fa-paper-plane"></i>
                        <span v-if="sendingInvoice === invoice.id">Sending...</span>
                        <span v-else>Send</span>
                      </button>
                      <button 
                        v-if="invoice.can_be_paid"
                        @click="markAsPaid(invoice)"
                        :disabled="markingPaid === invoice.id"
                        class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        title="Mark as Paid"
                      >
                        <i class="fa-light fa-check"></i>
                        <span v-if="markingPaid === invoice.id">...</span>
                        <span v-else>Paid</span>
                      </button>
                      <button 
                        @click="downloadPdf(invoice)"
                        class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Download PDF"
                      >
                        <i class="fa-light fa-download"></i>
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div class="text-sm text-gray-500">
              Page {{ page }} of {{ totalPages }} — {{ filteredInvoices.length }} invoices
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

    <!-- Add Invoice Dialog -->
    <AddInvoice 
      :visible="showAddInvoiceDialog" 
      @update:visible="(v: boolean) => showAddInvoiceDialog = v"
      @created="handleInvoiceCreated"
    />
    <ShowInvoice
      v-if="selectedInvoiceId"
      :visible="showInvoiceModal"
      :invoice-id="selectedInvoiceId"
      @update:visible="handleInvoiceModalClose"
      @duplicated="handleInvoiceDuplicated"
    />
    <SendInvoiceModal
      v-if="invoiceToSend !== null"
      :visible="showSendInvoiceModal"
      :invoice-id="invoiceToSend!.id"
      @update:visible="(v: boolean) => { 
        showSendInvoiceModal = v; 
        if (!v) {
          invoiceToSend = null;
        }
      }"
      @sent="handleInvoiceSent"
    />
  </MasterLayout>
</template>

