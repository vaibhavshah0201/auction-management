import { getTeams, getPlayers } from "@/lib/data";
import { AuctionClient } from "@/components/auction/AuctionClient";

export const dynamic = "force-dynamic";

export default async function AuctionPage() {
  const [teams, available, unsold] = await Promise.all([
    getTeams(),
    getPlayers({ status: "AVAILABLE" }),
    getPlayers({ status: "UNSOLD" }),
  ]);
  // Pool to pick from: available first, then previously unsold
  const pool = [...available, ...unsold];
  return <AuctionClient teams={teams} pool={pool} />;
}
