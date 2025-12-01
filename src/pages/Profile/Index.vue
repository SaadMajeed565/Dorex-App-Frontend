<script setup lang="ts">
import { onMounted, ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axiosClient from '../../axios';
import MasterLayout from '../../layouts/MasterLayout.vue';
import { useAuthStore } from '../../stores/authStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Profile photo as blob URL
const profilePhotoBlobUrl = ref<string | null>(null);

// Generate cache key for profile data
const getProfileCacheKey = (userId: number | string | undefined) => {
  if (!userId) return null
  return `profile_data_${userId}`
}

// Check if a value is polluted (null, undefined, empty string, empty array, etc.)
const isPolluted = (value: any): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}

// Check which fields in profile data are polluted
const getPollutedFields = (profile: any): string[] => {
  const pollutedFields: string[] = []
  if (!profile) return []
  
  // List of important fields to check
  const fieldsToCheck = [
    'id', 'name', 'email', 'login_id', 'nic', 'phone', 
    'alternative_phone', 'address', 'area', 'profile_photo',
    'roles', 'permissions', 'active'
  ]
  
  for (const field of fieldsToCheck) {
    if (isPolluted(profile[field])) {
      pollutedFields.push(field)
    }
  }
  
  return pollutedFields
}

// Save profile data to localStorage
const saveProfileToCache = (userId: number | string | undefined, profile: any) => {
  if (!userId || !profile) return
  
  try {
    const cacheKey = getProfileCacheKey(userId)
    if (cacheKey) {
      localStorage.setItem(cacheKey, JSON.stringify(profile))
    }
  } catch (error) {
    console.error('Failed to save profile to cache:', error)
  }
}

// Load profile data from localStorage
const loadProfileFromCache = (userId: number | string | undefined): any | null => {
  if (!userId) return null
  
  try {
    const cacheKey = getProfileCacheKey(userId)
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }
  } catch (error) {
    console.error('Failed to load profile from cache:', error)
  }
  return null
}

// Merge profile data (server data takes priority for polluted fields)
const mergeProfileData = (cached: any, server: any, pollutedFields: string[]): any => {
  if (!cached) return server
  if (!server) return cached
  
  const merged = { ...cached }
  
  // Update only polluted fields from server
  for (const field of pollutedFields) {
    if (server[field] !== undefined) {
      merged[field] = server[field]
    }
  }
  
  // Also update any fields that exist in server but not in cached (new fields)
  for (const key in server) {
    if (server.hasOwnProperty(key) && !cached.hasOwnProperty(key)) {
      merged[key] = server[key]
    }
  }
  
  return merged
}

// Load profile photo as blob
const loadProfilePhoto = async (photoUrl: string | null) => {
    if (!photoUrl) {
        profilePhotoBlobUrl.value = null;
        return;
    }

    try {
        // Clean up old blob URL
        if (profilePhotoBlobUrl.value) {
            URL.revokeObjectURL(profilePhotoBlobUrl.value);
        }

        // Fetch image with authentication
        const response = await axiosClient.get(photoUrl, {
            responseType: 'blob',
        });

        // Create blob URL
        profilePhotoBlobUrl.value = URL.createObjectURL(response.data);
    } catch (error) {
        console.error('Failed to load profile photo:', error);
        profilePhotoBlobUrl.value = null;
    }
};
import Tabs from '../../volt/Tabs.vue';
import TabList from '../../volt/TabList.vue';
import Tab from '../../volt/Tab.vue';
import TabPanels from '../../volt/TabPanels.vue';
import TabPanel from '../../volt/TabPanel.vue';
import Dialog from '../../volt/Dialog.vue';
import ConfirmDialog from '../../volt/ConfirmDialog.vue';
import InputText from '../../volt/InputText.vue';
import Textarea from '../../volt/Textarea.vue';
import Password from '../../volt/Password.vue';
import Button from '../../volt/Button.vue';
import ToggleSwitch from '../../volt/ToggleSwitch.vue';
import ImageCropper from '../../components/ImageCropper.vue';

const router = useRouter();
const authStore = useAuthStore();
const { userData } = storeToRefs(authStore);
const toast = useToast();
const confirm = useConfirm();

// State
const user = ref<any>(null);
const loading = ref(true);
const activeTab = ref('overview');
const uploadingPhoto = ref(false);
const updatingProfile = ref(false);
const changingPassword = ref(false);
const showDeleteAccountDialog = ref(false);

