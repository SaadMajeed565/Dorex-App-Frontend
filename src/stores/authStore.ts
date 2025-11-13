import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axiosClient from "../axios";
import axios, { AxiosError } from "axios";

export interface UserData {
  id?: number | string;
  name?: string;
  email?: string;
  login_id?: string;
  nic?: string;
  phone?: string;
  roles: string[];
  permissions: string[];
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("token"));
  const userData = ref<UserData | null>(getUserDataFromStorage());
  const isLoadingUser = ref(false);

  function getUserDataFromStorage(): UserData | null {
    const userDataStr = localStorage.getItem("userData");
    if (!userDataStr) return null;
    try {
      const parsed = JSON.parse(userDataStr);
      return normalizeUserData(parsed);
    } catch {
      return null;
    }
  }

  function normalizeUserData(payload: any): UserData {
    return {
      id: payload?.id,
      name: payload?.name || "",
      email: payload?.email || "",
      login_id: payload?.login_id || "",
      nic: payload?.nic || "",
      phone: payload?.phone || "",
      roles: Array.isArray(payload?.roles) ? payload.roles : [],
      permissions: Array.isArray(payload?.permissions) ? payload.permissions : [],
    };
  }

  function saveUserData(data: UserData | null) {
    if (!data) {
      localStorage.removeItem("userData");
      userData.value = null;
      return;
    }

    const normalized = normalizeUserData(data);
    localStorage.setItem("userData", JSON.stringify(normalized));
    userData.value = normalized;
  }

  function clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    token.value = null;
    userData.value = null;
  }

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem("token", newToken);
  }

  async function logout(): Promise<void> {
    if (!token.value) {
      clearAuthData();
      return;
    }

    try {
      await axiosClient.post("/logout");
    } catch (error) {
      const err = error as AxiosError;
      if (axios.isAxiosError(err)) {
        console.error("logout failed", {
          status: err.response?.status,
          data: err.response?.data,
        });
      } else {
        console.error("logout failed", err);
      }
    } finally {
      clearAuthData();
    }
  }

  async function fetchCurrentUser(): Promise<boolean> {
    if (!token.value) return false;
    if (isLoadingUser.value) return !!userData.value;

    isLoadingUser.value = true;
    try {
      const { data } = await axiosClient.get("/user");
      const payload =
        data && typeof data === "object" && "data" in (data as Record<string, unknown>)
          ? (data as Record<string, unknown>)["data"]
          : "user" in (data as Record<string, unknown>)
            ? (data as Record<string, unknown>)["user"]
            : data;

      saveUserData(payload as UserData);
      return true;
    } catch (error) {
      const err = error as AxiosError;
      if (axios.isAxiosError(err)) {
        console.error("fetchCurrentUser failed", {
          status: err.response?.status,
          data: err.response?.data,
        });
      } else {
        console.error("fetchCurrentUser failed", err);
      }
      clearAuthData();
      return false;
    } finally {
      isLoadingUser.value = false;
    }
  }

  async function authenticateToken(): Promise<boolean> {
    if (!token.value) return false;
    if (userData.value) return true;

    return await fetchCurrentUser();
  }

  function getLoginIdentifier(): string {
    if (!userData.value) return "";
    return userData.value.email || userData.value.login_id || "";
  }

  function hasPermission(permission: string): boolean {
    if (!permission) return true;
    return userData.value?.permissions?.includes(permission) ?? false;
  }

  function hasAnyPermission(permissions: string[] = []): boolean {
    if (!permissions.length) return true;
    return permissions.some((permission) => hasPermission(permission));
  }

  function hasAllPermissions(permissions: string[] = []): boolean {
    if (!permissions.length) return true;
    return permissions.every((permission) => hasPermission(permission));
  }

  function hasRole(role: string): boolean {
    if (!role) return true;
    return userData.value?.roles?.includes(role) ?? false;
  }

  function hasAnyRole(roles: string[] = []): boolean {
    if (!roles.length) return true;
    return roles.some((role) => hasRole(role));
  }

  const isAuthenticated = computed(() => Boolean(token.value && userData.value));

  return {
    token,
    userData,
    isAuthenticated,
    isLoadingUser,
    saveUserData,
    clearAuthData,
    setToken,
    logout,
    fetchCurrentUser,
    authenticateToken,
    getLoginIdentifier,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  };
});

