import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import ApprovalClient from "./ApprovalClient";

export default async function AdminTierDashboard() {
    const session = await getSession();

    if (!session || session.role !== "ADMIN_TIER" || !session.tierId) {
        redirect("/login");
    }

    const pendingOrders = await db
        .select({
            id: orders.id,
            totalAmount: orders.totalAmount,
            status: orders.status,
            buyerName: users.username,
            branchName: users.branchName,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(
            and(
                eq(orders.status, "PENDING_APPROVAL"),
                eq(orders.tierId, session.tierId)
            )
        );

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Persetujuan Pesanan (Admin Tier)</h1>
            <ApprovalClient initialOrders={pendingOrders} />
        </div>
    );
}
