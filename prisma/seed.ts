import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEAMS = [
  { name: "OE Blasters", shortName: "OEB", color: "#22c55e" },
  { name: "OE Challengers", shortName: "OEC", color: "#f59e0b" },
  { name: "OE Panthers", shortName: "OEP", color: "#8b5cf6" },
  { name: "OE Royals", shortName: "OER", color: "#ec4899" },
  { name: "OE Super Kings", shortName: "OESK", color: "#eab308" },
  { name: "OE Yoddhas", shortName: "OEY", color: "#ef4444" },
];

// Players from the live dashboard screenshot + a pool of extras to auction
const PLAYERS = [
  { srNo: 1, name: "Hitesh Parmar", flatNo: "C1201", age: 40, skill: "ALL-ROUNDER", lastOecl: true, mobile: "9998581202", soldTo: "OE Challengers", amount: 300000 },
  { srNo: 2, name: "Ankit Sheth", flatNo: "D802", age: 39, skill: "ALL-ROUNDER", lastOecl: true, mobile: "9909031418", soldTo: "OE Blasters", amount: 300000 },
  { srNo: 3, name: "Jigar Upadhyay", flatNo: "C102", age: 33, skill: "ALL-ROUNDER", lastOecl: true, mobile: "74900490049", soldTo: "OE Super Kings", amount: 300000 },
  { srNo: 4, name: "Rahul V V", flatNo: "I801", age: 38, skill: "ALL-ROUNDER", lastOecl: true, mobile: "9925013012", soldTo: "OE Yoddhas", amount: 300000 },
  // Unsold pool, ready for live auction
  { srNo: 5, name: "Suresh Menon", flatNo: "A304", age: 29, skill: "BATSMAN", lastOecl: false, mobile: "9812345670" },
  { srNo: 6, name: "Pradeep Nair", flatNo: "B210", age: 31, skill: "BOWLER", lastOecl: true, mobile: "9876543210" },
  { srNo: 7, name: "Vikram Joshi", flatNo: "E505", age: 27, skill: "ALL-ROUNDER", lastOecl: false, mobile: "9765432109" },
  { srNo: 8, name: "Deepak Rao", flatNo: "F110", age: 35, skill: "WICKET-KEEPER", lastOecl: true, mobile: "9654321098" },
  { srNo: 9, name: "Arjun Pillai", flatNo: "G707", age: 24, skill: "BATSMAN", lastOecl: false, mobile: "9543210987" },
  { srNo: 10, name: "Manish Verma", flatNo: "H404", age: 32, skill: "BOWLER", lastOecl: false, mobile: "9432109876" },
  { srNo: 11, name: "Rohit Shetty", flatNo: "C808", age: 28, skill: "ALL-ROUNDER", lastOecl: true, mobile: "9321098765" },
  { srNo: 12, name: "Kiran Kumar", flatNo: "D303", age: 30, skill: "BATSMAN", lastOecl: false, mobile: "9210987654" },
];

async function main() {
  console.log("Seeding database...");

  // Teams
  const teamMap = new Map<string, string>();
  for (const t of TEAMS) {
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: { shortName: t.shortName, color: t.color },
      create: {
        name: t.name,
        shortName: t.shortName,
        color: t.color,
        startingPurse: 2000000,
        squadSize: 10,
      },
    });
    teamMap.set(t.name, team.id);
  }

  // Players
  // for (const p of PLAYERS) {
  //   const teamId = p.soldTo ? teamMap.get(p.soldTo) ?? null : null;
  //   await prisma.player.create({
  //     data: {
  //       srNo: p.srNo,
  //       name: p.name,
  //       flatNo: p.flatNo,
  //       age: p.age,
  //       skill: p.skill,
  //       lastOecl: p.lastOecl,
  //       mobile: p.mobile,
  //       status: p.soldTo ? "SOLD" : "AVAILABLE",
  //       soldAmount: p.amount ?? null,
  //       teamId,
  //     },
  //   });
  // }

  // Auction state singleton
  await prisma.auctionState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", currentPlayerId: null },
  });

  console.log(`Seeded ${TEAMS.length} teams and ${PLAYERS.length} players.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
