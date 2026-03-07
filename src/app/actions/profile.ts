"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
    try {
        const session = await getSession();

        if (!session || !session.id) {
            return { success: false, message: "Sesi telah berakhir. Silakan login kembali." };
        }

        const userId = session.id;

        // Extract fields
        const username = formData.get("username")?.toString();
        const phone = formData.get("phone")?.toString();
        const currentPassword = formData.get("currentPassword")?.toString();
        const newPassword = formData.get("newPassword")?.toString();

        if (!username || !phone) {
            return { success: false, message: "Username dan No Handphone wajib diisi." };
        }

        // Fetch current user details securely
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!currentUser) {
            return { success: false, message: "Pengguna tidak ditemukan." };
        }

        // Validation: Unique Username
        if (username !== currentUser.username) {
            const existingUsername = await db.query.users.findFirst({
                where: and(eq(users.username, username), ne(users.id, userId))
            });
            if (existingUsername) {
                return { success: false, message: "Username sudah digunakan oleh pengguna lain." };
            }
        }

        // Validation: Unique Phone
        if (phone !== currentUser.phone) {
            const existingPhone = await db.query.users.findFirst({
                where: and(eq(users.phone, phone), ne(users.id, userId))
            });
            if (existingPhone) {
                return { success: false, message: "Nomor Handphone sudah terdaftar pada akun lain." };
            }
        }

        // Prepare updates
        const updates: any = {
            username,
            phone,
        };

        // Password logic
        if (newPassword && newPassword.length >= 6) {
            if (!currentPassword) {
                return { success: false, message: "Sandi saat ini wajib diisi untuk mengubah sandi." };
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);

            if (!isPasswordValid) {
                return { success: false, message: "Sandi saat ini yang Anda masukkan salah." };
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updates.password = hashedPassword;
        }

        // Execute update securely (Only targeted fields, using session ID)
        await db.update(users)
            .set(updates)
            .where(eq(users.id, userId));

        return { success: true, message: "Profil berhasil diperbarui!" };

    } catch (error) {
        console.error("Gagal memperbarui profil:", error);
        return { success: false, message: "Terjadi kesalahan internal. Silakan coba lagi." };
    }
}
