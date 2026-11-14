import { DownloadOutlined } from '@ant-design/icons'
import { Button, Tabs } from 'antd'
import { ScreenIntro } from '../components/ui'
import { PLAN_NAMES } from '../engine/compare'
import { checklistFor, requiredPayment } from '../lib/actionPlan'
import { usd } from '../lib/format'
import { buildPlanText, downloadBackup, downloadPlan } from '../lib/planFile'
import { usePlans, useStore } from '../state/store'
import { Calendar } from './plan/Calendar'
import { Checklist } from './plan/Checklist'
import { Scripts } from './plan/Scripts'
import { WhatIf } from './plan/WhatIf'

/** A demo link can open a given tab, e.g. `?demo=teacher&step=6&tab=calendar`. */
const tabFromLink = () => new URLSearchParams(window.location.search).get('tab') ?? 'checklist'

/** Screen 6: the paid action plan, one tab per tool. */
export function NextSteps() {
  const { state, dispatch } = useStore()
  const { comparison, focused: plan } = usePlans()
  const b = state.borrower

  const download = () => {
    const steps = checklistFor(plan, b).map((s) => `${s.title}. ${s.detail}`)
    downloadPlan(buildPlanText(b, plan, comparison, steps))
  }

  return (
    <div className="screen">
      <ScreenIntro title="Your plan is ready.">
        You chose {PLAN_NAMES[plan.id]}: {usd(requiredPayment(plan, b))} a month to start. This is
        your toolkit for switching to it and staying on it.
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
        defaultActiveKey={tabFromLink()}
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
