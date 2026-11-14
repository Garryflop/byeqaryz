import { Button, Checkbox, Collapse } from 'antd'
import { Term } from '../components/Term'
import { ScreenIntro } from '../components/ui'
import { GLOSSARY } from '../data/glossary'
import { PLAN_NAMES, PLAN_SHORT } from '../engine/compare'
import type { PlanId } from '../engine/types'
import { usd } from '../lib/format'
import { usePlans, useStore } from '../state/store'

/** Who each plan tends to suit, in one sentence. */
const SUITS: Record<PlanId, string> = {
  ibr: 'Often the lowest payment when your debt is large compared with your income.',
  rap: 'Your balance can never grow, and each child lowers the payment.',
  standard: 'The fastest way out and the least interest, if you can afford the payment.',
}

export function Options() {
  const { state, dispatch } = useStore()
  const { comparison } = usePlans()
  const chosen = state.selected.filter((id) => comparison.results.some((r) => r.id === id))

  return (
    <div className="screen">
      <ScreenIntro title="Your repayment options.">
        These are federal plans, not ours. Whichever you choose, you pay your loan servicer. Tick
        the ones you want to compare.
      </ScreenIntro>

      <div className="stack">
        {comparison.outcomes.map((o) => (
          <div className={`card${chosen.includes(o.id) ? ' card--chosen' : ''}`} key={o.id}>
            <Checkbox
              checked={chosen.includes(o.id)}
              disabled={!o.eligible}
              onChange={() => dispatch({ type: 'togglePlan', plan: o.id })}
            >
              <span style={{ fontSize: 17, fontWeight: 600 }}>
                {PLAN_NAMES[o.id]}
                {PLAN_SHORT[o.id] !== PLAN_NAMES[o.id] && ` (${PLAN_SHORT[o.id]})`}
              </span>
            </Checkbox>
            <p className="muted" style={{ margin: '6px 0 0 28px' }}>
              {o.result
                ? `Starts at ${usd(o.result.firstPayment)} a month for you.`
                : `Not open to you. ${o.reason}`}
            </p>
            <Collapse
              ghost
              size="small"
              style={{ marginLeft: 12 }}
              items={[
                {
                  key: 'why',
                  label: 'Why this option?',
                  children: (
                    <p className="muted">
                      {GLOSSARY[o.id].meaning} {SUITS[o.id]}
                    </p>
                  ),
                },
              ]}
            />
          </div>
        ))}
      </div>

      <p className="muted small" style={{ marginTop: 20 }}>
        Estimates from the published federal rules. Your servicer sets the final amount. Plans such
        as Graduated and Extended are not shown; <Term id="save">SAVE</Term> has ended.
      </p>

      <div className="actions">
        <Button size="large" onClick={() => dispatch({ type: 'go', step: 1 })}>
          ← Edit my details
        </Button>
        <Button
          type="primary"
          size="large"
          disabled={chosen.length === 0}
          onClick={() => dispatch({ type: 'advance', step: 3 })}
        >
          Compare selected options →
        </Button>
      </div>
    </div>
  )
}
