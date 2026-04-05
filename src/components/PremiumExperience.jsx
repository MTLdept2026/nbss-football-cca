import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

// ── RESPONSIVE HOOK ──
function useIsMobile(breakpoint = 700) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

function SurfaceTabs({ theme, bodyFont, items, active, setActive }) {
  // Nothing design: flat tab bar, underline-only active indicator, Space Mono ALL CAPS
  return (
    <div style={{
      display: "flex",
      gap: 0,
      overflowX: "auto",
      padding: "14px 0 0",
      marginBottom: 24,
      borderBottom: `1px solid ${theme.navyBorder}`,
    }}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setActive(item.id)}
          style={{
            padding: "10px 16px",
            borderRadius: 0,
            cursor: "pointer",
            border: "none",
            borderBottom: `2px solid ${active === item.id ? theme.gold : "transparent"}`,
            background: "transparent",
            color: active === item.id ? theme.gold : theme.textDim,
            fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "color 0.15s, border-color 0.15s",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SurfaceShell({ theme, children }) {
  return (
    <section style={{ minHeight: "100vh", padding: "96px 24px 88px", background: theme.navy, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `linear-gradient(135deg, transparent 0%, transparent 48%, ${theme.gold} 49%, transparent 50%)`, backgroundSize: "160px 160px", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </section>
  );
}

function HeroPanel({ theme, headFont, bodyFont, eyebrow, title, subtitle, lastUpdated, aside, lead }) {
  const isMobile = useIsMobile(700);
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.55fr) minmax(300px, 0.95fr)", gap: 20 }}>
      <div style={{ borderRadius: 24, padding: 30, background: `linear-gradient(135deg, ${theme.navyDeep} 0%, ${theme.navyCard} 58%, ${theme.navy} 100%)`, border: `1px solid ${theme.gold}24`, boxShadow: "0 18px 60px rgba(0,0,0,0.32)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: theme.gold, fontWeight: 700, letterSpacing: 1.7, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: theme.textDim }}>Last updated {lastUpdated || "-"}</div>
        </div>
        {lead ? <div style={{ marginBottom: 22 }}>{lead}</div> : null}
        <h1 style={{ fontFamily: headFont, fontSize: "clamp(42px, 7vw, 82px)", color: theme.textBright, margin: 0, lineHeight: 0.92, letterSpacing: 2 }}>{title}</h1>
        <p style={{ fontFamily: bodyFont, fontSize: 15, color: theme.textMid, lineHeight: 1.7, margin: "16px 0 0" }}>{subtitle}</p>
      </div>
      <div style={{ borderRadius: 24, padding: 28, background: theme.navyCard, border: `1px solid ${theme.navyBorder}`, boxShadow: "0 18px 60px rgba(0,0,0,0.22)" }}>
        {aside}
      </div>
    </div>
  );
}

function MetricGrid({ theme, headFont, bodyFont, items, columns = "repeat(auto-fit, minmax(150px, 1fr))" }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: columns, gap: 12, marginTop: 20 }}>
      {items.map((card, idx) => (
        <div key={idx} style={{ padding: "18px 16px", borderRadius: 16, background: theme.navyCard, border: `1px solid ${theme.navyBorder}`, borderTop: `3px solid ${card.tone || theme.gold}` }}>
          <div style={{ fontFamily: bodyFont, fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{card.label}</div>
          <div style={{ fontFamily: headFont, fontSize: 34, color: card.tone || theme.gold, letterSpacing: 1 }}>{card.value}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: theme.textDim, lineHeight: 1.5 }}>{card.note}</div>
        </div>
      ))}
    </div>
  );
}

function PanelCard({ theme, headFont, bodyFont, title, meta, children }) {
  return (
    <div style={{ borderRadius: 20, padding: 22, background: theme.navyCard, border: `1px solid ${theme.navyBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h3 style={{ fontFamily: headFont, fontSize: 22, color: theme.textBright, margin: 0, letterSpacing: 1 }}>{title}</h3>
        {meta ? <div style={{ fontFamily: bodyFont, fontSize: 12, color: theme.textDim }}>{meta}</div> : null}
      </div>
      {children}
    </div>
  );
}

function InsightStack({ theme, bodyFont, items }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ padding: "14px 16px", borderRadius: 14, background: item.bg || theme.surfaceSubtle, border: `1px solid ${item.border || theme.navyBorder}` }}>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: item.labelTone || theme.textDim, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>{item.label}</div>
          <div style={{ fontFamily: bodyFont, fontSize: 14, color: theme.textBright, lineHeight: 1.65 }}>{item.value}</div>
          {item.note ? <div style={{ fontFamily: bodyFont, fontSize: 12, color: theme.textDim, lineHeight: 1.55, marginTop: 8 }}>{item.note}</div> : null}
        </div>
      ))}
    </div>
  );
}

function TrendPanel({ theme, bodyFont, data, lines, yDomain, yUnit, referenceLines, emptyText, height = 220 }) {
  if (!data || data.length < 2) {
    return <div style={{ fontFamily: bodyFont, color: theme.textDim, fontSize: 14, lineHeight: 1.7 }}>{emptyText}</div>;
  }

  const hasMultipleLines = lines.length > 1;
  // Left margin: wider when a yUnit label needs space, tighter otherwise
  const leftMargin = yUnit ? 4 : -16;

  return (
    <div>
      {/* Inline legend — rendered above chart so it's always visible without hover */}
      {hasMultipleLines && (
        <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
          {lines.map((line) => (
            <div key={line.key} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 11, color: theme.textMid }}>
              <span style={{ display: "inline-block", width: 18, height: 2.5, background: line.color, borderRadius: 2, flexShrink: 0 }} />
              {line.label}
            </div>
          ))}
          {(referenceLines || []).map((rl, idx) => rl.label && (
            <div key={`ref-${idx}`} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 11, color: theme.textMid }}>
              <span style={{ display: "inline-block", width: 18, height: 0, borderTop: `2px dashed ${rl.color}`, flexShrink: 0 }} />
              {rl.label}
            </div>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: leftMargin, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.navyBorder} />
          <XAxis dataKey="date" tick={{ fontFamily: bodyFont, fontSize: 10, fill: theme.textDim }} tickLine={false} />
          <YAxis
            domain={yDomain}
            tick={{ fontFamily: bodyFont, fontSize: 10, fill: theme.textDim }}
            tickLine={false}
            label={yUnit ? {
              value: yUnit,
              angle: -90,
              position: "insideLeft",
              offset: 12,
              style: { fill: theme.textDim, fontSize: 10, fontFamily: bodyFont },
            } : undefined}
          />
          <Tooltip
            contentStyle={{ background: theme.navyCard, border: `1px solid ${theme.navyBorder}`, borderRadius: 10, fontFamily: bodyFont, fontSize: 12 }}
            formatter={(value, name) => [`${value}${yUnit ? ` ${yUnit}` : ""}`, name]}
          />
          {(referenceLines || []).map((line, idx) => (
            <ReferenceLine key={idx} y={line.value} stroke={line.color} strokeDasharray="4 2" label={line.label ? { value: line.label, fill: line.color, fontSize: 10, fontFamily: bodyFont } : undefined} />
          ))}
          {lines.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={2.4} dot={{ fill: line.color, r: 3 }} name={line.label} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RecentList({ theme, bodyFont, headFont, entries, emptyText }) {
  if (!entries.length) {
    return <div style={{ fontFamily: bodyFont, color: theme.textDim, fontSize: 14, lineHeight: 1.7 }}>{emptyText}</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {entries.map((entry) => (
        <div key={entry.id || `${entry.title}-${entry.date}`} style={{ padding: "14px", borderRadius: 14, background: theme.surfaceSubtle, border: `1px solid ${theme.navyBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: theme.textBright, fontWeight: 700 }}>{entry.title}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: theme.textDim }}>{entry.date}</div>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: bodyFont, fontSize: 12, color: theme.textMid }}>
            {(entry.metrics || []).map((metric, idx) => <span key={idx}>{metric}</span>)}
          </div>
          {entry.note ? <div style={{ fontFamily: bodyFont, fontSize: 12, color: theme.textDim, lineHeight: 1.55, marginTop: 8 }}>{entry.note}</div> : null}
          {entry.emphasis ? <div style={{ fontFamily: headFont, fontSize: 14, color: entry.emphasisTone || theme.gold, letterSpacing: 0.5, marginTop: 8 }}>{entry.emphasis}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function PlayerPerformanceSurface({ theme, fonts, summary, renderSessions, renderRecovery, renderDevelopment, renderProfile, renderGoals, initialTab }) {
  const [tab, setTab] = useState(initialTab || "overview");
  return (
    <div style={{ paddingTop: 64 }}>
      <SurfaceShell theme={theme}>
        <HeroPanel
          theme={theme}
          headFont={fonts.head}
          bodyFont={fonts.body}
          eyebrow="Performance Centre"
          title={summary.title}
          subtitle={summary.subtitle}
          lastUpdated={summary.lastUpdated}
          aside={
            <>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Decision support</div>
              <h2 style={{ fontFamily: fonts.head, fontSize: 28, color: theme.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Current direction</h2>
              <InsightStack theme={theme} bodyFont={fonts.body} items={summary.guidance} />
            </>
          }
        />

        <MetricGrid theme={theme} headFont={fonts.head} bodyFont={fonts.body} items={summary.metrics} columns="repeat(auto-fit, minmax(160px, 1fr))" />

        <SurfaceTabs
          theme={theme}
          bodyFont={fonts.body}
          items={[
            { id: "overview", label: "Overview" },
            { id: "sessions", label: "Sessions" },
            { id: "recovery", label: "Recovery" },
            { id: "development", label: "Development" },
            { id: "goals", label: "Goals" },
            { id: "profile", label: "Profile" },
          ]}
          active={tab}
          setActive={setTab}
        />

        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Load trend" meta="Acute vs chronic load">
                <TrendPanel theme={theme} bodyFont={fonts.body} data={summary.loadTrend} lines={[{ key: "acute", label: "Acute (7d)", color: theme.orange }, { key: "chronic", label: "Chronic (28d)", color: theme.electric }]} yUnit="AU" emptyText="Log at least two sessions with duration and RPE to unlock load analysis." />
              </PanelCard>
              <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Recovery trend" meta="Readiness against baseline">
                <TrendPanel theme={theme} bodyFont={fonts.body} data={summary.readinessTrend} lines={[{ key: "readiness", label: "Readiness", color: theme.success }]} referenceLines={[{ value: 75, color: theme.success, label: "Target (75%)" }]} yDomain={[0, 100]} yUnit="%" emptyText="Track sleep, energy, and soreness to unlock recovery analysis." />
              </PanelCard>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 20 }}>
              <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Recent sessions">
                <RecentList theme={theme} headFont={fonts.head} bodyFont={fonts.body} entries={summary.recentEntries} emptyText="No performance data yet. Log your first session to activate the centre." />
              </PanelCard>
              <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Performance alerts">
                <InsightStack theme={theme} bodyFont={fonts.body} items={summary.alerts} />
              </PanelCard>
            </div>
          </>
        )}

        {tab === "sessions" && renderSessions()}
        {tab === "recovery" && renderRecovery()}
        {tab === "development" && renderDevelopment()}
        {tab === "goals" && renderGoals && renderGoals()}
        {tab === "profile" && renderProfile()}
      </SurfaceShell>
    </div>
  );
}

