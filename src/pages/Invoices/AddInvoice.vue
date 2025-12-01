<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import axiosClient from '../../axios';
import { useGeneralSettingsStore } from '../../stores/generalSettingsStore';
import { useToast } from 'primevue/usetoast';
import Dialog from '../../volt/Dialog.vue';
import Button from '../../volt/Button.vue';
import AutoComplete from '../../volt/AutoComplete.vue';
import SendInvoiceModal from '../../components/SendInvoiceModal.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'created', data?: any): void;
}>();

const toast = useToast();
const generalSettingsStore = useGeneralSettingsStore();
const tenantCurrency = computed(() => generalSettingsStore.currencyUnit || 'PKR');

interface Customer {
  id: number;
  name: string;
  email?: string;
  area: string;
}

interface Subscription {
  id: number;
  package_name: string;
  status: string;
  package_snapshot?: {
    name: string;
    sale_price: number;
  };
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Form data
const form = ref({
  customer_id: null as Customer | null,
  subscription_id: null as number | null,
  items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
  tax_rate: 0,
  discount_amount: 0,
  discount_type: 'fixed' as 'fixed' | 'percentage',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: '',
  terms: '',
  currency: 'PKR',
  status: 'draft' as 'draft' | 'sent',
});

const customers = ref<Customer[]>([]);
const filteredCustomers = ref<Customer[]>([]);
const subscriptions = ref<Subscription[]>([]);
const loadingCustomers = ref(false);
const loadingSubscriptions = ref(false);
const submitting = ref(false);
const errors = ref<Record<string, string[]>>({});
const createdInvoiceId = ref<number | null>(null);
const showSendInvoiceModal = ref(false);

// Computed totals
const subtotal = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
});

const taxAmount = computed(() => {
  return subtotal.value * (form.value.tax_rate / 100);
});

const discountValue = computed(() => {
  if (form.value.discount_type === 'percentage') {
    return subtotal.value * (form.value.discount_amount / 100);
  }
  return form.value.discount_amount;
});

const total = computed(() => {
  return subtotal.value + taxAmount.value - discountValue.value;
});

