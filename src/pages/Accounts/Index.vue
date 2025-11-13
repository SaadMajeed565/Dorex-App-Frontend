<script setup lang="ts">
import MasterLayout from '../../layouts/MasterLayout.vue';
</script>

<template>
  <MasterLayout>
    <div class="flex items-center justify-center min-h-[60vh] bg-white p-4 rounded-lg shadow-sm">
      <div class="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div class="h-20 w-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm">
          <i class="fa-light fa-books text-3xl"></i>
        </div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-2">Accounts</h1>
        <p class="text-base text-gray-600 mb-1">This page is coming soon</p>
        <p class="text-sm text-gray-500">
          We're working hard to bring you a comprehensive accounts management experience. Check back soon!
        </p>
        <div class="mt-8 flex items-center gap-2 text-sm text-gray-400">
          <i class="fa-light fa-clock"></i>
          <span>Stay tuned for updates</span>
        </div>
      </div>
    </div>
  </MasterLayout>
</template>