// Form states
const editForm = ref({
    name: '',
    email: '',
    phone: '',
    alternative_phone: '',
    address: '',
    area: '',
});

const passwordForm = ref({
    current_password: '',
    password: '',
    password_confirmation: '',
});

const deleteAccountForm = ref({
    password: '',
    confirm: false,
});

// Load profile
async function load(forceRefresh: boolean = false) {
    loading.value = true;
    
    const userId = userData.value?.id
    if (!userId) {
        loading.value = false;
        return;
    }
    
    // Try to load cached profile first (unless forcing refresh)
    let cachedProfile: any = null
    let pollutedFields: string[] = []
    
    if (!forceRefresh) {
        cachedProfile = loadProfileFromCache(userId)
        if (cachedProfile) {
            // Use cached data immediately for instant display
            user.value = cachedProfile
            
            // Populate edit form from cached data
            editForm.value = {
                name: cachedProfile.name || '',
                email: cachedProfile.email || '',
                phone: cachedProfile.phone || '',
                alternative_phone: cachedProfile.alternative_phone || '',
                address: cachedProfile.address || '',
                area: cachedProfile.area || '',
            };
            
            // Load photo if available
            if (cachedProfile.profile_photo && !isPolluted(cachedProfile.profile_photo)) {
                loadProfilePhoto(cachedProfile.profile_photo);
            }
            
            // Check which fields are polluted
            pollutedFields = getPollutedFields(cachedProfile)
            
            // If no polluted fields, we can use cached data entirely
            if (pollutedFields.length === 0) {
                loading.value = false;
                return;
            }
        }
    }
    
    // Fetch from server if we have polluted fields or no cache
    try {
        const res = await axiosClient.get('/profile/');
        const serverPayload = res.data?.data || res.data;
        
        if (serverPayload) {
            // Merge server data with cached data
            let finalProfile = serverPayload
            if (cachedProfile && pollutedFields.length > 0) {
                finalProfile = mergeProfileData(cachedProfile, serverPayload, pollutedFields)
            }
            
            // Save merged profile to cache
            saveProfileToCache(userId, finalProfile)
            
            // Update user value
            user.value = finalProfile;
            
            // Populate edit form
            editForm.value = {
                name: finalProfile.name || '',
                email: finalProfile.email || '',
                phone: finalProfile.phone || '',
                alternative_phone: finalProfile.alternative_phone || '',
                address: finalProfile.address || '',
                area: finalProfile.area || '',
            };
            
            // Load photo if available
            if (finalProfile.profile_photo) {
                loadProfilePhoto(finalProfile.profile_photo);
            }
            
            // Update auth store
            const basicUserData = {
                id: finalProfile.id,
                name: finalProfile.name,
                email: finalProfile.email,
                login_id: finalProfile.login_id,
                nic: finalProfile.nic,
                phone: finalProfile.phone,
                roles: finalProfile.roles || [],
                permissions: finalProfile.permissions || [],
            };
            authStore.saveUserData(basicUserData);
        }
    } catch (error: any) {
        console.error('Failed to load user profile:', error);
        
        // If we have cached data, keep using it on error
        if (cachedProfile && !forceRefresh) {
            user.value = cachedProfile;
            editForm.value = {
                name: cachedProfile.name || '',
                email: cachedProfile.email || '',
                phone: cachedProfile.phone || '',
                alternative_phone: cachedProfile.alternative_phone || '',
                address: cachedProfile.address || '',
                area: cachedProfile.area || '',
            };
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Failed to load profile',
                life: 3000,
            });
        }
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    if (userData.value) {
        user.value = userData.value;
    }
    load();
});

onUnmounted(() => {
    // Clean up blob URL on component unmount
    if (profilePhotoBlobUrl.value) {
        URL.revokeObjectURL(profilePhotoBlobUrl.value);
    }
});

const initials = computed(() => {
    const name = user.value?.name || userData.value?.name || 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
});

// Watch for profile photo changes and load it
watch(() => user.value?.profile_photo, (newUrl) => {
    if (newUrl) {
        loadProfilePhoto(newUrl);
    } else {
        if (profilePhotoBlobUrl.value) {
            URL.revokeObjectURL(profilePhotoBlobUrl.value);
            profilePhotoBlobUrl.value = null;
        }
    }
}, { immediate: true });

