import { getDashboardStats } from "@/lib/data";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <DashboardClient stats={stats} />;
}
