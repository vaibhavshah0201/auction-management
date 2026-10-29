"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2, Trophy, Crown } from "lucide-react";
import { Button } from "./ui";
import { formatINR, formatINRCompact, SKILL_COLORS } from "@/lib/utils";
import type { PlayerDTO, TeamDTO } from "@/lib/types";

/**
 * Renders an "Export as Image" button plus a hidden, print-styled squad card.
 * Clicking the button rasterizes the card to a PNG and downloads it.
 */
export function TeamExport({
  team,
  roster,
}: {
  team: TeamDTO;
  roster: PlayerDTO[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function exportImage() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // crisp, high-res output
        backgroundColor: "#0a0e1a",
      });
      const link = document.createElement("a");
      link.download = `${team.name.replace(/\s+/g, "-")}-squad.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Export failed", e);
      alert("Could not export the image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const mostExpensive = roster.reduce<PlayerDTO | null>(
    (max, p) => ((p.soldAmount ?? 0) > (max?.soldAmount ?? 0) ? p : max),
    null
  );

  return (
    <>
      <Button variant="gold" onClick={exportImage} disabled={busy}>
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Exporting...
          </>
        ) : (
          <>
            <Download size={18} /> Export as Image
          </>
        )}
      </Button>

      {/* Off-screen export card (rendered to PNG). Fixed width for consistent output. */}
      <div className="pointer-events-none fixed left-[-9999px] top-0">
        <div
          ref={cardRef}
          style={{
            width: 1080,
            fontFamily: "Inter, system-ui, sans-serif",
            background: `
              radial-gradient(ellipse 70% 50% at 50% -10%, ${team.color}55, transparent),
              radial-gradient(ellipse 60% 50% at 100% 100%, ${team.color}33, transparent),
              linear-gradient(160deg, #0f1629, #0a0e1a)
            `,
            padding: 56,
            color: "#ffffff",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              paddingBottom: 28,
              borderBottom: `2px solid ${team.color}`,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                background: team.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 900,
                color: "#ffffff",
                boxShadow: `0 8px 32px ${team.color}88`,
              }}
            >
              {team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.logoUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", borderRadius: 24, objectFit: "cover" }}
                />
              ) : (
                team.shortName?.slice(0, 3) ?? team.name.slice(0, 2)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "#fbbf24",
                  textTransform: "uppercase",
                }}
              >
                <Trophy size={16} color="#fbbf24" /> OECL Mega Auction 7.0
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1 }}>
                {team.name}
              </div>
              <div style={{ fontSize: 16, color: "#94a3b8", marginTop: 4 }}>
                {team.playersBought} players · {formatINR(team.spent)} spent ·{" "}
                {formatINR(team.remaining)} remaining
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div style={{ display: "flex", gap: 16, margin: "28px 0" }}>
            {[
              { label: "Players", value: `${team.playersBought}/${team.squadSize}` },
              { label: "Spent", value: formatINRCompact(team.spent) },
              { label: "Remaining", value: formatINRCompact(team.remaining) },
              {
                label: "Costliest",
                value: mostExpensive
                  ? formatINRCompact(mostExpensive.soldAmount)
                  : "—",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "16px 20px",
                }}
              >
                <div style={{ fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Players grid */}
          {roster.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "#64748b",
                fontSize: 20,
              }}
            >
              No players signed yet.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {roster.map((p) => {
                const skillColor = SKILL_COLORS[p.skill] ?? "#22c55e";
                const isTop = mostExpensive?.id === p.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: isTop
                        ? "rgba(251,191,36,0.12)"
                        : "rgba(255,255,255,0.05)",
                      border: isTop
                        ? "1px solid rgba(251,191,36,0.5)"
                        : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    {/* Photo */}
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 14,
                        overflow: "hidden",
                        flexShrink: 0,
                        background: `${skillColor}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `2px solid ${skillColor}66`,
                      }}
                    >
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photoUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 24, fontWeight: 900, color: skillColor }}>
                          {p.name.slice(0, 1)}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {isTop && <Crown size={16} color="#fbbf24" />}
                        {p.name}
                        {p.isCaptain && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: "#0a0e1a",
                              background: "#fbbf24",
                              borderRadius: 6,
                              padding: "1px 6px",
                              letterSpacing: 1,
                            }}
                          >
                            C
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                        <span style={{ color: skillColor, fontWeight: 700 }}>
                          {p.skill}
                        </span>
                        {p.age ? ` · ${p.age} yrs` : ""}
                        {p.blockNo || p.flatNo
                          ? ` · ${[p.blockNo, p.flatNo].filter(Boolean).join("-")}`
                          : ""}
                      </div>
                      {p.keyStrength && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#cbd5e1",
                            fontStyle: "italic",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.keyStrength}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: "#fbbf24",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatINR(p.soldAmount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#64748b",
            }}
          >
            <span>OECL Mega Auction 7.0 · Rule the Ground, Claim the Throne</span>
            <span>Created by Vaibhav Shah</span>
          </div>
        </div>
      </div>
    </>
  );
}
