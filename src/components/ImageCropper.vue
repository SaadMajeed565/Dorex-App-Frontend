<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Dialog from '../volt/Dialog.vue';
import Button from '../volt/Button.vue';

interface Props {
    visible: boolean;
    imageFile: File | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    'update:visible': [value: boolean];
    'cropped': [file: File];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const imageUrl = ref<string | null>(null);
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const minScale = ref(1);
const maxScale = ref(3);

// Load image when file changes
watch(() => props.imageFile, (file) => {
    if (file) {
        if (imageUrl.value) {
            URL.revokeObjectURL(imageUrl.value);
        }
        imageUrl.value = URL.createObjectURL(file);
        scale.value = 1;
        position.value = { x: 0, y: 0 };
    }
}, { immediate: true });

// Initialize canvas size
const initCanvas = () => {
    if (!canvasRef.value || !containerRef.value) return;
    
    const container = containerRef.value;
    const canvas = canvasRef.value;
    const size = Math.min(container.clientWidth, container.clientHeight, 500);
    
    canvas.width = size;
    canvas.height = size;
    
    if (imageRef.value && imageRef.value.complete) {
        drawImage();
    }
};

// Draw image on canvas
const drawImage = () => {
    if (!canvasRef.value || !imageRef.value) return;
    
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw white background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate image dimensions
    const imgWidth = imageRef.value.width * scale.value;
    const imgHeight = imageRef.value.height * scale.value;

    // Calculate position to center the crop area
    const x = centerX + position.value.x;
    const y = centerY + position.value.y;

    // Draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.drawImage(
        imageRef.value,
        x - imgWidth / 2,
        y - imgHeight / 2,
        imgWidth,
        imgHeight
    );
    
    ctx.restore();

    // Draw border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.stroke();
};

// Handle image load
const handleImageLoad = () => {
    if (!imageRef.value || !canvasRef.value) return;
    
    initCanvas();
    
    const canvas = canvasRef.value;
    const size = Math.min(canvas.width, canvas.height);
    const img = imageRef.value;
    
    // Calculate initial scale to fit image
    const scaleX = size / img.width;
    const scaleY = size / img.height;
    scale.value = Math.max(scaleX, scaleY) * 1.1; // Slightly larger to allow cropping
    
    minScale.value = scale.value * 0.5;
    maxScale.value = scale.value * 3;
    
    drawImage();
};

// Handle zoom
const handleZoom = (direction: number) => {
    const zoomFactor = direction > 0 ? 1.1 : 0.9;
    scale.value = Math.max(minScale.value, Math.min(maxScale.value, scale.value * zoomFactor));
    drawImage();
};

// Handle zoom button click
const handleZoomIn = () => handleZoom(1);
const handleZoomOut = () => handleZoom(-1);

// Handle mouse wheel
const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    handleZoom(-event.deltaY);
};

// Handle drag start
const handleMouseDown = (event: MouseEvent) => {
    isDragging.value = true;
    dragStart.value = {
        x: event.clientX - position.value.x,
        y: event.clientY - position.value.y
    };
};

// Handle drag
const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return;
    position.value = {
        x: event.clientX - dragStart.value.x,
        y: event.clientY - dragStart.value.y
    };
    drawImage();
};

// Handle drag end
const handleMouseUp = () => {
    isDragging.value = false;
};

// Get cropped image
const getCroppedImage = (): Promise<File | null> => {
    if (!canvasRef.value) return Promise.resolve(null);

    return new Promise((resolve) => {
        canvasRef.value!.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'profile-photo.png', { type: 'image/png' });
                resolve(file);
            } else {
                resolve(null);
            }
        }, 'image/png', 1.0);
    });
};

// Handle crop
const handleCrop = async () => {
    const croppedFile = await getCroppedImage();
    if (croppedFile) {
        // Emit cropped event - parent will handle closing
        emit('cropped', croppedFile);
    }
};

// Handle cancel
const handleCancel = () => {
    // Clean up image URL
    if (imageUrl.value) {
        URL.revokeObjectURL(imageUrl.value);
        imageUrl.value = null;
    }
    emit('update:visible', false);
};

// Cleanup
onUnmounted(() => {
    if (imageUrl.value) {
        URL.revokeObjectURL(imageUrl.value);
    }
    if (containerRef.value) {
        containerRef.value.removeEventListener('wheel', handleWheel);
    }
});

onMounted(() => {
    if (containerRef.value) {
        containerRef.value.addEventListener('wheel', handleWheel, { passive: false });
    }
    // Initialize canvas when component is mounted
    setTimeout(() => {
        initCanvas();
    }, 100);
});

// Watch for visibility changes to reinitialize
watch(() => props.visible, (visible) => {
    if (visible) {
        setTimeout(() => {
            initCanvas();
            if (imageRef.value && imageRef.value.complete) {
                handleImageLoad();
            }
        }, 100);
    }
});
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="(v: boolean) => { emit('update:visible', v); }"
        modal
        header="Crop Profile Photo"
        :style="{ width: '600px', maxWidth: '95vw' }"
        :closable="true"
    >
        <div class="space-y-4">
            <div class="text-sm text-gray-600 mb-4">
                <p>Drag to reposition, scroll to zoom</p>
            </div>

            <div
                ref="containerRef"
                class="relative bg-gray-100 rounded-lg overflow-hidden"
                style="width: 100%; aspect-ratio: 1; max-height: 500px;"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
            >
                <canvas
                    ref="canvasRef"
                    class="w-full h-full cursor-move"
                    style="display: block;"
                ></canvas>
            </div>

            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <button
                        @click="handleZoomOut"
                        class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        title="Zoom Out"
                    >
                        <i class="fa-light fa-minus"></i>
                    </button>
                    <span class="text-sm text-gray-600 min-w-[60px] text-center">{{ Math.round(scale * 100) }}%</span>
                    <button
                        @click="handleZoomIn"
                        class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        title="Zoom In"
                    >
                        <i class="fa-light fa-plus"></i>
                    </button>
                </div>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <Button
                    label="Cancel"
                    severity="secondary"
                    outlined
                    @click="handleCancel"
                />
                <Button
                    label="Crop & Save"
                    icon="pi pi-check"
                    @click="handleCrop"
                />
            </div>
        </div>

        <img
            v-if="imageUrl"
            ref="imageRef"
            :src="imageUrl"
            @load="handleImageLoad"
            style="display: none;"
        />
    </Dialog>
</template>

