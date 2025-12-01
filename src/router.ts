import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/authStore";
import { isCentralDomain, validateTenant } from "./utils/tenantValidation";

const requireAuth = (permissions?: string | string[]) => ({
  requiresAuth: true,
  permissions: permissions
    ? Array.isArray(permissions)
      ? permissions
      : [permissions]
    : [],
});

const routes = [
    // registeration urls
    {
        name: "Auth.Register",
        path: "/auth/register",
        component: () => import("./pages/Auth/Register.vue"),
    },
    {
        name: "Auth.Login",
        path: "/auth/login",
        component: () => import("./pages/Auth/Login.vue"),
    },


    {
        name: "Home.Index",
        path: "/",
        component: () => import("./pages/Home/Index.vue"),
        meta: requireAuth("view-dashboard"),
    },
    {
        name: "Home.Stats",
        path: "/stats",
        component: () => import("./pages/Home/Stats.vue"),
        meta: requireAuth("stats-dashboard"),
    },
    {
        name: "Home.Report",
        path: "/reports",
        component: () => import("./pages/Home/Report.vue"),
        meta: requireAuth("reports-dashboard"),
    },
	// ISP Modules
	{
		name: "Employees.Index",
		path: "/employees",
		component: () => import("./pages/Employees/Index.vue"),
        meta: requireAuth("view-employee"),
	},
	{
		name: "Employees.Create",
		path: "/employees/create",
		component: () => import("./pages/Employees/AddEmployee.vue"),
        meta: requireAuth("create-employee"),
	},
	{
		name: "Employees.Show",
		path: "/employees/:id",
		component: () => import("./pages/Employees/Show.vue"),
        meta: requireAuth("view-employee"),
	},
	{
		name: "Employees.Edit",
		path: "/employees/:id/edit",
		component: () => import("./pages/Employees/Edit.vue"),
        meta: requireAuth("update-employee"),
	},
	{
		name: "Customers.Index",
		path: "/customers",
		component: () => import("./pages/Customers/Index.vue"),
        meta: requireAuth("view-customer"),
	},
	{
		name: "Customers.Create",
		path: "/customers/create",
		component: () => import("./pages/Customers/AddCustomer.vue"),
        meta: requireAuth("create-customer"),
	},
	{
		name: "Customers.Show",
		path: "/customers/:id",
		component: () => import("./pages/Customers/Show.vue"),
        meta: requireAuth("view-customer"),
	},
	{
		name: "Customers.Edit",
		path: "/customers/:id/edit",
		component: () => import("./pages/Customers/Edit.vue"),
        meta: requireAuth("update-customer"),
	},
	{
		name: "Areas.Index",
		path: "/areas",
		component: () => import("./pages/Areas/Index.vue"),
        meta: requireAuth("view-area"),
	},
	{
		name: "Areas.OrgChartDemo",
		path: "/areas/orgchart-demo",
		component: () => import("./pages/Areas/OrgChartDemo.vue"),
        meta: requireAuth("view-area"),
	},
	{
		name: "Areas.Create",
		path: "/areas/create",
		component: () => import("./pages/Areas/AddArea.vue"),
        meta: requireAuth("create-area"),
	},
	{
		name: "Areas.Show",
		path: "/areas/:id",
		component: () => import("./pages/Areas/Show.vue"),
        meta: requireAuth("view-area"),
	},
	{
		name: "Areas.Edit",
		path: "/areas/:id/edit",
		component: () => import("./pages/Areas/EditAreaDialog.vue"),
        meta: requireAuth("update-area"),
	},
	{
		name: "Packages.Index",
		path: "/packages",
		component: () => import("./pages/Packages/Index.vue"),
        meta: requireAuth("view-package"),
	},
	{
		name: "Packages.Create",
		path: "/packages/create",
		component: () => import("./pages/Packages/AddPackage.vue"),
        meta: requireAuth("create-package"),
	},
	{
		name: "Packages.Show",
		path: "/packages/:id",
		component: () => import("./pages/Packages/Show.vue"),
        meta: requireAuth("view-package"),
	},
	{
		name: "Packages.Edit",
		path: "/packages/:id/edit",
		component: () => import("./pages/Packages/Edit.vue"),
        meta: requireAuth("update-package"),
	},
	{
		name: "PlanAddons.Index",
		path: "/packages/:id/addons",
		component: () => import("./pages/Packages/AddonsIndex.vue"),
        meta: requireAuth("view-plan-addon"),
	},
	{
		name: "PlanAddons.Create",
		path: "/packages/:id/addons/create",
		component: () => import("./pages/Packages/AddonsAdd.vue"),
        meta: requireAuth("create-plan-addon"),
	},
	{
		name: "PlanAddons.Edit",
		path: "/packages/:id/addons/:addonId/edit",
		component: () => import("./pages/Packages/AddonsEdit.vue"),
        meta: requireAuth("update-plan-addon"),
	},
	{
		name: "Subscriptions.Index",
		path: "/subscriptions",
		component: () => import("./pages/Subscriptions/Index.vue"),
        meta: requireAuth("view-subscription"),
	},
	{
		name: "Subscriptions.Create",
		path: "/subscriptions/create",
		component: () => import("./pages/Subscriptions/AddSubscription.vue"),
        meta: requireAuth("create-subscription"),
	},
	{
		name: "Subscriptions.Show",
		path: "/subscriptions/:id",
		component: () => import("./pages/Subscriptions/Show.vue"),
        meta: requireAuth("view-subscription"),
	},
	{
		name: "Subscriptions.Edit",
		path: "/subscriptions/:id/edit",
		component: () => import("./pages/Subscriptions/Edit.vue"),
        meta: requireAuth("update-subscription"),
	},
	{
		name: "Payments.Index",
		path: "/payments",
		component: () => import("./pages/Payments/Index.vue"),
        meta: requireAuth("view-payment"),
	},
	{
		name: "Payments.Create",
		path: "/payments/create",
		component: () => import("./pages/Payments/AddPayment.vue"),
        meta: requireAuth("create-payment"),
	},
	{
		name: "Invoices.Index",
		path: "/invoices",
		component: () => import("./pages/Invoices/Index.vue"),
        meta: requireAuth("view-invoice"),
	},
	{
		name: "Invoices.Create",
		path: "/invoices/create",
		component: () => import("./pages/Invoices/AddInvoice.vue"),
        meta: requireAuth("create-invoice"),
	},
	{
		name: "Invoices.Show",
		path: "/invoices/:id",
		component: () => import("./pages/Invoices/Show.vue"),
        meta: requireAuth("view-invoice"),
	},
	{
		name: "Complaints.Index",
		path: "/complaints",
		component: () => import("./pages/Complaints/Index.vue"),
        meta: requireAuth("view-complaint"),
	},
	{
		name: "Tasks.Index",
		path: "/tasks",
		component: () => import("./pages/Tasks/Index.vue"),
        meta: requireAuth("view-task"),
	},
	{
		name: "Equipment.Index",
		path: "/equipment",
		component: () => import("./pages/Equipment/Index.vue"),
        meta: requireAuth("view-equipment"),
	},
	{
		name: "Inventory.Index",
		path: "/inventory",
		component: () => import("./pages/Inventory/Index.vue"),
        meta: requireAuth("view-inventory"),
	},
	{
		name: "Network.Logs",
		path: "/network/logs",
		component: () => import("./pages/Network/Logs.vue"),
        meta: requireAuth("view-equipment"),
	},
	{
		name: "Communications.Index",
		path: "/communications",
		component: () => import("./pages/Communications/Index.vue"),
        meta: requireAuth("view-communication"),
	},
	{
		name: "Communications.Show",
		path: "/communications/:id",
		component: () => import("./pages/Communications/Show.vue"),
        meta: requireAuth("view-communication"),
	},
	{
		name: "Accounts.Index",
		path: "/accounts",
		component: () => import("./pages/Accounts/Index.vue"),
        meta: requireAuth("view-account"),
	},
	{
		name: "Reports.Index",
		path: "/reports",
		component: () => import("./pages/Reports/Index.vue"),
        meta: requireAuth("reports-dashboard"),
	},
	{
		name: "Contacts.Index",
		path: "/contacts",
		component: () => import("./pages/Contacts/Index.vue"),
        meta: requireAuth("view-customer"),
	},
	{
		name: "Profile.Index",
		path: "/profile",
		component: () => import("./pages/Profile/Index.vue"),
        meta: requireAuth(),
	},
	{
		name: "Settings.Index",
		path: "/settings",
		redirect: { name: "Settings.General" },
        meta: requireAuth("view-setting"),
	},
	{
		name: "Settings.General",
		path: "/settings/general",
		component: () => import("./pages/Settings/Index.vue"),
        meta: requireAuth("view-setting"),
	},
	{
		name: "Settings.Communication",
		path: "/settings/communication",
		component: () => import("./pages/Settings/Index.vue"),
        meta: requireAuth("view-setting"),
	},
	{
		name: "Settings.System",
		path: "/settings/system",
		component: () => import("./pages/Settings/Index.vue"),
        meta: requireAuth("view-setting"),
	},
	{
		name: "Settings.Security",
		path: "/settings/security",
		component: () => import("./pages/Settings/Index.vue"),
        meta: requireAuth("view-setting"),
	},
	{
		name: "Settings.Integration",
		path: "/settings/integration",
		component: () => import("./pages/Settings/Index.vue"),
        meta: requireAuth("view-setting"),
	},
	{
		name: "Settings.Preferences",
		path: "/settings/preferences",
		component: () => import("./pages/Settings/Index.vue"),
        meta: requireAuth("view-setting"),
	},
	{
		name: "Settings.Roles.Index",
		path: "/settings/roles",
		component: () => import("./pages/Settings/Roles/Index.vue"),
        meta: requireAuth("roles-settings"),
	},
	{
		name: "Settings.Roles.Show",
		path: "/settings/roles/:id",
		component: () => import("./pages/Settings/Roles/Show.vue"),
        meta: requireAuth("roles-settings"),
	},
	{
		name: "Settings.Roles.Edit",
		path: "/settings/roles/:id/edit",
		component: () => import("./pages/Settings/Roles/Edit.vue"),
        meta: requireAuth("roles-settings"),
	},
    {
        name: "User.Index",
        path: "/users",
        component: () => import("./pages/User/Index.vue"),
        meta: requireAuth("view-user"),
    },
    {
        name: "User.Create",
        path: "/users/create",
        component: () => import("./pages/User/AddUser.vue"),
        meta: requireAuth("create-user"),
    },
    {
        name: "User.Show",
        path: "/users/:id",
        component: () => import("./pages/User/Show.vue"),
        meta: requireAuth("view-user"),
    },
    {
        name: "User.Edit",
        path: "/users/:id/edit",
        component: () => import("./pages/User/Edit.vue"),
        meta: requireAuth("update-user"),
    },
    // Error pages
    {
        name: "Errors.InvalidTenant",
        path: "/errors/invalid-tenant",
        component: () => import("./pages/Errors/InvalidTenant.vue"),
    },
];


const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = Boolean(to.meta?.requiresAuth);
    const permissions = (to.meta?.permissions as string[] | undefined) ?? [];

    // Skip tenant validation for error pages and central domains
    if (to.name !== "Errors.InvalidTenant" && !isCentralDomain()) {
        // Validate tenant exists before allowing access
        const tenantValid = await validateTenant();
        if (!tenantValid) {
            return next({ name: "Errors.InvalidTenant" });
        }
    }

    if (!authStore.token) {
        if (requiresAuth) {
            return next({ name: "Auth.Login", query: { redirect: to.fullPath } });
        }
        return next();
    }

    if (!authStore.userData) {
        const ensured = await authStore.fetchCurrentUser();
        if (!ensured) {
            authStore.clearAuthData();
            return next({ name: "Auth.Login" });
        }
    }

    if (to.name === "Auth.Login" || to.name === "Auth.Register") {
        return next({ name: "Home.Index" });
    }

    if (requiresAuth && permissions.length && !authStore.hasAnyPermission(permissions)) {
        if (from.name && from.name !== "Auth.Login") {
            return next(false);
        }
        return next({ name: "Home.Index" });
    }

    return next();
});

export default router;