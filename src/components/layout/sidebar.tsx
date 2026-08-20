"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, BarChart3,
  Settings, TrendingUp, ClipboardList, Tags, Tag, DollarSign,
  UserCircle, Receipt, PieChart, RotateCcw,
  X, Menu, FileText
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Role } from "@/generated/prisma";
import Logo from "@/components/ui/logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const ROLE_NAV: Record<Role, NavGroup[]> = {
  ADMIN: [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "/admin/analytics", icon: PieChart },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Settings", href: "/admin/settings", icon: Settings },
        { label: "Discounts", href: "/admin/discounts", icon: Tag },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Point of Sale", href: "/sales/pos", icon: ShoppingCart },
        { label: "Products", href: "/warehouse/products", icon: Package },
        { label: "Stock Movements", href: "/warehouse/stock", icon: TrendingUp },
        { label: "Suppliers", href: "/warehouse/suppliers", icon: Truck },
        { label: "Purchase Orders", href: "/warehouse/purchase-orders", icon: ClipboardList },
        { label: "Customers", href: "/sales/customers", icon: UserCircle },
        { label: "Sales History", href: "/sales/history", icon: ClipboardList },
        { label: "Returns", href: "/sales/returns", icon: RotateCcw },
        { label: "Register Sessions", href: "/sales/cash-register", icon: DollarSign },
        { label: "Expenses", href: "/accountant/expenses", icon: Receipt },
        { label: "Reports", href: "/accountant/reports", icon: FileText },
      ],
    },
  ],
  SALES: [
    {
      title: "Sales",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Point of Sale", href: "/sales/pos", icon: ShoppingCart },
        { label: "Cash Register", href: "/sales/cash-register", icon: DollarSign },
        { label: "Sales History", href: "/sales/history", icon: ClipboardList },
        { label: "Returns", href: "/sales/returns", icon: RotateCcw },
        { label: "Customers", href: "/sales/customers", icon: UserCircle },
      ],
    },
    {
      title: "Catalog",
      items: [
        { label: "Analytics", href: "/admin/analytics", icon: PieChart },
      ],
    },
  ],
  WAREHOUSE: [
    {
      title: "Inventory",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Products", href: "/warehouse/products", icon: Package },
        { label: "Stock Movements", href: "/warehouse/stock", icon: TrendingUp },
        { label: "Categories", href: "/warehouse/categories", icon: Tags },
      ],
    },
    {
      title: "Supply Chain",
      items: [
        { label: "Suppliers", href: "/warehouse/suppliers", icon: Truck },
        { label: "Purchase Orders", href: "/warehouse/purchase-orders", icon: ClipboardList },
      ],
    },
  ],
  ACCOUNTANT: [
    {
      title: "Finance",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Profit & Loss", href: "/accountant/profit-loss", icon: TrendingUp },
        { label: "Expenses", href: "/accountant/expenses", icon: Receipt },
        { label: "Reports", href: "/accountant/reports", icon: FileText },
      ],
    },
    {
      title: "Overview",
      items: [
        { label: "Sales Overview", href: "/sales/history", icon: BarChart3 },
        { label: "Customers", href: "/sales/customers", icon: UserCircle },
        { label: "Returns", href: "/sales/returns", icon: RotateCcw },
        { label: "Register Sessions", href: "/sales/cash-register", icon: DollarSign },
        { label: "Stock Movements", href: "/warehouse/stock", icon: TrendingUp },
      ],
    },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarContent({ role, onClose }: { role: Role; onClose: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const navGroups = ROLE_NAV[role] || ROLE_NAV.SALES;
  const [storeName, setStoreName] = useState("FirstLady");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => { if (d.storeName) setStoreName(d.storeName); }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <Logo size={40} />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{storeName}</h1>
            <p className="text-[10px] text-gray-400 -mt-0.5">POS System</p>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(user?.name || "U")
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-400 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = (user?.role as Role) || "SALES";
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-72 bg-white border-r border-gray-100 lg:hidden"
          >
            <SidebarContent role={role} onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      {mounted && (
        <aside className="hidden lg:flex fixed left-0 top-0 z-50 h-full w-72 bg-white border-r border-gray-100 flex-col">
          <SidebarContent role={role} onClose={onClose} />
        </aside>
      )}
    </>
  );
}