const statusBadge = computed(() => user.value?.active
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-rose-50 text-rose-700 border border-rose-200');

// Profile photo upload with cropping
const photoInput = ref<HTMLInputElement | null>(null);
const showCropper = ref(false);
const selectedImageFile = ref<File | null>(null);

const handlePhotoClick = () => {
    photoInput.value?.click();
};

const handlePhotoChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Please select an image file',
            life: 3000,
        });
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Image size must be less than 5MB',
            life: 3000,
        });
        return;
    }

    selectedImageFile.value = file;
    showCropper.value = true;
    if (target) target.value = '';
};

const handleCropped = async (croppedFile: File) => {
    // Close dialog with a small delay to avoid race conditions with Vue's update cycle
    setTimeout(() => {
        showCropper.value = false;
        selectedImageFile.value = null;
    }, 0);
    
    uploadingPhoto.value = true;
    try {
        const formData = new FormData();
        formData.append('photo', croppedFile);
        
        const res = await axiosClient.post('/profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        user.value = res.data?.data || res.data;
        
        // Save updated profile to cache
        if (user.value && userData.value?.id) {
            saveProfileToCache(userData.value.id, user.value);
        }
        
        // Update auth store with new photo URL
        if (user.value) {
            const basicUserData = {
                id: user.value.id,
                name: user.value.name,
                email: user.value.email,
                login_id: user.value.login_id,
                nic: user.value.nic,
                phone: user.value.phone,
                roles: user.value.roles || [],
                permissions: user.value.permissions || [],
            };
            authStore.saveUserData(basicUserData);
        }
        
        // Dispatch event to refresh avatar in header
        window.dispatchEvent(new CustomEvent('profile-photo-updated'));
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile photo updated successfully',
            life: 3000,
        });
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to upload photo',
            life: 3000,
        });
    } finally {
        uploadingPhoto.value = false;
        // Ensure dialog is closed
        showCropper.value = false;
        selectedImageFile.value = null;
    }
};

const handleDeletePhoto = async () => {
    try {
        const res = await axiosClient.delete('/profile/photo');
        user.value = res.data?.data || res.data;
        
        // Save updated profile to cache
        if (user.value && userData.value?.id) {
            saveProfileToCache(userData.value.id, user.value);
        }
        
        // Dispatch event to refresh avatar in header
        window.dispatchEvent(new CustomEvent('profile-photo-updated'));
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile photo deleted successfully',
            life: 3000,
        });
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to delete photo',
            life: 3000,
        });
    }
};

const handleImageError = (event: Event) => {
    console.error('Failed to load profile image:', event);
    // Fallback to initials if image fails to load
    const target = event.target as HTMLImageElement;
    if (target) {
        target.style.display = 'none';
    }
};

// Update profile
const handleUpdateProfile = async () => {
    updatingProfile.value = true;
    try {
        const res = await axiosClient.put('/profile', editForm.value);
        user.value = res.data?.data || res.data;
        
        // Save updated profile to cache
        if (user.value && userData.value?.id) {
            saveProfileToCache(userData.value.id, user.value);
            
            // Update auth store
            const basicUserData = {
                id: user.value.id,
                name: user.value.name,
                email: user.value.email,
                login_id: user.value.login_id,
                nic: user.value.nic,
                phone: user.value.phone,
                roles: user.value.roles || [],
                permissions: user.value.permissions || [],
            };
            authStore.saveUserData(basicUserData);
        }
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully',
            life: 3000,
        });
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to update profile',
            life: 3000,
        });
    } finally {
        updatingProfile.value = false;
    }
};

// Change password
const handleChangePassword = async () => {
    if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Passwords do not match',
            life: 3000,
        });
        return;
    }

    changingPassword.value = true;
    try {
        await axiosClient.post('/profile/change-password', {
            current_password: passwordForm.value.current_password,
            password: passwordForm.value.password,
            password_confirmation: passwordForm.value.password_confirmation,
        });
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully',
            life: 3000,
        });
        
        // Reset form
        passwordForm.value = {
            current_password: '',
            password: '',
            password_confirmation: '',
        };
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to change password',
            life: 3000,
        });
    } finally {
        changingPassword.value = false;
    }
};

// Toggle 2FA
const handleToggle2FA = async (enabled: boolean) => {
    try {
        await axiosClient.post('/profile/two-factor', { enabled });
        user.value.two_factor_enabled = enabled;
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
            life: 3000,
        });
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to update 2FA',
            life: 3000,
        });
    }
};

// Resend verification email
const handleResendVerification = async () => {
    try {
        await axiosClient.post('/profile/resend-verification');
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Verification email sent successfully',
            life: 3000,
        });
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to send verification email',
            life: 3000,
        });
    }
};