export function PlayerMatchSurface({ theme, fonts, summary, renderPreMatchPrep, renderLineups, renderPostMatch }) {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ paddingTop: 64 }}>
      <SurfaceShell theme={theme}>
        <HeroPanel
          theme={theme}
          headFont={fonts.head}
          bodyFont={fonts.body}
          eyebrow="Match Centre"
          title={summary.title}
          subtitle={summary.subtitle}
          lastUpdated={summary.lastUpdated}
          aside={
            <>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Execution focus</div>
              <h2 style={{ fontFamily: fonts.head, fontSize: 28, color: theme.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Next action</h2>
              <InsightStack theme={theme} bodyFont={fonts.body} items={summary.guidance} />
            </>
          }
        />

        <MetricGrid theme={theme} headFont={fonts.head} bodyFont={fonts.body} items={summary.metrics} columns="repeat(auto-fit, minmax(160px, 1fr))" />

        <SurfaceTabs
          theme={theme}
          bodyFont={fonts.body}
          items={[
            { id: "overview",  label: "Overview" },
            { id: "prematch",  label: "Pre-match Prep" },
            { id: "lineup",    label: "Lineup" },
            { id: "postmatch", label: "Post-match" },
          ]}
          active={tab}
          setActive={setTab}
        />

        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Rating trend" meta="Recent match outputs">
                <TrendPanel theme={theme} bodyFont={fonts.body} data={summary.ratingTrend} lines={[{ key: "rating", label: "Match rating", color: theme.gold }]} yDomain={[0, 5]} yUnit="/5" emptyText="Log at least two matches to unlock output trend analysis." />
              </PanelCard>
              <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Recent match records">
                <RecentList theme={theme} headFont={fonts.head} bodyFont={fonts.body} entries={summary.recentMatches} emptyText="No match records yet. Use the match log to build your output history." />
              </PanelCard>
            </div>
          </>
        )}

        {tab === "prematch" && renderPreMatchPrep && renderPreMatchPrep()}
        {tab === "lineup" && renderLineups && renderLineups()}
        {tab === "postmatch" && renderPostMatch && renderPostMatch()}
      </SurfaceShell>
    </div>
  );
}

