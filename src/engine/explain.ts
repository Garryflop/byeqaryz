import { IBR, RAP, povertyGuideline, regionOf } from './rules'
import {
  countedIncome,
  ibrTerms,
  rapShare,
  standardMonthly,
  standardMonths,
  tenYearStandardMonthly,
} from './simulate'
import type { Borrower, PlanId } from './types'

export interface Step {
  label: string
  /** Dollar amount, or a short text value such as "7%". */
  value: number | string
  /** The last step is the answer and is shown in bold. */
  result?: boolean
}

const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`

function rapBracketLabel(agi: number): string {
  let floor = 0
  for (const [ceiling] of RAP.brackets) {
    if (agi <= ceiling) {
      const from = floor === 0 ? '$0' : `$${(floor + 1).toLocaleString('en-US')}`
      return ceiling === Infinity
        ? `over $${floor.toLocaleString('en-US')}`
        : `${from} to $${ceiling.toLocaleString('en-US')}`
    }
    floor = ceiling
  }
  return ''
}

/**
 * The arithmetic behind the first monthly payment, one line per step, so the
 * borrower can check every number against the rule it came from.
 */
export function explainPayment(plan: PlanId, b: Borrower): Step[] {
  const income = countedIncome(b)
  const incomeLabel =
    b.filing === 'joint' ? 'Household income (you and your spouse)' : 'Your income (AGI)'

  if (plan === 'standard') {
    const payment = standardMonthly(b)
    return [
      { label: 'Loan balance', value: b.balance },
      { label: 'Interest rate', value: `${b.rate}%` },
      { label: 'Repaid in equal payments over', value: `${standardMonths(b)} months` },
      { label: 'Your payment', value: payment, result: true },
    ]
  }

  if (plan === 'rap') {
    const share = rapShare(income)
    const yearly = income * share
    const monthly = yearly / 12
    const discount = RAP.perDependentMonthly * b.dependents
    const payment = Math.max(RAP.minimumMonthly, monthly - discount)
    const steps: Step[] = [
      { label: incomeLabel, value: income },
      {
        label: `RAP rate for incomes ${rapBracketLabel(income)}`,
        value: `${Math.round(share * 100)}% of all income`,
      },
      { label: 'Per year', value: yearly },
      { label: 'Per month', value: monthly },
    ]
    if (b.dependents > 0) {
      steps.push({
        label: `Less $${RAP.perDependentMonthly} for each of ${b.dependents} ${b.dependents === 1 ? 'child' : 'children'}`,
        value: -discount,
      })
    }
    if (payment === RAP.minimumMonthly && monthly - discount < RAP.minimumMonthly) {
      steps.push({ label: 'RAP minimum payment applies', value: RAP.minimumMonthly })
    }
    steps.push({ label: 'Your payment', value: payment, result: true })
    return steps
  }

  const terms = ibrTerms(b)
  const guideline = povertyGuideline(regionOf(b.state), b.familySize)
  const protectedIncome = guideline * IBR.protectedMultiple
  const counted = Math.max(0, income - protectedIncome)
  const incomeBased = (counted * terms.share) / 12
  const cap = tenYearStandardMonthly(b)
  const steps: Step[] = [
    { label: incomeLabel, value: income },
    {
      label: `Protected: 150% of the poverty line for ${people(b.familySize)}`,
      value: -protectedIncome,
    },
    { label: 'Income that counts', value: counted },
    { label: `${Math.round(terms.share * 100)}% of that, per month`, value: incomeBased },
  ]
  if (incomeBased > cap) {
    steps.push({ label: 'Capped at the 10-year standard payment', value: cap })
    steps.push({ label: 'Your payment', value: cap, result: true })
  } else if (incomeBased < IBR.zeroBelow) {
    steps.push({ label: 'Under $5 rounds down to', value: 0, result: true })
  } else if (incomeBased < IBR.floor) {
    steps.push({ label: 'Under $10 rounds up to', value: IBR.floor, result: true })
  } else {
    steps.push({ label: 'Your payment', value: incomeBased, result: true })
  }
  return steps
}
