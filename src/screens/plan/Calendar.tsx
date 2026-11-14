import { CheckOutlined } from '@ant-design/icons'
import { Button, DatePicker, Progress } from 'antd'
import dayjs from 'dayjs'
import { CalendarButtons } from '../../components/CalendarButtons'
import { Term } from '../../components/Term'
import { TabNote } from '../../components/ui'
import { PLAN_SHORT } from '../../engine/compare'
import { tenYearStandardMonthly } from '../../engine/simulate'
import type { PlanResult } from '../../engine/types'
import { paymentProgress, remindersFor, requiredPayment } from '../../lib/actionPlan'
import { usd } from '../../lib/format'
import { useStore } from '../../state/store'

/** Deadlines with one-tap calendar buttons. */
function Deadlines({ plan }: { plan: PlanResult }) {
  const { state, dispatch } = useStore()
  const b = state.borrower
  const recert = state.recertDate ? dayjs(state.recertDate) : null
  const daysLeft = recert ? recert.diff(dayjs().startOf('day'), 'day') : null

  const recertHint =
    daysLeft === null
      ? 'It is on your servicer’s website, usually once every 12 months.'
      : daysLeft >= 0
        ? `${daysLeft} days left. Miss it and your payment can jump from ${usd(requiredPayment(plan, b))} to about ${usd(tenYearStandardMonthly(b))}.`
        : `This date passed ${-daysLeft} days ago. Check with your servicer.`

  return (
    <div className="card stack">
      <h3>Deadlines</h3>
      {plan.id === 'standard' ? (
        <p className="muted">
          The Standard payment is fixed, so there is no yearly income recertification.
        </p>
      ) : (
        <label className="stack" style={{ gap: 6 }}>
          <span>Your next income recertification date</span>
          <DatePicker
            size="large"
            format="MMM D, YYYY"
            value={recert}
            onChange={(d) =>
              dispatch({ type: 'setRecert', date: d ? d.format('YYYY-MM-DD') : null })
            }
            style={{ width: '100%' }}
          />
          <span className="muted small">{recertHint}</span>
        </label>
      )}

      <div className="divided">
        {remindersFor(plan, b, state.recertDate).map((r) => (
          <div className="row row--between" key={r.title} style={{ flexWrap: 'nowrap' }}>
            <span>
              <strong>{dayjs(r.date).format('MMM D, YYYY')}</strong>
              <br />
              <span className="muted">{r.title.replace('Student loans: ', '')}</span>
            </span>
            <CalendarButtons reminder={r} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A running count of payments: the reason to come back every month. */
function PaymentCount({ plan }: { plan: PlanResult }) {
  const { state, dispatch } = useStore()
  const { made, target, endsInForgiveness } = paymentProgress(
    plan,
    state.borrower,
    state.loggedMonths.length,
  )
  const thisMonth = dayjs().format('YYYY-MM')
  const monthName = dayjs().format('MMMM')
  const logged = state.loggedMonths.includes(thisMonth)

  return (
    <div className="card stack">
      <h3>
        Payments on <Term id={plan.id}>{PLAN_SHORT[plan.id]}</Term>
      </h3>
      <div>
        <span className="figure">{made}</span> <span className="muted">of {target}</span>
        <br />
        <span className="muted">
          {Math.max(0, target - made)} to go until{' '}
          {endsInForgiveness ? 'the rest is forgiven' : 'you are paid off'}
        </span>
      </div>
      <Progress
        percent={Math.min(100, (made / target) * 100)}
        showInfo={false}
        strokeColor="#1d1d1f"
      />
      <Button
        size="large"
        icon={logged ? <CheckOutlined /> : undefined}
        onClick={() => dispatch({ type: 'toggleMonth', month: thisMonth })}
      >
        {logged ? `${monthName} payment logged` : `I made my ${monthName} payment`}
      </Button>
      <span className="muted small">
        Come back each month to keep the count. It is saved in this browser.
      </span>
    </div>
  )
}

export function Calendar({ plan }: { plan: PlanResult }) {
  return (
    <>
      <TabNote>
        Dates that cost you money if you miss them, with one tap to put each in your calendar, and a
        running count of the payments you have made.
      </TabNote>
      <div className="grid grid--two">
        <Deadlines plan={plan} />
        <PaymentCount plan={plan} />
      </div>
    </>
  )
}
