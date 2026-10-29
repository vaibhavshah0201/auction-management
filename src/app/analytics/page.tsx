import { getTeams, getPlayers } from "@/lib/data";
import { AnalyticsClient } from "@/components/AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [teams, players] = await Promise.all([getTeams(), getPlayers()]);
  return <AnalyticsClient teams={teams} players={players} />;
}
