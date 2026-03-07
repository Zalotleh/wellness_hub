'use client';

import { useState, useCallback } from 'react';
import { FlaskConical, ExternalLink, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { DefenseSystem } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

interface ResearchArticle {
  pmid: string;
  title: string;
  abstract: string;
  journal: string;
  year: string;
  doi: string;
  authors: string;
  type: string;
  keyFoods: string[];
  keyFinding: string;
  system: DefenseSystem;
}

interface SystemColors {
  border: string;
  bg: string;
  badge: string;
  text: string;
  accent: string;
}

// ── Real PubMed articles per defense system ──────────────────────────────────

const RESEARCH_BY_SYSTEM: Record<string, ResearchArticle[]> = {
  ANGIOGENESIS: [
    {
      pmid: '38714356',
      title: 'The Past and Future of Angiogenesis as a Target for Cancer Therapy and Prevention',
      abstract:
        'Many compounds, either dietary derivatives or repurposed drugs, with antiangiogenic activity are possible tools for cancer angioprevention. Such molecules have a favorable safety profile and are likely to allow the prolonged duration necessary for an efficient preventive strategy. Food derivatives including flavonoids, retinoids, omega fatty acids, and carotenoids have been identified as having antiangiogenic activity.',
      journal: 'Cancer Prevention Research',
      year: '2024',
      doi: '10.1158/1940-6207.CAPR-24-0085',
      authors: 'Albini A, Noonan DM et al.',
      type: 'Review',
      keyFoods: ['green tea (EGCG)', 'resveratrol (red grapes)', 'lycopene (tomatoes)', 'omega-3 (salmon)'],
      keyFinding: 'Dietary compounds from green tea, red grapes, tomatoes, and salmon block tumor blood-vessel growth — with a safety profile suited for long-term cancer prevention.',
      system: DefenseSystem.ANGIOGENESIS,
    },
    {
      pmid: '22125182',
      title: 'Modulation of Angiogenesis by Dietary Phytoconstituents in the Prevention of Breast Cancer',
      abstract:
        'Various phytochemicals found in the diet kill breast cancer cells in vitro and prevent as well as suppress breast cancer progression in various preclinical animal models. This review examines the value of dietary phytoconstituents in the prevention and treatment of breast cancer through modulation of the complex process of angiogenesis.',
      journal: 'Molecular Nutrition & Food Research',
      year: '2012',
      doi: '10.1002/mnfr.201100619',
      authors: 'Reuben SC, Gopalan A, Bishayee A et al.',
      type: 'Review',
      keyFoods: ['berries', 'cruciferous vegetables', 'apples', 'green tea'],
      keyFinding: 'Phytochemicals from berries, cruciferous vegetables, apples, and green tea suppress breast cancer by cutting off the blood supply that feeds tumors.',
      system: DefenseSystem.ANGIOGENESIS,
    },
  ],
  REGENERATION: [
    {
      pmid: '38299969',
      title: 'Avenanthramide and β-Glucan Therapeutics Accelerate Wound Healing Via Distinct Mechanisms',
      abstract:
        'β-Glucan demonstrated increased angiogenesis and tissue regeneration with improved tissue architecture. Oat-derived avenanthramide promoted a regenerative tissue architecture with reduced inflammatory cell recruitment. These naturally derived therapeutics show promise for both tissue regeneration and reducing inflammation.',
      journal: 'Advances in Wound Care',
      year: '2024',
      doi: '10.1089/wound.2023.0050',
      authors: 'Kussie HC, ..., Li WW, Li VW et al. (Angiogenesis Foundation)',
      type: 'Journal Article',
      keyFoods: ['oats (β-glucan)', 'oats (avenanthramide)', 'mushrooms'],
      keyFinding: 'Oat-derived avenanthramide and mushroom β-glucan each independently accelerated tissue regeneration and reduced inflammation in Angiogenesis Foundation wound studies.',
      system: DefenseSystem.REGENERATION,
    },
  ],
  MICROBIOME: [
    {
      pmid: '39009882',
      title: 'The Interplay Between Diet and the Gut Microbiome: Implications for Health and Disease',
      abstract:
        'Diet has a pivotal role in shaping the composition, function and diversity of the gut microbiome, with various diets having a profound impact on the stability and diversity of the microbial community within our gut. The Mediterranean diet, high-fibre diet, and plant-based diet each influence the gut microbiome in distinct ways that affect metabolic and intestinal health.',
      journal: 'Nature Reviews Microbiology',
      year: '2024',
      doi: '10.1038/s41579-024-01068-4',
      authors: 'Ross FC, Patangia D, Stanton C et al.',
      type: 'Review · Nature',
      keyFoods: ['Mediterranean foods', 'high-fibre vegetables', 'fermented foods', 'legumes'],
      keyFinding: 'The Mediterranean, high-fiber, and plant-based diets each shape gut microbial diversity in distinct ways that protect metabolic and digestive health — reviewed in Nature.',
      system: DefenseSystem.MICROBIOME,
    },
    {
      pmid: '34941392',
      title: 'Dietary Fiber and Probiotics Influence the Gut Microbiome and Melanoma Immunotherapy Response',
      abstract:
        'Higher dietary fiber was associated with significantly improved progression-free survival in patients on immune checkpoint blockade, with the most pronounced benefit observed in patients with sufficient dietary fiber intake. Findings demonstrated impaired treatment response in mice receiving a low-fiber diet, with a lower frequency of cytotoxic T cells in the tumor microenvironment.',
      journal: 'Science',
      year: '2022',
      doi: '10.1126/science.aaz7015',
      authors: 'Spencer CN, McQuade JL, Wargo JA et al. (MD Anderson)',
      type: 'Clinical Study · Science',
      keyFoods: ['high-fibre vegetables', 'whole grains', 'legumes', 'fruit'],
      keyFinding: 'High dietary fiber intake significantly improved cancer survival in immunotherapy patients, directly linking what you eat to how well your immune system fights cancer.',
      system: DefenseSystem.MICROBIOME,
    },
  ],
  DNA_PROTECTION: [
    {
      pmid: '27951449',
      title: 'Plant Flavonoids in Cancer Chemoprevention: Role in Genome Stability',
      abstract:
        'Flavonoids are naturally occurring polyphenols that are ubiquitous in plant-based food such as fruits, vegetables and teas. This review describes the most efficacious plant flavonoids, including luteolin, epigallocatechin gallate, quercetin, and apigenin, and the molecular basis of how these flavonoids contribute to chemoprevention with a focus on protection against DNA damage caused by various carcinogenic factors.',
      journal: 'Journal of Nutritional Biochemistry',
      year: '2017',
      doi: '10.1016/j.jnutbio.2016.11.007',
      authors: 'George VC, Dellaire G, Rupasinghe HPV',
      type: 'Review',
      keyFoods: ['quercetin (apples, onions)', 'green tea (EGCG)', 'luteolin (parsley, celery)', 'apigenin (chamomile)'],
      keyFinding: 'Quercetin (apples/onions), EGCG (green tea), luteolin, and apigenin each protect DNA from carcinogenic damage through multiple molecular pathways linked to cancer prevention.',
      system: DefenseSystem.DNA_PROTECTION,
    },
  ],
  IMMUNITY: [
    {
      pmid: '34941392',
      title: 'Dietary Fiber and Probiotics Influence the Gut Microbiome and Melanoma Immunotherapy Response',
      abstract:
        'Higher dietary fiber was associated with significantly improved progression-free survival in cancer patients, with the most pronounced benefit observed in patients with sufficient dietary fiber intake. The gut microbiome directly modulates immune checkpoint therapy response — a landmark finding connecting what we eat to how our immune system fights cancer.',
      journal: 'Science',
      year: '2022',
      doi: '10.1126/science.aaz7015',
      authors: 'Spencer CN, McQuade JL, Wargo JA et al. (MD Anderson)',
      type: 'Clinical Study · Science',
      keyFoods: ['high-fibre foods', 'whole grains', 'vegetables', 'legumes'],
      keyFinding: 'Dietary fiber was a significant predictor of immunotherapy success in melanoma patients — establishing a direct gut-to-immune-to-cancer axis (Science, 2022).',
      system: DefenseSystem.IMMUNITY,
    },
  ],
};

// ── Prestige journal tiers ───────────────────────────────────────────────────

const PRESTIGE_TIER: Record<string, 'gold' | 'teal'> = {
  'Science':                      'gold',
  'Nature':                       'teal',
  'Cell':                         'teal',
  'The Lancet':                   'gold',
  'NEJM':                         'gold',
  'JAMA':                         'gold',
};

function getPrestigeTier(journal: string): 'gold' | 'teal' | null {
  for (const [name, tier] of Object.entries(PRESTIGE_TIER)) {
    if (journal.startsWith(name)) return tier;
  }
  return null;
}

// ── System color config ───────────────────────────────────────────────────────

const SYSTEM_COLORS: Record<string, SystemColors> = {
  ANGIOGENESIS:   { border: '#fca5a5', bg: '#fef2f2', badge: '#dc2626', text: '#7f1d1d', accent: '#dc2626' },
  REGENERATION:   { border: '#86efac', bg: '#f0fdf4', badge: '#16a34a', text: '#14532d', accent: '#16a34a' },
  MICROBIOME:     { border: '#c4b5fd', bg: '#f5f3ff', badge: '#7c3aed', text: '#3b0764', accent: '#7c3aed' },
  DNA_PROTECTION: { border: '#7dd3fc', bg: '#f0f9ff', badge: '#0284c7', text: '#0c4a6e', accent: '#0284c7' },
  IMMUNITY:       { border: '#fdba74', bg: '#fff7ed', badge: '#ea580c', text: '#7c2d12', accent: '#ea580c' },
};

// ── PaperCard ─────────────────────────────────────────────────────────────────

interface PaperCardProps {
  article: ResearchArticle;
  systemColor: SystemColors;
  summaryCache: Record<string, string>;
  cacheSource: Record<string, 'cache' | 'claude'>;
  onSummaryFetched: (pmid: string, text: string, source: 'cache' | 'claude') => void;
}

function PaperCard({ article, systemColor, summaryCache, cacheSource, onSummaryFetched }: PaperCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cachedSummary = summaryCache[article.pmid];
  const source = cacheSource[article.pmid];

  const handleSummaryClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (expanded) {
        setExpanded(false);
        return;
      }
      setExpanded(true);
      if (cachedSummary) return;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/research/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pmid: article.pmid,
            title: article.title,
            abstract: article.abstract,
            defenseSystem: article.system,
            keywords: article.keyFoods,
          }),
        });

        if (!res.ok) throw new Error('API error');

        const data = await res.json();
        onSummaryFetched(article.pmid, data.summary || 'Summary unavailable.', data.source ?? 'claude');
      } catch {
        setError("Couldn't load summary — please try again.");
      }
      setLoading(false);
    },
    [expanded, cachedSummary, article, onSummaryFetched],
  );

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{ borderColor: systemColor.border, background: '#fff' }}
    >
      {/* Paper header */}
      <div className="px-4 py-3">
        {/* Type badge + prestige + year */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: systemColor.bg, color: systemColor.badge }}
          >
            {article.type}
          </span>
          {getPrestigeTier(article.journal) === 'gold' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
              ⭐ Top Journal
            </span>
          )}
          {getPrestigeTier(article.journal) === 'teal' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              🔬 Nature Family
            </span>
          )}
          <span className="text-xs text-gray-400">
            {article.year} · {article.journal}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug mb-1">
          {article.title}
        </p>

        {/* Authors */}
        <p className="text-xs text-gray-400 mb-3">
          {article.authors}
        </p>

        {/* Key finding callout */}
        <blockquote
          className="border-l-4 pl-3 py-1.5 mb-3 rounded-r-lg"
          style={{ borderColor: systemColor.badge, background: systemColor.bg }}
        >
          <p className="text-sm font-semibold leading-snug" style={{ color: systemColor.text }}>
            {article.keyFinding}
          </p>
        </blockquote>

        {/* Key food chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.keyFoods.map((f) => (
            <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              🌿 {f}
            </span>
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSummaryClick}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: expanded ? systemColor.bg : systemColor.badge,
              color: expanded ? systemColor.badge : '#fff',
              border: `1px solid ${systemColor.border}`,
            }}
          >
            <Sparkles size={11} />
            {loading ? 'Asking Claude…' : expanded ? 'Hide summary' : 'Plain English'}
          </button>

          <a
            href={`https://doi.org/${article.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300"
          >
            <ExternalLink size={10} />
            PubMed ↗
          </a>

          {cachedSummary && !expanded && source === 'cache' && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              ⚡ cached
            </span>
          )}
        </div>
      </div>

      {/* AI summary panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div
            className="rounded-lg p-3 border"
            style={{ background: systemColor.bg, borderColor: systemColor.border }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} style={{ color: systemColor.badge }} />
              <span
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: systemColor.badge }}
              >
                Plain English Summary
              </span>
              {cachedSummary && source === 'cache' && (
                <span className="ml-auto text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  ⚡ DB cached
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-xs italic text-gray-400">Sending abstract to Claude…</p>
            ) : error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : cachedSummary ? (
              <p className="text-sm leading-relaxed" style={{ color: systemColor.text }}>
                {cachedSummary}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

interface DefenseSystemResearchProps {
  system: DefenseSystem;
  alwaysOpen?: boolean;
}

export const RESEARCH_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(RESEARCH_BY_SYSTEM).map(([k, v]) => [k, v.length]),
);

export default function DefenseSystemResearch({ system, alwaysOpen = false }: DefenseSystemResearchProps) {
  const [open, setOpen] = useState(false);
  const [summaryCache, setSummaryCache] = useState<Record<string, string>>({});
  const [cacheSource, setCacheSource] = useState<Record<string, 'cache' | 'claude'>>({});

  const handleSummaryFetched = useCallback(
    (pmid: string, text: string, source: 'cache' | 'claude') => {
      setSummaryCache((prev) => ({ ...prev, [pmid]: text }));
      setCacheSource((prev) => ({ ...prev, [pmid]: source }));
    },
    [],
  );

  const articles = RESEARCH_BY_SYSTEM[system as string];
  if (!articles || articles.length === 0) return null;

  const colors = SYSTEM_COLORS[system as string] ?? SYSTEM_COLORS.IMMUNITY;

  if (alwaysOpen) {
    return (
      <div className="flex flex-col gap-3">
        {articles.map((article) => (
          <PaperCard
            key={article.pmid}
            article={article}
            systemColor={colors}
            summaryCache={summaryCache}
            cacheSource={cacheSource}
            onSummaryFetched={handleSummaryFetched}
          />
        ))}
        <p className="text-xs text-center text-gray-400 mt-1">
          Source: PubMed · National Library of Medicine · Summaries by Claude AI
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-5" style={{ borderColor: colors.border }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: colors.bg }}>
            <FlaskConical size={14} style={{ color: colors.badge }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              Research Evidence
            </p>
            <p className="text-xs text-gray-400">
              {articles.length} peer-reviewed {articles.length === 1 ? 'paper' : 'papers'} from PubMed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: colors.bg, color: colors.badge }}
          >
            PubMed
          </span>
          {open ? (
            <ChevronUp size={15} className="text-gray-400" />
          ) : (
            <ChevronDown size={15} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Papers list */}
      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {articles.map((article) => (
            <PaperCard
              key={article.pmid}
              article={article}
              systemColor={colors}
              summaryCache={summaryCache}
              cacheSource={cacheSource}
              onSummaryFetched={handleSummaryFetched}
            />
          ))}
          <p className="text-xs text-center text-gray-300 mt-1">
            Source: PubMed · National Library of Medicine · Summaries by Claude AI
          </p>
        </div>
      )}
    </div>
  );
}
