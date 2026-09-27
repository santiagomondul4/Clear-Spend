import { Sidebar } from "@/components/dashboard/sidebar";
import { getProfile, requireUser } from "@/lib/data";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [user, profile] = await Promise.all([requireUser(), getProfile()]);
  const name = profile?.full_name || profile?.email || user.email || "Your account";
  const email = profile?.email || user.email;

  return (
    <div className="min-h-screen md:flex">
      <Sidebar name={name} email={email} />
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
