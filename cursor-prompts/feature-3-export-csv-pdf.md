# Cursor Agent Prompt — Feature 3: Export to CSV & PDF

> **Model:** Claude Sonnet 3.7 (Agent mode)
> **Estimated time:** 20–25 min
> **Complexity:** Medium-High

---

## Context (read before executing)

This is a React 19 + tRPC 11 + Express 4 + Drizzle ORM app.
- Frontend: `client/src/` — React + Tailwind 4 + Framer Motion
- Backend: `server/routers.ts` — tRPC procedures
- DB helpers: `server/db.ts`
- Design system: `ops-card`, `btn-primary`, `btn-secondary`, `section-label`, teal `#22d3ee`, gold `#f59e0b`

The `PerformanceTracker` page is at `client/src/pages/PerformanceTracker.tsx`. It already has:
- `trpc.ads.getCampaignAnalytics.useQuery({ campaignId })` → `analytics`
- `trpc.ads.list.useQuery({ campaignId })` → `ads`
- `trpc.campaigns.get.useQuery({ id: campaignId })` → `campaign`

---

## What to Build

Two export buttons on the PerformanceTracker page:
1. **Export CSV** — downloads a `.csv` file of all ads with their evaluation scores, cost, and status
2. **Export PDF** — downloads a formatted `.pdf` report with campaign summary + ads table

Both exports happen **client-side only** (no new backend procedures needed). Use browser APIs for CSV and `jspdf` + `jspdf-autotable` for PDF.

---

## Step 1: Install dependencies

```bash
pnpm add jspdf jspdf-autotable
pnpm add -D @types/jspdf
```

Note: `jspdf-autotable` extends `jspdf` — import it as a side effect: `import "jspdf-autotable"`.

---

## Step 2: Create export utility `client/src/lib/exportReport.ts`

