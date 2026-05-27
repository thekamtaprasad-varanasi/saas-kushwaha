// Validated psychiatric rating scales. All public-domain, copyright-free, standard worldwide.
// Each scale: { id, name, title, intro, options, questions, scoreFn }
// scoreFn(answers) returns { total, max, label, color, detail? }

// ---- Shared 4-point frequency scale (PHQ-9, GAD-7, PHQ-2) ----
export const FREQ_4 = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

// ---- DASS-21 4-point scale (different wording, last week) ----
export const DASS_4 = [
  { label: "Did not apply to me", value: 0 },
  { label: "Applied some of the time", value: 1 },
  { label: "Applied a good part of time", value: 2 },
  { label: "Applied most of the time", value: 3 },
];

// ---- Yes/No (MDQ) ----
export const YES_NO = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

function band(total, bands) {
  const b = bands.find((x) => total >= x.min && total <= x.max);
  return b || { label: "", color: "gray" };
}

// ================= PHQ-9 (Depression) =================
export const PHQ9 = {
  id: "phq9",
  name: "PHQ-9",
  title: "Depression (PHQ-9)",
  intro: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
  options: FREQ_4,
  max: 27,
  questions: [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling/staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself/family down",
    "Trouble concentrating on things, such as reading or watching television",
    "Moving/speaking so slowly others noticed — or being fidgety/restless, moving a lot more than usual",
    "Thoughts that you would be better off dead, or of hurting yourself",
  ],
  scoreFn(answers) {
    const total = answers.reduce((s, v) => s + (Number(v) || 0), 0);
    const b = band(total, [
      { min: 0, max: 4, label: "Minimal", color: "emerald" },
      { min: 5, max: 9, label: "Mild", color: "lime" },
      { min: 10, max: 14, label: "Moderate", color: "amber" },
      { min: 15, max: 19, label: "Moderately severe", color: "orange" },
      { min: 20, max: 27, label: "Severe", color: "red" },
    ]);
    // Q9 flag: any positive suicidal ideation
    const q9 = Number(answers[8]) || 0;
    return { total, max: 27, label: b.label, color: b.color, alert: q9 > 0 ? "Q9 positive — assess suicide risk" : "" };
  },
};

// ================= GAD-7 (Anxiety) =================
export const GAD7 = {
  id: "gad7",
  name: "GAD-7",
  title: "Anxiety (GAD-7)",
  intro: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  options: FREQ_4,
  max: 21,
  questions: [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid, as if something awful might happen",
  ],
  scoreFn(answers) {
    const total = answers.reduce((s, v) => s + (Number(v) || 0), 0);
    const b = band(total, [
      { min: 0, max: 4, label: "Minimal", color: "emerald" },
      { min: 5, max: 9, label: "Mild", color: "lime" },
      { min: 10, max: 14, label: "Moderate", color: "amber" },
      { min: 15, max: 21, label: "Severe", color: "red" },
    ]);
    return { total, max: 21, label: b.label, color: b.color };
  },
};

// ================= PHQ-2 (Quick depression screen) =================
export const PHQ2 = {
  id: "phq2",
  name: "PHQ-2",
  title: "Quick Depression Screen (PHQ-2)",
  intro: "Over the last 2 weeks, how often have you been bothered by the following?",
  options: FREQ_4,
  max: 6,
  questions: [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
  ],
  scoreFn(answers) {
    const total = answers.reduce((s, v) => s + (Number(v) || 0), 0);
    const b = band(total, [
      { min: 0, max: 2, label: "Negative screen", color: "emerald" },
      { min: 3, max: 6, label: "Positive — do full PHQ-9", color: "amber" },
    ]);
    return { total, max: 6, label: b.label, color: b.color };
  },
};

