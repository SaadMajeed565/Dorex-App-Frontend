import axiosClient from '../axios';

export interface ImportResult {
  status: boolean;
  message: string;
  data?: {
    created: number;
    updated?: number;
    errors: string[];
  };
}

export interface ValidationResult {
  status: boolean;
  data: {
    valid: boolean;
    errors: string[];
    preview: Record<string, any>[];
    rowErrors: Record<number, string[]>;
    totalRows: number;
    headers: string[];
  };
}

export class ImportService {
  /**
   * Import data from Excel/CSV file
   */
  static async import(file: File, module: string): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);

    try {
      const response = await axiosClient.post('/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Import failed. Please check your file format.'
      );
    }
  }

  /**
   * Validate and preview file without importing
   */
  static async validate(file: File, module: string): Promise<ValidationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);

    try {
      const response = await axiosClient.post('/import/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Validation failed. Please check your file format.'
      );
    }
  }

  /**
   * Download template file for a module
   */
  static async downloadTemplate(module: string): Promise<void> {
    try {
      const response = await axiosClient.get('/import/template', {
        params: { module },
        responseType: 'blob',
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${module}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to download template'
      );
    }
  }

  /**
   * Get supported modules
   */
  static getSupportedModules(): string[] {
    return ['customers', 'subscriptions', 'payments', 'areas', 'packages', 'employees'];
  }

  /**
   * Get module display name
   */
  static getModuleDisplayName(module: string): string {
    const names: Record<string, string> = {
      customers: 'Customers',
      subscriptions: 'Subscriptions',
      payments: 'Payments',
      areas: 'Areas',
      packages: 'Packages',
      employees: 'Employees',
    };
    return names[module] || module;
  }
}