export function CoachDashboardSurface({ theme, fonts, summary, renderActions, clubBadge }) {
  const coachName = summary.identity?.name?.trim() || "Coach";
  const coachInitials = coachName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CT";

  return (
    <SurfaceShell theme={theme}>
      {clubBadge && <div style={{ marginBottom: 20 }}>{clubBadge}</div>}
      <HeroPanel
        theme={theme}
        headFont={fonts.head}
        bodyFont={fonts.body}
        eyebrow="Coach Command Centre"
        title={summary.title}
        subtitle={summary.subtitle}
        lastUpdated={summary.lastUpdated}
        lead={summary.identity ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${theme.gold}40`,
              background: `${theme.gold}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {summary.identity.photo
                ? <img src={summary.identity.photo} alt={coachName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: fonts.head, fontSize: 28, color: theme.gold, letterSpacing: 1 }}>{coachInitials}</span>}
            </div>
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 6 }}>Staff profile</div>
              <div style={{ fontFamily: fonts.head, fontSize: 26, color: theme.textBright, letterSpacing: 1, lineHeight: 1 }}>{coachName}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: theme.textMid, marginTop: 8 }}>{summary.identity.role || "Coach/Teacher"}</div>
            </div>
          </div>
        ) : null}
        aside={
          <>
            <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Operational focus</div>
            <h2 style={{ fontFamily: fonts.head, fontSize: 28, color: theme.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Next priorities</h2>
            <InsightStack theme={theme} bodyFont={fonts.body} items={summary.guidance} />
            <div style={{ marginTop: 18 }}>{renderActions()}</div>
          </>
        }
      />
      <MetricGrid theme={theme} headFont={fonts.head} bodyFont={fonts.body} items={summary.metrics} columns="repeat(auto-fit, minmax(180px, 1fr))" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 20 }}>
        <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Availability watchlist">
          <RecentList theme={theme} headFont={fonts.head} bodyFont={fonts.body} entries={summary.watchlist} emptyText="No active availability constraints are currently logged." />
        </PanelCard>
        <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Workload trend">
          <TrendPanel theme={theme} bodyFont={fonts.body} data={summary.loadTrend} lines={[{ key: "acute", label: "Acute (7d)", color: theme.orange }, { key: "chronic", label: "Chronic (28d)", color: theme.electric }]} yUnit="AU" emptyText="Collect more session load data to unlock squad workload trends." />
        </PanelCard>
      </div>
    </SurfaceShell>
  );
}

