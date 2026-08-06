import { Role, PaymentMethod, OrderStatus, StockMovementType, ExpenseStatus } from "@/generated/prisma";

export type { Role, PaymentMethod, OrderStatus, StockMovementType, ExpenseStatus };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalUsers: number;
  recentSales: any[];
  topProducts: any[];
  salesByDay: any[];
  salesByCategory: any[];
  stockValue: number;
}

export interface ProfitLossReport {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  margin: number;
}

export interface SalesReport {
  date: string;
  count: number;
  revenue: number;
  profit: number;
}

export interface StockReport {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  value: number;
  movementCount: number;
  lastMovement: string;
}

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  quantity: number;
  maxQuantity: number;
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    "dashboard:view",
    "users:view", "users:create", "users:edit", "users:delete",
    "products:view", "products:create", "products:edit", "products:delete",
    "sales:view", "sales:create", "sales:delete",
    "customers:view", "customers:create", "customers:edit", "customers:delete",
    "suppliers:view", "suppliers:create", "suppliers:edit", "suppliers:delete",
    "stock:view", "stock:adjust", "stock:transfer",
    "expenses:view", "expenses:create", "expenses:approve", "expenses:delete",
    "reports:view", "reports:export",
    "categories:view", "categories:create", "categories:edit", "categories:delete",
    "settings:manage",
    "analytics:view",
  ],
  SALES: [
    "dashboard:view",
    "sales:view", "sales:create",
    "customers:view", "customers:create", "customers:edit",
    "products:view",
    "categories:view",
  ],
  WAREHOUSE: [
    "dashboard:view",
    "products:view", "products:create", "products:edit",
    "stock:view", "stock:adjust", "stock:transfer",
    "suppliers:view", "suppliers:create", "suppliers:edit",
    "categories:view", "categories:create", "categories:edit",
  ],
  ACCOUNTANT: [
    "dashboard:view",
    "sales:view",
    "expenses:view", "expenses:create", "expenses:approve",
    "reports:view", "reports:export",
    "analytics:view",
    "products:view",
    "customers:view",
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
