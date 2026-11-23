/**
 * Human-readable labels for the Wix assessment form fields (q4…q30).
 * Only the ones identifiable from the Wix page code are labelled; the rest fall back to
 * "Question N" until the real wording is added here.
 */
export const ASSESSMENT_QUESTION_LABELS: Record<string, string> = {
  q4: "Industry",
  q5: "Employee count band",
  q6: "Business size",
  q7: "Operating locations",
  q8: "Geographic scope",
  describeBusiness: "Business description",
  url: "Company website",
  namePolicyOwner: "Policy owner",
};

export function assessmentQuestionLabel(key: string): string {
  if (ASSESSMENT_QUESTION_LABELS[key]) return ASSESSMENT_QUESTION_LABELS[key];
  const m = /^q(\d+)$/.exec(key);
  return m ? `Question ${m[1]}` : key;
}

export function formatAssessmentAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
