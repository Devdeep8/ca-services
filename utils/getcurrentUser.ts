import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const getCurrentUser = async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/sign-in");
    }
    return session.user;
};