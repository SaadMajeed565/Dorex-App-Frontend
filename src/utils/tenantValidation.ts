import axios from "axios";

/**
 * Central domains that don't require tenant validation
 * These should match the backend config/tenancy.php central_domains
 */
const CENTRAL_DOMAINS = [
  "127.0.0.1",
  "localhost",
  "127.0.0.1:8000",
  "localhost:8000",
];

/**
 * Cache for tenant validation results
 * Key: hostname, Value: { valid: boolean, timestamp: number }
 */
const validationCache = new Map<string, { valid: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the validation cache for a specific hostname or all hostnames
 * Useful when tenant is created/updated or for testing
 */
export function clearValidationCache(hostname?: string): void {
  if (hostname) {
    validationCache.delete(hostname);
  } else {
    validationCache.clear();
  }
}

/**
 * Check if the current domain is a central domain
 */
export function isCentralDomain(): boolean {
  const hostname = window.location.hostname;
  const hostWithPort = `${hostname}${window.location.port ? `:${window.location.port}` : ""}`;
  
  return (
    CENTRAL_DOMAINS.includes(hostname) || 
    CENTRAL_DOMAINS.includes(hostWithPort)
  );
}

/**
 * Get API base URL for tenant validation
 * This uses a separate axios instance to avoid circular dependencies
 */
function getApiBaseUrl(): string {
  const currentHostname = window.location.hostname;
  
  if (import.meta.env.VITE_API_BASE_URL) {
    try {
      const envUrl = new URL(import.meta.env.VITE_API_BASE_URL);
      envUrl.hostname = currentHostname;
      return envUrl.toString().replace(/\/$/, "");
    } catch (e) {
      console.error("[Tenant Validation] Invalid VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
    }
  }
  
  const protocol = window.location.protocol;
  const apiPort = import.meta.env.VITE_API_PORT || "8000";
  const port = apiPort ? `:${apiPort}` : "";
  return `${protocol}//${currentHostname}${port}/api`;
}

/**
 * Validate that the current tenant exists and is accessible
 * Returns true if tenant is valid, false otherwise
 * Results are cached for 5 minutes to avoid repeated API calls
 */
export async function validateTenant(): Promise<boolean> {
  // Central domains don't need tenant validation
  if (isCentralDomain()) {
    return true;
  }

  const hostname = window.location.hostname;
  const now = Date.now();

  // Check cache first
  const cached = validationCache.get(hostname);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.valid;
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get(`${apiBaseUrl}/`, {
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    // Backend tenant route returns 200 with tenant info if tenant exists
    // If tenant doesn't exist, backend middleware returns 404
    if (response.status === 200) {
      // Check if response contains tenant info
      // Backend returns: "api is working! dont worry, just relax - Tenant: {id}"
      const responseText = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
      
      // If response mentions "Tenant:", it means tenant was identified
      if (responseText.includes('Tenant:')) {
        validationCache.set(hostname, { valid: true, timestamp: now });
        return true;
      }
      
      // If it's a JSON response with tenant info, also valid
      if (response.data && (response.data.tenant_id || response.data.tenant)) {
        validationCache.set(hostname, { valid: true, timestamp: now });
        return true;
      }
      
      // Otherwise, assume valid if we got 200
      validationCache.set(hostname, { valid: true, timestamp: now });
      return true;
    }

    // 404 means tenant doesn't exist
    if (response.status === 404) {
      console.warn("[Tenant Validation] Tenant not found (404)");
      validationCache.set(hostname, { valid: false, timestamp: now });
      return false;
    }

    // Other 4xx errors - might be auth or other issues, but tenant context exists
    // Allow access and let the app handle the error
    if (response.status >= 400 && response.status < 500) {
      console.warn("[Tenant Validation] Got 4xx response, but tenant context exists:", response.status);
      validationCache.set(hostname, { valid: true, timestamp: now });
      return true; // Tenant exists, but there's another issue (auth, etc.)
    }

    validationCache.set(hostname, { valid: false, timestamp: now });
    return false;
  } catch (error: any) {
    // Handle different types of errors
    console.error("[Tenant Validation] Error validating tenant:", error);
    
    // Network errors (CORS, connection refused, etc.)
    if (!error.response) {
      // No response means network error
      // This could be:
      // - Backend not running
      // - CORS issue
      // - Network connectivity problem
      console.error("[Tenant Validation] Network error - backend might not be accessible");
      
      // For development, we might want to be more lenient
      // But for security, fail closed
      // You can change this to `true` if you want to allow access when backend is down
      // Don't cache network errors - they might be temporary
      return false;
    }
    
    // HTTP errors with response
    const status = error.response?.status;
    
    // 404 means tenant doesn't exist
    if (status === 404) {
      validationCache.set(hostname, { valid: false, timestamp: now });
      return false;
    }
    
    // 401/403 might mean auth required, but tenant exists
    if (status === 401 || status === 403) {
      console.warn("[Tenant Validation] Auth required, but tenant exists");
      validationCache.set(hostname, { valid: true, timestamp: now });
      return true; // Tenant exists, just needs auth
    }
    
    // Timeout
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.error("[Tenant Validation] Request timeout");
      // Don't cache timeout errors - might be temporary
      return false;
    }
    
    // Other errors - fail closed for security
    console.error("[Tenant Validation] Unexpected error:", status);
    validationCache.set(hostname, { valid: false, timestamp: now });
    return false;
  }
}

