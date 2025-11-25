<template>
  <Dialog
    :visible="modelValue"
    @update:visible="(v: boolean) => $emit('update:modelValue', v)"
    modal
    :header="`Import ${moduleDisplayName}`"
    :style="{ width: '600px', maxWidth: '98vw' }"
    :closable="true"
  >
    <form ref="dialogFormRef" @submit.prevent="handleImport" class="space-y-4 p-1">
      <!-- Instructions -->
      <div class="rounded-xl border border-gray-100 p-4 bg-gray-50">
        <p class="text-sm font-medium text-gray-900 mb-2">Instructions</p>
        <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Download the template file to see the required format</li>
          <li>Fill in your data following the template structure</li>
          <li>Upload the completed file (XLS or XLSX format)</li>
          <li>Related data will be automatically created if missing</li>
        </ul>
      </div>

      <!-- Download Template -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Template</label>
        <Button
          label="Download Template"
          icon="pi pi-download"
          severity="secondary"
          outlined
          @click="downloadTemplate"
          :loading="downloadingTemplate"
          class="w-full"
        />
      </div>

      <!-- File Upload Area -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Select File</label>
        <div
          ref="dropZoneRef"
          @drop="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="handleDragLeave"
          @click="triggerFileInput"
          :class="[
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          ]"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="handleFileSelect"
            class="hidden"
          />

          <div v-if="!selectedFile" class="space-y-2">
            <i class="pi pi-cloud-upload text-3xl text-gray-400"></i>
            <p class="text-sm text-gray-600">
              Drag and drop your file here or <span class="text-indigo-600 font-medium">click to browse</span>
            </p>
            <p class="text-xs text-gray-500">Supports: .xlsx, .xls, .csv (Max 10MB)</p>
          </div>

          <div v-else class="space-y-2">
            <i class="pi pi-file-excel text-3xl text-green-600"></i>
            <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            <button
              type="button"
              @click.stop="clearFile"
              class="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Change file
            </button>
          </div>
        </div>
      </div>

      <!-- Validating State -->
      <div v-if="validating" class="flex items-center justify-center py-4 border border-gray-200 rounded-lg bg-gray-50">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-indigo-600 mb-2"></i>
          <p class="text-sm text-gray-600">Validating file...</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="importing" class="flex items-center justify-center py-4 border border-gray-200 rounded-lg bg-gray-50">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-indigo-600 mb-2"></i>
          <p class="text-sm text-gray-600">Importing data...</p>
        </div>
      </div>

      <!-- Validation Errors (Top) -->
      <div v-if="validationResult && !validationResult.data.valid" class="rounded-lg border border-red-200 bg-red-50 p-4">
        <div class="flex items-start gap-2 mb-3">
          <i class="pi pi-exclamation-triangle text-red-600 mt-0.5"></i>
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800 mb-2">Validation Errors Found:</p>
            <ul class="text-sm text-red-700 list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
              <li v-for="(err, idx) in validationResult.data.errors" :key="idx">{{ err }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-red-600 mt-0.5"></i>
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>
      </div>

      <!-- Preview Table -->
      <div v-if="validationResult && validationResult.data.preview.length > 0" class="rounded-lg border border-gray-200">
        <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <p class="text-sm font-medium text-gray-900">
            Preview ({{ validationResult.data.totalRows }} total rows, showing first {{ validationResult.data.preview.length }})
          </p>
        </div>
        <div class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Row</th>
                <th
                  v-for="(header, idx) in validationResult.data.headers"
                  :key="idx"
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(row, rowIdx) in validationResult.data.preview"
                :key="rowIdx"
                :class="{
                  'bg-red-50': validationResult.data.rowErrors[rowIdx + 2],
                  'hover:bg-gray-50': !validationResult.data.rowErrors[rowIdx + 2]
                }"
              >
                <td class="px-3 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                  {{ rowIdx + 2 }}
                  <span v-if="validationResult.data.rowErrors[rowIdx + 2]" class="ml-1 text-red-600">
                    <i class="pi pi-exclamation-circle"></i>
                  </span>
                </td>
                <td
                  v-for="(header, colIdx) in validationResult.data.headers"
                  :key="colIdx"
                  :class="{
                    'px-3 py-2 text-xs text-gray-900 border-r border-gray-200': true,
                    'bg-red-100': isFieldError(row, header, rowIdx + 2)
                  }"
                >
                  {{ getFieldValue(row, header) || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="validationResult.data.rowErrors && Object.keys(validationResult.data.rowErrors).length > 0" class="bg-red-50 px-4 py-2 border-t border-red-200">
          <p class="text-xs font-medium text-red-800 mb-1">Row-specific errors:</p>
          <div class="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
            <div v-for="(errors, rowNum) in validationResult.data.rowErrors" :key="rowNum">
              <span class="font-medium">Row {{ rowNum }}:</span>
              <ul class="list-disc list-inside ml-2 inline">
                <li v-for="(err, errIdx) in errors" :key="errIdx" class="inline">{{ err }}<span v-if="errIdx < errors.length - 1">; </span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="importResult && importResult.status" class="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
        <div class="flex items-start gap-2">
          <i class="pi pi-check-circle text-green-600 mt-0.5"></i>
          <div class="flex-1">
            <p class="text-sm font-medium text-green-800 mb-2">Import completed successfully!</p>
            <div class="space-y-1 text-sm text-green-700">
              <p v-if="importResult.data?.created">
                Created: <span class="font-medium">{{ importResult.data.created }}</span> records
              </p>
              <p v-if="importResult.data?.updated">
                Updated: <span class="font-medium">{{ importResult.data.updated }}</span> records
              </p>
            </div>
            <div v-if="importResult.data?.errors?.length" class="mt-3">
              <p class="text-xs font-medium text-red-800 mb-1">Errors encountered:</p>
              <div class="max-h-32 overflow-y-auto bg-red-100 rounded p-2">
                <ul class="text-xs text-red-700 list-disc list-inside space-y-0.5">
                  <li v-for="(err, idx) in importResult.data.errors.slice(0, 10)" :key="idx">
                    {{ err }}
                  </li>
                  <li v-if="importResult.data.errors.length > 10" class="text-gray-600 font-medium">
                    ... and {{ importResult.data.errors.length - 10 }} more errors
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-2 flex justify-end gap-2">
        <button
          type="button"
          @click="$emit('update:modelValue', false)"
          :disabled="importing"
          class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!selectedFile || importing || validating"
          class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <i v-if="importing" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-upload"></i>
          Import
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from '../volt/Dialog.vue';
import Button from '../volt/Button.vue';
import { useToast } from 'primevue/usetoast';
import { ImportService, type ImportResult, type ValidationResult } from '../services/importService';

interface Props {
  modelValue: boolean;
  module: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'imported': [];
}>();

const toast = useToast();
const fileInput = ref<HTMLInputElement | null>(null);
const dropZoneRef = ref<HTMLElement | null>(null);
const dialogFormRef = ref<HTMLElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const importing = ref(false);
const downloadingTemplate = ref(false);
const validating = ref(false);
const error = ref<string | null>(null);
const importResult = ref<ImportResult | null>(null);
const validationResult = ref<ValidationResult | null>(null);

const moduleDisplayName = computed(() => ImportService.getModuleDisplayName(props.module));

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const clearFile = () => {
  selectedFile.value = null;
  error.value = null;
  importResult.value = null;
  validationResult.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const getFieldValue = (row: Record<string, any>, header: string): string => {
  // Try exact match
  if (row[header] !== undefined) {
    return String(row[header] || '');
  }
  // Try case-insensitive match
  const lowerHeader = header.toLowerCase();
  for (const key in row) {
    if (key.toLowerCase() === lowerHeader) {
      return String(row[key] || '');
    }
  }
  return '';
};

const isFieldError = (row: Record<string, any>, header: string, rowNumber: number): boolean => {
  if (!validationResult.value?.data.rowErrors[rowNumber]) {
    return false;
  }
  const errors = validationResult.value.data.rowErrors[rowNumber];
  const value = getFieldValue(row, header);
  const lowerHeader = header.toLowerCase();
  
  // Check if any error mentions this field
  return errors.some(err => {
    const lowerErr = err.toLowerCase();
    return lowerErr.includes(lowerHeader) || 
           (lowerHeader.includes('email') && lowerErr.includes('email')) ||
           (lowerHeader.includes('login') && lowerErr.includes('login')) ||
           (lowerHeader.includes('name') && lowerErr.includes('name')) ||
           (lowerHeader.includes('phone') && lowerErr.includes('phone')) ||
           (empty(value) && errors.some(e => e.toLowerCase().includes('missing')));
  });
};

const empty = (value: any): boolean => {
  return value === null || value === undefined || String(value).trim() === '';
};

const validateFile = (file: File): string | null => {
  const validTypes = ['.xlsx', '.xls', '.csv'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!validTypes.includes(fileExtension)) {
    return 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File size exceeds 10MB limit';
  }
  return null;
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    const validationError = validateFile(file);
    if (validationError) {
      error.value = validationError;
      validationResult.value = null;
      return;
    }
    selectedFile.value = file;
    error.value = null;
    importResult.value = null;
    
    // Validate file immediately
    await validateFileData(file);
  }
};

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false;
  event.preventDefault();
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      error.value = validationError;
      validationResult.value = null;
      return;
    }
    selectedFile.value = file;
    error.value = null;
    importResult.value = null;
    
    // Validate file immediately
    await validateFileData(file);
  }
};

