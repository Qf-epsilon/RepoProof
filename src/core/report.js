import { BOUNDARY } from "./constants.js";
import { sortResults, summarize } from "./state.js";

export function buildReport({ repo, results, generatedAt }) {
  const sorted = sortResults(results);
  return {
    reportVersion: 1,
    generatedAt: generatedAt || new Date().toISOString(),
    repo,
    claims: sorted,
    summary: summarize(sorted),
    boundary: BOUNDARY,
  };
}