export function CoachSquadSurface({ theme, fonts, summary, renderAttendance }) {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ paddingTop: 64 }}>
      <SurfaceShell theme={theme}>
        <HeroPanel
          theme={theme}
          headFont={fonts.head}
          bodyFont={fonts.body}
          eyebrow="Squad Centre"
          title={summary.title}
          subtitle={summary.subtitle}
          lastUpdated={summary.lastUpdated}
          aside={
            <>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Availability status</div>
              <h2 style={{ fontFamily: fonts.head, fontSize: 28, color: theme.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Current watchlist</h2>
              <InsightStack theme={theme} bodyFont={fonts.body} items={summary.guidance} />
            </>
          }
        />
        <MetricGrid theme={theme} headFont={fonts.head} bodyFont={fonts.body} items={summary.metrics} columns="repeat(auto-fit, minmax(180px, 1fr))" />
        <SurfaceTabs theme={theme} bodyFont={fonts.body} items={[{ id: "overview", label: "Overview" }, { id: "attendance", label: "Attendance" }]} active={tab} setActive={setTab} />
        {tab === "overview" && (
          <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Availability details">
            <RecentList theme={theme} headFont={fonts.head} bodyFont={fonts.body} entries={summary.watchlist} emptyText="No active availability constraints are currently logged." />
          </PanelCard>
        )}
        {tab === "attendance" && renderAttendance()}
      </SurfaceShell>
    </div>
  );
}

