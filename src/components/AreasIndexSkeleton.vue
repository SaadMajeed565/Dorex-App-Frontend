<template>
  <div class="space-y-6">
    <!-- Header Skeleton -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-2">
        <div class="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div class="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        <div class="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>

    <!-- Stats Cards Skeleton -->
    <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Filters Skeleton -->
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex-1">
          <div class="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div class="flex items-center gap-3">
          <div class="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
          <div class="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Areas Grid Skeleton -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 3" :key="i" class="rounded-xl border border-gray-200 bg-white p-6">
        <!-- Card Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="space-y-2">
            <div class="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <!-- Card Content -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="flex items-center justify-between">
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="flex items-center justify-between">
            <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="flex items-center justify-between">
            <div class="h-4 w-18 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex items-center gap-2">
          <div class="flex-1 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div class="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This is a skeleton component for the Areas Index page
// It mimics the structure and layout of the actual Areas Index page
</script>

<style scoped>
/* Additional skeleton-specific animations if needed */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
