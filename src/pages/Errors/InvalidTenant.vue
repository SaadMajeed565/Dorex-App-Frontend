<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div class="mb-6">
        <svg
          class="mx-auto h-16 w-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        Invalid Tenant Domain
      </h1>
      
      <p class="text-gray-600 mb-6">
        The domain <strong class="text-gray-900">{{ currentDomain }}</strong> is not associated with a valid tenant.
      </p>
      
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 text-left">
        <p class="text-sm text-yellow-800">
          <strong>What to do:</strong>
        </p>
        <ul class="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
          <li>Check that you're using the correct tenant subdomain</li>
          <li>Contact your administrator if you believe this is an error</li>
          <li>Ensure the tenant has been properly configured</li>
        </ul>
      </div>
      
      <div class="space-y-3">
        <button
          @click="goToCentral"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Central Domain
        </button>
        
        <button
          @click="reload"
          class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const currentDomain = computed(() => window.location.hostname);

function goToCentral() {
  // Redirect to central domain (localhost or 127.0.0.1)
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : "";
  const centralDomain = window.location.hostname.includes("127.0.0.1") 
    ? "127.0.0.1" 
    : "localhost";
  
  window.location.href = `${protocol}//${centralDomain}${port}/`;
}

function reload() {
  window.location.reload();
}
</script>

