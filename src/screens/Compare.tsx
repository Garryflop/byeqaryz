import { CheckCircleFilled } from '@ant-design/icons'
import { Button, Collapse, Segmented } from 'antd'
import { BalanceChart, planSeries } from '../components/BalanceChart'
import { Term } from '../components/Term'
import { Lines, ScreenIntro } from '../components/ui'
import { SOURCES } from '../brand'
import { PLAN_NAMES } from '../engine/compare'
import { FORGIVENESS_TAX_RATE, GUIDELINE_GROWTH, RULES_AS_OF } from '../engine/rules'
import type { PlanResult } from '../engine/types'
import { duration, monthFromNow, usd } from '../lib/format'
import { usePlans, useStore } from '../state/store'
import type { Priority } from '../state/store'

const END_TEXT = {
  paid: 'Paid in full',
  forgiven: 'Rest forgiven',
  pslf: 'Rest forgiven, tax-free',
} as const

function PlanColumn({ result, fits }: { result: PlanResult; fits: boolean }) {
  const { dispatch } = useStore()

  return (
    <div className={`card stack${fits ? ' card--chosen' : ''}`}>
      <div style={{ minHeight: 20 }}>
        {fits && (
          <span className="badge">
            <CheckCircleFilled /> Fits your priority
          </span>
        )}
      </div>
      <h3>
        <Term id={result.id}>{PLAN_NAMES[result.id]}</Term>
      </h3>
      <div>
        <div className="figure">{usd(result.firstPayment)}</div>
        <span className="muted">a month to start</span>
      </div>
      <Lines
        items={[
          { label: 'You pay in total', value: usd(result.totalPaid), total: true },
          {
            label: 'Finished',
            value: `${monthFromNow(result.months)} (${duration(result.months)})`,
          },
          { label: 'How it ends', value: END_TEXT[result.endReason] },
          { label: 'Amount forgiven', value: result.forgiven > 0 ? usd(result.forgiven) : 'None' },
          ...(result.taxOnForgiven > 0
            ? [{ label: 'Est. tax on forgiveness', value: usd(result.taxOnForgiven) }]
            : []),
        ]}
      />
      <Button
        block
        onClick={() => dispatch({ type: 'focus', plan: result.id })}
        style={{ marginTop: 'auto' }}
      >
        Understand this plan →
      </Button>
    </div>
  )
}

export function Compare() {
  const { state, dispatch } = useStore()
  const { comparison, best } = usePlans()
  const b = state.borrower
  const shown = comparison.results.filter((r) => state.selected.includes(r.id))
  const { baseline, cheapest, costOfInaction } = comparison

  return (
    <div className="screen screen--wide">
      <ScreenIntro title="See the whole picture.">
        {usd(b.balance)} of loans at {b.rate}%, {usd(b.agi)} income, household of {b.familySize}
        {b.pslf ? ', public service' : ''}.
      </ScreenIntro>

      <div className="row row--between" style={{ marginBottom: 20 }}>
        <Segmented<Priority>
          value={state.priority}
          onChange={(priority) => dispatch({ type: 'setPriority', priority })}
          options={[
            { label: 'Lower monthly payment', value: 'payment' },
            { label: 'Lower total cost', value: 'total' },
          ]}
        />
        <Button
          type="link"
          onClick={() => dispatch({ type: 'go', step: 1 })}
          style={{ paddingInline: 0 }}
        >
          Edit my details
        </Button>
      </div>

      <div className="grid grid--plans">
        {shown.map((r) => (
          <PlanColumn key={r.id} result={r} fits={r.id === best.id} />
        ))}
      </div>

      {costOfInaction > 0 && (
        <p className="surface" style={{ marginTop: 16 }}>
          <strong>Changing nothing would cost you {usd(costOfInaction)} more.</strong> That is the
          gap between {comparison.baselineNote} ({usd(baseline.trueCost)} in total, tax included)
          and {PLAN_NAMES[cheapest.id]} ({usd(cheapest.trueCost)}).
        </p>
      )}

      {shown.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12 }}>What you still owe, year by year</h3>
          <BalanceChart series={planSeries(shown)} />
        </div>
      )}

      <Collapse
        ghost
        style={{ marginTop: 8 }}
        items={[
          {
            key: 'assumptions',
            label: 'Assumptions and sources',
            children: (
              <div className="stack muted">
                <p>
                  Computed in your browser from the federal rules as of {RULES_AS_OF}. We assume
                  on-time payments, an unchanged household and filing status, income growing{' '}
                  {b.incomeGrowth}% a year and poverty guidelines rising{' '}
                  {(GUIDELINE_GROWTH * 100).toFixed(1)}% a year. Tax on forgiveness is a rough
                  estimate at a flat {Math.round(FORGIVENESS_TAX_RATE * 100)}%.
                </p>
                <p>
                  Not modelled: a spouse’s own federal loans, the Graduated and Extended plans and
                  state income tax. This is an estimate to help you decide, not financial advice.
                </p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {SOURCES.map(([label, href]) => (
                    <li key={href}>
                      <a href={href} target="_blank" rel="noreferrer">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          },
        ]}
      />

      <div className="actions">
        <Button size="large" onClick={() => dispatch({ type: 'go', step: 2 })}>
          ← Change options
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={() => dispatch({ type: 'focus', plan: best.id })}
        >
          Understand {PLAN_NAMES[best.id]} →
        </Button>
      </div>
    </div>
  )
}
