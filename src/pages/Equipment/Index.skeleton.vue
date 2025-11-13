<script setup lang="ts">
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="h-6 w-40 rounded bg-gray-200 animate-pulse"></div>
      <div class="mt-2 h-4 w-64 rounded bg-gray-200 animate-pulse"></div>
    </div>
    <div class="flex items-center gap-3">
      <div class="h-9 w-32 rounded-lg bg-gray-200 animate-pulse"></div>
      <div class="h-9 w-24 rounded-lg bg-gray-200 animate-pulse"></div>
      <div class="h-9 w-24 rounded-lg bg-gray-200 animate-pulse"></div>
    </div>
  </div>

  <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <div v-for="i in 4" :key="i" class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="h-4 w-24 rounded bg-gray-200 animate-pulse"></div>
      <div class="mt-3 h-6 w-16 rounded bg-gray-200 animate-pulse"></div>
    </div>
  </div>

  <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="flex-1">
        <div class="h-9 w-full rounded-lg bg-gray-200 animate-pulse"></div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-9 w-36 rounded-lg bg-gray-200 animate-pulse"></div>
        <div class="h-9 w-36 rounded-lg bg-gray-200 animate-pulse"></div>
        <div class="h-9 w-36 rounded-lg bg-gray-200 animate-pulse"></div>
      </div>
    </div>
  </div>

  <div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
    <div class="bg-gray-50">
      <div class="grid grid-cols-7 gap-4 px-4 py-3">
        <div class="h-3 w-24 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-3 w-16 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-3 w-20 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-3 w-16 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-3 w-16 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-3 w-20 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-3 w-12 rounded bg-gray-200 animate-pulse"></div>
      </div>
    </div>
    <div class="divide-y divide-gray-200">
      <div v-for="i in 8" :key="i" class="grid grid-cols-7 gap-4 px-4 py-3">
        <div class="h-4 w-40 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-4 w-24 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-4 w-28 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-4 w-20 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-4 w-16 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-4 w-16 rounded bg-gray-200 animate-pulse"></div>
        <div class="h-4 w-16 rounded bg-gray-200 animate-pulse ml-auto"></div>
      </div>
    </div>
    <div class="border-t border-gray-200 bg-gray-50 px-4 py-3">
      <div class="h-5 w-64 rounded bg-gray-200 animate-pulse"></div>
    </div>
  </div>
</template>


