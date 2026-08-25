import { redirect } from "next/navigation";

import { AdminLoginPage } from "@/components/admin/admin-login-page";
import { getCurrentSession } from "@/server/auth/session";

export default async function AdminLoginRoute() {
  const session = await getCurrentSession();
  if (session?.user.platformRole) redirect("/admin");
  return <AdminLoginPage />;
}
