"use server";

import { put } from "@vercel/blob";

export async function uploadImageAction(formData: FormData) {
    const file = formData.get("file") as File;

    if (!file) {
        return { success: false, error: "No file provided" };
    }

    try {
        const blob = await put(file.name, file, {
            access: "public",
        });

        return { success: true, url: blob.url };
    } catch (error) {
        console.error("Failed to upload image:", error);
        return { success: false, error: "Failed to upload image. Please check your credentials." };
    }
}
