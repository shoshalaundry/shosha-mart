import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function BuyerProfilePage() {
    const session = await getSession();

    if (!session || session.role !== "BUYER") {
        redirect("/login");
    }

    // Fetch the latest user data securely
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.id),
        columns: {
            id: true,
            username: true,
            phone: true,
            branchName: true,
            role: true, // We will explicitly ignore this in the client/server action
        }
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="container mx-auto py-8 lg:px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Profil Akun</h1>
                <p className="text-neutral-500 mt-2">Kelola informasi pribadi dan pengaturan keamanan Anda.</p>
            </div>

            <ProfileClient initialUser={user} />
        </div>
    );
}
