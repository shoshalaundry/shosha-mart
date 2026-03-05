import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { products, tierPrices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddToCartButton from "@/components/dashboard/AddToCartButton";

export default async function BuyerDashboard() {
    const session = await getSession();

    if (!session || session.role !== "BUYER" || !session.tierId) {
        redirect("/dashboard/superadmin");
    }

    // Fetch products inner joined with tierPrices for the specific tierId
    const availableProducts = await db
        .select({
            id: products.id,
            name: products.name,
            sku: products.sku,
            price: tierPrices.price,
        })
        .from(products)
        .innerJoin(tierPrices, eq(products.id, tierPrices.productId))
        .where(eq(tierPrices.tierId, session.tierId));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Katalog Produk</h1>
                <p className="text-neutral-500">Pilih produk dan masukkan ke keranjang belanja Anda.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableProducts.map((product) => (
                    <Card key={product.id} className="flex flex-col h-full bg-white shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                            </div>
                            <CardDescription>SKU: {product.sku}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mt-2 flex items-baseline">
                                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                                    Rp {product.price.toLocaleString("id-ID")}
                                </span>
                                <span className="ml-1 text-sm text-neutral-500">/ pcs</span>
                            </div>
                            <div className="mt-4">
                                <Badge variant="outline" className="bg-neutral-50 text-neutral-600">Stock Tersedia</Badge>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <AddToCartButton
                                productId={product.id}
                                productName={product.name}
                                price={product.price}
                            />
                        </CardFooter>
                    </Card>
                ))}

                {availableProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-neutral-200 border-dashed">
                        <p className="text-neutral-500 font-medium">Tidak ada produk yang tersedia untuk tier Anda saat ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
