import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";
import { Sidebar } from "@/components/sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { getCurrentOrg } from "@/lib/current-org";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await getCurrentOrg();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <main className="content-shell">
          <DashboardBreadcrumbs />
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
