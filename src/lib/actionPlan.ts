import dayjs from 'dayjs'
import { DEFAULT_BORROWER } from '../data/personas'
import { PLAN_NAMES, compare } from '../engine/compare'
import { LEGACY_PLANS_CLOSE } from '../engine/rules'
import { forgivenessTarget, simulate, tenYearStandardMonthly } from '../engine/simulate'
import type { Borrower, Filing, PlanResult } from '../engine/types'
import type { Reminder } from './calendar'
import { usd } from './format'

/**
 * Everything the paid action plan works out from a borrower and their chosen
 * plan. These are plain functions with no UI in them, so they can be tested.
 */

/** The payment the servicer asks for, leaving out any extra the borrower adds. */
export const requiredPayment = (plan: PlanResult, b: Borrower) =>
  Math.max(0, plan.firstPayment - b.extraPayment)

export interface ChecklistItem {
  id: string
  title: string
  detail: string
}

/** The four things to do, in order, written for this borrower's plan. */
export function checklistFor(plan: PlanResult, b: Borrower): ChecklistItem[] {
  const standard = plan.id === 'standard'
  return [
    {
      id: 'confirm',
      title: 'Check your numbers with your servicer',
      detail: `Log in and confirm a balance near ${usd(b.balance)} at about ${b.rate}%.`,
    },
    {
      id: 'apply',
      title: standard
        ? 'Ask to be placed on the Standard plan'
        : `Apply for ${PLAN_NAMES[plan.id]}`,
      detail: standard
        ? 'Call or message your servicer. The “What to say” tab has the words.'
        : 'Apply on studentaid.gov or call your servicer. The “What to say” tab has the words.',
    },
    {
      id: 'calendar',
      title: standard
        ? 'Turn on automatic payments'
        : 'Put your recertification date in your calendar',
      detail: standard
        ? 'So a payment is never missed.'
        : 'Your servicer shows the date. The calendar tab adds it in one tap.',
    },
    {
      id: 'first',
      title: 'Make your first payment on the new plan',
      detail: `Expect about ${usd(requiredPayment(plan, b))}. Then log it in the calendar tab.`,
    },
  ]
}

/**
 * Deadlines worth a calendar entry. Income-driven plans need a yearly income
 * recertification, so they get a warning 30 days ahead and one on the day.
 */
export function remindersFor(plan: PlanResult, b: Borrower, recertDate: string | null): Reminder[] {
  const reminders: Reminder[] = []
  if (recertDate && plan.id !== 'standard') {
    const recert = dayjs(recertDate)
    reminders.push({
      date: recert.subtract(30, 'day').format('YYYY-MM-DD'),
      title: 'Student loans: Recertify your income (30 days left)',
      description: `Recertify at studentaid.gov or with your servicer. Miss it and your payment can rise to about ${usd(tenYearStandardMonthly(b))} a month.`,
    })
    reminders.push({
      date: recert.format('YYYY-MM-DD'),
      title: 'Student loans: Income recertification deadline',
      description: 'Last day to recertify your income for your repayment plan.',
    })
  }
  reminders.push({
    date: dayjs(LEGACY_PLANS_CLOSE).subtract(60, 'day').format('YYYY-MM-DD'),
    title: 'Student loans: PAYE and ICR plans close on July 1, 2028',
    description:
      'If any of your loans are still on PAYE or ICR, choose a new plan before the deadline.',
  })
  return reminders
}

export interface PaymentProgress {
  /** Payments counted so far, including those made before using the app. */
  made: number
  /** Payments needed until the debt is gone. */
  target: number
  /** Whether the plan ends in forgiveness or in a paid-off loan. */
  endsInForgiveness: boolean
}

/** How far along the borrower is, counting the months they have logged. */
export function paymentProgress(
  plan: PlanResult,
  b: Borrower,
  loggedMonths: number,
): PaymentProgress {
  const endsInForgiveness = plan.endReason !== 'paid'
  return {
    made: b.qualifyingPayments + loggedMonths,
    target: endsInForgiveness ? forgivenessTarget(plan.id, b) : b.qualifyingPayments + plan.months,
    endsInForgiveness,
  }
}

export interface WhatIf {
  /** The same plan with no extra payment and the default income growth. */
  before: PlanResult
  /** Whether the borrower has moved either slider. */
  changed: boolean
  /** Dollars saved by the changes; negative when they cost more. */
  saving: number
}

/** Compares the plan as adjusted by the borrower with the plan left alone. */
export function whatIf(plan: PlanResult, b: Borrower): WhatIf {
  const before = simulate(plan.id, {
    ...b,
    extraPayment: 0,
    incomeGrowth: DEFAULT_BORROWER.incomeGrowth,
  })
  return {
    before,
    changed: b.extraPayment > 0 || b.incomeGrowth !== DEFAULT_BORROWER.incomeGrowth,
    saving: before.trueCost - plan.trueCost,
  }
}

/**
 * What a married borrower would save on the loan by filing taxes the other
 * way, or null when it makes no difference (single, or a spouse with no income).
 */
export function filingSwitch(b: Borrower): { to: Filing; saving: number } | null {
  const to: Filing | null =
    b.filing === 'joint' ? 'separate' : b.filing === 'separate' ? 'joint' : null
  if (!to || b.spouseAgi <= 0) return null
  const saving = compare(b).cheapest.trueCost - compare({ ...b, filing: to }).cheapest.trueCost
  return { to, saving }
}
