import { describe, expect, test } from 'vitest'
import { DEFAULT_BORROWER } from '../data/personas'
import { compare, ineligibleReason } from './compare'
import { povertyGuideline } from './rules'
import {
  amortizedPayment,
  ibrMonthly,
  rapMonthly,
  rapShare,
  simulate,
  standardMonthly,
  standardMonths,
} from './simulate'
import type { Borrower } from './types'

const borrower = (patch: Partial<Borrower>): Borrower => ({ ...DEFAULT_BORROWER, ...patch })

/** Asserts `actual` is within `pct` percent of `expected`. */
function near(actual: number, expected: number, pct: number) {
  expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(pct / 100)
}

describe('building blocks', () => {
  test('amortised payment clears the loan', () => {
    expect(amortizedPayment(40_000, 6.5, 120)).toBeCloseTo(454.19, 2)
    expect(amortizedPayment(12_000, 0, 120)).toBe(100)
  })

  test('standard plan never drops under $50 a month', () => {
    expect(standardMonthly(borrower({ balance: 2_000 }))).toBe(50)
  })

  test('2026 poverty guidelines by region and household size', () => {
    expect(povertyGuideline('contiguous', 1)).toBe(15_960)
    expect(povertyGuideline('contiguous', 4)).toBe(33_000)
    expect(povertyGuideline('alaska', 2)).toBe(27_050)
    expect(povertyGuideline('hawaii', 1)).toBe(18_360)
  })
})

describe('Repayment Assistance Plan', () => {
  test('bracket boundaries are inclusive at the top', () => {
    expect(rapShare(10_000)).toBe(0)
    expect(rapShare(10_001)).toBe(0.01)
    expect(rapShare(100_000)).toBe(0.09)
    expect(rapShare(100_001)).toBe(0.1)
  })

  // Worked example published by TICAS:
  // https://ticas.org/affordability-2/reconciliation-2025-student-loans/
  test('the share applies to total income, so one more dollar can cost $25 a month', () => {
    expect(rapMonthly(borrower({ agi: 30_000 }))).toBeCloseTo(50, 2)
    expect(rapMonthly(borrower({ agi: 30_001 }))).toBeCloseTo(75, 2)
  })

  test('$50 off per dependent, and never under $10', () => {
    expect(rapMonthly(borrower({ agi: 75_000, dependents: 2 }))).toBeCloseTo(337.5, 2)
    expect(rapMonthly(borrower({ agi: 22_000, dependents: 3 }))).toBe(10)
    expect(rapMonthly(borrower({ agi: 8_000 }))).toBe(10)
  })

  test('the balance never grows, and principal falls at least $50 a month', () => {
    const low = borrower({ balance: 28_000, rate: 5.5, agi: 32_000, incomeGrowth: 0 })
    const { timeline } = simulate('rap', low)
    for (let i = 1; i < timeline.length - 1; i++) {
      expect(timeline[i - 1].balance - timeline[i].balance).toBeGreaterThanOrEqual(599.99)
    }
  })
})

describe('Income-Based Repayment', () => {
  test('10% or 15% of income above 150% of the poverty line', () => {
    expect(ibrMonthly(borrower({ agi: 60_000 }))).toBeCloseTo(300.5, 2)
    expect(ibrMonthly(borrower({ agi: 60_000, borrowedBeforeJuly2014: true }))).toBeCloseTo(
      450.75,
      2,
    )
  })

  test('is capped at the 10-year standard payment', () => {
    const high = borrower({ agi: 200_000 })
    expect(ibrMonthly(high)).toBeCloseTo(standardMonthly(high), 2)
  })

  test('tiny payments round to $0 or $10', () => {
    expect(ibrMonthly(borrower({ agi: 24_000 }))).toBe(0)
    expect(ibrMonthly(borrower({ agi: 24_900 }))).toBe(10)
  })

  test('joint filers are assessed on both incomes, separate filers on their own', () => {
    const couple = { agi: 50_000, spouseAgi: 50_000, familySize: 2 }
    expect(ibrMonthly(borrower({ ...couple, filing: 'joint' }))).toBeGreaterThan(
      ibrMonthly(borrower({ ...couple, filing: 'separate' })),
    )
  })
})

/**
 * Reference figures read from the official Repayment Calculator on
 * studentaid.gov on 2026-11-14, without logging in. That tool treats a manually
 * entered loan as fully subsidized and just entering repayment, and its totals
 * imply 3% yearly income growth, so the scenarios below use the same inputs.
 */
