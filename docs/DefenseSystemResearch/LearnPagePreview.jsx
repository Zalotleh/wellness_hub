import { useState, useCallback } from "react";
import { BookOpen, ChevronDown, ChevronUp, CheckCircle, Lightbulb, FlaskConical, ExternalLink, Sparkles } from "lucide-react";

const DEFENSE_SYSTEMS = {
  ANGIOGENESIS: {
    emoji: "🩸", displayName: "Angiogenesis", color: "#dc2626",
    bg: "rgba(254,242,242,1)", border: "#fca5a5", badgeBg: "#fef2f2",
    description: "Controls blood vessel growth to starve tumors and heal wounds.",
    keyFoods: ["Tomatoes", "Green Tea", "Dark Chocolate", "Blueberries", "Red Wine"],
    tips: ["Eat tomatoes with olive oil for better lycopene absorption", "Drink green tea daily"],
    papers: [
      {
        pmid: "38714356", year: "2024", type: "Review",
        title: "The Past and Future of Angiogenesis as a Target for Cancer Therapy and Prevention",
        abstract: "Many compounds with antiangiogenic activity are possible tools for cancer prevention. Food derivatives including flavonoids, omega fatty acids, and carotenoids show antiangiogenic activity. Epigallocatechin, resveratrol, lycopene, and curcumin are reviewed as dietary cancer prevention agents.",
        journal: "Cancer Prevention Research",
        authors: "Albini A, Noonan DM et al.",
        doi: "10.1158/1940-6207.CAPR-24-0085",
        keyFoods: ["green tea (EGCG)", "lycopene (tomatoes)", "resveratrol (red grapes)", "curcumin (turmeric)"],
      },
    ],
  },
  MICROBIOME: {
    emoji: "🦠", displayName: "Microbiome", color: "#7c3aed",
    bg: "rgba(245,243,255,1)", border: "#c4b5fd", badgeBg: "#f5f3ff",
    description: "Supports beneficial gut bacteria that protect your health.",
    keyFoods: ["Kimchi", "Yogurt", "Kefir", "Garlic", "Oats"],
    tips: ["Eat fermented foods like kimchi or yogurt daily", "Include prebiotic fiber (onions, garlic)"],
    papers: [
      {
        pmid: "39009882", year: "2024", type: "Review · Nature",
        title: "The Interplay Between Diet and the Gut Microbiome: Implications for Health and Disease",
        abstract: "Diet has a pivotal role in shaping the composition and diversity of the gut microbiome. The Mediterranean diet, high-fibre diet, and plant-based diet each influence the gut microbiome in distinct ways that affect metabolic and intestinal health.",
        journal: "Nature Reviews Microbiology",
        authors: "Ross FC, Patangia D, Stanton C et al.",
        doi: "10.1038/s41579-024-01068-4",
        keyFoods: ["Mediterranean foods", "fermented foods", "high-fibre vegetables", "legumes"],
      },
      {
        pmid: "34941392", year: "2022", type: "Clinical Study · Science",
        title: "Dietary Fiber and Probiotics Influence the Gut Microbiome and Immunotherapy Response",
        abstract: "Higher dietary fiber was associated with significantly improved progression-free survival in cancer patients on immune checkpoint blockade. The gut microbiome directly modulates immune therapy response — connecting what we eat to how our immune system fights cancer.",
        journal: "Science",
        authors: "Spencer CN, Wargo JA et al. (MD Anderson)",
        doi: "10.1126/science.aaz7015",
        keyFoods: ["high-fibre vegetables", "whole grains", "legumes", "fruit"],
      },
    ],
  },
};

