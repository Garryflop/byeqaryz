import { describe, expect, test } from 'vitest'
import { DEFAULT_BORROWER } from '../data/personas'
import { simulate } from '../engine/simulate'
import type { Borrower } from '../engine/types'
import {
  checklistFor,
  filingSwitch,
  paymentProgress,
  remindersFor,
  requiredPayment,
  whatIf,
} from './actionPlan'

const borrower = (patch: Partial<Borrower> = {}): Borrower => ({ ...DEFAULT_BORROWER, ...patch })

describe('required payment', () => {
  test('leaves out the extra the borrower chooses to pay', () => {
    const b = borrower({ extraPayment: 100 })
    expect(requiredPayment(simulate('rap', b), b)).toBeCloseTo(250, 2)
  })
})

describe('checklist', () => {
  test('always has four steps with stable ids', () => {
    const b = borrower()
    const ids = checklistFor(simulate('rap', b), b).map((i) => i.id)
    expect(ids).toEqual(['confirm', 'apply', 'calendar', 'first'])
  })

  test('the Standard plan asks for autopay instead of a recertification date', () => {
    const b = borrower()
    const standard = checklistFor(simulate('standard', b), b)
    expect(standard[2].title).toMatch(/automatic payments/)
    expect(checklistFor(simulate('ibr', b), b)[2].title).toMatch(/recertification/)
  })
})

describe('reminders', () => {
  const b = borrower()

  test('income-driven plans get a 30-day warning and the deadline itself', () => {
    const dates = remindersFor(simulate('rap', b), b, '2027-03-31').map((r) => r.date)
    expect(dates).toEqual(['2027-03-01', '2027-03-31', '2028-05-02'])
  })

  test('without a date, and on Standard, only the plan sunset is left', () => {
    expect(remindersFor(simulate('rap', b), b, null)).toHaveLength(1)
    expect(remindersFor(simulate('standard', b), b, '2027-03-31')).toHaveLength(1)
  })
})

describe('payment progress', () => {
  test('public service counts toward 120 payments, including earlier ones', () => {
    const b = borrower({ pslf: true, qualifyingPayments: 48 })
    const p = paymentProgress(simulate('rap', b), b, 3)
    expect(p).toEqual({ made: 51, target: 120, endsInForgiveness: true })
  })

  test('a plan that is paid off counts down its own months', () => {
    const b = borrower()
    const plan = simulate('standard', b)
    expect(paymentProgress(plan, b, 2)).toEqual({ made: 2, target: 120, endsInForgiveness: false })
  })
})

describe('what if', () => {
  test('nothing has changed until a slider moves', () => {
    const b = borrower()
    expect(whatIf(simulate('standard', b), b)).toMatchObject({ changed: false, saving: 0 })
  })

  test('extra payments on a plan that is paid off save money', () => {
    const b = borrower({ extraPayment: 100 })
    const result = whatIf(simulate('standard', b), b)
    expect(result.changed).toBe(true)
    expect(result.saving).toBeGreaterThan(0)
  })

  test('extra payments toward a balance that would be forgiven cost more', () => {
    const b = borrower({ balance: 85_000, rate: 7, agi: 40_000, extraPayment: 100 })
    expect(whatIf(simulate('ibr', b), b).saving).toBeLessThan(0)
  })
})

describe('filing switch', () => {
  test('makes no difference for single filers or a spouse with no income', () => {
    expect(filingSwitch(borrower())).toBeNull()
    expect(filingSwitch(borrower({ filing: 'joint', spouseAgi: 0 }))).toBeNull()
  })

  test('filing separately lowers the loan cost when the spouse earns', () => {
    const b = borrower({
      balance: 85_000,
      rate: 7,
      filing: 'joint',
      spouseAgi: 60_000,
      familySize: 2,
    })
    const result = filingSwitch(b)
    expect(result?.to).toBe('separate')
    expect(result?.saving).toBeGreaterThan(0)
  })
})
