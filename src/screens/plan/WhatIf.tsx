import { InputNumber, Slider } from 'antd'
import { BalanceChart, beforeAfterSeries } from '../../components/BalanceChart'
import { Lines, TabNote } from '../../components/ui'
import { PLAN_NAMES } from '../../engine/compare'
import type { PlanResult } from '../../engine/types'
import { filingSwitch, requiredPayment, whatIf } from '../../lib/actionPlan'
import { duration, usd } from '../../lib/format'
import { useStore } from '../../state/store'

interface ScenarioProps {
  label: string
  value: number
  onChange: (value: number) => void
  /** Upper end of the slider; the number box allows more. */
  sliderMax: number
  inputMax: number
  step: number
  unit: 'dollars' | 'percent'
  inputLabel: string
}

/** One adjustable assumption: a slider for feel, a number box for precision. */
function Scenario({
  label,
  value,
  onChange,
  sliderMax,
  inputMax,
  step,
  unit,
  inputLabel,
}: ScenarioProps) {
  const dollars = unit === 'dollars'

  return (
    <label className="stack" style={{ gap: 4 }}>
      <strong>{label}</strong>
      <span className="row" style={{ flexWrap: 'nowrap' }}>
        <Slider
          style={{ flex: 1 }}
          min={0}
          max={sliderMax}
          step={step}
          value={value}
          onChange={onChange}
          tooltip={{ formatter: (v) => (dollars ? usd(v ?? 0) : `${v}%`) }}
        />
        <InputNumber
          prefix={dollars ? '$' : undefined}
          suffix={dollars ? undefined : '%'}
          min={0}
          max={inputMax}
          step={step}
          value={value}
          onChange={(v) => onChange(v ?? 0)}
          style={{ width: 110 }}
          aria-label={inputLabel}
        />
      </span>
    </label>
  )
}

/** Lets the borrower change an assumption and see the effect on cost and time. */
export function WhatIf({ plan }: { plan: PlanResult }) {
  const { state, dispatch } = useStore()
  const b = state.borrower
  const { before, changed, saving } = whatIf(plan, b)
  const filing = filingSwitch(b)

  return (
    <div className="stack">
      <TabNote>
        Move a slider to try a change. The figures and the chart below show what it does to your
        total cost and to the date you are done.
      </TabNote>

      <div className="card stack">
        <Scenario
          label="I pay extra every month"
          value={b.extraPayment}
          onChange={(extraPayment) => dispatch({ type: 'patchBorrower', patch: { extraPayment } })}
          sliderMax={500}
          inputMax={5000}
          step={25}
          unit="dollars"
          inputLabel="Extra monthly payment in dollars"
        />
        <Scenario
          label="My income grows each year by"
          value={b.incomeGrowth}
          onChange={(incomeGrowth) => dispatch({ type: 'patchBorrower', patch: { incomeGrowth } })}
          sliderMax={10}
          inputMax={20}
          step={0.5}
          unit="percent"
          inputLabel="Yearly income growth in percent"
        />
      </div>

      <div className="surface">
        <h3 style={{ marginBottom: 12 }}>On {PLAN_NAMES[plan.id]} with these settings</h3>
        <Lines
          items={[
            {
              label: 'Payment to start',
              value:
                b.extraPayment > 0
                  ? `${usd(requiredPayment(plan, b))} required + ${usd(b.extraPayment)} extra`
                  : usd(plan.firstPayment),
            },
            { label: 'You pay in total', value: usd(plan.totalPaid), total: true },
            { label: 'Finished in', value: duration(plan.months) },
            ...(changed
              ? [
                  {
                    label: 'Compared with no changes',
                    value:
                      saving >= 0
                        ? `Saves ${usd(saving)}, done ${duration(Math.max(0, before.months - plan.months))} sooner`
                        : `Costs ${usd(-saving)} more: that balance would have been forgiven`,
                    total: true,
                  },
                ]
              : []),
          ]}
        />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>What you still owe, year by year</h3>
        <BalanceChart series={beforeAfterSeries(before, plan, changed)} />
      </div>

      {filing && filing.saving > 500 && (
        <p className="surface">
          <strong>
            Filing {filing.to === 'separate' ? 'separately' : 'jointly'} could cut your loan cost by{' '}
            {usd(filing.saving)}.
          </strong>{' '}
          It usually raises your tax bill, so compare both with a tax preparer before you switch.
        </p>
      )}
    </div>
  )
}
