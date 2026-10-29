export type PlayerStatus = "AVAILABLE" | "IN_AUCTION" | "SOLD" | "UNSOLD";

export interface TeamDTO {
  id: string;
  name: string;
  shortName: string | null;
  color: string;
  logoUrl: string | null;
  startingPurse: number;
  squadSize: number;
  // Derived
  spent: number;
  remaining: number;
  playersBought: number;
  playersRemaining: number;
  maxAvgBid: number;
  utilization: number;
}

export interface PlayerDTO {
  id: string;
  srNo: number | null;
  name: string;
  blockNo: string | null;
  flatNo: string | null;
  dob: string | null;
  age: number | null;
  skill: string;
  keyStrength: string | null;
  lastOecl: boolean;
  isCaptain: boolean;
  mobile: string | null;
  photoUrl: string | null;
  status: PlayerStatus;
  soldAmount: number | null;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
}

export interface BidDTO {
  id: string;
  amount: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  createdAt: string;
}

export interface AuctionSnapshot {
  currentPlayer: PlayerDTO | null;
  bids: BidDTO[];
  highestBid: BidDTO | null;
}
