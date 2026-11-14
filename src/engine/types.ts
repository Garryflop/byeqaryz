/** Poverty-guideline region. Alaska and Hawaii have their own, higher tables. */
export type Region = 'contiguous' | 'alaska' | 'hawaii'

export type Filing = 'single' | 'joint' | 'separate'

/** Plans the engine can simulate. */
export type PlanId = 'standard' | 'ibr' | 'rap'

/** Parent PLUS loans are shut out of the income-driven plans modelled here. */
export type LoanType = 'direct' | 'parentPlus'

/** What the borrower says they are on today. */
export type CurrentPlan = PlanId | 'save' | 'unsure'

/** Everything the calculator needs to know about one borrower. */
export interface Borrower {
  /** Total federal loan balance in dollars (principal plus any unpaid interest). */
  balance: number
  /** Weighted average interest rate, in percent (6.5 means 6.5%). */
  rate: number
  /**
   * Share of the balance (0 to 1) that is in subsidized loans. On IBR the
   * government pays unpaid interest on that share for the first three years.
   */
  subsidizedShare: number
  loanType: LoanType
  /**
   * True if the borrower took out or consolidated a federal loan on or after
   * July 1, 2026. Those loans can only use RAP or the tiered Standard plan.
   */
  newLoansSinceJuly2026: boolean
  /** True if the borrower had federal loans before July 1, 2014 ("old" IBR terms). */
  borrowedBeforeJuly2014: boolean
  /** Borrower's own adjusted gross income, dollars per year. */
  agi: number
  /** Spouse's adjusted gross income; only used when filing jointly. */
  spouseAgi: number
  filing: Filing
  /** Household size used for the poverty guideline (borrower included). */
  familySize: number
  /** Dependent children claimed on the tax return (used by RAP). */
  dependents: number
  /** Two-letter state code. */
  state: string
  /** Works full-time for a government or non-profit employer and wants PSLF. */
  pslf: boolean
  /** Qualifying payments already made toward forgiveness. */
  qualifyingPayments: number
  currentPlan: CurrentPlan
  /** Expected yearly income growth, in percent. */
  incomeGrowth: number
  /** Extra dollars the borrower chooses to pay every month. */
  extraPayment: number
}

export type EndReason = 'paid' | 'forgiven' | 'pslf'

export interface YearPoint {
  /** Years from today (0 = now). */
  year: number
  /** Balance still owed at that point, dollars. */
  balance: number
  /** Cumulative amount paid by the borrower, dollars. */
  paid: number
}

export interface PlanResult {
  id: PlanId
  /** Monthly payment in month one. */
  firstPayment: number
  /** Monthly payment in the final month before payoff or forgiveness. */
  lastPayment: number
  /** Highest monthly payment over the life of the plan. */
  peakPayment: number
  /** Everything the borrower pays out of pocket. */
  totalPaid: number
  /** Balance wiped out at the end, if any. */
  forgiven: number
  /** Rough federal tax owed on the forgiven amount (zero for PSLF). */
  taxOnForgiven: number
  /** totalPaid + taxOnForgiven: the number plans are ranked by. */
  trueCost: number
  /** Months from today until the debt is gone. */
  months: number
  endReason: EndReason
  /** Interest and principal the government covered under RAP. */
  governmentHelp: number
  timeline: YearPoint[]
}

export interface PlanOutcome {
  id: PlanId
  eligible: boolean
  /** Shown instead of numbers when the plan is not available. */
  reason?: string
  result?: PlanResult
}

export interface Comparison {
  outcomes: PlanOutcome[]
  /** Results for the plans the borrower can actually use. */
  results: PlanResult[]
  /** Eligible plan with the lowest true cost. */
  cheapest: PlanResult
  /** Eligible plan with the lowest payment in month one. */
  lowestPayment: PlanResult
  /** Plan the borrower ends up on if they change nothing. */
  baseline: PlanResult
  /** How the baseline was chosen, for the explanation line. */
  baselineNote: string
  /** baseline.trueCost - cheapest.trueCost, never negative. */
  costOfInaction: number
}
