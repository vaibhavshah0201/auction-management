# 🏏 OECL Mega Auction — Live Auction Management

A live, animated cricket auction management system built with **Next.js 15**, **Prisma**, **Tailwind CSS**, and **Framer Motion**. Run live bidding with custom amounts, manage players and teams, and watch the purse update in real time.

## Features

- **Live Auction Block** — a large player photo spotlight, place custom (free-form) bids from any team, animated "SOLD!" moment with confetti, mark unsold, live bid feed.
- **Custom bidding** — no base price and no minimum. The auctioneer enters any amount (₹100, ₹10,000, anything). A new bid only has to beat the current highest bid and fit within the team's remaining purse.
- **Unsold handling** — players marked unsold return to the pool in a dedicated "Unsold — re-auction" group so they can be put back on the block anytime.
- **Player Management** — add / edit / delete players, skills, veteran flag, search & filter, and upload a player photo (stored on the server so it persists across restarts).
- **Bulk import from Excel** — upload an `.xlsx` / `.xls` / `.csv` file to add many players at once. Flexible column matching, a preview step that validates every row before writing, team auto-matching for pre-sold players, and a downloadable CSV template.
- **Team Management** — create / edit / delete franchises, custom colors, starting purse, squad size. Deleting a team releases its players back to the pool.
- **Team detail pages** — full squad roster, spend, remaining purse, costliest buy.
- **Captain** — mark one player per team as captain; shown with a crown badge on the roster, players list, live auction spotlight, and the exported image.
- **Manual roster management** — on a team page you can add an existing player to the team (at any price), edit a player's sold price inline, remove a player back to the pool, and set/change the captain — all without going through the live auction.
- **Export team as image** — on a team's page, click "Export as Image" to download a polished PNG squad card: team-colored gradient background, team name, stat strip, and every player with photo, skill, age, flat and sold price (the costliest buy is crowned).
- **Dashboard** — animated command center with live totals, utilization, marquee signing, and per-team purse cards.
- **Analytics** — team spend vs remaining, squad composition by skill, top buys.
- **Auto-derived purse** — team spend/remaining/utilization are always computed from sold players, so resetting a player automatically refunds the team.

## Getting started

```bash
npm install
npm run db:push      # create the SQLite schema
npm run db:seed      # seed teams + players (from the OECL dashboard)
npm run dev          # http://localhost:3000
```

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run db:push` | Sync schema to the database |
| `npm run db:seed` | Seed sample teams and players |
| `npm run db:studio` | Open Prisma Studio to inspect data |

## Data storage — SQLite now, MySQL later

The app uses **SQLite** out of the box (`prisma/dev.db`), zero setup. Switching to MySQL (including MySQL in Docker) is a two-line change:

1. In `prisma/schema.prisma`, change the datasource:

   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

   > Note: the `status` field is already stored as a plain string (not a DB enum), so the schema migrates to MySQL without changes.

2. In `.env`, point `DATABASE_URL` at your MySQL instance:

   ```env
   DATABASE_URL="mysql://auction:auction@localhost:3306/auction"
   ```

3. Spin up MySQL in Docker and apply the schema:

   ```bash
   docker run --name auction-mysql -e MYSQL_ROOT_PASSWORD=root \
     -e MYSQL_DATABASE=auction -e MYSQL_USER=auction \
     -e MYSQL_PASSWORD=auction -p 3306:3306 -d mysql:8

   npm run db:push
   npm run db:seed
   ```

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** — UI and API routes in one codebase
- **Prisma** — type-safe ORM, SQLite → MySQL with a one-line swap
- **Tailwind CSS** — styling
- **Framer Motion** + **canvas-confetti** — live animations and the SOLD celebration
- **Recharts** — analytics charts

## Project structure

```
src/
  app/
    api/            # CRUD + auction API routes
      auction/      # start, bid, sell, unsold, reset, snapshot
      players/      # players CRUD
      teams/        # teams CRUD
    auction/        # live auction page
    players/        # player management page
    teams/          # teams + team detail pages
    analytics/      # charts
    page.tsx        # dashboard
  components/       # UI + feature components
  lib/              # prisma client, data access, types, utils
prisma/
  schema.prisma     # data model
  seed.ts           # seed data from the OECL dashboard
```

## Importing players from Excel

On the **Players** page, click **Import from Excel**:

1. Download the CSV template (optional) to see the expected columns.
2. Drop in your `.xlsx` / `.xls` / `.csv` file.
3. Click **Preview** — every row is validated and you see what's ready, skipped, or in error.
4. Click **Import** to write the valid rows.

Column headers are matched flexibly and case-insensitively. Recognized columns:

| Column (any of) | Maps to |
| --- | --- |
| Player Name / Name | name (required) |
| Sr No / SR / No | srNo (auto-assigned if blank) |
| Flat No / Flat | flatNo |
| Age | age |
| Skill / Role | skill (Batsman / Bowler / All-Rounder / Wicket-Keeper, fuzzy-matched) |
| Last OECL / OECL / Veteran | lastOecl (Yes/No/true/1) |
| Mobile / Phone / Contact | mobile |
| Photo Link / Photo / Image | photoUrl |
| Sold To / Team | assigns the player to that team as SOLD |
| Amount / Sold Amount / Price | sold amount |

If **Sold To** names a team that doesn't exist, that row is reported as an error (create the team first, or leave the column blank).

## Auction flow

1. Go to **Live Auction**.
2. Click a player in the **Player Pool** to put them on the block.
3. Select a team, enter a custom bid amount (or use the quick-step buttons), and click **Bid**.
4. When bidding ends, click **SOLD!** to assign the player to the highest bidder — purse deducts automatically and confetti fires. Or click **Mark Unsold**.
5. The dashboard, teams, and analytics update live.
