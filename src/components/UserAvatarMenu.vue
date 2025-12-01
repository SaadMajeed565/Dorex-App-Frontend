<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { storeToRefs } from 'pinia'
import axiosClient from '../axios'

const router = useRouter()
const authStore = useAuthStore()
const { userData } = storeToRefs(authStore)

// State
const showMenu = ref(false)
const profilePhotoBlobUrl = ref<string | null>(null)

// Computed user info
const user = computed(() => ({
  name: userData.value?.name || 'User',
  email: userData.value?.email || '',
  initials: (userData.value?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}))

// Generate cache key for profile photo (based on user ID only)
const getCacheKey = (userId: number | string | undefined) => {
  if (!userId) return null
  return `profile_photo_${userId}`
}

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

// Convert blob to base64 for localStorage storage
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Load image from localStorage
const loadImageFromCache = (cacheKey: string): string | null => {
  try {
    const cachedBase64 = localStorage.getItem(cacheKey)
    return cachedBase64
  } catch (error) {
    console.error('Failed to load image from cache:', error)
    return null
  }
}

// Load profile photo
const loadProfilePhoto = async (photoUrl: string | null, forceRefresh: boolean = false) => {
    if (!photoUrl) {
        if (profilePhotoBlobUrl.value) {
            // Don't revoke if it's a data URL (from cache)
            if (!profilePhotoBlobUrl.value.startsWith('data:')) {
                URL.revokeObjectURL(profilePhotoBlobUrl.value);
            }
            profilePhotoBlobUrl.value = null;
        }
        return;
    }

    const userId = userData.value?.id
    const cacheKey = userId ? getCacheKey(userId) : null

    // Try to load from cache first (unless forcing refresh)
    if (cacheKey && !forceRefresh) {
        const cachedImage = loadImageFromCache(cacheKey)
        if (cachedImage) {
            // Clean up old blob URL if it's not a data URL
            if (profilePhotoBlobUrl.value && !profilePhotoBlobUrl.value.startsWith('data:')) {
                URL.revokeObjectURL(profilePhotoBlobUrl.value);
            }
            // Show cached image immediately
            profilePhotoBlobUrl.value = cachedImage
        }
    }

    try {
        // Fetch new image from server
        const response = await axiosClient.get(photoUrl, {
            responseType: 'blob',
        });

        // Convert to base64 and save to cache
        let newImageBase64: string | null = null
        if (cacheKey) {
            newImageBase64 = await blobToBase64(response.data)
            localStorage.setItem(cacheKey, newImageBase64)
        }

        // Clean up old blob URL if it's not a data URL
        if (profilePhotoBlobUrl.value && !profilePhotoBlobUrl.value.startsWith('data:')) {
            URL.revokeObjectURL(profilePhotoBlobUrl.value);
        }
        
        // Update to show the new image - use cached base64 if available, otherwise create blob URL
        if (newImageBase64) {
            profilePhotoBlobUrl.value = newImageBase64
        } else {
            profilePhotoBlobUrl.value = URL.createObjectURL(response.data)
        }
    } catch (error) {
        console.error('Failed to load profile photo:', error);
        // If we failed to load and don't have a cached version, clear it
        if (!cacheKey || !loadImageFromCache(cacheKey)) {
            if (profilePhotoBlobUrl.value && !profilePhotoBlobUrl.value.startsWith('data:')) {
                URL.revokeObjectURL(profilePhotoBlobUrl.value);
            }
            profilePhotoBlobUrl.value = null;
        }
        // Otherwise, keep showing the cached version (already displayed above)
    }
};

// Load cached image for user (for initial display)
const loadCachedPhotoForUser = () => {
    const userId = userData.value?.id
    if (!userId) return false
    
    const cacheKey = getCacheKey(userId)
    if (!cacheKey) return false
    
    try {
        const cachedImage = loadImageFromCache(cacheKey)
        if (cachedImage) {
            profilePhotoBlobUrl.value = cachedImage
            return true
        }
    } catch (error) {
        console.error('Failed to load cached photo:', error)
    }
    return false
}

// Fetch user profile to get photo URL
const fetchUserProfile = async (forceRefresh: boolean = false) => {
    const userId = userData.value?.id
    if (!userId) return
    
    // Try to load cached profile first (unless forcing refresh)
    let cachedProfile: any = null
    let pollutedFields: string[] = []
    
    if (!forceRefresh) {
        cachedProfile = loadProfileFromCache(userId)
        if (cachedProfile) {
            // Check which fields are polluted
            pollutedFields = getPollutedFields(cachedProfile)
            
            // Use cached profile photo if available and not polluted
            if (cachedProfile.profile_photo && !isPolluted(cachedProfile.profile_photo)) {
                loadProfilePhoto(cachedProfile.profile_photo, false)
            } else {
                loadCachedPhotoForUser()
            }
            
            // If no polluted fields, we can use cached data entirely
            if (pollutedFields.length === 0) {
                return
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
            
            // Load photo from the final profile
            if (finalProfile?.profile_photo) {
                loadProfilePhoto(finalProfile.profile_photo, forceRefresh);
            } else {
                // If no photo URL, try to load cached one if available
                if (!forceRefresh) {
                    loadCachedPhotoForUser()
                }
            }
        }
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // On error, try to load cached photo
        if (!forceRefresh) {
            if (cachedProfile?.profile_photo) {
                loadProfilePhoto(cachedProfile.profile_photo, false)
            } else {
                loadCachedPhotoForUser()
            }
        }
    }
};

// Toggle dropdown visibility
const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

// Close when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const menu = document.getElementById('avatar-menu')
  if (menu && !menu.contains(event.target as Node)) {
    showMenu.value = false
  }
}

const logout = async () => {
  await authStore.logout()
  router.replace('/auth/login')
}

const goToProfile = () => {
  showMenu.value = false
  router.push({ name: 'Profile.Index' })
}

// Store event handler reference for cleanup
let photoUpdateHandler: (() => void) | null = null

// Fetch user data if not available
onMounted(async () => {
  if (!userData.value) {
    await authStore.fetchCurrentUser()
  }
  
  // Try to load cached profile data first
  const userId = userData.value?.id
  if (userId) {
    const cachedProfile = loadProfileFromCache(userId)
    if (cachedProfile) {
      // Use cached photo immediately if available
      if (cachedProfile.profile_photo && !isPolluted(cachedProfile.profile_photo)) {
        loadProfilePhoto(cachedProfile.profile_photo, false)
      } else {
        loadCachedPhotoForUser()
      }
    } else {
      // No cached profile, try cached photo
      loadCachedPhotoForUser()
    }
  }
  
  // Then fetch profile from server (will update cache and display)
  await fetchUserProfile()
  document.addEventListener('click', handleClickOutside)
  // Listen for profile photo update events
  photoUpdateHandler = () => fetchUserProfile(true)
  window.addEventListener('profile-photo-updated', photoUpdateHandler)
})

// Watch for user data changes to reload photo
watch(() => userData.value?.id, () => {
  fetchUserProfile()
})

onUnmounted(() => {
  if (photoUpdateHandler) {
    window.removeEventListener('profile-photo-updated', photoUpdateHandler)
  }
  if (profilePhotoBlobUrl.value) {
    // Only revoke blob URLs, not data URLs (cached images)
    if (!profilePhotoBlobUrl.value.startsWith('data:')) {
      URL.revokeObjectURL(profilePhotoBlobUrl.value)
    }
  }
})

// Expose method to refresh photo (can be called from outside)
defineExpose({
  refreshPhoto: fetchUserProfile
})
</script>

<template>
  <div id="avatar-menu" class="relative">
    <!-- Avatar -->
    <button @click.stop="toggleMenu" class="focus:outline-none">
      <div v-if="profilePhotoBlobUrl" class="h-8 w-8 rounded-full overflow-hidden border-2 border-indigo-200 cursor-pointer hover:scale-105 transition">
        <img :src="profilePhotoBlobUrl" :alt="user.name" class="w-full h-full object-cover" />
      </div>
      <div v-else class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white text-xs font-medium shadow-sm cursor-pointer hover:scale-105 transition">
        {{ user.initials }}
      </div>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
      >
        <div class="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
          <p class="font-semibold">{{ user.name }}</p>
          <p v-if="user.email" class="text-xs text-gray-500 mt-0.5">{{ user.email }}</p>
          <p v-if="userData?.login_id" class="text-xs text-gray-400 mt-0.5">ID: {{ userData.login_id }}</p>
        </div>
        <button
          @click="goToProfile"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
          <i class="fa-light fa-user mr-2"></i>
          Profile
        </button>
        <button
          @click="logout"
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
          <i class="fa-light fa-sign-out mr-2"></i>
          Logout
        </button>
      </div>
    </transition>
  </div>
</template>
