"use server";

import { db } from "@/lib/db";
import { orders, orderItems, products, users, tiers } from "@/lib/db/schema";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";

export async function getTierMonthlyReport(tierId: string, month: number, year: number) {
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
