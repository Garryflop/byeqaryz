import {
  FORGIVENESS_TAX_RATE,
  IBR,
  MAX_MONTHS,
  PSLF_MONTHS,
  RAP,
  STANDARD,
  TIERED_STANDARD,
  povertyGuideline,
  regionOf,
} from './rules'
import type { Borrower, EndReason, PlanId, PlanResult, YearPoint } from './types'

const cents = (n: number) => Math.round(n * 100) / 100

/** Fixed payment that clears `balance` in `months` at a yearly `ratePct`. */
export function amortizedPayment(balance: number, ratePct: number, months: number): number {
  if (balance <= 0) return 0
  const r = ratePct / 100 / 12
  if (r === 0) return balance / months
  return (balance * r) / (1 - (1 + r) ** -months)
}

/** Income the plan formulas look at: joint filers are assessed on both incomes. */
export function countedIncome(b: Borrower, yearsAhead = 0): number {
  const base = b.filing === 'joint' ? b.agi + b.spouseAgi : b.agi
  return base * (1 + b.incomeGrowth / 100) ** yearsAhead
}

/** Length of the Standard plan: 10 years, or tiered by balance for new loans. */
export function standardMonths(b: Borrower): number {
  if (!b.newLoansSinceJuly2026) return STANDARD.months
  for (const [below, months] of TIERED_STANDARD) {
    if (b.balance < below) return months
  }
  return STANDARD.months
}

/** Payment on the Standard plan this borrower would be placed on. */
export function standardMonthly(b: Borrower): number {
  return Math.max(STANDARD.minimumMonthly, amortizedPayment(b.balance, b.rate, standardMonths(b)))
}

/**
 * The 10-year standard amount. IBR payments are capped at it, and it is what a
 * borrower is charged after missing income recertification.
 */
export function tenYearStandardMonthly(b: Borrower): number {
  return Math.max(STANDARD.minimumMonthly, amortizedPayment(b.balance, b.rate, STANDARD.months))
}

export function ibrTerms(b: Borrower) {
  return b.borrowedBeforeJuly2014 ? IBR.oldBorrower : IBR.newBorrower
}

/** IBR: a share of income above 150% of the poverty line, capped at the standard payment. */
export function ibrMonthly(b: Borrower, yearsAhead = 0): number {
  const protectedIncome =
    IBR.protectedMultiple * povertyGuideline(regionOf(b.state), b.familySize, yearsAhead)
  const discretionary = Math.max(0, countedIncome(b, yearsAhead) - protectedIncome)
  let incomeBased = (discretionary * ibrTerms(b).share) / 12
  if (incomeBased < IBR.zeroBelow) incomeBased = 0
  else if (incomeBased < IBR.floor) incomeBased = IBR.floor
  return Math.min(incomeBased, tenYearStandardMonthly(b))
}

/** Share of total AGI owed per year under RAP. */
export function rapShare(agi: number): number {
  for (const [ceiling, share] of RAP.brackets) {
    if (agi <= ceiling) return share
  }
  return RAP.brackets[RAP.brackets.length - 1][1]
}

/** RAP: a share of total AGI, less $50 per dependent, never under $10. */
export function rapMonthly(b: Borrower, yearsAhead = 0): number {
  const agi = countedIncome(b, yearsAhead)
  const incomeBased = (agi * rapShare(agi)) / 12
  return Math.max(RAP.minimumMonthly, incomeBased - RAP.perDependentMonthly * b.dependents)
}

function scheduledPayment(plan: PlanId, b: Borrower, yearsAhead: number): number {
  if (plan === 'standard') return standardMonthly(b)
  if (plan === 'ibr') return ibrMonthly(b, yearsAhead)
  return rapMonthly(b, yearsAhead)
}

/** Total qualifying payments needed before the remaining balance is forgiven. */
export function forgivenessTarget(plan: PlanId, b: Borrower): number {
  if (plan === 'standard') return Infinity
  if (b.pslf) return PSLF_MONTHS
  return plan === 'ibr' ? ibrTerms(b).forgivenessMonths : RAP.forgivenessMonths
}

/**
 * Walks the loan forward one month at a time until it is paid off or forgiven.
 *
 * Interest rules differ by plan:
 *  - Standard: ordinary amortisation.
 *  - IBR: interest the payment does not cover keeps accruing (it is tracked
 *    separately and does not capitalise while the borrower stays on the plan),
 *    except on subsidized loans during the first three years.
 *  - RAP: interest the payment does not cover is waived, and if the payment
 *    reduces principal by less than $50 the government makes up the difference.
 */
export function simulate(plan: PlanId, b: Borrower): PlanResult {
  const monthlyRate = b.rate / 100 / 12
  const target = forgivenessTarget(plan, b)

  let principal = b.balance
  let unpaidInterest = 0
  let totalPaid = 0
  let governmentHelp = 0
  let firstPayment = 0
  let lastPayment = 0
  let peakPayment = 0
  let months = 0
  let forgiven = 0
  let endReason: EndReason = 'paid'
  const timeline: YearPoint[] = [{ year: 0, balance: cents(principal), paid: 0 }]

  while (principal + unpaidInterest > 0.005 && months < MAX_MONTHS) {
    if (b.qualifyingPayments + months >= target) {
      forgiven = principal + unpaidInterest
      endReason = b.pslf ? 'pslf' : 'forgiven'
      principal = 0
      unpaidInterest = 0
      break
    }

    const yearsAhead = Math.floor(months / 12)
    const interest = principal * monthlyRate
    const owed = principal + unpaidInterest + interest
    const payment = Math.min(scheduledPayment(plan, b, yearsAhead) + b.extraPayment, owed)

    // Payments go to this month's interest, then older interest, then principal.
    let left = payment
    const toInterest = Math.min(left, interest)
    left -= toInterest
    const toOldInterest = Math.min(left, unpaidInterest)
    left -= toOldInterest
    unpaidInterest -= toOldInterest
    let toPrincipal = left

    const shortfall = interest - toInterest
    if (plan === 'rap') {
      governmentHelp += shortfall
      const match = Math.min(
        Math.max(0, Math.min(RAP.principalMatchMonthly, payment) - toPrincipal),
        principal - toPrincipal,
      )
      governmentHelp += match
      toPrincipal += match
    } else if (plan === 'ibr' && months < IBR.subsidyMonths) {
      unpaidInterest += shortfall * (1 - b.subsidizedShare)
    } else {
      unpaidInterest += shortfall
    }
    principal -= toPrincipal

    totalPaid += payment
    if (months === 0) firstPayment = payment
    lastPayment = payment
    peakPayment = Math.max(peakPayment, payment)
    months += 1

    if (months % 12 === 0) {
      timeline.push({
        year: months / 12,
        balance: cents(principal + unpaidInterest),
        paid: cents(totalPaid),
      })
    }
  }

  if (months % 12 !== 0 || months === 0) {
    timeline.push({ year: cents(months / 12), balance: 0, paid: cents(totalPaid) })
  } else {
    timeline[timeline.length - 1].balance = 0
  }

  const taxOnForgiven = endReason === 'forgiven' ? forgiven * FORGIVENESS_TAX_RATE : 0

  return {
    id: plan,
    firstPayment: cents(firstPayment),
    lastPayment: cents(lastPayment),
    peakPayment: cents(peakPayment),
    totalPaid: cents(totalPaid),
    forgiven: cents(forgiven),
    taxOnForgiven: cents(taxOnForgiven),
    trueCost: cents(totalPaid + taxOnForgiven),
    months,
    endReason,
    governmentHelp: cents(governmentHelp),
    timeline,
  }
}
