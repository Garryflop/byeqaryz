import { Button, Collapse } from 'antd'
import { Lines, ScreenIntro } from '../components/ui'
import { PLAN_PRICE, SOURCES } from '../brand'
import { GLOSSARY } from '../data/glossary'
import { PLAN_NAMES, PLAN_SHORT } from '../engine/compare'
import { explainPayment } from '../engine/explain'
import { STATES } from '../engine/rules'
import { tenYearStandardMonthly } from '../engine/simulate'
import type { Borrower, PlanResult } from '../engine/types'
import { signedUsd, usd } from '../lib/format'
import { usePlans, useStore } from '../state/store'

const FILING = {
  single: 'Single',
  joint: 'Married, filing jointly',
  separate: 'Married, filing separately',
}

/** What can move the result, written from this borrower's own numbers. */
function factors(result: PlanResult, b: Borrower): string[] {
  if (result.id === 'standard') {
    return [
      'The payment is fixed. It does not change with your income.',
      'Paying extra shortens the loan and cuts the interest you pay.',
    ]
  }
  const list = [
    `Your payment is recalculated every year. At ${b.incomeGrowth}% income growth it reaches about ${usd(result.peakPayment)} a month.`,
    `Miss your yearly income recertification and the payment can jump to about ${usd(tenYearStandardMonthly(b))} a month.`,
    'A change in household size or tax filing status changes the payment.',
  ]
  if (result.id === 'rap') {
    list.push(
      'The rate applies to all of your income, so crossing a $10,000 threshold raises the payment at once.',
    )
  }
  if (result.forgiven > 0 && result.endReason === 'forgiven') {
    list.push(
      `A forgiven balance counts as taxable income. We estimate a tax bill of ${usd(result.taxOnForgiven)}.`,
    )
  }
  return list
}

export function Understand() {
  const { state, dispatch } = useStore()
  const { focused: result } = usePlans()
  const b = state.borrower
  const steps = explainPayment(result.id, b)
  const stateName = STATES.find((s) => s.code === b.state)?.name ?? b.state

  return (
    <div className="screen">
      <ScreenIntro title={`A closer look at ${PLAN_SHORT[result.id]}.`}>
        {GLOSSARY[result.id].meaning}
      </ScreenIntro>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="big">{usd(result.firstPayment)}</div>
        <span className="muted">a month to start on {PLAN_NAMES[result.id]}</span>
      </div>

      <Collapse
        defaultActiveKey={['formula']}
        items={[
          {
            key: 'inputs',
            label: 'What we used',
            children: (
              <Lines
                items={[
                  { label: 'Loan balance', value: usd(b.balance) },
                  { label: 'Interest rate', value: `${b.rate}%` },
                  { label: 'Your income (AGI)', value: usd(b.agi) },
                  ...(b.filing === 'joint'
                    ? [{ label: 'Spouse’s income', value: usd(b.spouseAgi) }]
                    : []),
                  { label: 'Tax filing status', value: FILING[b.filing] },
                  { label: 'Household', value: `${b.familySize} in ${stateName}` },
                  { label: 'Dependent children', value: b.dependents },
                ]}
              />
            ),
          },
          {
            key: 'formula',
            label: `Where ${usd(result.firstPayment)} comes from`,
            children: (
              <Lines
                items={steps.map((s) => ({
                  label: s.label,
                  value: signedUsd(s.value),
                  total: s.result,
                }))}
              />
            ),
          },
          {
            key: 'factors',
            label: 'What can change it',
            children: (
              <ul className="stack muted" style={{ margin: 0, paddingLeft: 20, gap: 8 }}>
                {factors(result, b).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ),
          },
          {
            key: 'official',
            label: 'Official information',
            children: (
              <ul className="stack" style={{ margin: 0, paddingLeft: 20, gap: 8 }}>
                {SOURCES.slice(0, 4).map(([label, href]) => (
                  <li key={href}>
                    <a href={href} target="_blank" rel="noreferrer">
                      {label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />

      <div className="surface stack" style={{ marginTop: 24 }}>
        <h2>Turn this into a plan you can act on.</h2>
        <p className="muted">
          A step-by-step checklist for switching to {PLAN_SHORT[result.id]}, what-if scenarios, a
          script for your loan servicer, and your deadlines in your calendar.
        </p>
        <div className="row">
          <Button
            type="primary"
            size="large"
            onClick={() => dispatch({ type: 'advance', step: 5 })}
          >
            See what’s included · ${PLAN_PRICE} →
          </Button>
          <span className="muted small">One-time purchase. No subscription.</span>
        </div>
      </div>

      <div className="actions">
        <Button size="large" onClick={() => dispatch({ type: 'go', step: 3 })}>
          ← Back to comparison
        </Button>
        <Button
          type="link"
          href="https://studentaid.gov/repayment-calculator/"
          target="_blank"
          rel="noreferrer"
        >
          I’ll continue on my own ↗
        </Button>
      </div>
    </div>
  )
}