export function CoachOperationsSurface({ theme, fonts, summary, renderSchedule, renderLineups, renderAnnouncements }) {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ paddingTop: 64 }}>
      <SurfaceShell theme={theme}>
        <HeroPanel
          theme={theme}
          headFont={fonts.head}
          bodyFont={fonts.body}
          eyebrow="Operations Centre"
          title={summary.title}
          subtitle={summary.subtitle}
          lastUpdated={summary.lastUpdated}
          aside={
            <>
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Run of play</div>
              <h2 style={{ fontFamily: fonts.head, fontSize: 28, color: theme.textBright, margin: "0 0 16px", letterSpacing: 1 }}>Operational guidance</h2>
              <InsightStack theme={theme} bodyFont={fonts.body} items={summary.guidance} />
            </>
          }
        />
        <MetricGrid theme={theme} headFont={fonts.head} bodyFont={fonts.body} items={summary.metrics} columns="repeat(auto-fit, minmax(180px, 1fr))" />
        <SurfaceTabs theme={theme} bodyFont={fonts.body} items={[{ id: "overview", label: "Overview" }, { id: "schedule", label: "Schedule" }, { id: "lineups", label: "Lineups" }, { id: "announcements", label: "Announcements" }]} active={tab} setActive={setTab} />
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Current schedule pressure">
              <InsightStack theme={theme} bodyFont={fonts.body} items={summary.scheduleHighlights} />
            </PanelCard>
            <PanelCard theme={theme} headFont={fonts.head} bodyFont={fonts.body} title="Latest outputs">
              <RecentList theme={theme} headFont={fonts.head} bodyFont={fonts.body} entries={summary.recentOutputs} emptyText="No operational outputs are stored yet." />
            </PanelCard>
          </div>
        )}
        {tab === "schedule" && renderSchedule()}
        {tab === "lineups" && renderLineups()}
        {tab === "announcements" && renderAnnouncements()}
      </SurfaceShell>
    </div>
  );
}