```typescript
import jsPDF from "jspdf";
import "jspdf-autotable";

// ── CSV Export ────────────────────────────────────────────────────────────────
export function exportToCSV(campaign: any, ads: any[], evaluations: Record<number, any>) {
  const headers = [
    "Ad ID", "Status", "Generation Mode", "Iteration",
    "Primary Text", "Headline", "Description", "CTA Button",
    "Quality Score", "Clarity", "Value Prop", "CTA Score", "Brand Voice", "Emotional",
    "Tokens Used", "Cost (USD)", "Created At"
  ];

  const rows = ads.map(ad => {
    const ev = evaluations[ad.id];
    return [
      ad.id,
      ad.status,
      ad.generationMode,
      ad.iterationNumber,
      `"${(ad.primaryText || "").replace(/"/g, '""')}"`,
      `"${(ad.headline || "").replace(/"/g, '""')}"`,
      `"${(ad.description || "").replace(/"/g, '""')}"`,
      ad.ctaButton,
      ev ? ev.weightedScore.toFixed(2) : "",
      ev ? ev.scoreClarity.toFixed(2) : "",
      ev ? ev.scoreValueProp.toFixed(2) : "",
      ev ? ev.scoreCta.toFixed(2) : "",
      ev ? ev.scoreBrandVoice.toFixed(2) : "",
      ev ? ev.scoreEmotionalResonance.toFixed(2) : "",
      (ad.promptTokens || 0) + (ad.completionTokens || 0),
      ad.estimatedCostUsd ? ad.estimatedCostUsd.toFixed(6) : "0",
      new Date(ad.createdAt).toISOString(),
    ];
  });

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${campaign.name.replace(/\s+/g, "_")}_ads_export_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── PDF Export ────────────────────────────────────────────────────────────────
export function exportToPDF(campaign: any, ads: any[], analytics: any) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(2, 11, 24);
  doc.rect(0, 0, 297, 297, "F");

  doc.setTextColor(34, 211, 238);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AUTONOMOUS AD ENGINE", 14, 18);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Campaign: ${campaign.name}`, 14, 26);
  doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 32);

  // KPI summary row
  const kpis = [
    ["Total Ads", analytics?.totalAds || 0],
    ["Approved", analytics?.approvedAds || 0],
    ["Approval Rate", analytics?.totalAds ? Math.round((analytics.approvedAds / analytics.totalAds) * 100) + "%" : "0%"],
    ["Quality Threshold", (campaign.currentQualityThreshold || 7).toFixed(1) + "/10"],
    ["Total Cost", "$" + (analytics?.totalCost || 0).toFixed(4)],
    ["Cost/Approved", "$" + (analytics?.costPerApprovedAd || 0).toFixed(4)],
  ];

  let kpiX = 14;
  kpis.forEach(([label, value]) => {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(String(label).toUpperCase(), kpiX, 42);
    doc.setTextColor(248, 250, 252);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), kpiX, 48);
    doc.setFont("helvetica", "normal");
    kpiX += 46;
  });

  // Ads table
  const approvedAds = ads.filter(a => a.status === "approved");
  const tableData = approvedAds.map(ad => [
    "#" + ad.id,
    ad.headline?.slice(0, 30) || "",
    ad.primaryText?.slice(0, 60) + (ad.primaryText?.length > 60 ? "…" : "") || "",
    ad.ctaButton || "",
    ad.qualityScore ? ad.qualityScore.toFixed(1) : "—",
    ad.generationMode?.replace("_", " ") || "",
    "$" + (ad.estimatedCostUsd || 0).toFixed(6),
  ]);

  (doc as any).autoTable({
    startY: 56,
    head: [["ID", "Headline", "Primary Text", "CTA", "Score", "Mode", "Cost"]],
    body: tableData,
    theme: "grid",
    styles: {
      fillColor: [8, 24, 48],
      textColor: [200, 210, 220],
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [15, 35, 65],
      textColor: [34, 211, 238],
      fontSize: 8,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [12, 30, 55] },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 45 },
      2: { cellWidth: 90 },
      3: { cellWidth: 22 },
      4: { cellWidth: 16 },
      5: { cellWidth: 28 },
      6: { cellWidth: 22 },
    },
  });

  doc.save(`${campaign.name.replace(/\s+/g, "_")}_report_${new Date().toISOString().split("T")[0]}.pdf`);
}
```

---

## Step 3: Update `client/src/pages/PerformanceTracker.tsx`

### Import additions at top of file:
```typescript
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";
```

### State addition inside `PerformanceTracker` component:
```typescript
const [isExporting, setIsExporting] = useState<"csv" | "pdf" | null>(null);
```

### Build evaluations lookup map (add after existing data derivations):
```typescript
// Build a lookup map of adId → evaluation for CSV export
const evaluationsMap = useMemo(() => {
  const map: Record<number, any> = {};
  // We need evaluations — fetch them via analytics or a separate query
  // Use the qualityTrend data which has per-evaluation scores
  // Actually: fetch evaluations via a new query or use ads list with embedded scores
  return map;
}, []);
```

**Important:** The `ads.list` query returns ads with `qualityScore` embedded. For the CSV, use `ad.qualityScore` directly instead of a separate evaluations map. Simplify the CSV export to use fields available on the ad object:

```typescript
// Simplified: use ad.qualityScore (already on the ad object from ads.list)
// Remove the `evaluations` parameter from exportToCSV and use ad.qualityScore directly
```

Update `exportToCSV` in `exportReport.ts` to accept `ads` only (no evaluations map), using `ad.qualityScore` for the score column.

### Export buttons (add to the header section, next to the back button):
```tsx
<div className="flex items-center gap-2 ml-auto">
  <button
    onClick={async () => {
      if (!campaign || !ads) return;
      setIsExporting("csv");
      try { exportToCSV(campaign, ads); }
      finally { setIsExporting(null); }
    }}
    disabled={!ads || ads.length === 0 || isExporting !== null}
    className="btn-secondary flex items-center gap-2 text-xs disabled:opacity-30"
  >
    {isExporting === "csv"
      ? <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
          style={{ borderColor: "rgba(34,211,238,0.2)", borderTopColor: "#22d3ee" }} />
      : <FileSpreadsheet size={12} />
    }
    Export CSV
  </button>

  <button
    onClick={async () => {
      if (!campaign || !ads || !analytics) return;
      setIsExporting("pdf");
      try { exportToPDF(campaign, ads, analytics); }
      finally { setIsExporting(null); }
    }}
    disabled={!ads || ads.length === 0 || isExporting !== null}
    className="btn-secondary flex items-center gap-2 text-xs disabled:opacity-30"
    style={{ borderColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}
  >
    {isExporting === "pdf"
      ? <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
          style={{ borderColor: "rgba(245,158,11,0.2)", borderTopColor: "#f59e0b" }} />
      : <FileText size={12} />
    }
    Export PDF
  </button>
</div>
```

Place this `div` inside the existing header `motion.div`, after the back button and title block, as a flex sibling.

---

## Verification checklist

After implementation, verify:
- [ ] `pnpm tsc --noEmit` → 0 errors
- [ ] `pnpm test` → 17/17 passing (no new tests needed for client-side export)
- [ ] Export CSV button downloads a `.csv` file with correct headers and data
- [ ] Export PDF button downloads a dark-themed `.pdf` with campaign KPIs and ads table
- [ ] Both buttons show a loading spinner while exporting
- [ ] Buttons are disabled when no ads exist
- [ ] No console errors on export

---

## Files to modify
1. `client/src/lib/exportReport.ts` — create new file
2. `client/src/pages/PerformanceTracker.tsx` — add imports, state, and export buttons

## Files NOT to modify
- `server/routers.ts` — no backend changes needed
- `server/db.ts` — no changes needed
- Any other files
