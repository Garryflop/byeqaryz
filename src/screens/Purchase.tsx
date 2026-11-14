import { CheckOutlined } from '@ant-design/icons'
import { Button, Checkbox, Input } from 'antd'
import { useState } from 'react'
import { Lines, ScreenIntro } from '../components/ui'
import { PLAN_PRICE } from '../brand'
import { PLAN_SHORT } from '../engine/compare'
import { usd } from '../lib/format'
import { usePlans, useStore } from '../state/store'

const INCLUDED = [
  ['Switching checklist', 'The steps to move onto your plan, in order, with your progress saved.'],
  [
    'What-if scenarios',
    'A raise, extra payments, filing separately: see each one on your numbers.',
  ],
  ['The cost of waiting', 'What staying where you are adds to your total, in dollars.'],
  [
    'What to say',
    'Word-for-word text for calling or messaging the company that collects your payments.',
  ],
  ['Downloadable plan', 'Your figures and next steps in one file you can keep.'],
  [
    'Deadlines in your calendar',
    'Recertification reminders for Google Calendar or Apple Calendar.',
  ],
] as const

export function Purchase() {
  const { state, dispatch } = useStore()
  const { focused } = usePlans()
  // The email is only held while this screen is open: it is never stored or sent.
  const [email, setEmail] = useState('')
  const [understood, setUnderstood] = useState(false)

  if (state.purchased) {
    return (
      <div className="screen">
        <ScreenIntro title="Your personal action plan.">
          You already have it. Pick up where you left off.
        </ScreenIntro>
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            onClick={() => dispatch({ type: 'advance', step: 6 })}
          >
            Open my plan →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen screen--wide">
      <ScreenIntro title="Your personal action plan.">
        Everything you need to move onto {PLAN_SHORT[focused.id]} and stay on it. One payment of $
        {PLAN_PRICE}, paid to us. Your loan payments still go to your servicer.
      </ScreenIntro>

      <div className="grid grid--two">
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>What’s included</h2>
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {INCLUDED.map(([title, text]) => (
              <li key={title} style={{ display: 'flex', gap: 12 }}>
                <CheckOutlined style={{ marginTop: 4 }} />
                <span>
                  <strong>{title}</strong>
                  <br />
                  <span className="muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface stack">
          <div className="row row--between">
            <h2>Checkout</h2>
            <span className="badge">Demo mode</span>
          </div>

          <label className="stack" style={{ gap: 6 }}>
            <span>Email for your receipt (optional)</span>
            <Input
              size="large"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className="muted small">Not stored and not sent in this demo.</span>
          </label>

          <label className="stack" style={{ gap: 6 }}>
            <span>Test card</span>
            <Input
              size="large"
              readOnly
              value="4242 4242 4242 4242    12 / 34    123"
              aria-describedby="card-note"
            />
            <span className="muted small" id="card-note">
              Filled in for you. Real card details are never asked for.
            </span>
          </label>

          <Lines
            items={[
              { label: 'Personal action plan', value: usd(PLAN_PRICE) },
              { label: 'Demo mode', value: `- ${usd(PLAN_PRICE)}` },
              { label: 'Charged today', value: usd(0), total: true },
            ]}
          />

          <Checkbox checked={understood} onChange={(e) => setUnderstood(e.target.checked)}>
            I understand this is a demo purchase: no money is taken and no email is sent.
          </Checkbox>

          <Button
            type="primary"
            size="large"
            block
            disabled={!understood}
            onClick={() => dispatch({ type: 'purchase' })}
          >
            Simulate ${PLAN_PRICE} purchase →
          </Button>
        </div>
      </div>

      <div className="actions">
        <Button size="large" onClick={() => dispatch({ type: 'go', step: 4 })}>
          ← Back
        </Button>
      </div>
    </div>
  )
}
