"use server";

import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitOrder(
    buyerId: string,
    tierId: string,
    cartItems: { productId: string; quantity: number; priceAtPurchase: number }[]
) {
    if (!cartItems || cartItems.length === 0) {
        return { error: "Keranjang kosong" };
    }

    try {
        const totalAmount = cartItems.reduce(
            (sum, item) => sum + item.priceAtPurchase * item.quantity,
            0
        );

        // Insert order header
        const [newOrder] = await db
            .insert(orders)
            .values({
                buyerId,
                tierId,
                totalAmount,
                status: "PENDING_APPROVAL",
            })
            .returning();

        // Insert order items
        const itemsToInsert = cartItems.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
        }));

        await db.insert(orderItems).values(itemsToInsert);

        revalidatePath("/dashboard/buyer");
        return { success: true };
    } catch (error) {
        console.error("Failed to submit order:", error);
        return { error: "Failed to submit order" };
    }
}

export async function approveOrder(orderId: string) {
    try {
        await db
            .update(orders)
            .set({ status: "APPROVED_BY_TIER" })
            .where(eq(orders.id, orderId));

        revalidatePath("/dashboard/admin-tier");
        revalidatePath("/dashboard/superadmin");
        return { success: true };
    } catch (error) {
        return { error: "Failed to approve order" };
    }
}

export async function rejectOrder(orderId: string, reason: string) {
    try {
        if (!reason || reason.trim() === "") {
            return { error: "Alasan pembatalan harus diisi" };
        }

        await db
            .update(orders)
            .set({
                status: "REJECTED",
                rejectionReason: reason
            })
            .where(eq(orders.id, orderId));

        revalidatePath("/dashboard/admin-tier");
        return { success: true };
    } catch (error) {
        return { error: "Failed to reject order" };
    }
}

export async function processOrder(orderId: string) {
    try {
        await db
            .update(orders)
            .set({ status: "PROCESSED" })
            .where(eq(orders.id, orderId));

        revalidatePath("/dashboard/superadmin");
        return { success: true };
    } catch (error) {
        return { error: "Failed to process order" };
    }
}
