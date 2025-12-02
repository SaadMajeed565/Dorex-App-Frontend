<template>
    <ConfirmDialog
        unstyled
        :pt="theme"
        :ptOptions="{
            mergeProps: ptViewMerge
        }"
    >
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="flex items-center justify-between shrink-0 px-5 pt-5 pb-4">
                <span class="font-semibold text-lg">{{ message.header }}</span>
                <SecondaryButton variant="text" rounded @click="rejectCallback" autofocus>
                    <template #icon>
                        <TimesIcon />
                    </template>
                </SecondaryButton>
            </div>
            <div class="px-5 pb-4 flex items-start gap-4">
                <ExclamationTriangeIcon class="size-6 mt-0.5 shrink-0 text-amber-500" />
                <div class="flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ message.message }}</div>
            </div>
            <div class="px-5 pb-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <SecondaryButton @click="rejectCallback" :label="message.rejectProps?.label || 'Cancel'" size="small" />
                <Button @click="acceptCallback" :label="message.acceptProps?.label || 'Confirm'" size="small" />
            </div>
        </template>
    </ConfirmDialog>
</template>

<script setup lang="ts">
import ExclamationTriangeIcon from '@primevue/icons/exclamationtriangle';
import TimesIcon from '@primevue/icons/times';
import ConfirmDialog, { type ConfirmDialogPassThroughOptions, type ConfirmDialogProps } from 'primevue/confirmdialog';
import { ref } from 'vue';
import Button from './Button.vue';
import SecondaryButton from './SecondaryButton.vue';
import { ptViewMerge } from './utils';

interface Props extends /* @vue-ignore */ ConfirmDialogProps {}
defineProps<Props>();

const theme = ref<ConfirmDialogPassThroughOptions>({
    root: `w-auto max-w-md rounded-xl
        border border-surface-200 dark:border-surface-700
        bg-surface-0 dark:bg-surface-900
        text-surface-700 dark:text-surface-0 shadow-lg`,
    mask: `bg-black/50 fixed top-0 start-0 w-full h-full`,
    transition: {
        enterFromClass: 'opacity-0 scale-75',
        enterActiveClass: 'transition-all duration-150 ease-[cubic-bezier(0,0,0.2,1)]',
        leaveActiveClass: 'transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
        leaveToClass: 'opacity-0 scale-75'
    }
});
</script>
