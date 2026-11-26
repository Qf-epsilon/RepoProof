import { STATE, STATE_META } from "./constants.js";

export function makeResult({
  claimId,
  claimText,
  object,
  rule,
  state,
  explanation,
  supports = [],
  doesNotSupport = [],
  evidence = [],
  order = 0,
}) {
  if (!Object.values(STATE).includes(state)) {
    throw new Error(`未知状态: ${state}`);
  }
  return {
    claimId,
    claimText,
    object,
    rule,
    state,
    explanation,
    supports,
    doesNotSupport,
    evidence,
    order,
  };
}

export function sortResults(results) {
  return [...results].sort((a, b) => {
    const byState = STATE_META[a.state].order - STATE_META[b.state].order;
    return byState !== 0 ? byState : a.order - b.order;
  });
}

export function summarize(results) {
  const summary = {
    found: 0,
    insufficient: 0,
    inconsistent: 0,
    unable: 0,
  };
  for (const result of results) {
    summary[result.state] += 1;
  }
  return summary;
}

export function stateLabel(state) {
  return STATE_META[state]?.label || state;
}

export function errorToState(kind) {
  return kind === "not_found" ? STATE.INSUFFICIENT : STATE.UNABLE;
}
