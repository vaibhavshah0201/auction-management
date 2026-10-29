import { getTeams } from "@/lib/data";
import { TeamsClient } from "@/components/TeamsClient";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await getTeams();
  return <TeamsClient initialTeams={teams} />;
}
