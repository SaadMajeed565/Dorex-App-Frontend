import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axiosClient from "../axios";

export interface Customer {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  plan: string;
  status: string;
  joinDate: string;
  lastPayment: string;
  balance: number;
  nic: string;
  loginId: string;
  panelId: string;
  panelPass: string;
}

export const useCustomerStore = defineStore("customers", () => {
  const customers = ref<Customer[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");
  const statusFilter = ref("All");
  const areaFilter = ref("All");

  // Status options
  const statusOptions = [
    { label: "All", value: "All" },
    { label: "Active", value: "Active" },
    { label: "Suspended", value: "Suspended" },
    { label: "Inactive", value: "Inactive" },
  ];

  // Get unique areas from customers
  const areas = computed(() => {
    const uniqueAreas = new Set(
      customers.value.map((c) => c.area).filter((a) => a && a !== "N/A")
    );
    return ["All", ...Array.from(uniqueAreas)];
  });

  // Filtered customers
  const filteredCustomers = computed(() => {
    return customers.value.filter((customer) => {
      const matchesSearch =
        !searchQuery.value ||
        customer.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        customer.phone.includes(searchQuery.value);

      const matchesStatus =
        statusFilter.value === "All" || customer.status === statusFilter.value;
      const matchesArea =
        areaFilter.value === "All" || customer.area === areaFilter.value;

      return matchesSearch && matchesStatus && matchesArea;
    });
  });

  // Statistics
  const stats = computed(() => {
    const total = customers.value.length;
    const active = customers.value.filter(
      (c) => c && c.status === "Active"
    ).length;
    const suspended = customers.value.filter(
      (c) => c && c.status === "Suspended"
    ).length;
    const totalRevenue = customers.value.reduce(
      (sum, c) => sum + (c && c.balance ? c.balance : 0),
      0
    );

    return { total, active, suspended, totalRevenue };
  });

  // Fetch customers
  const fetchCustomers = async () => {
    loading.value = true;
    try {
      const response = await axiosClient.get("/customers");
      if (response.data.status && response.data.customers) {
        customers.value = response.data.customers.map((customer: any) => ({
          id: customer.customer.id,
          name: customer.name || `Customer #${customer.id}`,
          email: customer.email || "N/A",
          phone: customer.phone || customer.alternative_phone || "N/A",
          address: customer.address || "N/A",
          area: customer.area || "N/A",
          plan: customer.customer?.fee_amount
            ? `Fee: $${customer.customer.fee_amount}`
            : "N/A",
          status: customer.status
            ? customer.status.charAt(0).toUpperCase() +
              customer.status.slice(1).toLowerCase()
            : "Unknown",
          joinDate: customer.customer?.created_at || "N/A",
          lastPayment: customer.customer?.payment_date || "N/A",
          balance: 0,
          nic: customer.nic || "N/A",
          loginId: customer.login_id || "N/A",
          panelId: customer.customer?.panel_id || "N/A",
          panelPass: customer.customer?.panel_password || "N/A",
        }));
      } else {
        customers.value = [];
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      customers.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Status color helper
  const getStatusSeverity = (status: string) => {
    const statusMap: Record<string, string> = {
      Active: "success",
      Suspended: "warn",
      Inactive: "secondary",
    };
    return statusMap[status] || "secondary";
  };

  // Balance color helper
  const getBalanceColor = (balance: number) => {
    return balance > 0 ? "text-red-600" : "text-green-600";
  };

  return {
    customers,
    loading,
    searchQuery,
    statusFilter,
    areaFilter,
    statusOptions,
    areas,
    filteredCustomers,
    stats,
    fetchCustomers,
    getStatusSeverity,
    getBalanceColor,
  };
});

