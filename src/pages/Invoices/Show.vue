<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from '../../volt/Dialog.vue';
import Button from '../../volt/Button.vue';
import SendInvoiceModal from '../../components/SendInvoiceModal.vue';
import axiosClient from '../../axios';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';
import { useToast } from 'primevue/usetoast';

const router = useRouter();

const props = defineProps<{
  visible: boolean;
  invoiceId?: number;
  invoiceData?: any;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'duplicated': [invoice: any];
}>();

const toast = useToast();
const generalSettingsStore = useGeneralSettingsStore();

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  subscription?: {
    id: number;
    package_name: string;
    status: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  discount_type?: string;
  total: number;
  amount_due: number;
  currency: string;
  status: string;
  status_label: string;
  status_color: string;
  issue_date: string;
  due_date: string;
  sent_at?: string;
  paid_at?: string;
  notes?: string;
  terms?: string;
  is_draft: boolean;
  is_sent: boolean;
  is_paid: boolean;
  is_overdue: boolean;
  is_cancelled: boolean;
  can_be_edited: boolean;
  can_be_sent: boolean;
  can_be_paid: boolean;
  creator?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

const invoice = ref<Invoice | null>(null);
const loading = ref(true);
const markingPaid = ref(false);
const cancelling = ref(false);
const duplicating = ref(false);
const showSendInvoiceModal = ref(false);

const formatCurrency = (amount: number, currency?: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || invoice.value?.currency || 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount?.toFixed(2)} ${currency || invoice.value?.currency}`;
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
};

const statusClasses = computed(() => {
  const status = invoice.value?.status;
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700';
    case 'sent':
      return 'bg-blue-100 text-blue-700';
    case 'paid':
      return 'bg-emerald-100 text-emerald-700';
    case 'partial':
      return 'bg-amber-100 text-amber-700';
    case 'overdue':
      return 'bg-rose-100 text-rose-700';
    case 'cancelled':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-700';
  }
});

const fetchInvoice = async () => {
  if (props.invoiceData) {
    invoice.value = props.invoiceData;
    loading.value = false;
    return;
  }
  
  if (!props.invoiceId) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const res = await axiosClient.get(`/invoices/${props.invoiceId}`);
    invoice.value = res.data?.data || res.data;
  } catch (err) {
    console.error('Error fetching invoice:', err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load invoice', life: 3000 });
    emit('update:visible', false);
  } finally {
    loading.value = false;
  }
};

const sendInvoice = () => {
  if (!invoice.value?.can_be_sent) return;
  showSendInvoiceModal.value = true;
};

const handleInvoiceSent = async () => {
  await fetchInvoice();
};

const markAsPaid = async () => {
  if (!invoice.value?.can_be_paid) return;
  
  markingPaid.value = true;
  try {
    await axiosClient.post(`/invoices/${invoice.value.id}/mark-paid`);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Invoice marked as paid', life: 3000 });
    await fetchInvoice();
  } catch (err: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.response?.data?.message || 'Failed to mark invoice as paid', 
      life: 3000 
    });
  } finally {
    markingPaid.value = false;
  }
};

const cancelInvoice = async () => {
  if (invoice.value?.is_paid) return;
  
  if (!confirm('Are you sure you want to cancel this invoice?')) return;
  
  cancelling.value = true;
  try {
    await axiosClient.post(`/invoices/${invoice.value?.id}/cancel`);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Invoice cancelled', life: 3000 });
    await fetchInvoice();
  } catch (err: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.response?.data?.message || 'Failed to cancel invoice', 
      life: 3000 
    });
  } finally {
    cancelling.value = false;
  }
};

const duplicateInvoice = async () => {
  duplicating.value = true;
  try {
    const res = await axiosClient.post(`/invoices/${invoice.value?.id}/duplicate`);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Invoice duplicated', life: 3000 });
    // Emit event to parent to handle navigation or modal update
    emit('duplicated', res.data?.data);
  } catch (err: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.response?.data?.message || 'Failed to duplicate invoice', 
      life: 3000 
    });
  } finally {
    duplicating.value = false;
  }
};

const downloadPdf = async () => {
  try {
    const response = await axiosClient.get(`/invoices/${invoice.value?.id}/pdf`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.value?.invoice_number}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to download PDF', life: 3000 });
  }
};

const previewPdf = async () => {
  try {
    const response = await axiosClient.get(`/invoices/${invoice.value?.id}/preview`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to preview PDF', life: 3000 });
  }
};

const handleClose = () => {
  emit('update:visible', false);
};

const openCustomerModal = (customerId: number) => {
  router.push({ name: 'Customers.Index', query: { show: customerId } });
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchInvoice();
  }
}, { immediate: true });

watch(() => props.invoiceData, () => {
  if (props.visible) {
    fetchInvoice();
  }
}, { deep: true });

onMounted(async () => {
  await generalSettingsStore.fetchSettings();
  if (props.visible) {
    await fetchInvoice();
  }
});
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    :header="invoice ? `Invoice ${invoice.invoice_number}` : 'Invoice Details'"
    :closable="true"
    :breakpoints="{ '960px': '95vw', '640px': '98vw' }"
    :style="{ width: '1200px', maxWidth: '98vw', maxHeight: '90vh' }"
  >
    <!-- Loading State -->
    <div v-if="loading" class="py-8 text-center text-gray-500">
      <i class="fa-light fa-spinner fa-spin text-2xl"></i>
    </div>

    <div v-else-if="invoice" class="space-y-6 py-4">
        <!-- Header -->
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ invoice.invoice_number }}</h1>
              <span 
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                :class="statusClasses"
              >
                {{ invoice.status_label }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Created {{ formatDateTime(invoice.created_at) }}
              <span v-if="invoice.creator"> by {{ invoice.creator.name }}</span>
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Invoice Details Card -->
          <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <!-- Invoice Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-xl font-bold">INVOICE</h2>
                  <p class="text-indigo-200 mt-1">{{ invoice.invoice_number }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-indigo-200">Issue Date</p>
                  <p class="font-semibold">{{ formatDate(invoice.issue_date) }}</p>
                  <p class="text-sm text-indigo-200 mt-2">Due Date</p>
                  <p class="font-semibold" :class="{ 'text-rose-300': invoice.is_overdue }">
                    {{ formatDate(invoice.due_date) }}
                    <span v-if="invoice.is_overdue" class="text-xs ml-1">(Overdue)</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Bill To -->
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill To</h3>
                <button 
                  v-if="invoice.customer?.id"
                  @click="openCustomerModal(invoice.customer.id)"
                  class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                >
                  <i class="fa-light fa-user"></i> View Customer
                </button>
              </div>
              <p class="text-lg font-semibold text-gray-900">{{ invoice.customer?.name }}</p>
              <p v-if="invoice.customer?.email" class="text-sm text-gray-600">{{ invoice.customer?.email }}</p>
              <p v-if="invoice.customer?.phone" class="text-sm text-gray-600">{{ invoice.customer?.phone }}</p>
              <p v-if="invoice.customer?.address" class="text-sm text-gray-600 mt-1">{{ invoice.customer?.address }}</p>
            </div>

            <!-- Items Table -->
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(item, index) in invoice.items" :key="index">
                    <td class="px-6 py-4 text-sm text-gray-900">{{ item.description }}</td>
                    <td class="px-6 py-4 text-sm text-gray-700 text-right">{{ item.quantity }}</td>
                    <td class="px-6 py-4 text-sm text-gray-700 text-right">{{ formatCurrency(item.unit_price) }}</td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">{{ formatCurrency(item.total || (item.quantity * item.unit_price)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="p-6 bg-gray-50">
              <div class="max-w-xs ml-auto space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Subtotal</span>
                  <span class="font-medium text-gray-900">{{ formatCurrency(invoice.subtotal) }}</span>
                </div>
                <div v-if="invoice.tax_rate > 0" class="flex justify-between text-sm">
                  <span class="text-gray-600">Tax ({{ invoice.tax_rate }}%)</span>
                  <span class="font-medium text-gray-900">{{ formatCurrency(invoice.tax_amount) }}</span>
                </div>
                <div v-if="invoice.discount_amount > 0" class="flex justify-between text-sm">
                  <span class="text-gray-600">Discount</span>
                  <span class="font-medium text-rose-600">-{{ formatCurrency(invoice.discount_amount) }}</span>
                </div>
                <div class="flex justify-between text-base pt-2 border-t border-gray-200">
                  <span class="font-semibold text-gray-900">Total</span>
                  <span class="font-bold text-indigo-600 text-lg">{{ formatCurrency(invoice.total) }}</span>
                </div>
                <div v-if="!invoice.is_paid && invoice.amount_due > 0" class="flex justify-between text-base pt-2 border-t border-gray-200">
                  <span class="font-semibold text-rose-600">Amount Due</span>
                  <span class="font-bold text-rose-600 text-lg">{{ formatCurrency(invoice.amount_due) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes & Terms -->
          <div v-if="invoice.notes || invoice.terms" class="rounded-xl border border-gray-200 bg-white p-6">
            <div v-if="invoice.notes" class="mb-4">
              <h3 class="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ invoice.notes }}</p>
            </div>
            <div v-if="invoice.terms">
              <h3 class="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
              <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ invoice.terms }}</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status Card -->
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Invoice Status</h3>
            
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div 
                  class="h-10 w-10 rounded-full flex items-center justify-center"
                  :class="{
                    'bg-gray-100 text-gray-600': invoice.is_draft,
                    'bg-blue-100 text-blue-600': invoice.is_sent && !invoice.is_paid && !invoice.is_overdue,
                    'bg-emerald-100 text-emerald-600': invoice.is_paid,
                    'bg-rose-100 text-rose-600': invoice.is_overdue,
                    'bg-gray-100 text-gray-400': invoice.is_cancelled,
                  }"
                >
                  <i 
                    class="fa-light text-lg"
                    :class="{
                      'fa-file-pen': invoice.is_draft,
                      'fa-paper-plane': invoice.is_sent && !invoice.is_paid && !invoice.is_overdue,
                      'fa-circle-check': invoice.is_paid,
                      'fa-triangle-exclamation': invoice.is_overdue,
                      'fa-ban': invoice.is_cancelled,
                    }"
                  ></i>
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ invoice.status_label }}</p>
                  <p v-if="invoice.sent_at" class="text-xs text-gray-500">Sent {{ formatDateTime(invoice.sent_at) }}</p>
                  <p v-if="invoice.paid_at" class="text-xs text-gray-500">Paid {{ formatDateTime(invoice.paid_at) }}</p>
                </div>
              </div>

              <!-- Amount Due Highlight -->
              <div v-if="!invoice.is_paid && !invoice.is_cancelled" class="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p class="text-xs text-amber-700 font-medium mb-1">Amount Due</p>
                <p class="text-xl font-bold text-amber-800">{{ formatCurrency(invoice.amount_due) }}</p>
                <p class="text-xs text-amber-600 mt-1">Due {{ formatDate(invoice.due_date) }}</p>
              </div>

              <!-- Paid Highlight -->
              <div v-if="invoice.is_paid" class="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p class="text-xs text-emerald-700 font-medium mb-1">Paid in Full</p>
                <p class="text-xl font-bold text-emerald-800">{{ formatCurrency(invoice.total) }}</p>
                <p v-if="invoice.paid_at" class="text-xs text-emerald-600 mt-1">{{ formatDateTime(invoice.paid_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Subscription Info -->
          <div v-if="invoice.subscription" class="rounded-xl border border-gray-200 bg-white p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Related Subscription</h3>
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <i class="fa-light fa-badge-check text-indigo-600"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ invoice.subscription.package_name }}</p>
                <p class="text-xs text-gray-500 capitalize">{{ invoice.subscription.status }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <button 
                @click="downloadPdf"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i class="fa-light fa-download w-5"></i>
                Download PDF
              </button>
              <button 
                @click="previewPdf"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i class="fa-light fa-eye w-5"></i>
                Preview PDF
              </button>
              <button 
                @click="duplicateInvoice"
                :disabled="duplicating"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <i class="fa-light fa-copy w-5"></i>
                Duplicate Invoice
              </button>
              <router-link 
                :to="{ name: 'Customers.Show', params: { id: invoice.customer?.id } }"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <i class="fa-light fa-user w-5"></i>
                View Customer
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="py-4 text-center text-sm text-gray-500">
      No invoice data found.
    </div>

    <template #footer>
      <div class="w-full flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Button
            v-if="invoice?.can_be_sent"
            @click="sendInvoice"
            size="small"
            icon="pi pi-send"
            label="Send Invoice"
          />
          <Button
            v-if="invoice?.can_be_paid"
            @click="markAsPaid"
            :disabled="markingPaid"
            size="small"
            icon="pi pi-check"
            :label="markingPaid ? 'Marking...' : 'Mark as Paid'"
            :loading="markingPaid"
          />
          <Button
            v-if="!invoice?.is_paid && !invoice?.is_cancelled"
            @click="cancelInvoice"
            :disabled="cancelling"
            size="small"
            icon="pi pi-ban"
            label="Cancel"
            class="p-outlined"
            :loading="cancelling"
          />
        </div>
        <div class="flex items-center gap-2">
          <Button
            @click="previewPdf"
            size="small"
            icon="pi pi-eye"
            label="Preview PDF"
            class="p-outlined"
          />
          <Button
            @click="downloadPdf"
            size="small"
            icon="pi pi-download"
            label="Download PDF"
            class="p-outlined"
          />
          <Button
            @click="duplicateInvoice"
            :disabled="duplicating"
            size="small"
            icon="pi pi-copy"
            label="Duplicate"
            class="p-outlined"
            :loading="duplicating"
          />
          <Button
            label="Close"
            size="small"
            class="p-outlined"
            @click="handleClose"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <SendInvoiceModal
    v-if="invoice?.id"
    :visible="showSendInvoiceModal"
    :invoice-id="invoice.id"
    @update:visible="(v: boolean) => showSendInvoiceModal = v"
    @sent="handleInvoiceSent"
  />
</template>

