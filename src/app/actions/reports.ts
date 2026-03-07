"use server";

import { db } from "@/lib/db";
import { orders, orderItems, products, users, tiers } from "@/lib/db/schema";
import { eq, and, sql, desc, gte, lte, or, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function getTierMonthlyReport(tierId: string, month: number, year: number) {
    // ... rest truncated for replacement below
    try {
        const startDate = new Date(year, month - 1, 1).getTime();
        const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

        const totalSpentResult = await db
            .select({
                total: sql<number>`sum(${orders.totalAmount})`
            })
            .from(orders)
            .where(
                and(
                    eq(orders.tierId, tierId),
                    eq(orders.status, "PROCESSED"),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate)
                )
            );

        const topProducts = await db
            .select({
                name: products.name,
                totalQuantity: sql<number>`sum(${orderItems.quantity})`,
            })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(
                and(
                    eq(orders.tierId, tierId),
                    eq(orders.status, "PROCESSED"),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate)
                )
            )
            .groupBy(products.name)
            .orderBy(desc(sql`sum(${orderItems.quantity})`))
            .limit(5);

        return {
            totalSpent: totalSpentResult[0]?.total || 0,
            topProducts
        };
    } catch (error) {
        console.error("Failed to fetch tier monthly report:", error);
        return { totalSpent: 0, topProducts: [] };
    }
}

export async function getGlobalAnalytics() {
    try {
        const tierComparison = await db
            .select({
                name: tiers.name,
                totalSales: sql<number>`sum(${orders.totalAmount})`,
            })
            .from(orders)
            .innerJoin(tiers, eq(orders.tierId, tiers.id))
            .where(eq(orders.status, "PROCESSED"))
            .groupBy(tiers.name);

        const topBranches = await db
            .select({
                branchName: users.branchName,
                username: users.username,
                totalSpent: sql<number>`sum(${orders.totalAmount})`,
            })
            .from(orders)
            .innerJoin(users, eq(orders.buyerId, users.id))
            .where(eq(orders.status, "PROCESSED"))
            .groupBy(users.id)
            .orderBy(desc(sql`sum(${orders.totalAmount})`))
            .limit(10);

        return {
            tierComparison,
            topBranches
        };
    } catch (error) {
        console.error("Failed to fetch global analytics:", error);
        return { tierComparison: [], topBranches: [] };
    }
}

export async function getReportData({
    startDate,
    endDate,
    role,
    adminId,
    branchId,
}: {
    startDate: number;
    endDate: number;
    role: string;
    adminId?: string;
    branchId?: string;
}) {
    try {
        const session = await getSession();
        const effectiveAdminId = adminId || (session?.role === "ADMIN_TIER" ? session.id : undefined);

        const conditions = [
            inArray(orders.status, ["APPROVED", "PACKING", "PROCESSED", "SUCCESS"]),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate),
        ];

        if (role === "ADMIN_TIER" && effectiveAdminId) {
            conditions.push(eq(users.createdBy, effectiveAdminId));
        }

        if (branchId) {
            conditions.push(eq(orders.buyerId, branchId));
        }

        let ordersQuery = db
            .select({
                orderId: orders.id,
                totalAmount: orders.totalAmount,
                createdAt: orders.createdAt,
                buyerName: users.branchName,
                buyerUsername: users.username,
            })
            .from(orders)
            .innerJoin(users, eq(orders.buyerId, users.id))
            .where(and(...conditions));

        const filteredOrders = await ordersQuery;

        if (filteredOrders.length === 0) {
            return {
                success: true,
                totalRevenue: 0,
                completedOrders: 0,
                topProducts: [],
                dailySales: [],
                transactionList: []
            };
        }

        const orderIds = filteredOrders.map(o => o.orderId);

        const itemsQuery = await db
            .select({
                orderId: orderItems.orderId,
                productName: products.name,
                unit: products.unit,
                quantity: orderItems.quantity,
                price: orderItems.priceAtPurchase,
            })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(inArray(orderItems.orderId, orderIds));

        let totalRevenue = 0;
        let completedOrders = filteredOrders.length;
        const productsMap = new Map<string, number>();
        const salesByDate = new Map<string, number>();
        const transactions: any[] = [];

        for (const order of filteredOrders) {
            totalRevenue += order.totalAmount;

            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            salesByDate.set(dateStr, (salesByDate.get(dateStr) || 0) + order.totalAmount);

            const matchedItems = itemsQuery.filter(i => i.orderId === order.orderId);
            for (const item of matchedItems) {
                productsMap.set(item.productName, (productsMap.get(item.productName) || 0) + item.quantity);

                transactions.push({
                    date: dateStr,
                    buyerName: order.buyerName || order.buyerUsername,
                    productName: item.productName,
                    unit: item.unit,
                    quantity: item.quantity,
                    totalPrice: item.quantity * item.price,
                });
            }
        }

        const topProducts = Array.from(productsMap.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const dailySales = Array.from(salesByDate.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));

        transactions.sort((a, b) => b.date.localeCompare(a.date));

        return {
            success: true,
            totalRevenue,
            completedOrders,
            topProducts,
            dailySales,
            transactionList: transactions,
        };
    } catch (error) {
        console.error("Failed to fetch report data:", error);
        return {
            success: false,
            totalRevenue: 0,
            completedOrders: 0,
            topProducts: [],
            dailySales: [],
            transactionList: []
        };
    }
}
