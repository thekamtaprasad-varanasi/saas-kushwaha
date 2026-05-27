// Drug-drug interaction checker for psychiatry. Rule-based, no external API.
// Each rule: two groups of drugs (by salt name keyword) + severity + message.
// Severity: "danger" (avoid) | "caution" (monitor).

// Drug class groups — matched against medicine name (case-insensitive substring).
const GROUPS = {
  MAOI: ["phenelzine", "tranylcypromine", "isocarboxazid", "selegiline", "moclobemide"],
  SSRI: ["sertraline", "escitalopram", "fluoxetine", "paroxetine", "fluvoxamine", "citalopram"],
  SNRI: ["venlafaxine", "desvenlafaxine", "duloxetine"],
  TCA: ["amitriptyline", "nortriptyline", "imipramine", "clomipramine"],
  LITHIUM: ["lithium"],
  TRAMADOL: ["tramadol"],
  PETHIDINE: ["pethidine", "meperidine"],
  DEXTRO: ["dextromethorphan"],
  TRIPTAN: ["sumatriptan", "rizatriptan", "zolmitriptan", "naratriptan"],
  BUSPIRONE: ["buspirone"],
  LINEZOLID: ["linezolid"],
  CARBAMAZEPINE: ["carbamazepine"],
  VALPROATE: ["valproate", "valproic"],
  CLOZAPINE: ["clozapine"],
};

// Interaction rules. Each: groups [A, B], severity, short clinical message.
const RULES = [
  { a: "MAOI", b: "SSRI", severity: "danger", msg: "MAOI + SSRI: high risk of serotonin syndrome. Do NOT combine. Allow 2-week washout (5 weeks for fluoxetine)." },
  { a: "MAOI", b: "SNRI", severity: "danger", msg: "MAOI + SNRI: high risk of serotonin syndrome. Do NOT combine. Allow 2-week washout." },
  { a: "MAOI", b: "TCA", severity: "danger", msg: "MAOI + TCA (esp. clomipramine): risk of serotonin syndrome. Avoid combination." },
  { a: "MAOI", b: "TRAMADOL", severity: "danger", msg: "MAOI + Tramadol: serotonin syndrome risk. Avoid." },
  { a: "MAOI", b: "DEXTRO", severity: "danger", msg: "MAOI + Dextromethorphan: serotonin syndrome risk. Avoid." },
  { a: "MAOI", b: "PETHIDINE", severity: "danger", msg: "MAOI + Pethidine: serotonin syndrome risk. Avoid." },

  { a: "SSRI", b: "TRAMADOL", severity: "caution", msg: "SSRI + Tramadol: serotonin syndrome risk + lowered seizure threshold. Monitor; prefer safer analgesic." },
  { a: "SNRI", b: "TRAMADOL", severity: "caution", msg: "SNRI + Tramadol: serotonin syndrome risk. Monitor; prefer safer analgesic." },
  { a: "SSRI", b: "TRIPTAN", severity: "caution", msg: "SSRI + Triptan: possible serotonin syndrome. Monitor for symptoms." },
  { a: "SNRI", b: "TRIPTAN", severity: "caution", msg: "SNRI + Triptan: possible serotonin syndrome. Monitor." },
  { a: "SSRI", b: "LITHIUM", severity: "caution", msg: "SSRI + Lithium: additive serotonergic effect. Monitor for serotonin syndrome." },
  { a: "SSRI", b: "BUSPIRONE", severity: "caution", msg: "SSRI + Buspirone: additive serotonergic effect. Monitor." },
  { a: "SSRI", b: "LINEZOLID", severity: "danger", msg: "SSRI + Linezolid (a weak MAOI antibiotic): serotonin syndrome risk. Avoid." },
  { a: "SNRI", b: "LINEZOLID", severity: "danger", msg: "SNRI + Linezolid: serotonin syndrome risk. Avoid." },

  { a: "LITHIUM", b: "TRAMADOL", severity: "caution", msg: "Lithium + Tramadol: serotonin syndrome risk. Monitor." },
  { a: "CARBAMAZEPINE", b: "CLOZAPINE", severity: "danger", msg: "Carbamazepine + Clozapine: both suppress bone marrow (agranulocytosis risk). Avoid combination." },
  { a: "VALPROATE", b: "CARBAMAZEPINE", severity: "caution", msg: "Valproate + Carbamazepine: complex level changes; monitor drug levels and toxicity." },
];

function matchGroup(name, group) {
  const n = (name || "").toLowerCase();
  return GROUPS[group].some((kw) => n.includes(kw));
}

// Given a list of medicine objects (with .name), return array of triggered warnings.
export function checkInteractions(medicines) {
  const names = (medicines || []).map((m) => m.name).filter(Boolean);
  if (names.length < 2) return [];

  const warnings = [];
  const seen = new Set();

  for (const rule of RULES) {
    const aMatches = names.filter((n) => matchGroup(n, rule.a));
    const bMatches = names.filter((n) => matchGroup(n, rule.b));
    if (aMatches.length === 0 || bMatches.length === 0) continue;

    for (const x of aMatches) {
      for (const y of bMatches) {
        if (x === y) continue;
        const key = [x, y].sort().join("|") + rule.msg;
        if (seen.has(key)) continue;
        seen.add(key);
        warnings.push({
          drugs: [x, y],
          severity: rule.severity,
          message: rule.msg,
        });
      }
    }
  }
  return warnings;
}