const validateFileData = async (file: File) => {
  validating.value = true;
  error.value = null;
  
  try {
    const result = await ImportService.validate(file, props.module);
    validationResult.value = result;
    
    if (!result.data.valid) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Issues',
        detail: `Found ${result.data.errors.length} validation error(s). Please review the preview below.`,
        life: 5000,
      });
    } else {
      toast.add({
        severity: 'success',
        summary: 'File Valid',
        detail: 'File validation passed. You can proceed with import.',
        life: 3000,
      });
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to validate file';
    validationResult.value = null;
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: err.message || 'Failed to validate file',
      life: 4000,
    });
  } finally {
    validating.value = false;
  }
};

const handleDragLeave = (event: DragEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement;
  if (!dropZoneRef.value?.contains(relatedTarget)) {
    isDragging.value = false;
  }
};

const downloadTemplate = async () => {
  downloadingTemplate.value = true;
  try {
    await ImportService.downloadTemplate(props.module);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Template downloaded successfully',
      life: 3000,
    });
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to download template',
      life: 4000,
    });
  } finally {
    downloadingTemplate.value = false;
  }
};

const handleImport = async () => {
  if (!selectedFile.value) {
    error.value = 'Please select a file';
    return;
  }

  importing.value = true;
  error.value = null;
  importResult.value = null;

  try {
    const result = await ImportService.import(selectedFile.value, props.module);
    importResult.value = result;

    if (result.status) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: result.message || 'Import completed successfully',
        life: 5000,
      });
      
      emit('imported');
      
      if (!result.data?.errors?.length) {
        setTimeout(() => {
          emit('update:modelValue', false);
        }, 3000);
      }
    } else {
      error.value = result.message || 'Import failed';
    }
  } catch (err: any) {
    error.value = err.message || 'Import failed. Please check your file format.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Import failed',
      life: 4000,
    });
  } finally {
    importing.value = false;
  }
};

const reset = () => {
  selectedFile.value = null;
  isDragging.value = false;
  error.value = null;
  importResult.value = null;
  validationResult.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    reset();
  }
});
</script>
