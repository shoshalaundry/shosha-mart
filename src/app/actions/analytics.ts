"use server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";
import { eq, and, sql, desc, inArray, gte, lte } from "drizzle-orm";

export type TopProductData = {
    name: string;
    totalRevenue: number;
    quantitySold: number;
};

export type SalesTrendData = {
    date: string;
    revenue: number;
};

export type AnalyticsSummary = {
    totalRevenue: number;
    ordersCount: number;
    topProducts: TopProductData[];
    salesTrend: SalesTrendData[];
    totalUsers?: number;
};

export async function getAnalyticsData(
    params?: { startDate?: number; endDate?: number; branchId?: string }
): Promise<AnalyticsSummary | null> {
    const session = await getSession();
    if (!session) return null;

    // Use SQL aggregations heavily
    const role = session.role;
    const userId = session.id;

    // Default to last 30 days if no dates provided
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
    const defaultEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999);

    const start = params?.startDate || defaultStartDate;
    const end = params?.endDate || defaultEndDate;

    // Must map SQL values to number for lte and gte
    const dateFilter = and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end)
    );

    let baseWhereClause;

    if (role === "BUYER") {
        baseWhereClause = and(
            inArray(orders.status, ["APPROVED", "PACKING", "PROCESSED", "SUCCESS"]),
            eq(orders.buyerId, userId),
            dateFilter
        );
    } else if (role === "ADMIN_TIER") {
        // Find buyers created by this admin
        const managedBuyers = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.createdBy, userId));

        const managedBuyerIds = managedBuyers.map(b => b.id);

        if (managedBuyerIds.length === 0) {
            return { totalRevenue: 0, ordersCount: 0, topProducts: [], salesTrend: [] };
        }

        const conditions = [
            inArray(orders.status, ["APPROVED", "PACKING", "PROCESSED", "SUCCESS"]),
            dateFilter
        ];

        if (params?.branchId) {
            if (managedBuyerIds.includes(params.branchId)) {
                conditions.push(eq(orders.buyerId, params.branchId));
            } else {
                return { totalRevenue: 0, ordersCount: 0, topProducts: [], salesTrend: [] };
            }
        } else {
            conditions.push(inArray(orders.buyerId, managedBuyerIds));
        }

        baseWhereClause = and(...conditions);
    } else if (role === "SUPERADMIN") {
        const conditions = [
            inArray(orders.status, ["APPROVED", "PACKING", "PROCESSED", "SUCCESS"]),
            dateFilter
        ];

        if (params?.branchId) {
            conditions.push(eq(orders.buyerId, params.branchId));
        }

        baseWhereClause = and(...conditions);
    } else {
        return null; // Fallback
    }

    // 1. Total Revenue and Count (Aggregated via SQL)
    const summaryResult = await db.select({
        totalRevenue: sql<number>`CAST(COALESCE(SUM(${orders.totalAmount}), 0) AS INTEGER)`,
        ordersCount: sql<number>`COUNT(${orders.id})`
    })
        .from(orders)
        .where(baseWhereClause);

    const totalRevenue = Number(summaryResult[0]?.totalRevenue ?? 0);
    const ordersCount = Number(summaryResult[0]?.ordersCount ?? 0);

    // 2. Top Products (Join items & products, aggregate)
    // We subquery the valid orders first.
    const validOrdersQuery = db
        .select({ id: orders.id, createdAt: orders.createdAt })
        .from(orders)
        .where(baseWhereClause)
        .as('validOrders');

    const topProductsResult = await db.select({
        name: products.name,
        totalRevenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.priceAtPurchase})`,
        quantitySold: sql<number>`sum(${orderItems.quantity})`
    })
        .from(orderItems)
        .innerJoin(validOrdersQuery, eq(orderItems.orderId, sql`${validOrdersQuery.id}`))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .groupBy(products.id, products.name)
        .orderBy(desc(sql`sum(${orderItems.quantity} * ${orderItems.priceAtPurchase})`))
        .limit(5);

    // 3. Sales Trend (Last 7 Days approximation using date mapping)
    // UNIX timestamps in SQLite need to be formatted to date strings.
    // Our createdAt is a milliseconds timestamp.
    const trendResult = await db.select({
        date: sql<string>`date(${orders.createdAt} / 1000, 'unixepoch')`,
        revenue: sql<number>`sum(${orders.totalAmount})`
    })
        .from(orders)
        .where(baseWhereClause)
        .groupBy(sql`date(${orders.createdAt} / 1000, 'unixepoch')`)
        .orderBy(sql`date(${orders.createdAt} / 1000, 'unixepoch')`)
        .limit(30);

    let totalUsers: number | undefined = undefined;
    if (role === "SUPERADMIN") {
        const totalUsersResult = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(eq(users.isActive, true));
        totalUsers = totalUsersResult[0].count;
    }

    return {
        totalRevenue,
        ordersCount,
        topProducts: topProductsResult,
        salesTrend: trendResult,
        totalUsers
    };
}
