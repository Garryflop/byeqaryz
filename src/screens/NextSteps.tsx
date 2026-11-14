import { CheckOutlined, DownloadOutlined } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Collapse,
  DatePicker,
  InputNumber,
  Progress,
  Slider,
  Tabs,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { BalanceChart, beforeAfterSeries } from '../components/BalanceChart'
import { CalendarButtons } from '../components/CalendarButtons'
import { Term } from '../components/Term'
import { Lines, ScreenIntro } from '../components/ui'
import { DEFAULT_BORROWER } from '../data/personas'
import { buildTemplates } from '../data/templates'
import { PLAN_NAMES, PLAN_SHORT, compare } from '../engine/compare'
import { forgivenessTarget, simulate, tenYearStandardMonthly } from '../engine/simulate'
import type { Borrower, PlanResult } from '../engine/types'
import type { Reminder } from '../lib/calendar'
import { duration, usd } from '../lib/format'
import { buildPlanText, downloadBackup, downloadPlan } from '../lib/planFile'
import { usePlans, useStore } from '../state/store'

/** Date after which the older income-driven plans (PAYE, ICR) close. */
const PLAN_SUNSET = '2028-07-01'

/** The payment the servicer asks for, leaving out any extra the borrower adds. */
const requiredPayment = (plan: PlanResult, b: Borrower) =>
  Math.max(0, plan.firstPayment - b.extraPayment)

/** One line under each tab saying what it is for. */
function TabNote({ children }: { children: ReactNode }) {
  return (
    <p className="muted" style={{ marginBottom: 16 }}>
      {children}
    </p>
  )
}

