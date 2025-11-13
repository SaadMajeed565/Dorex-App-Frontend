<script setup lang="ts">
defineProps<{ title: string; actionText?: string }>();
defineEmits<{ (e: 'action'): void }>();
</script>

<template>
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-gray-700">{{ title }}</h3>
    <button v-if="actionText" @click="$emit('action')" class="text-xs text-gray-500 hover:text-gray-700">{{ actionText }}</button>
  </div>
</template>

