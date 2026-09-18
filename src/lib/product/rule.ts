/**
 * Most important product rule for PropertyCheck Pakistan.
 * Features that only inflate the app must not ship.
 */

export const MOST_IMPORTANT_RULE =
  "Do not add random features simply to make the application look large.";

export const FEATURE_FILTER_QUESTION =
  "Does this make buying/selling property in Pakistan safer, easier, clearer, or more accessible?";

export const FEATURE_OUTCOMES = ["safer", "easier", "clearer", "more accessible"] as const;

export type FeatureOutcome = (typeof FEATURE_OUTCOMES)[number];

/** If none of the outcomes apply, do not build the feature. */
export function shouldBuildFeature(outcomes: readonly FeatureOutcome[]): boolean {
  return outcomes.some((o) => (FEATURE_OUTCOMES as readonly string[]).includes(o));
}

export const SCOPE_DOC = "docs/SCOPE.md";
