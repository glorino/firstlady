import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSales,
      todaySales,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      totalUsers,
      recentSales,
      totalRevenue,
      totalExpenses,
    ] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.findMany({
        where: { createdAt: { gte: today } },
        include: { items: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { stockQuantity: { lte: prisma.product.fields.minStockLevel } },
        select: { id: true, name: true, stockQuantity: true, minStockLevel: true },
      }),
      prisma.customer.count(),
      prisma.user.count(),
      prisma.sale.findMany({
        take: 10,
        include: { customer: true, items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sale.aggregate({ _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const todayCogs = todaySales.reduce((sum, sale) => {
      return sum + sale.items.reduce((cog, item) => cog + Number(item.costPrice) * item.quantity, 0);
    }, 0);

    return NextResponse.json({
      totalSales: totalSales,
      todaySales: todaySales.length,
      todayRevenue,
      todayProfit: todayRevenue - todayCogs,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      totalCustomers,
      totalUsers,
      recentSales,
      totalRevenue: Number(totalRevenue._sum.totalAmount) || 0,
      totalExpenses: Number(totalExpenses._sum.amount) || 0,
      profit: (Number(totalRevenue._sum.totalAmount) || 0) - (Number(totalExpenses._sum.amount) || 0),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
