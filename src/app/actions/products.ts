"use server";

import { db } from "@/lib/db";
import { products, tierPrices, tiers } from "@/lib/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as xlsx from "xlsx";

export async function getProductsForBuyer(tierId: string, page: number = 1, limit: number = 10) {
    try {
        const offset = (page - 1) * limit;

        const result = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
                stock: products.stock,
                tierPrice: tierPrices.price,
                basePrice: products.basePrice,
                unit: products.unit,
                imageUrl: products.imageUrl,
            })
            .from(products)
            .leftJoin(
                tierPrices,
                and(
                    eq(tierPrices.productId, products.id),
                    eq(tierPrices.tierId, tierId)
                )
            )
            .where(
                or(
                    isNull(tierPrices.isActive),
                    eq(tierPrices.isActive, true)
                )
            )
            .limit(limit)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .leftJoin(
                tierPrices,
                and(
                    eq(tierPrices.productId, products.id),
                    eq(tierPrices.tierId, tierId)
                )
            )
            .where(
                or(
                    isNull(tierPrices.isActive),
                    eq(tierPrices.isActive, true)
                )
            );

        return {
            products: result.map(p => ({
                ...p,
                finalPrice: p.tierPrice ?? p.basePrice
            })),
            totalCount: countResult.count
        };
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return { products: [], totalCount: 0 };
    }
}

export async function createProduct(data: { name: string; sku: string; basePrice: number; stock: number; unit: string; imageUrl?: string }) {
    try {
        await db.insert(products).values({
            name: data.name,
            sku: data.sku,
            basePrice: data.basePrice,
            stock: data.stock,
            unit: data.unit,
            imageUrl: data.imageUrl,
        });
        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil ditambahkan!" };
    } catch (error) {
        console.error("Failed to create product:", error);
        return { success: false, error: "Gagal menambahkan produk. SKU mungkin sudah terpakai." };
    }
}

export async function updateProduct(id: string, data: { name: string; sku: string; basePrice: number; stock: number; unit: string; imageUrl?: string }) {
    try {
        await db.update(products)
            .set({
                name: data.name,
                sku: data.sku,
                basePrice: data.basePrice,
                stock: data.stock,
                unit: data.unit,
                imageUrl: data.imageUrl
            })
            .where(eq(products.id, id));
        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil diperbarui!" };
    } catch (error) {
        console.error("Failed to update product:", error);
        return { success: false, error: "Gagal memperbarui produk." };
    }
}

export async function deleteProduct(id: string) {
    try {
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/dashboard/superadmin/products");
        return { success: true, message: "Produk berhasil dihapus!" };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, error: "Gagal menghapus produk. Produk mungkin terkait dengan data lain." };
    }
}

export async function getAllProducts(page: number = 1, limit: number = 10) {
    try {
        const offset = (page - 1) * limit;

        const allProducts = await db
            .select()
            .from(products)
            .limit(limit)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products);

        return {
            products: allProducts,
            totalCount: countResult.count
        };
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return { products: [], totalCount: 0 };
    }
}

export async function downloadProductTemplate() {
    try {
        const allTiers = await db.select().from(tiers);

        // Define standard columns
        const header = ["Nama Produk", "SKU", "Satuan (Unit)", "Stok", "Harga Dasar", "Deskripsi"];

        // Add dynamic tier columns
        allTiers.forEach(tier => {
            header.push(`Harga ${tier.name}`);
        });

        // Add dummy data for guidance
        const dummyRow = ["Solasi Bening", "SOL-001", "ROLL", 100, 40000, "Lakban berkualitas"];
        allTiers.forEach(() => dummyRow.push(42000));

        const wsName = "Template Produk";
        const wsData = [header, dummyRow];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        xlsx.utils.book_append_sheet(wb, ws, wsName);

        const base64 = xlsx.write(wb, { type: "base64", bookType: "xlsx" });
        return { success: true, base64 };
    } catch (error) {
        console.error("Failed to generate template:", error);
        return { success: false, error: "Gagal membuat template." };
    }
}

export async function importProducts(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "File tidak ditemukan." };
        }

        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: "Ukuran file terlalu besar (Maksimal 5MB)." };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const wb = xlsx.read(buffer, { type: "buffer" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // Convert sheet to JSON array
        const data = xlsx.utils.sheet_to_json(ws);
        if (!data || data.length === 0) {
            return { success: false, error: "File Excel kosong." };
        }

        const allTiers = await db.select().from(tiers);

        // Transaction for Upsert
        return await db.transaction(async (tx) => {
            let imported = 0;
            let updated = 0;

            for (let i = 0; i < data.length; i++) {
                const row = data[i] as any;
                const name = row["Nama Produk"];
                const sku = row["SKU"];
                const unit = row["Satuan (Unit)"] || "Pcs";
                const stock = Number(row["Stok"]) || 0;
                const basePrice = Number(row["Harga Dasar"]);

                // Validation
                if (!name || typeof name !== "string" || name.trim() === "") {
                    throw new Error(`Baris ${i + 2}: Nama Produk tidak boleh kosong.`);
                }
                if (!sku || typeof sku !== "string" || sku.trim() === "") {
                    throw new Error(`Baris ${i + 2}: SKU tidak boleh kosong.`);
                }
                if (isNaN(basePrice)) {
                    throw new Error(`Baris ${i + 2}: Harga Dasar tidak valid.`);
                }

                // Check if product exists to determine if it's an update or insert
                const existingProduct = await tx.select({ id: products.id }).from(products).where(eq(products.sku, sku));
                let productId: string;

                if (existingProduct.length > 0) {
                    // Update
                    await tx.update(products)
                        .set({ name, unit, stock, basePrice })
                        .where(eq(products.sku, sku));
                    productId = existingProduct[0].id;
                    updated++;
                } else {
                    // Insert
                    const inserted = await tx.insert(products)
                        .values({ name, sku, unit, stock, basePrice })
                        .returning({ id: products.id });
                    productId = inserted[0].id;
                    imported++;
                }

                // Process Tiers
                for (const tier of allTiers) {
                    const priceCol = `Harga ${tier.name}`;
                    if (row[priceCol] !== undefined && row[priceCol] !== "") {
                        const price = Number(row[priceCol]);
                        if (!isNaN(price)) {
                            // Check existing tier price
                            const existingTierPrice = await tx.select({ id: tierPrices.id })
                                .from(tierPrices)
                                .where(
                                    and(
                                        eq(tierPrices.productId, productId),
                                        eq(tierPrices.tierId, tier.id)
                                    )
                                );

                            if (existingTierPrice.length > 0) {
                                await tx.update(tierPrices)
                                    .set({ price, isActive: true })
                                    .where(eq(tierPrices.id, existingTierPrice[0].id));
                            } else {
                                await tx.insert(tierPrices)
                                    .values({ productId, tierId: tier.id, price, isActive: true });
                            }
                        }
                    }
                }
            }

            revalidatePath("/dashboard/superadmin/products");
            return {
                success: true,
                message: `Berhasil mengimport ${imported} barang, memperbarui ${updated} barang, dan 0 gagal.`
            };
        });

    } catch (error: any) {
        console.error("Failed to import products:", error);
        return { success: false, error: error.message || "Gagal mengimport produk." };
    }
}

