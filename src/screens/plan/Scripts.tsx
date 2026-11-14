import { Collapse, Typography } from 'antd'
import { Term } from '../../components/Term'
import { TabNote } from '../../components/ui'
import { buildTemplates } from '../../data/templates'
import type { PlanResult } from '../../engine/types'
import { useStore } from '../../state/store'

/** Ready-made words for calling or messaging the loan servicer. */
export function Scripts({ plan }: { plan: PlanResult }) {
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
