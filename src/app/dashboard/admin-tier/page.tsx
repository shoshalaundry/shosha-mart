import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import ApprovalClient from "./ApprovalClient";
import { Suspense } from "react";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Manajemen Pesanan",
};

export default async function AdminTierDashboard(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();

    if (!session || session.role !== "ADMIN_TIER" || !session.tierId) {
        redirect("/login");
    }

    // Parse filters
    const startDate = searchParams?.startDate ? parseInt(searchParams.startDate as string) : undefined;
    const endDate = searchParams?.endDate ? parseInt(searchParams.endDate as string) : undefined;
    const branchId = searchParams?.branchId ? searchParams.branchId as string : undefined;
    const searchQuery = searchParams?.q ? searchParams.q as string : undefined;
    const statusFilter = searchParams?.status ? (searchParams.status as string).split(",") : ["APPROVED", "PACKING"];

    // Fetch branches for filter dropdown (buyers created by this Admin_Tier)
    const branches = await db.query.users.findMany({
        where: eq(users.createdBy, session.id),
        columns: {
            id: true,
            username: true,
            branchName: true,
        }
    });

    const conditions: any[] = [
        inArray(orders.status, statusFilter),
        eq(orders.tierId, session.tierId)
    ];

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
    const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999);

    const activeStart = startDate || defaultStart;
    const activeEnd = endDate || defaultEnd;

    conditions.push(gte(orders.createdAt, activeStart));
    conditions.push(lte(orders.createdAt, activeEnd));

    if (branchId) {
        const isManaged = branches.some(b => b.id === branchId);
        if (isManaged) {
            conditions.push(eq(orders.buyerId, branchId));
        } else {
            conditions.push(eq(orders.buyerId, "invalid-branch")); // Prevent data leak
        }
    } else {
        const managedBuyerIds = branches.map(b => b.id);
        if (managedBuyerIds.length > 0) {
            conditions.push(inArray(orders.buyerId, managedBuyerIds));
        } else {
            conditions.push(eq(orders.buyerId, "no-buyers-yet"));
        }
    }

    // Search Logic
    if (searchQuery) {
        conditions.push(sql`(
            ${users.username} LIKE ${`%${searchQuery}%`} OR 
            ${users.branchName} LIKE ${`%${searchQuery}%`} OR 
            ${orders.id} LIKE ${`%${searchQuery}%`}
        )`);
    }

    const pendingOrders = await db.query.orders.findMany({
        where: and(...conditions),
        with: {
            buyer: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    const formattedOrders = pendingOrders.map(o => ({
        id: o.id,
        totalAmount: o.totalAmount,
        status: o.status,
        buyerName: o.buyer.username,
        branchName: o.buyer.branchName,
        buyerPhone: o.buyer.phone,
        createdAt: o.createdAt,
        items: o.items.map(item => ({
            id: item.id,
            name: item.product?.name || "Produk Terhapus",
            sku: item.product?.sku || "-",
            unit: item.product?.unit || "Pcs",
            imageUrl: item.product?.imageUrl || null,
            quantity: item.quantity,
            price: item.priceAtPurchase,
        })),
    }));

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Manajemen Pesanan (Admin Tier)</h1>

            <DashboardFilters role="ADMIN_TIER" branches={branches} />

            <Suspense fallback={<DashboardSkeleton />} key={`${startDate}-${endDate}-${branchId}`}>
                <DashboardAnalytics
                    role="ADMIN_TIER"
                    startDate={startDate}
                    endDate={endDate}
                    branchId={branchId}
                />
            </Suspense>

            <div className="mt-12">
                <ApprovalClient initialOrders={formattedOrders} />
            </div>
        </div>
    );
}
