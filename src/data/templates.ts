import { PLAN_NAMES } from '../engine/compare'
import type { Borrower, PlanResult } from '../engine/types'
import { usd } from '../lib/format'

export interface Template {
  key: string
  title: string
  /** When to use it, in one line. */
  when: string
  body: string
}

/**
 * Plain-text scripts and messages filled in with the borrower's own numbers.
 * They are fixed templates, not generated text, so the wording is predictable
 * and nothing about the borrower is sent anywhere.
 */
export function buildTemplates(b: Borrower, plan: PlanResult): Template[] {
  const name = PLAN_NAMES[plan.id]
  const household = `${b.familySize} ${b.familySize === 1 ? 'person' : 'people'}`
  const filing =
    b.filing === 'single'
      ? 'single'
      : b.filing === 'joint'
        ? 'married filing jointly'
        : 'married filing separately'

  const templates: Template[] = [
    {
      key: 'switch',
      title: `Phone script: switch to ${name}`,
      when: 'Call your loan servicer. Have your account number ready.',
      body: [
        `Hi, I’d like to change the repayment plan on my federal student loans to the ${name} plan.`,
        '',
        `My adjusted gross income is ${usd(b.agi)}, I file as ${filing}, and my household is ${household}.`,
        `By my calculation the payment should be about ${usd(plan.firstPayment)} a month. Can you confirm the amount you get?`,
        '',
        'Before we finish, please tell me:',
        '1. The date my first payment under the new plan is due.',
        '2. Whether any unpaid interest will be added to my principal because of this change.',
        '3. The date of my next income recertification.',
        '',
        'Please send written confirmation of the change to the address on file. Can I have a reference number for this call?',
      ].join('\n'),
    },
    {
      key: 'mismatch',
      title: 'Message: my payment looks wrong',
      when: 'Use the secure message form on your servicer’s website.',
      body: [
        'Subject: Request to review my monthly payment amount',
        '',
        `I am enrolled in (or have applied for) the ${name} plan. My statement shows a different payment from the one I expect.`,
        '',
        `My details: adjusted gross income ${usd(b.agi)}, filing status ${filing}, household of ${household}${b.dependents ? `, ${b.dependents} dependent ${b.dependents === 1 ? 'child' : 'children'}` : ''}.`,
        `Expected payment: about ${usd(plan.firstPayment)} a month.`,
        '',
        'Please tell me which income, family size and plan you used, and correct the amount if it is wrong. While this is under review, please confirm that I will not be reported as late.',
        '',
        'Thank you.',
      ].join('\n'),
    },
  ]

  if (b.pslf) {
    templates.push({
      key: 'pslf',
      title: 'Message: confirm my PSLF payment count',
      when: 'Send once a year, and whenever you change employer.',
      body: [
        'Subject: Request for my qualifying PSLF payment count',
        '',
        `I work full-time for a qualifying public service employer and am pursuing Public Service Loan Forgiveness. By my records I have made ${b.qualifyingPayments} qualifying payments.`,
        '',
        'Please confirm, in writing:',
        '1. The number of qualifying payments on each of my loans.',
        '2. Any months that were not counted, and the reason.',
        '3. Whether my employment certification is up to date.',
        '',
        'Thank you.',
      ].join('\n'),
    })
  }

  templates.push({
    key: 'hardship',
    title: 'Phone script: I can’t afford this month’s payment',
    when: 'Call before the due date, not after.',
    body: [
      'Hi, I’m calling because I won’t be able to make my full payment this month and I want to avoid becoming delinquent.',
      '',
      `My income is ${usd(b.agi)} a year. What options do I have?`,
      '',
      'Please cover:',
      '1. Whether recalculating my payment on my current income would lower it, and how fast that takes effect.',
      '2. Whether a short forbearance is available, and how much interest it would add.',
      '3. Whether months in that status count toward forgiveness.',
      '',
      'Please note on my account that I called before the due date, and give me a reference number.',
    ].join('\n'),
  })

  return templates
}
