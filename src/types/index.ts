import { Role, PaymentMethod, OrderStatus, StockMovementType } from "@/generated/prisma";

export type { Role, PaymentMethod, OrderStatus, StockMovementType };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
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
