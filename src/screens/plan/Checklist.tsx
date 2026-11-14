import { Checkbox, Progress } from 'antd'
import { TabNote } from '../../components/ui'
import type { PlanResult } from '../../engine/types'
import { checklistFor } from '../../lib/actionPlan'
import { useStore } from '../../state/store'

/** The steps for moving onto the plan, with progress saved between visits. */
export function Checklist({ plan }: { plan: PlanResult }) {
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