describe('matches the official studentaid.gov calculator', () => {
  const gov = { incomeGrowth: 3, subsidizedShare: 1 }
  const s1 = borrower({ ...gov, balance: 40_000, rate: 6.5, agi: 60_000, state: 'TX' })
  const s2 = borrower({
    ...gov,
    balance: 85_000,
    rate: 7,
    agi: 75_000,
    filing: 'joint',
    familySize: 4,
    dependents: 2,
    state: 'CA',
  })
  const s3 = borrower({ ...gov, balance: 28_000, rate: 5.5, agi: 32_000, state: 'OH' })

  test('standard plan', () => {
    const r = simulate('standard', s1)
    expect(Math.round(r.firstPayment)).toBe(454)
    near(r.totalPaid, 54_503, 0.01)
    expect(r.months).toBe(120)
    near(simulate('standard', s2).totalPaid, 118_431, 0.01)
    near(simulate('standard', s3).totalPaid, 36_465, 0.01)
  })

  test('RAP first payment, total paid and payoff time', () => {
    const a = simulate('rap', s1)
    expect(Math.round(a.firstPayment)).toBe(250)
    near(a.totalPaid, 62_149, 0.05)
    expect(a.months).toBe(154)

    const b = simulate('rap', s2)
    expect(Math.round(b.firstPayment)).toBe(338)
    near(b.totalPaid, 165_493, 0.05)

    const c = simulate('rap', s3)
    expect(Math.round(c.firstPayment)).toBe(80)
    near(c.totalPaid, 44_384, 0.05)
  })

  test('IBR first payment, total paid and forgiven amount', () => {
    const a = simulate('ibr', s1)
    expect(Math.round(a.firstPayment)).toBe(301)
    near(a.totalPaid, 63_224, 1)
    expect(a.forgiven).toBe(0)

    const b = simulate('ibr', s2)
    expect(Math.round(b.firstPayment)).toBe(213)
    near(b.totalPaid, 76_568, 1)
    near(b.forgiven, 117_500, 1)
    expect(b.months).toBe(240)

    const c = simulate('ibr', s3)
    expect(Math.round(c.firstPayment)).toBe(67)
    near(c.totalPaid, 25_550, 1)
    near(c.forgiven, 31_139, 1)
  })

  test('Public Service Loan Forgiveness after 120 payments', () => {
    const rap = simulate('rap', { ...s3, pslf: true })
    near(rap.totalPaid, 11_828, 0.05)
    near(rap.forgiven, 22_012, 0.1)
    expect(rap.endReason).toBe('pslf')
    expect(rap.taxOnForgiven).toBe(0)

    const ibr = simulate('ibr', { ...s3, pslf: true })
    near(ibr.totalPaid, 9_905, 1)
    near(ibr.forgiven, 31_384, 1)
  })
})

describe('comparison', () => {
  test('payments already made bring PSLF forgiveness closer', () => {
    const fresh = simulate('rap', borrower({ pslf: true }))
    const veteran = simulate('rap', borrower({ pslf: true, qualifyingPayments: 100 }))
    expect(fresh.months).toBe(120)
    expect(veteran.months).toBe(20)
  })

  test('forgiveness outside PSLF carries an estimated tax bill', () => {
    const r = simulate('ibr', borrower({ balance: 85_000, rate: 7, agi: 40_000 }))
    expect(r.endReason).toBe('forgiven')
    expect(r.taxOnForgiven).toBeCloseTo(r.forgiven * 0.22, 0)
    expect(r.trueCost).toBeCloseTo(r.totalPaid + r.taxOnForgiven, 0)
  })

  test('cost of inaction is the gap between the default plan and the cheapest', () => {
    const c = compare(borrower({ currentPlan: 'ibr' }))
    expect(c.baseline.id).toBe('ibr')
    expect(c.costOfInaction).toBeCloseTo(c.baseline.trueCost - c.cheapest.trueCost, 2)
    expect(c.costOfInaction).toBeGreaterThanOrEqual(0)
  })

  test('extra payments shorten the standard plan', () => {
    const base = simulate('standard', borrower({}))
    const extra = simulate('standard', borrower({ extraPayment: 100 }))
    expect(extra.months).toBeLessThan(base.months)
    expect(extra.totalPaid).toBeLessThan(base.totalPaid)
  })
})

describe('who can use which plan', () => {
  test('loans made since July 1, 2026 get the tiered Standard term', () => {
    const fresh = { newLoansSinceJuly2026: true }
    expect(standardMonths(borrower({ ...fresh, balance: 20_000 }))).toBe(120)
    expect(standardMonths(borrower({ ...fresh, balance: 28_000 }))).toBe(180)
    expect(standardMonths(borrower({ ...fresh, balance: 60_000 }))).toBe(240)
    expect(standardMonths(borrower({ ...fresh, balance: 150_000 }))).toBe(300)
    expect(standardMonths(borrower({ balance: 150_000 }))).toBe(120)
  })

  // The official calculator shows $229 a month and $41,181 in total for a
  // $28,000 loan at 5.5% on the Tiered Standard plan.
  test('tiered Standard matches the official calculator', () => {
    const r = simulate(
      'standard',
      borrower({ newLoansSinceJuly2026: true, balance: 28_000, rate: 5.5 }),
    )
    expect(Math.round(r.firstPayment)).toBe(229)
    near(r.totalPaid, 41_181, 0.05)
    expect(r.months).toBe(180)
  })

  test('new loans close IBR; Parent PLUS loans leave only Standard', () => {
    expect(ineligibleReason('ibr', borrower({ newLoansSinceJuly2026: true }))).toMatch(
      /July 1, 2026/,
    )
    expect(ineligibleReason('rap', borrower({ newLoansSinceJuly2026: true }))).toBeNull()

    const plus = compare(borrower({ loanType: 'parentPlus' }))
    expect(plus.results.map((r) => r.id)).toEqual(['standard'])
    expect(plus.cheapest.id).toBe('standard')
  })

  test('a borrower cannot be assumed to stay on a plan that is closed to them', () => {
    const c = compare(borrower({ currentPlan: 'ibr', newLoansSinceJuly2026: true }))
    expect(c.baseline.id).toBe('standard')
  })
})