// Export data
const handleExportData = async () => {
    try {
        const res = await axiosClient.get('/profile/export');
        const data = JSON.stringify(res.data?.data || res.data, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Data exported successfully',
            life: 3000,
        });
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to export data',
            life: 3000,
        });
    }
};

// Delete account
const handleDeleteAccount = async () => {
    if (!deleteAccountForm.value.confirm) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Please confirm account deletion',
            life: 3000,
        });
        return;
    }

    try {
        await axiosClient.delete('/profile/account', {
            data: {
                password: deleteAccountForm.value.password,
                confirm: deleteAccountForm.value.confirm,
            },
        });
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Account deleted successfully',
            life: 3000,
        });
        
        // Logout and redirect
        setTimeout(() => {
            authStore.logout();
            router.replace('/auth/login');
        }, 2000);
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to delete account',
            life: 3000,
        });
    }
};
</script>

<template>
    <MasterLayout>
        <div class="p-4">
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
                    <p class="text-sm text-gray-500">Manage your account settings and preferences</p>
                </div>
                <div class="flex items-center gap-3">
                    <button 
                        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" 
                        @click="router.back()">
                        <i class="fa-light fa-arrow-left"></i>
                        Back
                    </button>
                </div>
            </div>

            <div v-if="loading && !user" class="mt-6 text-sm text-gray-500">Loading...</div>

            <div v-else-if="user" class="mt-4">
                <!-- Profile Header Card -->
                <div class="rounded-lg border border-gray-200 bg-white p-6 mb-6">
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <div v-if="profilePhotoBlobUrl" class="h-24 w-24 rounded-full overflow-hidden border-2 border-indigo-200">
                                <img :src="profilePhotoBlobUrl" :alt="user.name" class="w-full h-full object-cover" @error="handleImageError">
                            </div>
                            <div v-else class="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
                                {{ initials }}
                            </div>
                            <button
                                @click="handlePhotoClick"
                                class="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg"
                                :disabled="uploadingPhoto"
                            >
                                <i v-if="uploadingPhoto" class="fa-light fa-spinner fa-spin"></i>
                                <i v-else class="fa-light fa-camera text-sm"></i>
                            </button>
                            <input
                                ref="photoInput"
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="handlePhotoChange"
                            />
                        </div>
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold text-gray-900">{{ user.name || 'User' }}</h2>
                            <p v-if="user.email" class="text-sm text-gray-500">{{ user.email }}</p>
                            <p v-if="user.login_id" class="text-xs text-gray-400 mt-1">ID: {{ user.login_id }}</p>
                            <div class="mt-2 flex items-center gap-2">
                                <div class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="statusBadge">
                                    <i :class="user.active ? 'fa-regular fa-circle-check mr-1' : 'fa-regular fa-circle-xmark mr-1'"></i>
                                    {{ user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown' }}
                                </div>
                                <button
                                    v-if="user.profile_photo"
                                    @click="handleDeletePhoto"
                                    class="text-xs text-red-600 hover:text-red-700"
                                >
                                    Remove Photo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <Tabs :value="activeTab" @update:value="activeTab = $event" class="w-full">
                    <TabList class="border-b border-gray-200">
                        <Tab value="overview">
                            <i class="fa-light fa-user mr-2"></i>
                            Overview
                        </Tab>
                        <Tab value="edit">
                            <i class="fa-light fa-edit mr-2"></i>
                            Edit Profile
                        </Tab>
                        <Tab value="security">
                            <i class="fa-light fa-shield-halved mr-2"></i>
                            Security
                        </Tab>
                        <Tab value="account">
                            <i class="fa-light fa-gear mr-2"></i>
                            Account
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <!-- Overview Tab -->
                        <TabPanel value="overview">
                            <div class="mt-6 space-y-4">
                                <!-- Basic Information -->
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fa-light fa-info-circle mr-2 text-indigo-600"></i>
                                        Basic Information
                                    </h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.name || 'N/A' }}</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.email || 'N/A' }}</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Login ID</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.login_id || 'N/A' }}</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">NIC</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.nic || 'N/A' }}</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.phone || 'N/A' }}</div>
                                        </div>
                                        <div v-if="user.alternative_phone">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Alternative Phone</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.alternative_phone }}</div>
                                        </div>
                                        <div v-if="user.area">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Area</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.area }}</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Role</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.role || user.current_role || 'N/A' }}</div>
                                        </div>
                                        <div v-if="user.address" class="md:col-span-2 lg:col-span-1">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.address }}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Employee Information -->
                                <div v-if="user.employee" class="rounded-lg border border-gray-200 bg-white p-6">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fa-light fa-briefcase mr-2 text-indigo-600"></i>
                                        Employee Information
                                    </h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Designation</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.employee.designation || 'N/A' }}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Customer Information -->
                                <div v-if="user.customer" class="rounded-lg border border-gray-200 bg-white p-6">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fa-light fa-user-tie mr-2 text-indigo-600"></i>
                                        Customer Information
                                    </h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div v-if="user.customer.fee_amount !== undefined">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fee Amount</div>
                                            <div class="text-sm font-medium text-gray-800">Rs. {{ user.customer.fee_amount?.toLocaleString() || '0' }}</div>
                                        </div>
                                        <div v-if="user.customer.payment_date">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Date</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.customer.payment_date }}</div>
                                        </div>
                                        <div v-if="user.customer.panel_id">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Panel ID</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.customer.panel_id }}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Authentication & Security -->
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fa-light fa-shield-halved mr-2 text-indigo-600"></i>
                                        Authentication & Security
                                    </h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div v-if="user.email_verified_at">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email Verified</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.email_verified_at }}</div>
                                        </div>
                                        <div v-if="user.last_login_at">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Login</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.last_login_at }}</div>
                                        </div>
                                        <div v-if="user.last_login_ip">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Login IP</div>
                                            <div class="text-sm font-medium text-gray-800 font-mono">{{ user.last_login_ip }}</div>
                                        </div>
                                        <div>
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Two-Factor Auth</div>
                                            <div class="text-sm font-medium" :class="user.two_factor_enabled ? 'text-emerald-600' : 'text-gray-600'">
                                                <i :class="user.two_factor_enabled ? 'fa-regular fa-circle-check mr-1' : 'fa-regular fa-circle-xmark mr-1'"></i>
                                                {{ user.two_factor_enabled ? 'Enabled' : 'Disabled' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Roles & Permissions -->
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div class="rounded-xl border border-gray-200 bg-white p-6">
                                        <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                            <i class="fa-light fa-shield mr-2 text-indigo-600"></i>
                                            Roles
                                        </h3>
                                        <div v-if="user.roles && user.roles.length > 0" class="space-y-2">
                                            <div 
                                                v-for="role in user.roles" 
                                                :key="role"
                                                class="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium mr-2 mb-2">
                                                <i class="fa-light fa-shield mr-1.5"></i>
                                                {{ role }}
                                            </div>
                                        </div>
                                        <div v-else class="text-xs text-gray-400">No roles assigned</div>
                                    </div>

                                    <div class="rounded-xl border border-gray-200 bg-white p-6">
                                        <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                            <i class="fa-light fa-key mr-2 text-indigo-600"></i>
                                            Permissions
                                        </h3>
                                        <div v-if="user.all_permissions && user.all_permissions.length > 0" class="space-y-1 max-h-64 overflow-y-auto">
                                            <div 
                                                v-for="permission in user.all_permissions" 
                                                :key="permission"
                                                class="text-xs text-gray-600 py-1">
                                                <i class="fa-light fa-check-circle text-emerald-500 mr-1.5"></i>
                                                {{ permission }}
                                            </div>
                                        </div>
                                        <div v-else class="text-xs text-gray-400">No permissions assigned</div>
                                    </div>
                                </div>

                                <!-- Account Information -->
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fa-light fa-clock mr-2 text-indigo-600"></i>
                                        Account Information
                                    </h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div v-if="user.created_at">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Account Created</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.created_at }}</div>
                                        </div>
                                        <div v-if="user.updated_at">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
                                            <div class="text-sm font-medium text-gray-800">{{ user.updated_at }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Edit Profile Tab -->
                        <TabPanel value="edit">
                            <div class="mt-6">
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-4">Edit Profile Information</h3>
                                    <form @submit.prevent="handleUpdateProfile" class="space-y-4">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                                <InputText v-model="editForm.name" class="w-full" />
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <InputText v-model="editForm.email" type="email" class="w-full" />
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                                <InputText v-model="editForm.phone" class="w-full" />
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Alternative Phone</label>
                                                <InputText v-model="editForm.alternative_phone" class="w-full" />
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">Area</label>
                                                <InputText v-model="editForm.area" class="w-full" />
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            <Textarea v-model="editForm.address" rows="3" class="w-full" />
                                        </div>
                                        <div class="flex justify-end">
                                            <Button 
                                                type="submit" 
                                                label="Save Changes" 
                                                :loading="updatingProfile"
                                                icon="pi pi-check"
                                            />
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Security Tab -->
                        <TabPanel value="security">
                            <div class="mt-6 space-y-4">
                                <!-- Change Password -->
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <h3 class="text-sm font-semibold text-gray-900 mb-4">Change Password</h3>
                                    <form @submit.prevent="handleChangePassword" class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                            <Password v-model="passwordForm.current_password" class="w-full" :feedback="false" toggleMask />
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                            <Password v-model="passwordForm.password" class="w-full" toggleMask />
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                            <Password v-model="passwordForm.password_confirmation" class="w-full" :feedback="false" toggleMask />
                                        </div>
                                        <div class="flex justify-end">
                                            <Button 
                                                type="submit" 
                                                label="Change Password" 
                                                :loading="changingPassword"
                                                icon="pi pi-key"
                                            />
                                        </div>
                                    </form>
                                </div>

                                <!-- Two-Factor Authentication -->
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h3 class="text-sm font-semibold text-gray-900 mb-1">Two-Factor Authentication</h3>
                                            <p class="text-xs text-gray-500">Add an extra layer of security to your account</p>
                                        </div>
                                        <ToggleSwitch 
                                            :modelValue="user.two_factor_enabled" 
                                            @update:modelValue="handleToggle2FA"
                                        />
                                    </div>
                                </div>

                                <!-- Email Verification -->
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h3 class="text-sm font-semibold text-gray-900 mb-1">Email Verification</h3>
                                            <p class="text-xs text-gray-500">
                                                {{ user.email_verified_at ? 'Your email is verified' : 'Please verify your email address' }}
                                            </p>
                                        </div>
                                        <Button 
                                            v-if="!user.email_verified_at"
                                            label="Resend Verification" 
                                            @click="handleResendVerification"
                                            icon="pi pi-envelope"
                                            severity="secondary"
                                            outlined
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Account Tab -->
                        <TabPanel value="account">
                            <div class="mt-6 space-y-4">
                                <!-- Export Data -->
                                <div class="rounded-lg border border-gray-200 bg-white p-6">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h3 class="text-sm font-semibold text-gray-900 mb-1">Export Your Data</h3>
                                            <p class="text-xs text-gray-500">Download a copy of your account data</p>
                                        </div>
                                        <Button 
                                            label="Export Data" 
                                            @click="handleExportData"
                                            icon="pi pi-download"
                                            severity="secondary"
                                            outlined
                                        />
                                    </div>
                                </div>

                                <!-- Delete Account -->
                                <div class="rounded-lg border border-red-200 bg-red-50 p-6">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h3 class="text-sm font-semibold text-red-900 mb-1">Delete Account</h3>
                                            <p class="text-xs text-red-700">Permanently delete your account and all associated data</p>
                                        </div>
                                        <Button 
                                            label="Delete Account" 
                                            @click="showDeleteAccountDialog = true"
                                            icon="pi pi-trash"
                                            severity="danger"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>
        </div>

        <!-- Delete Account Dialog -->
        <Dialog
            v-model:visible="showDeleteAccountDialog"
            modal
            header="Delete Account"
            :style="{ width: '500px' }"
        >
            <div class="space-y-4">
                <p class="text-sm text-gray-700">
                    This action cannot be undone. This will permanently delete your account and all associated data.
                </p>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Enter your password to confirm</label>
                    <Password v-model="deleteAccountForm.password" class="w-full" :feedback="false" toggleMask />
                </div>
                <div class="flex items-center">
                    <input
                        type="checkbox"
                        v-model="deleteAccountForm.confirm"
                        id="confirmDelete"
                        class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label for="confirmDelete" class="ml-2 text-sm text-gray-700">
                        I understand this action cannot be undone
                    </label>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" @click="showDeleteAccountDialog = false" severity="secondary" outlined />
                <Button 
                    label="Delete Account" 
                    @click="handleDeleteAccount"
                    severity="danger"
                    :disabled="!deleteAccountForm.confirm || !deleteAccountForm.password"
                />
            </template>
        </Dialog>

        <!-- Image Cropper Dialog -->
        <ImageCropper
            :visible="showCropper"
            :imageFile="selectedImageFile"
            @update:visible="(v: boolean) => { 
                showCropper = v; 
                if (!v) {
                    selectedImageFile = null;
                }
            }"
            @cropped="handleCropped"
        />

        <ConfirmDialog />
    </MasterLayout>
</template>