// ================= DASS-21 (Depression / Anxiety / Stress) =================
// 21 items, 3 subscales of 7. Final subscale score = sum × 2.
// Subscale item indexes (0-based) per standard DASS-21:
//   Depression: 2,4,9,12,15,16,20
//   Anxiety:    1,3,6,8,14,18,19
//   Stress:     0,5,7,10,11,13,17
export const DASS21 = {
  id: "dass21",
  name: "DASS-21",
  title: "Depression · Anxiety · Stress (DASS-21)",
  intro: "Over the past week, how much did each statement apply to you?",
  options: DASS_4,
  max: 126,
  questions: [
    "I found it hard to wind down",
    "I was aware of dryness of my mouth",
    "I couldn't seem to experience any positive feeling at all",
    "I experienced breathing difficulty (e.g. rapid breathing, breathlessness with no exertion)",
    "I found it difficult to work up the initiative to do things",
    "I tended to over-react to situations",
    "I experienced trembling (e.g. in the hands)",
    "I felt that I was using a lot of nervous energy",
    "I was worried about situations in which I might panic and make a fool of myself",
    "I felt that I had nothing to look forward to",
    "I found myself getting agitated",
    "I found it difficult to relax",
    "I felt down-hearted and blue",
    "I was intolerant of anything that kept me from getting on with what I was doing",
    "I felt I was close to panic",
    "I was unable to become enthusiastic about anything",
    "I felt I wasn't worth much as a person",
    "I felt that I was rather touchy",
    "I was aware of the action of my heart in the absence of exertion (e.g. heart racing)",
    "I felt scared without any good reason",
    "I felt that life was meaningless",
  ],
  scoreFn(answers) {
    const dIdx = [2, 4, 9, 12, 15, 16, 20];
    const aIdx = [1, 3, 6, 8, 14, 18, 19];
    const sIdx = [0, 5, 7, 10, 11, 13, 17];
    const sum = (idx) => idx.reduce((s, i) => s + (Number(answers[i]) || 0), 0) * 2;
    const dep = sum(dIdx), anx = sum(aIdx), str = sum(sIdx);

    const depBand = band(dep, [
      { min: 0, max: 9, label: "Normal", color: "emerald" },
      { min: 10, max: 13, label: "Mild", color: "lime" },
      { min: 14, max: 20, label: "Moderate", color: "amber" },
      { min: 21, max: 27, label: "Severe", color: "orange" },
      { min: 28, max: 999, label: "Extremely severe", color: "red" },
    ]);
    const anxBand = band(anx, [
      { min: 0, max: 7, label: "Normal", color: "emerald" },
      { min: 8, max: 9, label: "Mild", color: "lime" },
      { min: 10, max: 14, label: "Moderate", color: "amber" },
      { min: 15, max: 19, label: "Severe", color: "orange" },
      { min: 20, max: 999, label: "Extremely severe", color: "red" },
    ]);
    const strBand = band(str, [
      { min: 0, max: 14, label: "Normal", color: "emerald" },
      { min: 15, max: 18, label: "Mild", color: "lime" },
      { min: 19, max: 25, label: "Moderate", color: "amber" },
      { min: 26, max: 33, label: "Severe", color: "orange" },
      { min: 34, max: 999, label: "Extremely severe", color: "red" },
    ]);

    return {
      total: dep + anx + str,
      max: 126,
      label: "See subscales",
      color: "indigo",
      detail: [
        { name: "Depression", score: dep, label: depBand.label, color: depBand.color },
        { name: "Anxiety", score: anx, label: anxBand.label, color: anxBand.color },
        { name: "Stress", score: str, label: strBand.label, color: strBand.color },
      ],
    };
  },
};

// ================= MDQ (Bipolar screen) =================
// Q1: 13 yes/no symptom items. Positive screen needs ALL three:
//   (a) 7+ "yes" on the 13 items, (b) same-period co-occurrence = yes,
//   (c) problem severity = moderate or serious.
// We store: answers[0..12] = symptom yes/no, answers[13] = co-occurrence (0/1),
//   answers[14] = severity (0 none,1 minor,2 moderate,3 serious).
export const MDQ = {
  id: "mdq",
  name: "MDQ",
  title: "Bipolar Screen (MDQ)",
  intro: "Has there ever been a period when you were not your usual self and...",
  options: YES_NO,
  max: 13,
  questions: [
    "...you felt so good or hyper that others thought you were not your normal self, or you got into trouble?",
    "...you were so irritable that you shouted at people or started fights/arguments?",
    "...you felt much more self-confident than usual?",
    "...you got much less sleep than usual and found you didn't really miss it?",
    "...you were much more talkative or spoke faster than usual?",
    "...thoughts raced through your head or you couldn't slow your mind down?",
    "...you were so easily distracted that you had trouble concentrating/staying on track?",
    "...you had much more energy than usual?",
    "...you were much more active or did many more things than usual?",
    "...you were much more social or outgoing than usual (e.g. phoned friends at night)?",
    "...you were much more interested in sex than usual?",
    "...you did things that were unusual for you, or that others thought were excessive/risky?",
    "...spending money got you or your family into trouble?",
  ],
  // extra (asked separately in UI): co-occurrence + severity
  followups: [
    { key: "cooccur", text: "If you ticked more than one above, did several happen during the same period?", options: YES_NO },
    {
      key: "severity",
      text: "How much of a problem did these cause (work, family, money, legal)?",
      options: [
        { label: "No problem", value: 0 },
        { label: "Minor", value: 1 },
        { label: "Moderate", value: 2 },
        { label: "Serious", value: 3 },
      ],
    },
  ],
  scoreFn(answers, extra = {}) {
    const yesCount = answers.slice(0, 13).reduce((s, v) => s + (Number(v) || 0), 0);
    const cooccur = Number(extra.cooccur) || 0;
    const severity = Number(extra.severity) || 0;
    const positive = yesCount >= 7 && cooccur === 1 && severity >= 2;
    return {
      total: yesCount,
      max: 13,
      label: positive ? "Positive — bipolar likely, refer" : "Negative screen",
      color: positive ? "red" : "emerald",
      detail: [
        { name: "Symptoms", score: yesCount, label: `${yesCount}/13 yes`, color: yesCount >= 7 ? "amber" : "emerald" },
      ],
    };
  },
};

export const SCALES = [PHQ9, GAD7, PHQ2, DASS21, MDQ];

export function getScale(id) {
  return SCALES.find((s) => s.id === id) || null;
}