/** The four things to do, in order, written for this borrower's plan. */
function checklistFor(plan: PlanResult, b: Borrower) {
  const name = PLAN_NAMES[plan.id]
  return [
    {
      id: 'confirm',
      title: 'Check your numbers with your servicer',
      detail: `Log in and confirm a balance near ${usd(b.balance)} at about ${b.rate}%.`,
    },
    {
      id: 'apply',
      title: plan.id === 'standard' ? 'Ask to be placed on the Standard plan' : `Apply for ${name}`,
      detail:
        plan.id === 'standard'
          ? 'Call or message your servicer. The “What to say” tab has the words.'
          : 'Apply on studentaid.gov or call your servicer. The “What to say” tab has the words.',
    },
    {
      id: 'calendar',
      title:
        plan.id === 'standard'
          ? 'Turn on automatic payments'
          : 'Put your recertification date in your calendar',
      detail:
        plan.id === 'standard'
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

function Checklist({ plan }: { plan: PlanResult }) {
  const { state, dispatch } = useStore()
  const items = checklistFor(plan, state.borrower)
  const done = items.filter((i) => state.checklist.includes(i.id)).length

  return (
    <div className="stack">
      <TabNote>
        The four things to do to move onto your plan, in order. Tick each one when it is done; your
        progress is saved.
      </TabNote>
      <div>
        <strong>
          {done} of {items.length} done
        </strong>
        <Progress percent={(done / items.length) * 100} showInfo={false} strokeColor="#1d1d1f" />
      </div>
      <div className="card divided">
        {items.map((item) => (
          <Checkbox
            key={item.id}
            checked={state.checklist.includes(item.id)}
            onChange={() => dispatch({ type: 'toggleCheck', id: item.id })}
            style={{ display: 'flex' }}
          >
            <strong>{item.title}</strong>
            <br />
            <span className="muted">{item.detail}</span>
          </Checkbox>
        ))}
      </div>
    </div>
  )
}

function WhatIf({ plan }: { plan: PlanResult }) {
  const { state, dispatch } = useStore()
  const b = state.borrower
  const patch = (p: Partial<Borrower>) => dispatch({ type: 'patchBorrower', patch: p })
  // "Before" is the plan with no extra payment and the default income growth.
  const before = simulate(plan.id, {
    ...b,
    extraPayment: 0,
    incomeGrowth: DEFAULT_BORROWER.incomeGrowth,
  })
  const changed = b.extraPayment > 0 || b.incomeGrowth !== DEFAULT_BORROWER.incomeGrowth
  const saving = before.trueCost - plan.trueCost

  // Filing the other way only changes anything when there is a spouse with income.
  const otherFiling = b.filing === 'joint' ? 'separate' : b.filing === 'separate' ? 'joint' : null
  const other = otherFiling && b.spouseAgi > 0 ? compare({ ...b, filing: otherFiling }) : null
  const current = compare(b)
  const filingSaving = other ? current.cheapest.trueCost - other.cheapest.trueCost : 0

  return (
    <div className="stack">
      <TabNote>
        Move a slider to try a change. The figures and the chart below show what it does to your
        total cost and to the date you are done.
      </TabNote>
      <div className="card stack">
        <label className="stack" style={{ gap: 4 }}>
          <strong>I pay extra every month</strong>
          <span className="row" style={{ flexWrap: 'nowrap' }}>
            <Slider
              style={{ flex: 1 }}
              min={0}
              max={500}
              step={25}
              value={b.extraPayment}
              onChange={(v) => patch({ extraPayment: v })}
              tooltip={{ formatter: (v) => usd(v ?? 0) }}
            />
            <InputNumber
              prefix="$"
              min={0}
              max={5000}
              step={25}
              value={b.extraPayment}
              onChange={(v) => patch({ extraPayment: v ?? 0 })}
              style={{ width: 110 }}
              aria-label="Extra monthly payment in dollars"
            />
          </span>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <strong>My income grows each year by</strong>
          <span className="row" style={{ flexWrap: 'nowrap' }}>
            <Slider
              style={{ flex: 1 }}
              min={0}
              max={10}
              step={0.5}
              value={b.incomeGrowth}
              onChange={(v) => patch({ incomeGrowth: v })}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
            <InputNumber
              suffix="%"
              min={0}
              max={20}
              step={0.5}
              value={b.incomeGrowth}
              onChange={(v) => patch({ incomeGrowth: v ?? 0 })}
              style={{ width: 110 }}
              aria-label="Yearly income growth in percent"
            />
          </span>
        </label>
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

      {other && filingSaving > 500 && (
        <p className="surface">
          <strong>
            Filing {otherFiling === 'separate' ? 'separately' : 'jointly'} could cut your loan cost
            by {usd(filingSaving)}.
          </strong>{' '}
          It usually raises your tax bill, so compare both with a tax preparer before you switch.
        </p>
      )}
    </div>
  )
}

function Scripts({ plan }: { plan: PlanResult }) {
  const { state } = useStore()
  const templates = buildTemplates(state.borrower, plan)

  return (
    <>
      <TabNote>
        Your <Term id="servicer">loan servicer</Term> is the company that collects your payments for
        the government. To change plans you call or message them. These are the words to use, filled
        in with your numbers.
      </TabNote>
      <Collapse
        accordion
        defaultActiveKey={templates[0].key}
        items={templates.map((t) => ({
          key: t.key,
          label: t.title,
          children: (
            <>
              <span className="muted">{t.when}</span>
              <Typography.Paragraph
                className="script"
                copyable={{ text: t.body, tooltips: ['Copy', 'Copied'] }}
              >
                {t.body}
              </Typography.Paragraph>
            </>
          ),
        }))}
      />
    </>
  )
}

function Calendar({ plan }: { plan: PlanResult }) {
  const { state, dispatch } = useStore()
  const b = state.borrower
  const incomeDriven = plan.id !== 'standard'
  const recert = state.recertDate ? dayjs(state.recertDate) : null
  const daysLeft = recert ? recert.diff(dayjs().startOf('day'), 'day') : null
  const missed = tenYearStandardMonthly(b)

  const reminders: Reminder[] = []
  if (recert && incomeDriven) {
    reminders.push({
      date: recert.subtract(30, 'day').format('YYYY-MM-DD'),
      title: 'Student loans: Recertify your income (30 days left)',
      description: `Recertify at studentaid.gov or with your servicer. Miss it and your payment can rise to about ${usd(missed)} a month.`,
    })
    reminders.push({
      date: recert.format('YYYY-MM-DD'),
      title: 'Student loans: Income recertification deadline',
      description: 'Last day to recertify your income for your repayment plan.',
    })
  }
  reminders.push({
    date: dayjs(PLAN_SUNSET).subtract(60, 'day').format('YYYY-MM-DD'),
    title: 'Student loans: PAYE and ICR plans close on July 1, 2028',
    description:
      'If any of your loans are still on PAYE or ICR, choose a new plan before the deadline.',
  })

  const forgiven = plan.endReason !== 'paid'
  const target = forgiven ? forgivenessTarget(plan.id, b) : b.qualifyingPayments + plan.months
  const made = b.qualifyingPayments + state.loggedMonths.length
  const thisMonth = dayjs().format('YYYY-MM')
  const logged = state.loggedMonths.includes(thisMonth)

  return (
    <>
      <TabNote>
        Dates that cost you money if you miss them, with one tap to put each in your calendar, and a
        running count of the payments you have made.
      </TabNote>
      <div className="grid grid--two">
        <div className="card stack">
          <h3>Deadlines</h3>
          {incomeDriven ? (
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
              <span className="muted small">
                {daysLeft === null
                  ? 'It is on your servicer’s website, usually once every 12 months.'
                  : daysLeft >= 0
                    ? `${daysLeft} days left. Miss it and your payment can jump from ${usd(requiredPayment(plan, b))} to about ${usd(missed)}.`
                    : `This date passed ${-daysLeft} days ago. Check with your servicer.`}
              </span>
            </label>
          ) : (
            <p className="muted">
              The Standard payment is fixed, so there is no yearly income recertification.
            </p>
          )}

          <div className="divided">
            {reminders.map((r) => (
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

        <div className="card stack">
          <h3>
            Payments on <Term id={plan.id}>{PLAN_SHORT[plan.id]}</Term>
          </h3>
          <div>
            <span className="figure">{made}</span> <span className="muted">of {target}</span>
            <br />
            <span className="muted">
              {Math.max(0, target - made)} to go until{' '}
              {forgiven ? 'the rest is forgiven' : 'you are paid off'}
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
            {logged
              ? `${dayjs().format('MMMM')} payment logged`
              : `I made my ${dayjs().format('MMMM')} payment`}
          </Button>
          <span className="muted small">
            Come back each month to keep the count. It is saved in this browser.
          </span>
        </div>
      </div>
    </>
  )
}

export function NextSteps() {
  const { state, dispatch } = useStore()
  const { comparison, focused: plan } = usePlans()

  const download = () =>
    downloadPlan(
      buildPlanText(
        state.borrower,
        plan,
        comparison,
        checklistFor(plan, state.borrower).map((s) => `${s.title}. ${s.detail}`),
      ),
    )

  return (
    <div className="screen">
      <ScreenIntro title="Your plan is ready.">
        You chose {PLAN_NAMES[plan.id]}: {usd(requiredPayment(plan, state.borrower))} a month to
        start. This is your toolkit for switching to it and staying on it.
      </ScreenIntro>

      <div className="row" style={{ justifyContent: 'center', marginBottom: 24 }}>
        <Button type="primary" size="large" icon={<DownloadOutlined />} onClick={download}>
          Download plan
        </Button>
        <Button size="large" onClick={() => downloadBackup(state)}>
          Save a backup
        </Button>
      </div>

      <Tabs
        className="plan-tabs"
        size="large"
        // A demo link can open a given tab, e.g. `?demo=teacher&step=6&tab=calendar`.
        defaultActiveKey={new URLSearchParams(window.location.search).get('tab') ?? 'checklist'}
        items={[
          { key: 'checklist', label: 'Action checklist', children: <Checklist plan={plan} /> },
          { key: 'whatif', label: 'What if?', children: <WhatIf plan={plan} /> },
          { key: 'script', label: 'What to say', children: <Scripts plan={plan} /> },
          { key: 'calendar', label: 'Calendar', children: <Calendar plan={plan} /> },
        ]}
      />

      <div className="actions">
        <Button size="large" onClick={() => dispatch({ type: 'go', step: 3 })}>
          ← Back to comparison
        </Button>
      </div>
    </div>
  )
}
