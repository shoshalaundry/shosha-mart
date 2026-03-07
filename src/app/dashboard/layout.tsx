import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { deleteSession } from "@/lib/auth/session";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const { role } = session;

    let menuItems: any[] = [];

    if (role === "SUPERADMIN") {
        menuItems = [
            { name: "Global Dashboard", href: "/dashboard/superadmin", iconName: "LayoutDashboard" },
            { name: "Manajemen User", href: "/dashboard/superadmin/users", iconName: "Users" },
            { name: "Produk Master", href: "/dashboard/superadmin/products", iconName: "Package" },
            { name: "Manajemen Harga", href: "/dashboard/superadmin/pricing", iconName: "Settings" },
            { name: "Laporan Global", href: "/dashboard/superadmin/reports", iconName: "BarChart" },
        ];
    } else if (role === "ADMIN_TIER") {
        menuItems = [
            { name: "Approval Pesanan", href: "/dashboard/admin-tier", iconName: "ShoppingCart" },
            { name: "Laporan Tier", href: "/dashboard/admin-tier/reports", iconName: "BarChart" },
        ];
    } else {
        // BUYER
        const buyerMenu = [
            { name: "Dashboard", href: "/dashboard/buyer", iconName: "LayoutDashboard" as const },
            { name: "Katalog L24J", href: "/dashboard/buyer/katalog", iconName: "Package" as const },
            { name: "Keranjang Belanja", href: "/dashboard/buyer/cart", iconName: "ShoppingCart" as const },
            { name: "Pesanan Saya", href: "/dashboard/buyer/orders", iconName: "Package" as const },
            { name: "Profil Saya", href: "/dashboard/buyer/profile", iconName: "Settings" as const },
        ];
        menuItems = buyerMenu;
    }

    async function handleLogout() {
        "use server";
        await deleteSession();
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">
            <Sidebar
                menuItems={menuItems}
                role={role}
                logoutAction={handleLogout}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0">
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

