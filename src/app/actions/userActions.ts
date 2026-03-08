"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, desc, ne, and, like, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

// Ensure only SUPERADMIN can perform these actions
async function checkSuperAdmin() {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function getUsers(query?: string, roleFilter?: string, page: number = 1, limit: number = 10) {
    await checkSuperAdmin();

    try {
        let conditions = [eq(users.isActive, true)];

        // Exclude themselves (optional, but good practice so they don't delete themselves)
        const session = await getSession();
        if (session) {
            conditions.push(ne(users.id, session.id));
        }

        if (roleFilter && roleFilter !== "ALL") {
            conditions.push(eq(users.role, roleFilter));
        }

        if (query) {
            conditions.push(
                or(
                    like(users.username, `%${query}%`),
                    like(users.phone, `%${query}%`)
                )!
            );
        }

        const offset = (page - 1) * limit;

        // Fetch paginated users
        const allUsers = await db
            .select({
                id: users.id,
                username: users.username,
                phone: users.phone,
                role: users.role,
                branchName: users.branchName,
                createdBy: users.createdBy,
            })
            .from(users)
            .where(and(...conditions))
            .orderBy(desc(users.role))
            .limit(limit)
            .offset(offset);

        // Count total users for pagination UI
        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(...conditions));

        const totalCount = countResult.count;

        // Map createdBy to human readable names
        const admins = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.role, "ADMIN_TIER"));
        const adminMap = new Map(admins.map(a => [a.id, a.username]));

        const formattedUsers = allUsers.map(u => ({
            ...u,
            managedBy: u.createdBy ? adminMap.get(u.createdBy) || "Unknown Admin" : "-",
        }));

        return {
            users: formattedUsers,
            totalCount
        };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { users: [], totalCount: 0 };
    }
}

export async function getAdmins() {
    await checkSuperAdmin();
    try {
        return await db
            .select({ id: users.id, username: users.username })
            .from(users)
            .where(and(eq(users.role, "ADMIN_TIER"), eq(users.isActive, true)));
    } catch (error) {
        console.error("Failed to fetch admins:", error);
        return [];
    }
}

export async function createUser(data: any) {
    await checkSuperAdmin();
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        let targetTierId = null;
        if (data.role === "BUYER" || data.role === "ADMIN_TIER") {
            if (data.createdBy) {
                const adminData = await db
                    .select({ tierId: users.tierId })
                    .from(users)
                    .where(eq(users.id, data.createdBy))
                    .limit(1);
                targetTierId = adminData[0]?.tierId || null;
            } else if (data.tierId) {
                targetTierId = data.tierId;
            }
        }

        const [newUser] = await db.insert(users).values({
            username: data.username,
            phone: data.phone,
            password: hashedPassword,
            role: data.role,
            tierId: targetTierId,
            branchName: data.role === "BUYER" ? data.branchName : null,
            createdBy: data.role === "BUYER" ? data.createdBy : null,
        }).returning();

        revalidatePath("/dashboard/superadmin/users");
        return { success: true, message: "User berhasil dibuat" };
    } catch (error: any) {
        console.error("Failed to create user:", error);
        if (error.message?.includes("UNIQUE constraint failed")) {
            return { success: false, message: "Username atau No HP sudah terdaftar" };
        }
        return { success: false, message: "Gagal membuat user" };
    }
}

export async function updateUser(id: string, data: any) {
    await checkSuperAdmin();
    try {
        const updateData: any = {
            username: data.username,
            phone: data.phone,
            role: data.role,
        };

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        if (data.role === "BUYER" && data.createdBy) {
            const adminData = await db
                .select({ tierId: users.tierId })
                .from(users)
                .where(eq(users.id, data.createdBy))
                .limit(1);
            const targetTierId = adminData[0]?.tierId || null;

            updateData.tierId = targetTierId;
            updateData.branchName = data.branchName;
            updateData.createdBy = data.createdBy;
        } else if (data.role !== "BUYER") {
            updateData.branchName = null;
            updateData.createdBy = null;
        }

        await db.update(users).set(updateData).where(eq(users.id, id));

        revalidatePath("/dashboard/superadmin/users");
        return { success: true, message: "User berhasil diperbarui" };
    } catch (error: any) {
        console.error("Failed to update user:", error);
        if (error.message?.includes("UNIQUE constraint failed")) {
            return { success: false, message: "Username atau No HP sudah digunakan oleh user lain" };
        }
        return { success: false, message: "Gagal memperbarui user" };
    }
}

export async function deleteUser(id: string) {
    await checkSuperAdmin();
    try {
        // Soft delete
        await db.update(users).set({ isActive: false }).where(eq(users.id, id));
        revalidatePath("/dashboard/superadmin/users");
        return { success: true, message: "User berhasil dihapus" };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, message: "Gagal menghapus user" };
    }
}
