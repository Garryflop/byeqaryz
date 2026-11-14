import { BRAND } from '../brand'
import { PLAN_NAMES } from '../engine/compare'
import { explainPayment } from '../engine/explain'
import type { Borrower, Comparison, PlanResult } from '../engine/types'
import { saveFile } from './download'
import { duration, monthFromNow, signedUsd, usd } from './format'

/** The borrower's plan as a plain-text file they can keep or print. */
export function buildPlanText(
  b: Borrower,
  plan: PlanResult,
  comparison: Comparison,
  steps: string[],
): string {
  const lines = [
    `${BRAND}: your repayment plan`,
    `Prepared ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
    '',
    `PLAN: ${PLAN_NAMES[plan.id]}`,
    `Payment to start: ${usd(plan.firstPayment)} a month`,
    `Total you pay: ${usd(plan.totalPaid)}`,
    `Finished: ${monthFromNow(plan.months)} (${duration(plan.months)})`,
    plan.forgiven > 0 ? `Amount forgiven: ${usd(plan.forgiven)}` : 'Paid in full, nothing forgiven',
    plan.taxOnForgiven > 0 ? `Estimated tax on forgiveness: ${usd(plan.taxOnForgiven)}` : '',
    '',
    'HOW THE PAYMENT IS CALCULATED',
    ...explainPayment(plan.id, b).map((s) => `  ${s.label}: ${signedUsd(s.value)}`),
    '',
    'ALL PLANS OPEN TO YOU',
    ...comparison.results.map(
      (r) => `  ${PLAN_NAMES[r.id]}: ${usd(r.firstPayment)} a month, ${usd(r.totalPaid)} in total`,
    ),
    comparison.costOfInaction > 0
      ? `  Changing nothing would cost about ${usd(comparison.costOfInaction)} more.`
      : '',
    '',
    'YOUR NEXT STEPS',
    ...steps.map((s, i) => `  ${i + 1}. ${s}`),
    '',
    'YOUR DETAILS',
    `  Balance ${usd(b.balance)} at ${b.rate}%, income ${usd(b.agi)}, household of ${b.familySize} in ${b.state}`,
    '',
    'This is an estimate from published federal rules, not financial advice.',
    'Your loan servicer sets the final payment amount.',
  ]
  return lines.filter((l, i) => l !== '' || lines[i - 1] !== '').join('\n')
}

export const downloadPlan = (text: string) => saveFile('byeqaryz-plan.txt', text, 'text/plain')

/** Everything saved in this browser, as a file the borrower keeps themselves. */
export const downloadBackup = (state: unknown) =>
  saveFile('byeqaryz-backup.json', JSON.stringify(state, null, 2), 'application/json')
