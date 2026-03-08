"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export interface ActionState {
    error?: string;
    success?: boolean;
}

export async function login(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    if (!identifier || !password) {
        return { error: "Identifier dan Password harus diisi." };
    }

    // Find user by username or phone
    const result = await db
        .select()
        .from(users)
        .where(or(eq(users.username, identifier), eq(users.phone, identifier)))
        .limit(1);

    const user = result[0];

    if (!user) {
        return { error: "User tidak ditemukan" };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        return { error: "Password salah" };
    }

    // Create session
    await createSession({
        id: user.id,
        username: user.username,
        role: user.role,
        tierId: user.tierId,
    });

    // Redirect based on role
    if (user.role === "SUPERADMIN") {
        redirect("/dashboard/superadmin");
    } else if (user.role === "ADMIN_TIER") {
        redirect("/dashboard/admin-tier");
    } else {
        redirect("/dashboard/buyer");
    }
}
