import type { Borrower } from '../engine/types'

export const DEFAULT_BORROWER: Borrower = {
  balance: 40_000,
  rate: 6.5,
  subsidizedShare: 0,
  loanType: 'direct',
  newLoansSinceJuly2026: false,
  borrowedBeforeJuly2014: false,
  agi: 60_000,
  spouseAgi: 0,
  filing: 'single',
  familySize: 1,
  dependents: 0,
  state: 'TX',
  pslf: false,
  qualifyingPayments: 0,
  currentPlan: 'unsure',
  incomeGrowth: 3,
  extraPayment: 0,
}

export interface Persona {
  key: string
  name: string
  tagline: string
  borrower: Borrower
}

/**
 * Editable starting points so anyone can try the product without their own
 * loan data. They are ordinary inputs: every number shown for them is computed
 * by the same engine as a real borrower's.
 */
export const PERSONAS: Persona[] = [
  {
    key: 'teacher',
    name: 'Maya, public-school teacher',
    tagline: '$48k in loans, 4 years into public service',
    borrower: {
      ...DEFAULT_BORROWER,
      balance: 48_000,
      rate: 5.8,
      agi: 52_000,
      state: 'OH',
      pslf: true,
      qualifyingPayments: 48,
      currentPlan: 'save',
    },
  },
  {
    key: 'family',
    name: 'Dan & Priya, two kids',
    tagline: '$85k in grad-school debt, one income',
    borrower: {
      ...DEFAULT_BORROWER,
      balance: 85_000,
      rate: 7,
      agi: 75_000,
      filing: 'joint',
      familySize: 4,
      dependents: 2,
      state: 'CA',
      currentPlan: 'save',
    },
  },
  {
    key: 'starter',
    name: 'Jordan, early career',
    tagline: '$28k balance on a $38k salary',
    borrower: {
      ...DEFAULT_BORROWER,
      balance: 28_000,
      rate: 5.5,
      agi: 38_000,
      state: 'GA',
      currentPlan: 'standard',
    },
  },
  {
    key: 'earner',
    name: 'Alex, software engineer',
    tagline: '$60k balance, $120k salary',
    borrower: {
      ...DEFAULT_BORROWER,
      balance: 60_000,
      rate: 6.8,
      agi: 120_000,
      state: 'WA',
      currentPlan: 'ibr',
      incomeGrowth: 4,
    },
  },
]