const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: form.value.currency || tenantCurrency.value,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${form.value.currency}`;
  }
};

const resetForm = () => {
  form.value = {
    customer_id: null,
    subscription_id: null,
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    tax_rate: 0,
    discount_amount: 0,
    discount_type: 'fixed',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: '',
    currency: tenantCurrency.value,
    status: 'draft',
  };
  subscriptions.value = [];
  errors.value = {};
};

const handleInvoiceSent = () => {
  resetForm();
  emit('created');
  emit('update:visible', false);
  showSendInvoiceModal.value = false;
  createdInvoiceId.value = null;
};

// Fetch customers
const fetchCustomers = async () => {
  loadingCustomers.value = true;
  try {
    const res = await axiosClient.get('/customers');
    let raw: any[] = [];
    
    // Handle different response structures
    if (Array.isArray(res?.data?.customers)) {
      raw = res.data.customers;
    } else if (Array.isArray(res?.data?.data)) {
      raw = res.data.data;
    } else if (Array.isArray(res?.data)) {
      raw = res.data;
    }

    customers.value = raw.map((c) => {
      // CustomerResource returns UserResource structure with nested customer object
      // So we have: c.name, c.email, c.area (from UserResource) and c.customer.id
      const customerId = c.customer?.id || c.id;
      const customerName = c.name || c.user?.name || 'Unknown';
      const customerEmail = c.email || c.user?.email;
      const customerArea = c.area || c.area_name || '';
      
      return {
        id: customerId,
        name: customerName,
        email: customerEmail,
        area: customerArea,
      };
    });
    
    // Initialize filtered customers with first 50 for initial display
    filteredCustomers.value = customers.value.slice(0, 50);
    
    // Debug log to help troubleshoot
    if (customers.value.length === 0) {
      console.warn('No customers found. API response:', res.data);
    }
  } catch (err) {
    console.error('Error fetching customers:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load customers',
      life: 3000,
    });
    customers.value = [];
    filteredCustomers.value = [];
  } finally {
    loadingCustomers.value = false;
  }
};

// Autocomplete search for customers
const searchCustomers = (event: any) => {
  const query = (event.query || '').toLowerCase().trim();
  
  if (!query) {
    // If no query, show all customers (limit to first 50 for performance)
    filteredCustomers.value = customers.value.slice(0, 50);
    return;
  }
  
  filteredCustomers.value = customers.value.filter(
    c =>
      c.name.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.area && c.area.toLowerCase().includes(query))
  );
};

// Fetch subscriptions for selected customer
const fetchSubscriptions = async (customerId: number) => {
  if (!customerId) {
    subscriptions.value = [];
    return;
  }
  
  loadingSubscriptions.value = true;
  try {
    const res = await axiosClient.get(`/customers/${customerId}/subscriptions`);
    let raw: any[] = [];
    
    // Handle paginated response structure: { status: true, data: { data: [...], current_page: ... } }
    if (res?.data?.data?.data && Array.isArray(res.data.data.data)) {
      // Paginated response
      raw = res.data.data.data;
    } else if (Array.isArray(res?.data?.data)) {
      // Direct array in data
      raw = res.data.data;
    } else if (Array.isArray(res?.data)) {
      // Direct array
      raw = res.data;
    }

    subscriptions.value = raw.map((s) => ({
      id: s.id,
      package_name: s.package_snapshot?.name || s.package?.name || 'Unknown Package',
      status: s.status,
      package_snapshot: s.package_snapshot,
    }));
    
    // Debug log to help troubleshoot
    if (subscriptions.value.length === 0) {
      console.warn('No subscriptions found for customer:', customerId, 'API response:', res.data);
    }
  } catch (err: any) {
    console.error('Error fetching subscriptions:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Failed to load subscriptions',
      life: 3000,
    });
    subscriptions.value = [];
  } finally {
    loadingSubscriptions.value = false;
  }
};

// Watch for customer selection change
watch(() => form.value.customer_id, (newCustomer) => {
  if (newCustomer && newCustomer.id) {
    fetchSubscriptions(newCustomer.id);
  } else {
    form.value.subscription_id = null;
    subscriptions.value = [];
  }
});

// Watch for subscription change to auto-populate items
watch(() => form.value.subscription_id, (newId) => {
  if (newId) {
    const subscription = subscriptions.value.find(s => s.id === newId);
    if (subscription?.package_snapshot) {
      form.value.items = [{
        description: `${subscription.package_name} - Monthly Subscription`,
        quantity: 1,
        unit_price: subscription.package_snapshot.sale_price || 0,
        total: subscription.package_snapshot.sale_price || 0,
      }];
    }
  }
});

// Update item total when quantity or unit_price changes
const updateItemTotal = (index: number) => {
  const item = form.value.items[index];
  item.total = item.quantity * item.unit_price;
};

// Add new item
const addItem = () => {
  form.value.items.push({ description: '', quantity: 1, unit_price: 0, total: 0 });
};

// Remove item
const removeItem = (index: number) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1);
  }
};

// Submit form
const submitForm = async (sendImmediately: boolean = false) => {
  errors.value = {};
  submitting.value = true;

  try {
    const payload = {
      ...form.value,
      customer_id: form.value.customer_id!.id,
      status: 'draft', // Always create as draft, sending will be handled separately
    };

    const res = await axiosClient.post('/invoices', payload);
    const invoiceId = res.data?.data?.id;
    
    if (sendImmediately && invoiceId) {
      // Store the invoice ID and open the send modal
      createdInvoiceId.value = invoiceId;
      showSendInvoiceModal.value = true;
      toast.add({ severity: 'success', summary: 'Success', detail: 'Invoice created successfully', life: 3000 });
    } else {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Invoice created successfully', life: 3000 });
      // Reset form and close modal
      resetForm();
      emit('created', res.data);
      emit('update:visible', false);
    }
  } catch (err: any) {
    if (err.response?.data?.errors) {
      const rawErrors = err.response.data.errors;
      // Transform error messages: show "This field is required" when field is empty
      errors.value = Object.keys(rawErrors).reduce((acc, key) => {
        // Handle nested errors like items.0.description
        const keyParts = key.split('.');
        let fieldValue: any = form.value;
        
        for (let i = 0; i < keyParts.length; i++) {
          const part = keyParts[i];
          if (fieldValue === null || fieldValue === undefined) {
            fieldValue = undefined;
            break;
          }
          
          // Handle array indices (e.g., items.0.description -> items[0].description)
          if (Array.isArray(fieldValue) && /^\d+$/.test(part)) {
            const index = parseInt(part, 10);
            if (index >= 0 && index < fieldValue.length) {
              fieldValue = fieldValue[index];
            } else {
              fieldValue = undefined;
              break;
            }
          } else if (typeof fieldValue === 'object' && part in fieldValue) {
            fieldValue = fieldValue[part];
          } else {
            fieldValue = undefined;
            break;
          }
        }
        
        const isEmpty = fieldValue === null || fieldValue === undefined || fieldValue === '' || (typeof fieldValue === 'string' && fieldValue.trim() === '');
        acc[key] = rawErrors[key].map((msg: string) => {
          // If field is empty and error mentions "must be" or "required", show friendly message
          if (isEmpty && (msg.toLowerCase().includes('must be') || msg.toLowerCase().includes('required'))) {
            return 'This field is required';
          }
          return msg;
        });
        return acc;
      }, {} as Record<string, string[]>);
    } else if (err.response?.data?.message) {
      // If no structured errors, show general message
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response.data.message, 
        life: 3000 
      });
    } else {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
        detail: 'Failed to create invoice', 
      life: 3000 
    });
    }
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await generalSettingsStore.fetchSettings();
      form.value.currency = tenantCurrency.value;
      await fetchCustomers();
      // Reset form when dialog opens
      form.value = {
        customer_id: null,
        subscription_id: null,
        items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
        tax_rate: 0,
        discount_amount: 0,
        discount_type: 'fixed',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        terms: '',
        currency: tenantCurrency.value,
        status: 'draft',
      };
      subscriptions.value = [];
      errors.value = {};
    }
  },
  { immediate: false }
);

onMounted(async () => {
  await generalSettingsStore.fetchSettings();
  form.value.currency = tenantCurrency.value;
});
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    modal
    header="Create Invoice"
    :closable="true"
    :breakpoints="{ '960px': '95vw', '640px': '98vw' }"
    :style="{ width: '1200px', maxWidth: '98vw', maxHeight: '90vh' }"
  >
    <form @submit.prevent="submitForm(false)" class="space-y-4 p-1">
        <!-- Customer & Subscription Section -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <!-- Customer AutoComplete -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Customer <span class="text-rose-500">*</span>
              </label>
              <AutoComplete
                v-model="form.customer_id"
                :suggestions="filteredCustomers"
                @complete="searchCustomers"
                :optionLabel="(c) => `${c.name}${c.area ? ' - ' + c.area : ''}`"
                placeholder="Search customers by name, email, or area"
                size="small"
                fluid
                class="w-full"
                :minLength="0"
                :disabled="loadingCustomers"
                :loading="loadingCustomers"
                :class="{ 'border-rose-500': errors.customer_id }"
                dropdown
              />
              <p v-if="errors.customer_id" class="mt-1 text-xs text-rose-500">{{ errors.customer_id[0] }}</p>
            </div>

            <!-- Subscription Select (Optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Subscription <span class="text-gray-400">(optional)</span>
              </label>
              <select
                v-model="form.subscription_id"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :class="{ 'border-rose-500': errors.subscription_id, 'border-gray-200': !errors.subscription_id }"
                :disabled="!form.customer_id || loadingSubscriptions"
              >
                <option :value="null">No subscription</option>
                <option v-for="sub in subscriptions" :key="sub.id" :value="sub.id">
                  {{ sub.package_name }} ({{ sub.status }})
                </option>
              </select>
              <p v-if="errors.subscription_id" class="mt-1 text-xs text-rose-500">{{ errors.subscription_id[0] }}</p>
              <p v-else-if="loadingSubscriptions" class="mt-1 text-xs text-gray-500">Loading subscriptions...</p>
            </div>
          </div>
        </div>

        <!-- Invoice Items -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Invoice Items</h2>
            <button 
              type="button"
              @click="addItem"
              class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <i class="fa-light fa-plus"></i>
              Add Item
            </button>
          </div>

          <div class="space-y-4">
            <div 
              v-for="(item, index) in form.items" 
              :key="index"
              class="grid grid-cols-12 gap-4 items-start p-4 bg-gray-50 rounded-lg"
            >
              <!-- Description -->
              <div class="col-span-12 sm:col-span-5">
                <label class="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input
                  v-model="item.description"
                  type="text"
                  placeholder="Item description"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :class="{ 'border-rose-500': errors[`items.${index}.description`], 'border-gray-200': !errors[`items.${index}.description`] }"
                  required
                />
                <p v-if="errors[`items.${index}.description`]" class="mt-1 text-xs text-rose-500">{{ errors[`items.${index}.description`][0] }}</p>
              </div>

              <!-- Quantity -->
              <div class="col-span-4 sm:col-span-2">
                <label class="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :class="{ 'border-rose-500': errors[`items.${index}.quantity`], 'border-gray-200': !errors[`items.${index}.quantity`] }"
                  @input="updateItemTotal(index)"
                  required
                />
                <p v-if="errors[`items.${index}.quantity`]" class="mt-1 text-xs text-rose-500">{{ errors[`items.${index}.quantity`][0] }}</p>
              </div>

              <!-- Unit Price -->
              <div class="col-span-4 sm:col-span-2">
                <label class="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                <input
                  v-model.number="item.unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :class="{ 'border-rose-500': errors[`items.${index}.unit_price`], 'border-gray-200': !errors[`items.${index}.unit_price`] }"
                  @input="updateItemTotal(index)"
                  required
                />
                <p v-if="errors[`items.${index}.unit_price`]" class="mt-1 text-xs text-rose-500">{{ errors[`items.${index}.unit_price`][0] }}</p>
              </div>

              <!-- Total -->
              <div class="col-span-3 sm:col-span-2">
                <label class="block text-xs font-medium text-gray-500 mb-1">Total</label>
                <div class="px-3 py-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200">
                  {{ formatCurrency(item.total) }}
                </div>
              </div>

              <!-- Remove -->
              <div class="col-span-1 flex items-end pb-2">
                <button
                  v-if="form.items.length > 1"
                  type="button"
                  @click="removeItem(index)"
                  class="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                  title="Remove item"
                >
                  <i class="fa-light fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <p v-if="errors.items" class="mt-2 text-xs text-rose-500">{{ errors.items[0] }}</p>
        </div>

        <!-- Dates & Totals -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-4">
          <!-- Dates -->
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Invoice Dates</h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="form.issue_date"
                  type="date"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :class="{ 'border-rose-500': errors.issue_date, 'border-gray-200': !errors.issue_date }"
                  required
                />
                <p v-if="errors.issue_date" class="mt-1 text-xs text-rose-500">{{ errors.issue_date[0] }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Due Date <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="form.due_date"
                  type="date"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :class="{ 'border-rose-500': errors.due_date, 'border-gray-200': !errors.due_date }"
                  required
                />
                <p v-if="errors.due_date" class="mt-1 text-xs text-rose-500">{{ errors.due_date[0] }}</p>
              </div>
            </div>
          </div>

          <!-- Totals -->
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h2>
            
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Subtotal</span>
                <span class="text-sm font-medium text-gray-900">{{ formatCurrency(subtotal) }}</span>
              </div>

              <!-- Tax Rate -->
              <div class="flex justify-between items-center gap-4">
                <label class="text-sm text-gray-600">Tax Rate (%)</label>
                <div class="flex flex-col items-end">
                <input
                  v-model.number="form.tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                    class="w-24 rounded-lg border px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    :class="{ 'border-rose-500': errors.tax_rate, 'border-gray-200': !errors.tax_rate }"
                />
                  <p v-if="errors.tax_rate" class="mt-1 text-xs text-rose-500">{{ errors.tax_rate[0] }}</p>
                </div>
              </div>

              <div v-if="form.tax_rate > 0" class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Tax ({{ form.tax_rate }}%)</span>
                <span class="text-sm font-medium text-gray-900">{{ formatCurrency(taxAmount) }}</span>
              </div>

              <!-- Discount -->
              <div class="flex justify-between items-center gap-4">
                <label class="text-sm text-gray-600">Discount</label>
                <div class="flex flex-col items-end gap-1">
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="form.discount_amount"
                    type="number"
                    min="0"
                    step="0.01"
                      class="w-24 rounded-lg border px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      :class="{ 'border-rose-500': errors.discount_amount, 'border-gray-200': !errors.discount_amount }"
                  />
                  <select
                    v-model="form.discount_type"
                      class="rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      :class="{ 'border-rose-500': errors.discount_type, 'border-gray-200': !errors.discount_type }"
                  >
                    <option value="fixed">{{ form.currency }}</option>
                    <option value="percentage">%</option>
                  </select>
                  </div>
                  <p v-if="errors.discount_amount" class="text-xs text-rose-500">{{ errors.discount_amount[0] }}</p>
                  <p v-if="errors.discount_type" class="text-xs text-rose-500">{{ errors.discount_type[0] }}</p>
                </div>
              </div>

              <div v-if="form.discount_amount > 0" class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Discount</span>
                <span class="text-sm font-medium text-rose-600">-{{ formatCurrency(discountValue) }}</span>
              </div>

              <div class="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span class="text-base font-semibold text-gray-900">Total</span>
                <span class="text-xl font-bold text-indigo-600">{{ formatCurrency(total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes & Terms -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                v-model="form.notes"
                rows="3"
                placeholder="Any additional notes for the customer..."
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :class="{ 'border-rose-500': errors.notes, 'border-gray-200': !errors.notes }"
              ></textarea>
              <p v-if="errors.notes" class="mt-1 text-xs text-rose-500">{{ errors.notes[0] }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea
                v-model="form.terms"
                rows="3"
                placeholder="Payment terms and conditions..."
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :class="{ 'border-rose-500': errors.terms, 'border-gray-200': !errors.terms }"
              ></textarea>
              <p v-if="errors.terms" class="mt-1 text-xs text-rose-500">{{ errors.terms[0] }}</p>
            </div>
          </div>
        </div>

      </form>
    <template #footer>
      <div class="w-full flex items-center justify-end gap-3">
        <Button
          label="Cancel"
          size="small"
          class="p-outlined"
          @click="emit('update:visible', false)"
        />
        <Button
          label="Save as Draft"
          size="small"
          icon="pi pi-save"
          :loading="submitting"
          @click="submitForm(false)"
        />
        <Button
          label="Save & Send"
          size="small"
          icon="pi pi-send"
          :loading="submitting"
            @click="submitForm(true)"
        />
        </div>
    </template>
  </Dialog>

  <SendInvoiceModal
    v-if="createdInvoiceId !== null"
    :visible="showSendInvoiceModal"
    :invoice-id="createdInvoiceId!"
    @update:visible="(v: boolean) => { 
      showSendInvoiceModal = v; 
      if (!v) {
        resetForm();
        emit('created');
        emit('update:visible', false);
        createdInvoiceId = null;
      }
    }"
    @sent="handleInvoiceSent"
  />
</template>

