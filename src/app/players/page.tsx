import { getPlayers, getTeams } from "@/lib/data";
import { PlayersClient } from "@/components/PlayersClient";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
  return <PlayersClient initialPlayers={players} teams={teams} />;
}
