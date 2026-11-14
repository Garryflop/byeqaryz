import { simulate } from './simulate'
import type { Borrower, Comparison, PlanId, PlanOutcome, PlanResult } from './types'

export const PLAN_ORDER: PlanId[] = ['ibr', 'rap', 'standard']

export const PLAN_NAMES: Record<PlanId, string> = {
  standard: 'Standard',
  ibr: 'Income-Based Repayment',
  rap: 'Repayment Assistance Plan',
}

/** Short names for tight spaces. */
export const PLAN_SHORT: Record<PlanId, string> = {
  standard: 'Standard',
  ibr: 'IBR',
  rap: 'RAP',
}

/**
 * Why a borrower cannot use a plan, or null if they can.
 * Sources: 34 CFR 685.208 and 685.209 as amended May 1, 2026.
 */
export function ineligibleReason(plan: PlanId, b: Borrower): string | null {
  if (plan === 'standard') return null
  if (b.loanType === 'parentPlus') {
    return plan === 'rap'
      ? 'Parent PLUS loans cannot be repaid under RAP.'
      : 'Parent PLUS loans are not eligible for Income-Based Repayment.'
  }
  if (plan === 'ibr' && b.newLoansSinceJuly2026) {
    return 'IBR is closed to borrowers with a federal loan made on or after July 1, 2026.'
  }
  return null
}

function baselinePlan(b: Borrower): { plan: PlanId; note: string } {
  switch (b.currentPlan) {
    case 'standard':
    case 'ibr':
    case 'rap':
      return { plan: b.currentPlan, note: `staying on ${PLAN_SHORT[b.currentPlan]}` }
    case 'save':
      // SAVE ended in March 2026. Servicers give 90 days to choose; reports say
      // borrowers who do not choose are placed on a Standard plan.
      return { plan: 'standard', note: 'being moved off SAVE onto the Standard plan' }
    case 'unsure':
      return { plan: 'standard', note: 'the default Standard plan' }
  }
}

const by = (key: (r: PlanResult) => number) => (a: PlanResult, b: PlanResult) => key(a) - key(b)

/** Runs every plan for one borrower and works out what doing nothing costs. */
export function compare(b: Borrower): Comparison {
  const outcomes: PlanOutcome[] = PLAN_ORDER.map((id) => {
    const reason = ineligibleReason(id, b)
    return reason
      ? { id, eligible: false, reason }
      : { id, eligible: true, result: simulate(id, b) }
  })
  const results = outcomes.flatMap((o) => (o.result ? [o.result] : []))

  const cheapest = [...results].sort(by((r) => r.trueCost))[0]
  const lowestPayment = [...results].sort(by((r) => r.firstPayment))[0]
  const { plan, note } = baselinePlan(b)
  // A borrower cannot stay on a plan that is closed to them.
  const baseline = results.find((r) => r.id === plan) ?? results.find((r) => r.id === 'standard')!

  return {
    outcomes,
    results,
    cheapest,
    lowestPayment,
    baseline,
    baselineNote: baseline.id === plan ? note : 'the Standard plan',
    costOfInaction: Math.max(0, baseline.trueCost - cheapest.trueCost),
  }
}
