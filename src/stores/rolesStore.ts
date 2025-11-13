import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axiosClient from "../axios";

export interface Role {
  id: string | number;
  name: string;
  description?: string;
  guard_name?: string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export const useRolesStore = defineStore("roles", () => {
  const roles = ref<Role[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");

  const normalizePermissions = (rawPermissions: any): string[] => {
    if (!Array.isArray(rawPermissions)) {
      return [];
    }

    return rawPermissions
      .map((permission) => {
        if (!permission) return null;

        if (typeof permission === "string") {
          return permission;
        }

        if (typeof permission === "object") {
          return permission.name ?? permission.key ?? null;
        }

        return null;
      })
      .filter((permission): permission is string => Boolean(permission));
  };

  const filteredRoles = computed(() => {
    if (!searchQuery.value) return roles.value;
    const term = searchQuery.value.toLowerCase();
    return roles.value.filter((role) =>
      role.name?.toLowerCase().includes(term) ||
      role.description?.toLowerCase().includes(term)
    );
  });

  // Statistics
  const stats = computed(() => {
    const total = roles.value.length;
    const totalPermissions = roles.value.reduce(
      (sum, role) => sum + (role.permissions?.length || 0),
      0
    );
    const avgPermissions = total > 0 ? Math.round(totalPermissions / total) : 0;

    return { total, totalPermissions, avgPermissions };
  });

  // Fetch roles
  const fetchRoles = async () => {
    loading.value = true;
    try {
      const response = await axiosClient.get("/roles");
      const payload = response.data.roles ?? response.data ?? [];

      roles.value = Array.isArray(payload)
        ? payload.map((role: any) => ({
            id: role.id,
            name: role.name || `Role #${role.id}`,
            description: role.description || "",
            guard_name: role.guard_name || "api",
            permissions: normalizePermissions(role.permissions),
            created_at: role.created_at,
            updated_at: role.updated_at,
          }))
        : [];
    } catch (error) {
      console.error("Error fetching roles:", error);
      roles.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Get role by ID
  const getRoleById = (id: string | number) => {
    return roles.value.find((role) => role.id === id);
  };

  // Get permission count for a role
  const getPermissionCount = (role: Role) => {
    return role.permissions?.length || 0;
  };

  return {
    roles,
    loading,
    searchQuery,
    filteredRoles,
    stats,
    fetchRoles,
    getRoleById,
    getPermissionCount,
  };
});

