import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

function getDateRange(filter: string): { start: Date; label: string } {
  const now = new Date();
  const start = new Date();

  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      return { start, label: "Today" };
    case "week": {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      return { start, label: "This Week" };
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start, label: "This Month" };
    default:
      return { start: new Date(0), label: "All Time" };
  }
}

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const { start: dateStart } = getDateRange(filter);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtered sales (based on date filter)
    const filteredSales = await prisma.sale.findMany({
      where: { createdAt: { gte: dateStart } },
      include: { items: true },
    });

    // Recent sales (latest 10, always)
    const recentSales = await prisma.sale.findMany({
      take: 10,
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      ...(filter !== "all" ? { where: { createdAt: { gte: dateStart } } } : {}),
    });

    const [
      totalSalesCount,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      totalUsers,
      totalRevenueAgg,
      totalExpensesAgg,
    ] = await Promise.all([
      prisma.sale.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { stockQuantity: { lte: 10 } },
        select: { id: true, name: true, sku: true, stockQuantity: true, minStockLevel: true },
      }),
      prisma.customer.count(),
      prisma.user.count(),
      prisma.sale.aggregate({ _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    // Compute filtered stats
    const filteredRevenue = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount), 0
    );
    const filteredCogs = filteredSales.reduce((sum, sale) => {
      return sum + sale.items.reduce(
        (cog, item) => cog + Number(item.costPrice) * item.quantity, 0
      );
    }, 0);
    const filteredExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: dateStart } },
    });
    const filteredExpenseTotal = Number(filteredExpenses._sum.amount) || 0;

    // Sales chart — adapt based on filter
    let salesChart: { name: string; sales: number; profit: number }[] = [];

    if (filter === "today") {
      // Hourly breakdown for today
      const hourlyData: Record<string, { sales: number; profit: number }> = {};
      for (let h = 8; h <= 18; h++) {
        const label = `${h > 12 ? h - 12 : h}${h >= 12 ? "PM" : "AM"}`;
        hourlyData[label] = { sales: 0, profit: 0 };
      }
      for (const sale of filteredSales) {
        const hour = new Date(sale.createdAt).getHours();
        if (hour >= 8 && hour <= 18) {
          const label = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "PM" : "AM"}`;
          hourlyData[label].sales += Number(sale.totalAmount);
          const cogs = sale.items.reduce((s, i) => s + Number(i.costPrice) * i.quantity, 0);
          hourlyData[label].profit += Number(sale.totalAmount) - cogs;
        }
      }
      salesChart = Object.entries(hourlyData).map(([name, data]) => ({ name, ...data }));
    } else if (filter === "week") {
      // Daily breakdown for this week
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const salesByDay: Record<string, { sales: number; profit: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        salesByDay[dayNames[d.getDay()]] = { sales: 0, profit: 0 };
      }
      for (const sale of filteredSales) {
        const day = dayNames[new Date(sale.createdAt).getDay()];
        if (salesByDay[day]) {
          salesByDay[day].sales += Number(sale.totalAmount);
          const cogs = sale.items.reduce((s, i) => s + Number(i.costPrice) * i.quantity, 0);
          salesByDay[day].profit += Number(sale.totalAmount) - cogs;
        }
      }
      salesChart = Object.entries(salesByDay).map(([name, data]) => ({ name, ...data }));
    } else if (filter === "month") {
      // Daily breakdown for this month
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const salesByDay: Record<string, { sales: number; profit: number }> = {};
      for (let d = 1; d <= daysInMonth; d++) {
        salesByDay[`${d}`] = { sales: 0, profit: 0 };
      }
      for (const sale of filteredSales) {
        const day = new Date(sale.createdAt).getDate().toString();
        if (salesByDay[day]) {
          salesByDay[day].sales += Number(sale.totalAmount);
          const cogs = sale.items.reduce((s, i) => s + Number(i.costPrice) * i.quantity, 0);
          salesByDay[day].profit += Number(sale.totalAmount) - cogs;
        }
      }
      salesChart = Object.entries(salesByDay).map(([name, data]) => ({ name: `Day ${name}`, ...data }));
    } else {
      // All time: monthly breakdown
      const allSales = await prisma.sale.findMany({ include: { items: true }, orderBy: { createdAt: "asc" } });
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const salesByMonth: Record<string, { sales: number; profit: number }> = {};
      for (const sale of allSales) {
        const key = monthNames[new Date(sale.createdAt).getMonth()];
        if (!salesByMonth[key]) salesByMonth[key] = { sales: 0, profit: 0 };
        salesByMonth[key].sales += Number(sale.totalAmount);
        const cogs = sale.items.reduce((s, i) => s + Number(i.costPrice) * i.quantity, 0);
        salesByMonth[key].profit += Number(sale.totalAmount) - cogs;
      }
      salesChart = Object.entries(salesByMonth).map(([name, data]) => ({ name, ...data }));
    }

    // Category breakdown (filtered)
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: dateStart } } },
      include: { product: { include: { category: true } } },
    });
    const catMap: Record<string, number> = {};
    for (const si of saleItems) {
      const catName = si.product.category.name;
      catMap[catName] = (catMap[catName] || 0) + Number(si.total);
    }

    // AI Insights
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { saleItems: { where: filter !== "all" ? { sale: { createdAt: { gte: dateStart } } } : {} } },
    });

    const productSales = allProducts
      .map((p) => ({
        name: p.name,
        totalSold: p.saleItems.reduce((s, si) => s + si.quantity, 0),
        revenue: p.saleItems.reduce((s, si) => s + Number(si.total), 0),
        stock: p.stockQuantity,
        minStock: p.minStockLevel,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProduct = productSales[0];
    const topPercent = topProduct
      ? ((topProduct.revenue / (filteredRevenue || 1)) * 100).toFixed(0)
      : "0";

    const lowStockItems = allProducts.filter((p) => p.stockQuantity <= p.minStockLevel * 2);

    const insights = [];
    const filterLabel = filter === "today" ? "today" : filter === "week" ? "this week" : filter === "month" ? "this month" : "overall";

    if (filteredRevenue > 0) {
      insights.push({
        id: 1, type: "positive",
        title: "Revenue Trending",
        insight: `${filterLabel.charAt(0).toUpperCase() + filterLabel.slice(1)} revenue: ₦${filteredRevenue.toLocaleString()}. Net profit: ₦${(filteredRevenue - filteredCogs - filteredExpenseTotal).toLocaleString()}.`,
        action: "Keep up the momentum!",
      });
    }

    if (lowStockItems.length > 0) {
      insights.push({
        id: 2, type: "warning",
        title: "Stock Alert",
        insight: `${lowStockItems.length} product(s) are running low on stock.`,
        action: "Reorder recommended soon.",
      });
    }

    const recentCustomers = await prisma.sale.groupBy({
      by: ["customerId"], _count: true,
      where: { customerId: { not: null }, createdAt: { gte: dateStart } },
      orderBy: { _count: { customerId: "desc" } }, take: 1,
    });

    if (recentCustomers.length > 0 && recentCustomers[0]._count > 2) {
      insights.push({
        id: 3, type: "info",
        title: "Repeat Customer",
        insight: `A customer has placed ${recentCustomers[0]._count} orders ${filterLabel}. Valuable repeat buyer.`,
        action: "Consider a loyalty incentive.",
      });
    }

    if (topProduct && topProduct.revenue > 0) {
      insights.push({
        id: 4, type: "info",
        title: "Top Performer",
        insight: `${topProduct.name} leads with ${topPercent}% of revenue (${topProduct.totalSold} units ${filterLabel}).`,
        action: "Ensure consistent stock for this product.",
      });
    }

    const totalRevenue = Number(totalRevenueAgg._sum.totalAmount) || 0;
    const totalExpenses = Number(totalExpensesAgg._sum.amount) || 0;

    return NextResponse.json({
      stats: {
        todayRevenue: filteredRevenue,
        todayProfit: filteredRevenue - filteredCogs - filteredExpenseTotal,
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        totalCustomers,
        totalUsers,
        totalSalesCount,
        todaySalesCount: filteredSales.length,
        filteredExpenses: filteredExpenseTotal,
      },
      salesChart,
      categoryChart: Object.entries(catMap).map(([name, value]) => ({ name, value })),
      recentSales: recentSales.map((s) => ({
        id: s.id,
        customer: s.customer?.name || "Walk-in",
        amount: Number(s.totalAmount),
        items: s.items.reduce((sum, i) => sum + i.quantity, 0),
        product: s.items[0]?.product?.name || "N/A",
        date: s.createdAt,
        status: s.status.toLowerCase(),
      })),
      lowStockProducts: lowStockProducts.map((p) => ({
        name: p.name, sku: p.sku, stock: p.stockQuantity, min: p.minStockLevel,
      })),
      insights,
      topProducts: productSales.slice(0, 5),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
