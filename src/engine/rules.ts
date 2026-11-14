/**
 * Every number that comes from law or regulation lives in this file, next to
 * the source it was taken from. Nothing else in the app hard-codes a rule, so
 * when Congress or the Department of Education changes something, this is the
 * only file to edit.
 */
import type { Region } from './types'

export const RULES_AS_OF = '2026-11-14'

/**
 * HHS poverty guidelines, 2026 (annual update published January 2026).
 * https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
 */
export const POVERTY_GUIDELINE: Record<Region, { base: number; perPerson: number }> = {
  contiguous: { base: 15_960, perPerson: 5_680 },
  alaska: { base: 19_950, perPerson: 7_100 },
  hawaii: { base: 18_360, perPerson: 6_530 },
}

/**
 * Income-Based Repayment, 34 CFR 685.209 as amended May 1, 2026.
 * https://www.law.cornell.edu/cfr/text/34/685.209
 * The payment is capped at the 10-year standard amount. The old "partial
 * financial hardship" entry test was removed by Public Law 119-21.
 */
export const IBR = {
  /** Income below this multiple of the poverty guideline is protected. */
  protectedMultiple: 1.5,
  /** Months during which unpaid interest on subsidized loans is not charged. */
  subsidyMonths: 36,
  /** A calculated payment under this is rounded down to zero... */
  zeroBelow: 5,
  /** ...and one between `zeroBelow` and this is rounded up to this. */
  floor: 10,
  /** Borrowers with no loans before July 1, 2014. */
  newBorrower: { share: 0.1, forgivenessMonths: 240 },
  /** Borrowers who already had loans before July 1, 2014. */
  oldBorrower: { share: 0.15, forgivenessMonths: 300 },
}

/**
 * Repayment Assistance Plan, created by Public Law 119-21 sec. 82001 and
 * available from July 1, 2026 (34 CFR 685.209).
 * https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.htm
 *
 * The percentage applies to the borrower's whole AGI, not just the part inside
 * the bracket, so crossing a threshold by one dollar raises the payment. The
 * thresholds are fixed dollar amounts and are not indexed to inflation.
 */
export const RAP = {
  /** [AGI up to and including, share of total AGI]. */
  brackets: [
    [10_000, 0],
    [20_000, 0.01],
    [30_000, 0.02],
    [40_000, 0.03],
    [50_000, 0.04],
    [60_000, 0.05],
    [70_000, 0.06],
    [80_000, 0.07],
    [90_000, 0.08],
    [100_000, 0.09],
    [Infinity, 0.1],
  ] as ReadonlyArray<readonly [number, number]>,
  /** Flat monthly payment when AGI is at or below the first bracket. */
  minimumMonthly: 10,
  /** Monthly reduction for each dependent child. */
  perDependentMonthly: 50,
  /** Government tops principal reduction up to this amount each month. */
  principalMatchMonthly: 50,
  forgivenessMonths: 360,
}

/** Standard fixed plan for existing borrowers: 10 years, at least $50 a month. */
export const STANDARD = {
  months: 120,
  minimumMonthly: 50,
}

/**
 * Tiered Standard plan for loans made on or after July 1, 2026: the term
 * depends on the balance when repayment starts (34 CFR 685.208).
 * [balance below, months]
 */
export const TIERED_STANDARD: ReadonlyArray<readonly [number, number]> = [
  [25_000, 120],
  [50_000, 180],
  [100_000, 240],
  [Infinity, 300],
]

/** The older income-driven plans (PAYE, ICR) close on this date (Public Law 119-21). */
export const LEGACY_PLANS_CLOSE = '2028-07-01'

/** Public Service Loan Forgiveness: 120 qualifying payments, tax-free. */
export const PSLF_MONTHS = 120

/**
 * Forgiveness under income-driven plans is federally taxable again for
 * discharges after December 31, 2025. We do not know the borrower's future
 * bracket, so the estimate uses a single flat rate and is labelled as rough.
 */
export const FORGIVENESS_TAX_RATE = 0.22

/**
 * Poverty guidelines are indexed to inflation. The official calculator uses
 * CBO inflation projections; 2.4% a year reproduces its IBR totals to within
 * one percent (see engine.test.ts).
 */
export const GUIDELINE_GROWTH = 0.024

/** Hard stop for the simulation loop. */
export const MAX_MONTHS = 480

export const STATES: ReadonlyArray<{ code: string; name: string }> = [
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['DC', 'District of Columbia'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['HI', 'Hawaii'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }))

export function regionOf(state: string): Region {
  if (state === 'AK') return 'alaska'
  if (state === 'HI') return 'hawaii'
  return 'contiguous'
}

/** Poverty guideline for a household, optionally projected `yearsAhead`. */
export function povertyGuideline(region: Region, familySize: number, yearsAhead = 0): number {
  const { base, perPerson } = POVERTY_GUIDELINE[region]
  const today = base + perPerson * Math.max(0, familySize - 1)
  return today * (1 + GUIDELINE_GROWTH) ** yearsAhead
}
