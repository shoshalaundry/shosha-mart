import { getAllProducts } from "@/app/actions/products";
import { getAllTiers } from "@/app/actions/pricing";
import { db } from "@/lib/db";
import { tierPrices } from "@/lib/db/schema";
import PricingList from "./PricingList";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PricingPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        redirect("/login");
    }

    const products = await getAllProducts();
    const tiers = await getAllTiers();
    const existingPrices = await db.select().from(tierPrices);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Manajemen Harga Tier</h1>
            <PricingList
                products={products}
                tiers={tiers}
                initialPrices={existingPrices}
            />
        </div>
    );
}