// ── Paper card ────────────────────────────────────────────────────────────────
function PaperCard({ article, colors, cache, onCached }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cached = cache[article.pmid];

  const handleClick = useCallback(async (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (cached) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a warm health educator for a wellness app. Never use jargon. Make science feel exciting and personal.",
          messages: [{ role: "user", content: `Summarize in exactly 3 sentences for a wellness app user.\n\nSentence 1: What was found (plain English).\nSentence 2: Why this matters for everyday health.\nSentence 3: One specific food to eat today based on this research.\n\nTitle: "${article.title}"\nAbstract: "${article.abstract}"\nKey foods: ${article.keyFoods.join(", ")}\n\nExactly 3 sentences only.` }]
        })
      });
      const data = await res.json();
      onCached(article.pmid, data.content?.[0]?.text || "Summary unavailable.");
    } catch { setError("Could not load summary."); }
    setLoading(false);
  }, [open, cached, article, onCached]);

  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: "#fff", overflow: "hidden", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
          <span style={{ fontSize: 10, fontWeight: 700, background: colors.badgeBg, color: colors.color, padding: "2px 8px", borderRadius: 99 }}>{article.type}</span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{article.year} · {article.journal}</span>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>{article.title}</p>
        <p style={{ margin: "0 0 10px", fontSize: 11, color: "#9ca3af" }}>{article.authors}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {article.keyFoods.map(f => (
            <span key={f} style={{ fontSize: 11, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 99 }}>🌿 {f}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={handleClick} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            background: open ? colors.badgeBg : colors.color, color: open ? colors.color : "#fff",
            border: `1px solid ${colors.border}`, transition: "all 0.15s"
          }}>
            <Sparkles size={10} />
            {loading ? "Asking Claude..." : open ? "Hide" : "Plain English"}
          </button>
          <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af", textDecoration: "none", padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <ExternalLink size={10} /> PubMed ↗
          </a>
          {cached && !open && <span style={{ fontSize: 10, color: "#16a34a", background: "#f0fdf4", padding: "2px 7px", borderRadius: 99 }}>⚡ cached</span>}
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Sparkles size={10} style={{ color: colors.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: colors.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>Plain English Summary</span>
              {cached && <span style={{ marginLeft: "auto", fontSize: 10, color: "#9ca3af", background: "#fff", padding: "1px 6px", borderRadius: 99, border: "1px solid #e5e7eb" }}>⚡ DB cached</span>}
            </div>
            {loading ? <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Sending abstract to Claude...</p>
              : error ? <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{error}</p>
              : cached ? <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{cached}</p>
              : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Research section (the sub-accordion inside the system card) ───────────────
function ResearchSection({ papers, colors }) {
  const [open, setOpen] = useState(false);
  const [cache, setCache] = useState({});
  const onCached = useCallback((pmid, text) => setCache(p => ({ ...p, [pmid]: text })), []);

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px dashed ${colors.border}` }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: 6, borderRadius: 8, background: colors.badgeBg }}>
            <FlaskConical size={13} style={{ color: colors.color }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>Research Evidence</p>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{papers.length} peer-reviewed {papers.length === 1 ? "paper" : "papers"} from PubMed</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, background: colors.badgeBg, color: colors.color, padding: "2px 8px", borderRadius: 99 }}>PubMed</span>
          {open ? <ChevronUp size={14} style={{ color: "#9ca3af" }} /> : <ChevronDown size={14} style={{ color: "#9ca3af" }} />}
        </div>
      </button>
      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {papers.map(p => <PaperCard key={p.pmid} article={p} colors={colors} cache={cache} onCached={onCached} />)}
          <p style={{ margin: 0, textAlign: "center", fontSize: 10, color: "#d1d5db" }}>
            Source: PubMed · National Library of Medicine · Summaries by Claude AI
          </p>
        </div>
      )}
    </div>
  );
}

// ── Defense System Card (mirrors your existing Learn page accordion) ──────────
function DefenseSystemCard({ systemKey, system }) {
  const [expanded, setExpanded] = useState(false);
  const colors = { color: system.color, bg: system.bg, border: system.border, badgeBg: system.badgeBg };

  return (
    <div style={{ border: `2px solid ${system.border}`, borderRadius: 16, overflow: "hidden", background: "#fff", marginBottom: 12 }}>
      <button onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: system.bg, border: "none", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{system.emoji}</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{system.displayName}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{system.description}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} style={{ color: system.color }} /> : <ChevronDown size={18} style={{ color: system.color }} />}
      </button>

      {expanded && (
        <div style={{ padding: "20px" }}>
          {/* Key foods */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Key Foods</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {system.keyFoods.map(f => (
                <span key={f} style={{ fontSize: 12, background: system.bg, color: system.color, border: `1px solid ${system.border}`, padding: "3px 10px", borderRadius: 99, fontWeight: 500 }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ marginBottom: 4 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <Lightbulb size={11} style={{ display: "inline", marginRight: 4 }} />Tips
            </p>
            {system.tips.map(t => (
              <div key={t} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 5 }}>
                <CheckCircle size={13} style={{ color: system.color, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* ← THIS IS WHERE DefenseSystemResearch slots in */}
          <ResearchSection papers={system.papers} colors={colors} />
        </div>
      )}
    </div>
  );
}

// ── Page preview ─────────────────────────────────────────────────────────────
export default function LearnPagePreview() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "linear-gradient(135deg, #f0fdf4, #eff6ff)", minHeight: "100vh", padding: "28px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header — matches your existing Learn page */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, background: "linear-gradient(135deg, #16a34a, #2563eb)", borderRadius: 16, marginBottom: 12 }}>
            <BookOpen size={26} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#111827" }}>Learn the 5x5x5 System</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            Discover Dr. William Li's framework — and the peer-reviewed science behind it
          </p>
        </div>

        {/* Callout */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <FlaskConical size={16} style={{ color: "#7c3aed", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#111827" }}>Research Evidence now embedded</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              Each defense system now shows real peer-reviewed papers from PubMed. Expand any system, then click <strong>Research Evidence</strong> → <strong>Plain English</strong> to get a 3-sentence summary powered by Claude.
            </p>
          </div>
        </div>

        {/* Defense system cards */}
        {Object.entries(DEFENSE_SYSTEMS).map(([key, system]) => (
          <DefenseSystemCard key={key} systemKey={key} system={system} />
        ))}

        <p style={{ textAlign: "center", fontSize: 11, color: "#d1d5db", marginTop: 20 }}>
          This preview shows 2 of 5 defense systems · Full component covers all 5
        </p>
      </div>
    </div>
  );
}
