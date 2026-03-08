import { getSession } from "@/lib/auth/session";
import { getUsers, getAdmins } from "@/app/actions/userActions";
import { redirect } from "next/navigation";
import { UserManagementClient } from "./UserManagementClient";

export default async function SuperAdminUsersPage(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        redirect("/login");
    }

    const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1;
    const query = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
    const role = typeof searchParams?.role === 'string' ? searchParams.role : undefined;

    const [userResponse, initialAdmins] = await Promise.all([
        getUsers(query, role, page),
        getAdmins()
    ]);

    return (
        <div className="container mx-auto py-8 lg:px-4">
            <UserManagementClient
                initialUsers={userResponse.users}
                totalCount={userResponse.totalCount}
                currentPage={page}
                initialAdmins={initialAdmins}
            />
        </div>
    );
}
