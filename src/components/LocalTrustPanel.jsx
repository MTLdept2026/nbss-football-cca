import { useMemo, useRef, useState } from "react";

const STORAGE_META_SUFFIX = "__meta";

function readMeta(key) {
  try {
    const raw = localStorage.getItem(`${key}${STORAGE_META_SUFFIX}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function countValue(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return value ? 1 : 0;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LocalTrustPanel({ theme, fonts, title, description, storageItems }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const summary = useMemo(() => {
    return storageItems.map((item) => {
      try {
        const raw = localStorage.getItem(item.key);
        const parsed = raw ? JSON.parse(raw) : item.fallback;
        const meta = readMeta(item.key);
        return {
          ...item,
          count: countValue(parsed),
          updatedAt: meta?.updatedAt || null,
        };
      } catch {
        return {
          ...item,
          count: 0,
          updatedAt: null,
        };
      }
    });
  }, [refreshTick, storageItems]);

  const handleExport = () => {
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        storage: {},
      };

      storageItems.forEach((item) => {
        const raw = localStorage.getItem(item.key);
        const meta = localStorage.getItem(`${item.key}${STORAGE_META_SUFFIX}`);
        if (raw !== null) backup.storage[item.key] = JSON.parse(raw);
        if (meta !== null) backup.storage[`${item.key}${STORAGE_META_SUFFIX}`] = JSON.parse(meta);
      });

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `gameplan-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "Local backup exported." });
    } catch {
      setStatus({ type: "error", message: "Backup export failed." });
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.storage || typeof parsed.storage !== "object") throw new Error("invalid");

      if (!window.confirm("Import this local backup and replace the current browser data?")) return;

      Object.entries(parsed.storage).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });

      setStatus({ type: "success", message: "Local backup imported. Reloading..." });
      setRefreshTick((tick) => tick + 1);
      setTimeout(() => window.location.reload(), 500);
    } catch {
      setStatus({ type: "error", message: "Backup import failed. Use a GamePlan local backup file." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{ marginTop: 24, padding: 22, borderRadius: 20, background: theme.navyCard, border: `1px solid ${theme.navyBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.7, marginBottom: 8 }}>Local trust centre</div>
          <h3 style={{ fontFamily: fonts.head, fontSize: 22, color: theme.textBright, margin: "0 0 8px", letterSpacing: 1 }}>{title}</h3>
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: theme.textMid, lineHeight: 1.6, margin: 0 }}>{description}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={handleExport} style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${theme.gold}35`, background: `${theme.gold}14`, color: theme.gold, fontFamily: fonts.body, fontSize: 12, fontWeight: 700 }}>
            Export Backup
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${theme.navyBorder}`, background: theme.surfaceSubtle, color: theme.textBright, fontFamily: fonts.body, fontSize: 12, fontWeight: 700 }}>
            Import Backup
          </button>
          <input ref={inputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleImport} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {summary.map((item) => (
          <div key={item.key} style={{ padding: "14px 16px", borderRadius: 14, background: theme.surfaceSubtle, border: `1px solid ${theme.navyBorder}` }}>
            <div style={{ fontFamily: fonts.body, fontSize: 10, color: theme.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontFamily: fonts.head, fontSize: 28, color: item.tone || theme.gold, letterSpacing: 1 }}>{item.count}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 11, color: theme.textDim, lineHeight: 1.5 }}>Updated {formatDateTime(item.updatedAt)}</div>
          </div>
        ))}
      </div>

      {status ? (
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: status.type === "error" ? `${theme.danger}10` : `${theme.success}10`, border: `1px solid ${status.type === "error" ? `${theme.danger}35` : `${theme.success}35`}`, color: status.type === "error" ? theme.danger : theme.success, fontFamily: fonts.body, fontSize: 12, fontWeight: 700 }}>
          {status.message}
        </div>
      ) : null}
    </div>
  );
}
