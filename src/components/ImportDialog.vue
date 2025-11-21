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

      <!-- Loading State -->
      <div v-if="importing" class="flex items-center justify-center py-4 border border-gray-200 rounded-lg bg-gray-50">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-indigo-600 mb-2"></i>
          <p class="text-sm text-gray-600">Importing data...</p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-red-600 mt-0.5"></i>
          <p class="text-sm text-red-800">{{ error }}</p>
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
          :disabled="!selectedFile || importing"
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
import { ImportService, type ImportResult } from '../services/importService';

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
const error = ref<string | null>(null);
const importResult = ref<ImportResult | null>(null);

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
  if (fileInput.value) {
    fileInput.value.value = '';
  }
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

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    const validationError = validateFile(file);
    if (validationError) {
      error.value = validationError;
      return;
    }
    selectedFile.value = file;
    error.value = null;
    importResult.value = null;
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  event.preventDefault();
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      error.value = validationError;
      return;
    }
    selectedFile.value = file;
    error.value = null;
    importResult.value = null;
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
